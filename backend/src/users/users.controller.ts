import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Endpoints } from 'src/shared/constants';
import AbstractController from 'src/shared/mongo/AbstractController';
import { ResetPasswordDto, User, UserDocument } from './user.model';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination } from 'src/shared/dto/pagination.dto';
import { UsersRepo } from './users.repo';
import { AuthPermissions } from 'src/app-auth/guards/app-permissions.guard';
import { Permissions } from 'src/groups/enums/permissions.enum';
import { GenericFilterQuery } from 'src/shared/mongo/generic-filter-query.dto';
import { CurrentUser } from 'src/app-auth/user.decorator';
import { IsSuperAdminGuard } from 'src/app-auth/guards/super-admin.guard';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@ApiTags(Endpoints.AdminUsers)
@Controller(Endpoints.AdminUsers)
@ApiBearerAuth()
export class UsersController extends AbstractController<User, UserDocument, UsersRepo, UsersService> {
    constructor(
        configService: ConfigService,
        private readonly service: UsersService,
    ) {
        super(service, configService);
    }

    @Get(':id')
    @AuthPermissions(Permissions.UserRead)
    async get(@Param('id') id: string, @Query() queryParams) {
        const result = await super.get_(id, queryParams);
        return this.service.sanitizeUserResponse(result);
    }

    @Get()
    @ApiQuery({
        name: '$sort',
        required: false,
        type: 'object',
        explode: true,
        style: 'deepObject',
        example: '{"name": 1, "age": -1}',
    })
    @ApiQuery({
        name: 'propertyName',
        required: false,
        type: 'object',
        explode: true,
        style: 'deepObject',
        example: '{$regex: "ahm", $gt: 3, $gte: 3, $lt: 3, $lte: 3, $ne: 3}',
    })
    @ApiQuery({
        required: false,
        type: User,
    })
    @AuthPermissions(Permissions.UserRead)
    async find(@Query() queryParams, @Query() pagination: Pagination) {
        const result = await super.findAll_(queryParams, pagination);
        return this.service.sanitizeUserResponse(result);
    }

    @Post()
    @UseGuards(IsSuperAdminGuard)
    @AuthPermissions(Permissions.UserCreate)
    async create(@Body() data: CreateAdminUserDto, @CurrentUser() user: User) {
        const payload = { ...data, createdBy: user._id } as User;
        const created = await this.service.createUser(payload);
        return this.service.sanitizeUserResponse(created);
    }

    @Post('search')
    @AuthPermissions(Permissions.UserRead)
    async advancedSearch(@Body() filters: GenericFilterQuery) {
        filters.equal = {
            ...filters.equal,
        };

        filters.populate = [
            {
                path: 'groups',
                select: 'name',
            },
            {
                path: 'userGroupsIds',
                select: 'name',
            },
        ];
        const result = await this.service.search(filters);
        return this.service.sanitizeUserResponse(result);
    }

    @Post('count')
    @AuthPermissions(Permissions.UserRead)
    count(@Body() filters: GenericFilterQuery) {
        return this.service.getSearchCount(filters);
    }

    @Patch('change-password')
    updatePassword(@CurrentUser() user: User, @Body() data: ResetPasswordDto) {
        return this.getOrThrow404(this.service.updatePassword(user._id, data));
    }

    @Patch(':id')
    @UseGuards(IsSuperAdminGuard)
    @AuthPermissions(Permissions.UserUpdate)
    async update(@Param('id') id: string, @Body() data: UpdateAdminUserDto) {
        const updated = await this.getOrThrow404(this.service.updateUser(id, data as User));
        return this.service.sanitizeUserResponse(updated);
    }

    @UseGuards(IsSuperAdminGuard)
    @Patch(':id/reset-password')
    resetPassword(@Param('id') id, @Body() data: User) {
        return this.getOrThrow404(this.service.updateUser(id, data));
    }

    @ApiOperation({
        description: 'this is a soft delete operation',
    })
    @Delete(':id')
    @AuthPermissions(Permissions.UserDelete)
    delete(@Param('id') id: string) {
        return this.getOrThrow404(this.service.softDeleteUser(id));
    }
}
