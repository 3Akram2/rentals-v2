import { ExecutionContext } from '@nestjs/common';
import { AppAuthService } from '../app-auth.service';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

export const AUTH_IS_PUBLIC_KEY = 'AUTH_isPublic';
export const AUTH_TRY_EXTRACTING_USER_KEY = 'AUTH_tryExtractingUser';

export function BaseAppAuthGuard(...args: string[]) {
    return class AbstractBaseAppAuthGuard extends AuthGuard(args) {
        constructor(
            public authService: AppAuthService,
            public reflector: Reflector,
        ) {
            super();
        }

        canActivate(context: ExecutionContext): Promise<boolean> {
            const request = context.switchToHttp().getRequest();
            if (request['user']) return Promise.resolve(true);

            const isPublic = this.reflector.getAllAndOverride<boolean>(AUTH_IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
            const tryExtractingUser = this.reflector.getAllAndOverride<boolean>(AUTH_TRY_EXTRACTING_USER_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
            if (isPublic) return Promise.resolve(true);

            if (tryExtractingUser) {
                return (super.canActivate(context) as Promise<boolean>).catch((_) => true).then((_) => true);
            }

            // return super.canActivate(context);
            return Promise.resolve(super.canActivate(context)).then((result) => {
                return Promise.resolve(result as boolean);
            });
        }
    };
}

export const Public = (tryExtractingUser?: boolean) => {
    if (tryExtractingUser) {
        return SetMetadata(AUTH_TRY_EXTRACTING_USER_KEY, true);
    } else {
        return SetMetadata(AUTH_IS_PUBLIC_KEY, true);
    }
};
