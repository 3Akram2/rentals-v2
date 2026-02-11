import { ForbiddenException, Injectable } from '@nestjs/common';
import { GroupService } from 'src/groups/group.service';
import { User } from 'src/users/user.model';

@Injectable()
export class BuildingAccessService {
    constructor(private readonly groupService: GroupService) {}

    async isSuperAdmin(user: User): Promise<boolean> {
        return this.groupService.isSuperAdminGroup(user?.groups || []);
    }

    async getAllowedBuildingIds(user: User): Promise<string[] | null> {
        if (!user?._id) return [];
        if (await this.isSuperAdmin(user)) return null;
        return (user.allowedBuildingIds || []).map((id) => String(id));
    }

    async assertBuildingAccess(user: User, buildingId: string): Promise<void> {
        const allowedBuildingIds = await this.getAllowedBuildingIds(user);
        if (allowedBuildingIds === null) return;
        if (!allowedBuildingIds.includes(String(buildingId))) {
            throw new ForbiddenException('You are not allowed to access this building');
        }
    }

    async buildingFilter(user: User, field = '_id') {
        const allowedBuildingIds = await this.getAllowedBuildingIds(user);
        if (allowedBuildingIds === null) return {};
        return { [field]: { $in: allowedBuildingIds } };
    }
}
