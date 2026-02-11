import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { BuildingAccessService } from '../building-access.service';

@Injectable()
export class SuperAdminAccessGuard implements CanActivate {
    constructor(private readonly buildingAccessService: BuildingAccessService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const user = context.switchToHttp().getRequest()?.user;
        if (!user) throw new ForbiddenException();

        const isSuperAdmin = await this.buildingAccessService.isSuperAdmin(user);
        if (!isSuperAdmin) throw new ForbiddenException('SuperAdmin access required');

        return true;
    }
}
