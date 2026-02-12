import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';
import { StringValue } from 'ms';
import { compare } from 'bcrypt';
import { User } from 'src/users/user.model';
import { ErrorCodes } from 'src/shared/errors/custom';
import { GroupService } from 'src/groups/group.service';
import { UserLoginDto } from './dto/user-login.dto';
import { AuditService } from 'src/audit/audit.service';

@Injectable()
export class AppAuthService {
    private readonly usernameField: string | string[];
    private readonly passwordField: string;
    private readonly secret: string;
    private readonly maxAge: string;
    private readonly audience: string;
    private readonly issuer: string;
    private readonly renewExpiredToken: boolean;
    private readonly algorithms: Algorithm[];

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly groupService: GroupService,
        private readonly auditService: AuditService,
    ) {
        this.usernameField = this.configService.get('server')['authentication']['usernameField'];
        this.passwordField = this.configService.get('server')['authentication']['passwordField'];
        const jwtConfig = this.configService.get('server')['authentication']['jwt'];
        this.secret = jwtConfig['secret'];
        this.maxAge = jwtConfig['signOptions']['expiresIn'];
        this.audience = jwtConfig['signOptions']['audience'];
        this.issuer = jwtConfig['signOptions']['issuer'];
        this.algorithms = [jwtConfig['signOptions']['algorithm']];
        this.renewExpiredToken = this.configService.get('server')['authentication']['renewExpiredToken'];
    }

    async createAccessToken(user, additionalInfo?: Record<string, any>) {
        const payload = await this.createPayload(user);
        return this.jwtService.signAsync(Object.assign(payload, additionalInfo || {}), {
            expiresIn: this.configService.get('server.authentication.jwt.signOptions.expiresIn') as StringValue | number,
        });
    }

    async createPayload(user) {
        const response = { sub: user._id };
        if (Array.isArray(this.usernameField)) {
            this.usernameField.forEach((field) => {
                response[field] = user[field];
            });
        } else {
            response[this.usernameField] = user[this.usernameField];
        }
        return response;
    }

    async jwtPayloadToUser(payload) {
        return this.usersService.findById(payload.sub);
    }

    async isUserEnabled(user): Promise<boolean> {
        return user.active && !user.deleted;
    }

    async findUserByUsername(username) {
        if (Array.isArray(this.usernameField)) {
            const query = { $or: [] };
            this.usernameField.forEach((field) => {
                query.$or.push({ [field]: username });
            });
            return this.usersService.findOne(query);
        } else {
            return this.usersService.findOne({
                [this.usernameField as string]: username,
            });
        }
    }

    async findUserById(_id) {
        return this.usersService.findById(_id);
    }

    async processUser(user: User) {
        delete user[this.passwordField];
    }

    async validateUserWithCredentials(username: string, password: string) {
        if (!username || !password) {
            throw new BadRequestException(`${this.usernameField} and ${this.passwordField} fields are required.`);
        }
        const user = await this.findUserByUsername(username);
        if (!user) {
            return null;
        }
        if (!(await compare(password, user[this.passwordField]))) {
            return null;
        }
        if (await this.isUserEnabled(user)) {
            return user;
        }
        return null;
    }

    async validateUserWithJwtPayload(payload: any) {
        const user = await this.jwtPayloadToUser(payload);
        if (user && (await this.isUserEnabled(user))) {
            await this.processUser(user);
            return user;
        }
        return null;
    }

    async validateUserWithJwtToken(accessToken: string, rememberMe = false) {
        if (!accessToken) {
            throw new BadRequestException(`accessToken field is required.`);
        }
        try {
            const payload = await this.jwtService.verifyAsync(accessToken, {
                secret: this.secret,
                maxAge: this.maxAge,
                ignoreExpiration: false,
                audience: this.audience,
                issuer: this.issuer,
                ignoreNotBefore: false,
                algorithms: this.algorithms,
            });
            const user = await this.jwtPayloadToUser(payload);
            if (user && (await this.isUserEnabled(user))) {
                await this.processUser(user);
                return [user, false];
            }
            return [null, false];
        } catch (error) {
            if (error.name === 'TokenExpiredError' && this.renewExpiredToken && rememberMe) {
                const payload = this.jwtService.decode(accessToken);
                const user = await this.jwtPayloadToUser(payload);
                if (user && (await this.isUserEnabled(user))) {
                    await this.processUser(user);
                    return [user, true];
                }
                return [null, false];
            } else {
                return [null, false];
            }
        }
    }

    async userLogin(data: UserLoginDto) {
        const { email, password } = data;

        const user = await this.usersService.findOne(
            {
                $or: [
                    {
                        email: email,
                    },
                    { username: email },
                ],
            },
            {
                populate: {
                    path: 'groups',
                    select: 'name',
                },
            },
        );

        if (!user) {
            await this.auditService.log({
                eventType: 'auth.login.fail',
                severity: 'warn',
                actor: { email },
                action: { module: 'auth', operation: 'login', status: 'fail', reason: 'wrongCredentials' },
                http: { statusCode: 400 },
                meta: { loginIdentifier: email },
            });
            throw new BadRequestException(ErrorCodes.auth.wrongCredentials);
        }

        const isValidPassword = await this.comparePassword(password, user.password);
        if (!isValidPassword) {
            await this.auditService.log({
                eventType: 'auth.login.fail',
                severity: 'warn',
                actor: {
                    userId: String((user as any)._id),
                    email: (user as any).email,
                    username: (user as any).username,
                    name: (user as any).name,
                },
                action: { module: 'auth', operation: 'login', status: 'fail', reason: 'wrongCredentials' },
                http: { statusCode: 400 },
            });
            throw new BadRequestException(ErrorCodes.auth.wrongCredentials);
        }
        if (!(await this.isUserEnabled(user))) {
            await this.auditService.log({
                eventType: 'auth.login.fail',
                severity: 'warn',
                actor: {
                    userId: String((user as any)._id),
                    email: (user as any).email,
                    username: (user as any).username,
                    name: (user as any).name,
                },
                action: { module: 'auth', operation: 'login', status: 'fail', reason: 'userNotActive' },
                http: { statusCode: 400 },
            });
            throw new BadRequestException(ErrorCodes.auth.userNotActive);
        }

        await this.auditService.log({
            eventType: 'auth.login.success',
            severity: 'info',
            actor: {
                userId: String((user as any)._id),
                email: (user as any).email,
                username: (user as any).username,
                name: (user as any).name,
                roles: ((user as any).groups || []).map((g) => (typeof g === 'string' ? g : g?.name)).filter(Boolean),
            },
            action: { module: 'auth', operation: 'login', status: 'success' },
            http: { statusCode: 200 },
        });

        return this.prepareTokenResponse(user);
    }

    public async comparePassword(password, userPassword): Promise<boolean> {
        return compare(password, userPassword);
    }

    public async prepareTokenResponse(user: User, additionalInfo: Record<string, any> = {}) {
        await this.processUser(user);
        return {
            user,
            accessToken: await this.createAccessToken(user, additionalInfo),
            permissions: await this.groupService.getUserPermissions(user._id),
        };
    }

    async getUserPermission(userId: string) {
        const permissions = await this.groupService.getUserPermissions(userId);

        return { permissions };
    }

    async getUserProfile(userId: string) {
        const user = await this.usersService.findById(userId, {
            populate: [
                {
                    path: 'groups',
                    select: 'name',
                },
                {
                    path: 'userGroupsIds',
                    select: 'name',
                },
                {
                    path: 'allowedBuildingIds',
                    select: 'number address',
                },
            ],
        });
        await this.processUser(user);
        return user;
    }
}
