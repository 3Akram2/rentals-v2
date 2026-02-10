import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { Endpoints } from 'src/shared/constants';
import AbstractController from 'src/shared/mongo/AbstractController';
import { UsersGroup, UsersGroupDocument } from './users-group.model';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Pagination } from 'src/shared/dto/pagination.dto';
import { UsersGroupRepo } from './users-group.repo';
import { GenericFilterQuery } from 'src/shared/mongo/generic-filter-query.dto';
import { UsersGroupService } from './users-group.service';
import { CreateUsersGroupDto } from './dto/create-users-group.dto';
import { UpdateUsersGroupDto } from './dto/update-users-group.dto';
import { UpdateUsersGroupStatusDto } from './dto/update-users-group-status.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { RemoveUsersDto } from './dto/remove-users.dto';

@ApiTags(Endpoints.UsersGroup)
@Controller({ path: Endpoints.UsersGroup })
@ApiBearerAuth()
export class UsersGroupController extends AbstractController<
    UsersGroup,
    UsersGroupDocument,
    UsersGroupRepo,
    UsersGroupService
> {
    constructor(
        configService: ConfigService,
        private readonly service: UsersGroupService,
    ) {
        super(service, configService);
    }

    @Get(':id')
    get(@Param('id') id: string, @Query() queryParams) {
        queryParams.populate = [{ path: 'userIds', select: 'username email profileImage name' }];
        return super.get_(id, queryParams);
    }

    @Get()
    find(@Query() queryParams, @Query() pagination: Pagination) {
        return super.find_(queryParams, pagination);
    }

    @Post()
    create(@Req() req: Request, @Body() data: CreateUsersGroupDto) {
        return this.service.create(data);
    }

    @Post('search')
    advancedSearch(@Body() filters: GenericFilterQuery) {
        filters.populate = [{ path: 'userIds', select: 'username email profileImage name' }];
        return this.service.search(filters);
    }

    @Post('count')
    count(@Body() filters: GenericFilterQuery) {
        return this.service.getSearchCount(filters);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: UpdateUsersGroupDto) {
        return this.service.updateUsersGroup(id, data);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() data: UpdateUsersGroupStatusDto) {
        return this.service.updateUsersGroupStatus(id, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.service.deleteById(id);
    }

    @Post(':id/add-users')
    addUsers(@Param('id') id: string, @Body() data: AddUsersDto) {
        return this.service.addUsers(id, data.userIds);
    }

    @Post(':id/remove-users')
    removeUsers(@Param('id') id: string, @Body() data: RemoveUsersDto) {
        return this.service.removeUsers(id, data.userIds);
    }
}
