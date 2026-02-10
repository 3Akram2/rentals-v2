import { Injectable } from '@nestjs/common';
import { AppAuthService } from '../app-auth.service';
import { Reflector } from '@nestjs/core';
import { AuthenticationStrategies } from 'src/shared/constants';
import { BaseAppAuthGuard } from './app-auth.base.guard';

@Injectable()
export class AppJWTAuthGuard extends BaseAppAuthGuard(AuthenticationStrategies.JWT) {
    constructor(authService_: AppAuthService, reflector_: Reflector) {
        super(authService_, reflector_);
    }
}
