import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { BuildingsService } from './buildings.service';
import { PropertiesService } from '../properties/properties.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { AuthPermissions } from 'src/app-auth/guards/app-permissions.guard';
import { Permissions } from 'src/groups/enums/permissions.enum';
import { CurrentUser } from 'src/app-auth/user.decorator';
import { User } from 'src/users/user.model';
import { BuildingAccessService } from 'src/app-auth/building-access.service';
import { UsersService } from 'src/users/users.service';

@ApiTags(Endpoints.Buildings)
@Controller(Endpoints.Buildings)
export class BuildingsController {
    constructor(
        private readonly buildingsService: BuildingsService,
        @Inject(forwardRef(() => PropertiesService))
        private readonly propertiesService: PropertiesService,
        private readonly buildingAccessService: BuildingAccessService,
        private readonly usersService: UsersService,
    ) {}

    @Get()
    @AuthPermissions(Permissions.BuildingRead)
    async findAll(@CurrentUser() user: User) {
        const filter = await this.buildingAccessService.buildingFilter(user, '_id');
        return this.buildingsService.findAll(filter, { populate: 'moderatorAdminUserId' });
    }

    @Get(':id')
    @AuthPermissions(Permissions.BuildingRead)
    async findOne(@Param('id') id: string, @CurrentUser() user: User) {
        await this.buildingAccessService.assertBuildingAccess(user, id);
        const building = await this.buildingsService.findById(id, { populate: 'moderatorAdminUserId' });
        if (!building) throw new NotFoundException('Building not found');
        return building;
    }

    @Get(':id/properties')
    @AuthPermissions(Permissions.PropertyRead)
    async getProperties(@Param('id') id: string, @CurrentUser() user: User) {
        await this.buildingAccessService.assertBuildingAccess(user, id);
        return this.propertiesService.findAll({ buildingId: id });
    }

    @Post()
    @AuthPermissions(Permissions.BuildingCreate)
    async create(@Body() data: CreateBuildingDto, @CurrentUser() user: User) {
        await this.assertValidModerator(data?.moderatorAdminUserId);
        const building = await this.buildingsService.create(data as any);

        if (!(await this.buildingAccessService.isSuperAdmin(user))) {
            const currentAllowed = (user.allowedBuildingIds || []).map((id) => String(id));
            if (!currentAllowed.includes(String((building as any)._id))) {
                await this.usersService.updateById(user._id, {
                    allowedBuildingIds: [...currentAllowed, (building as any)._id],
                });
            }
        }

        return building;
    }

    @Put(':id')
    @AuthPermissions(Permissions.BuildingUpdate)
    async update(@Param('id') id: string, @Body() data: any, @CurrentUser() user: User) {
        await this.buildingAccessService.assertBuildingAccess(user, id);
        await this.assertValidModerator(data?.moderatorAdminUserId);
        const result = await this.buildingsService.findOneAndUpdate(
            { _id: id },
            { $set: data },
            { new: true, populate: 'moderatorAdminUserId' },
        );
        if (!result) throw new NotFoundException('Building not found');
        return result;
    }

    @Delete(':id')
    @AuthPermissions(Permissions.BuildingDelete)
    async remove(@Param('id') id: string, @CurrentUser() user: User) {
        await this.buildingAccessService.assertBuildingAccess(user, id);
        const properties = await this.propertiesService.findAll({ buildingId: id });
        for (const prop of properties) {
            await this.propertiesService.deleteById((prop as any)._id);
        }
        const result = await this.buildingsService.deleteById(id);
        if (!result) throw new NotFoundException('Building not found');
        return { message: 'Building deleted successfully' };
    }

    private async assertValidModerator(moderatorAdminUserId?: string) {
        if (!moderatorAdminUserId) return;
        const moderator = await this.usersService.findById(moderatorAdminUserId);
        if (!moderator || !(moderator as any).username || !(moderator as any).email) {
            throw new BadRequestException('Moderator must be a valid admin user');
        }
    }
}
