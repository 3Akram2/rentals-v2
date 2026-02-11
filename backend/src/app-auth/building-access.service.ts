import { ForbiddenException, Injectable } from '@nestjs/common';
import { MainGroups } from 'src/groups/constants';
import { GroupService } from 'src/groups/group.service';
import { User } from 'src/users/user.model';

@Injectable()
export class BuildingAccessService {
    private superAdminGroupId?: string;

    constructor(private readonly groupService: GroupService) {}

    private async getSuperAdminGroupId(): Promise<string | null> {
        if (this.superAdminGroupId) return this.superAdminGroupId;
        const superAdminGroup = await this.groupService.findOne({ name: MainGroups.SuperAdmin });
        this.superAdminGroupId = superAdminGroup?._id ? String(superAdminGroup._id) : undefined;
        return this.superAdminGroupId || null;
    }

    async isSuperAdmin(user: User): Promise<boolean> {
        const superAdminGroupId = await this.getSuperAdminGroupId();
        if (!superAdminGroupId) return false;

        const userGroupIds = (user?.groups || []).map((group: any) => String(group?._id || group));
        return userGroupIds.includes(superAdminGroupId);
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
