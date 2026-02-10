import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UseGuards,
    SetMetadata,
    applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GroupService } from 'src/groups/group.service';

export function AuthPermissions(...permissions: string[]) {
    return applyDecorators(SetMetadata('permissions', permissions), UseGuards(PermissionsGuard));
}

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly groupService: GroupService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const permissions = this.reflector.get<string[]>('permissions', context.getHandler());
        if (permissions.length === 0) return true;
        const request = context.switchToHttp().getRequest();

        const usersPermissions = await this.groupService.distinct('permissions', {
            _id: { $in: request?.user?.groups },
        });

        if (!permissions.every((permission) => usersPermissions.includes(permission))) throw new ForbiddenException();

        return true;
    }
}
