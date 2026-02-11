import { BadRequestException, Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ResetPasswordDto, User, UserDocument } from './user.model';
import AbstractMongooseService from 'src/shared/mongo/AbstractMongooseService';
import * as bcrypt from 'bcrypt';
import { UsersRepo } from './users.repo';
import { ErrorCodes } from 'src/shared/errors/custom';
import { GroupService } from 'src/groups/group.service';
import { UsersGroupService } from 'src/users-group/users-group.service';
import { MainGroups } from 'src/groups/constants';

@Injectable()
export class UsersService extends AbstractMongooseService<User, UserDocument, UsersRepo> {
    private logger = new Logger(UsersService.name);
    private readonly protectedAdminEmails = ['admin@rentals.local'];
    private readonly protectedAdminUsernames = ['admin'];

    constructor(
        repo: UsersRepo,
        private readonly groupService: GroupService,
        @Inject(forwardRef(() => UsersGroupService))
        private readonly usersGroupService: UsersGroupService,
    ) {
        super(repo);
    }

    private isProtectedAdminAccount(user: User) {
        const email = String(user?.email || '').toLowerCase();
        const username = String(user?.username || '').toLowerCase();
        return this.protectedAdminEmails.includes(email) || this.protectedAdminUsernames.includes(username);
    }

    async sanitizeUserResponse<T = any>(payload: T): Promise<T> {
        if (!payload) return payload;

        const strip = (item: any) => {
            if (item && typeof item === 'object' && 'password' in item) {
                delete item.password;
            }
            return item;
        };

        if (Array.isArray(payload)) {
            return payload.map(strip) as T;
        }

        if ((payload as any).data && Array.isArray((payload as any).data)) {
            (payload as any).data = (payload as any).data.map(strip);
            return payload;
        }

        return strip(payload) as T;
    }

    async createUser(data: User): Promise<User> {
        await this.validateUserUniqueNess(data);
        data.password = await bcrypt.hash(data.password, 10);

        return this.create(data);
    }

    async updateUser(id: string, data: User): Promise<User> {
        await this.validateUserUniqueNess(data, id);

        const currentUser = await this.findById(id, { populate: { path: 'groups', select: 'name' } });
        if (!currentUser) {
            throw new NotFoundException(ErrorCodes.user.notFound);
        }

        if (this.isProtectedAdminAccount(currentUser)) {
            const targetGroups = data.groups || currentUser.groups || [];
            const targetGroupIds = targetGroups.map((g: any) => String(g?._id || g));
            const resolvedGroups = await this.groupService.findAll({ _id: { $in: targetGroupIds } });
            const keepsSuperAdmin = resolvedGroups.some((group) => group.name === MainGroups.SuperAdmin);
            if (!keepsSuperAdmin) {
                throw new BadRequestException('Primary super admin role cannot be removed');
            }
            if (data.active === false) {
                throw new BadRequestException('Primary super admin cannot be deactivated');
            }
        }

        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        // Handle bidirectional updates for userGroupsIds
        if (data.userGroupsIds !== undefined) {
            await this.syncUserGroupsIds(id, data.userGroupsIds);
        }

        return await this.findOneAndUpdate(
            { _id: id },
            {
                $set: data,
            },
            {
                new: true,
            },
        );
    }

    private async syncUserGroupsIds(userId: string, newGroupIds: string[]): Promise<void> {
        const currentUser = await this.findById(userId);
        if (!currentUser) {
            throw new NotFoundException(ErrorCodes.user.notFound);
        }

        const currentGroupIds = currentUser.userGroupsIds || [];

        // Find groups to remove and add
        const removedGroupIds = currentGroupIds.filter(
            (groupId) => !newGroupIds.some((id) => String(id) === String(groupId)),
        );
        const addedGroupIds = newGroupIds.filter(
            (id) => !currentGroupIds.some((groupId) => String(id) === String(groupId)),
        );

        // Update UsersGroup entities bidirectionally
        if (removedGroupIds.length) {
            await this.usersGroupService.updateMany({ _id: { $in: removedGroupIds } }, { $pull: { userIds: userId } });
        }
        if (addedGroupIds.length) {
            // Validate that all groups exist before adding
            const existingGroups = await this.usersGroupService.findAll({
                _id: { $in: addedGroupIds },
                deleted: false,
            });
            if (existingGroups.length !== addedGroupIds.length) {
                throw new BadRequestException(ErrorCodes.usersGroup.notFound);
            }

            await this.usersGroupService.updateMany(
                { _id: { $in: addedGroupIds } },
                { $addToSet: { userIds: userId } },
            );
        }
    }

    async updatePassword(id: string, passwordData: ResetPasswordDto): Promise<User | string> {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException('user not found');
        }
        const isValidPassword = await bcrypt.compare(passwordData.oldPassword, user.password);
        if (!isValidPassword) {
            throw new BadRequestException('wrong old password');
        }
        return this.updateUser(id, new User({ password: passwordData.password }));
    }

    async softDeleteUser(id: string): Promise<User> {
        const user = await this.findById(id);
        if (this.isProtectedAdminAccount(user)) {
            throw new BadRequestException('Primary super admin cannot be deleted');
        }

        // Remove the user from all user groups
        await this.removeUserFromUserGroups(id);

        return this.loadByIdAndPatch(id, (oldUser) => {
            return {
                deletedAt: new Date(),
                deleted: true,
                email: `DELETED_${Date.now()}_${oldUser.email}`,
            };
        });
    }

    private async removeUserFromUserGroups(userId: string): Promise<void> {
        try {
            // Remove the user from all user groups' userIds arrays
            await this.usersGroupService.updateMany({ userIds: userId }, { $pull: { userIds: userId } });

            // Clear the user's userGroupsIds array
            await this.updateById(userId, { userGroupsIds: [] });
        } catch (error) {
            this.logger.error(`Failed to remove user ${userId} from user groups: ${error.message}`);
        }
    }

    getNormalUsersByAdminId(id: string, onlyReturnId = true) {
        return onlyReturnId ? this.distinct('_id', { createdBy: id }) : this.findAll({ createdBy: id });
    }

    async isValueExist(key: string, value: string, exceptDocId?: string) {
        const result = await this.count({
            [`${key}`]: value,
            deleted: { $ne: true },
            ...(exceptDocId && {
                _id: { $ne: exceptDocId },
            }),
        });

        return result.total > 0;
    }

    async validateUserUniqueNess(user: User, exceptDocId?: string) {
        if (user.email && (await this.isValueExist('email', user.email, exceptDocId)))
            throw new BadRequestException(ErrorCodes.user.emailAlreadyExist);

        if (user.username && (await this.isValueExist('username', user.username, exceptDocId)))
            throw new BadRequestException(ErrorCodes.user.usernameAlreadyExist);
    }
}
