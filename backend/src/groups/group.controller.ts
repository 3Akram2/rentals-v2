import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { Endpoints } from 'src/shared/constants';
import AbstractController from 'src/shared/mongo/AbstractController';
import { Group, GroupDocument } from './group.model';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Pagination } from 'src/shared/dto/pagination.dto';
import { GroupRepo } from './group.repo';
import { GenericFilterQuery } from 'src/shared/mongo/generic-filter-query.dto';
import { GroupService } from './group.service';
import { Permissions } from './enums/permissions.enum';
import { AuthPermissions } from 'src/app-auth/guards/app-permissions.guard';
import { CurrentUser } from 'src/app-auth/user.decorator';
import { User } from 'src/users/user.model';

@ApiTags(Endpoints.Groups)
@Controller({ path: Endpoints.Groups })
@ApiBearerAuth()
export class GroupController extends AbstractController<Group, GroupDocument, GroupRepo, GroupService> {
    constructor(
        configService: ConfigService,
        private readonly service: GroupService,
    ) {
        super(service, configService);
    }

    @Get()
    @AuthPermissions(Permissions.GroupRead)
    find(@Query() queryParams, @Query() pagination: Pagination) {
        return super.find_(queryParams, pagination);
    }

    @Post()
    @AuthPermissions(Permissions.GroupCreate)
    create(@Req() req: Request, @Body() data: Group) {
        return this.service.create(data);
    }

    @Post('search')
    @AuthPermissions(Permissions.GroupRead)
    advancedSearch(@Body() filters: GenericFilterQuery) {
        return this.service.search(filters);
    }

    @Post('count')
    @AuthPermissions(Permissions.GroupRead)
    count(@Body() filters: GenericFilterQuery) {
        return this.service.getSearchCount(filters);
    }

    @Patch(':id')
    @AuthPermissions(Permissions.GroupUpdate)
    update(@Param('id') id: string, @Body() data: Group) {
        return super.patch_(id, data);
    }

    @Delete(':id')
    @AuthPermissions(Permissions.GroupDelete)
    delete(@Param('id') id: string) {
        return super.softDelete_(id);
    }

    @Get(':id')
    @AuthPermissions(Permissions.GroupRead)
    get(@Param('id') id: string, @Query() queryParams) {
        return super.get_(id, queryParams);
    }

    @Get('permissions/all')
    @AuthPermissions(Permissions.GroupRead)
    getPermissions(@CurrentUser() user: User) {
        return { data: Object.values(Permissions) };
    }
}
