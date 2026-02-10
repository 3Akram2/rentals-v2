import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AppAuthService } from '../app-auth.service';
import { AuthenticationStrategies } from 'src/shared/constants';
import { ConfigService } from '@nestjs/config';
// import * as express from 'express';

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy, AuthenticationStrategies.JWT) {
    constructor(
        private authService: AppAuthService,
        configService: ConfigService,
    ) {
        const jwtConfig = configService.get('server')['authentication']['jwt'];
        super({
            secretOrKey: jwtConfig['secret'],
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            issuer: jwtConfig['signOptions']['issuer'],
            audience: jwtConfig['signOptions']['audience'],
            algorithms: [jwtConfig['signOptions']['algorithm']],
            ignoreExpiration: false,
            passReqToCallback: false,
            jsonWebTokenOptions: {
                ignoreNotBefore: false,
                maxAge: jwtConfig['signOptions']['expiresIn'],
            },
        });
    }

    // authenticate(req: express.Request, options?: any): void {
    //   super.authenticate(req, options);
    // }

    async validate(payload: any): Promise<any> {
        return this.authService.validateUserWithJwtPayload(payload);
    }
}
