import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class IsSuperAdminGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const user = context.switchToHttp().getRequest()?.user;

        if (user.branchId || user.restaurantId) throw new ForbiddenException();

        return true;
    }
}
