import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AppAuthService } from '../app-auth.service';
import { AuthenticationStrategies } from 'src/shared/constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, AuthenticationStrategies.Local) {
    constructor(
        private authService: AppAuthService,
        configService: ConfigService,
    ) {
        super({
            usernameField: 'email', // that is the property name received from client, internally it will be checked against this.configService.get('server')['authentication']['usernameField'] array
            passwordField: configService.get('server')['authentication']['passwordField'],
        });
    }

    async validate(username: string, password: string): Promise<any> {
        return this.authService.validateUserWithCredentials(username, password);
    }
}
