import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { RentalUsersService } from './rental-users.service';
import { CreateRentalUserDto } from './dto/create-rental-user.dto';
import { UpdateRentalUserDto } from './dto/update-rental-user.dto';
import { AuthPermissions } from 'src/app-auth/guards/app-permissions.guard';
import { Permissions } from 'src/groups/enums/permissions.enum';
import { CurrentUser } from 'src/app-auth/user.decorator';
import { User } from 'src/users/user.model';

@ApiTags(Endpoints.RentalUsers)
@Controller(Endpoints.RentalUsers)
export class RentalUsersController {
    constructor(private readonly rentalUsersService: RentalUsersService) {}

    @Get()
    @AuthPermissions(Permissions.RentalUserRead)
    async findAll(@CurrentUser() actor: User, @Query('status') status?: string, @Query('search') search?: string) {
        return this.rentalUsersService.findAllAccessible(actor, status, search);
    }

    @Get(':id')
    @AuthPermissions(Permissions.RentalUserRead)
    async findOne(@CurrentUser() actor: User, @Param('id') id: string) {
        return this.rentalUsersService.findOneAccessible(actor, id);
    }

    @Post()
    @AuthPermissions(Permissions.RentalUserCreate)
    async create(@Body() data: CreateRentalUserDto) {
        return this.rentalUsersService.create({
            name: data.name,
            phone: data.phone,
            notes: data.notes,
            status: data.status || 'active',
        } as any);
    }

    @Put(':id')
    @AuthPermissions(Permissions.RentalUserUpdate)
    async update(@CurrentUser() actor: User, @Param('id') id: string, @Body() data: UpdateRentalUserDto) {
        await this.rentalUsersService.findOneAccessible(actor, id);

        const result = await this.rentalUsersService.findOneAndUpdate(
            { _id: id },
            { $set: { name: data.name, phone: data.phone, notes: data.notes, status: data.status } },
            { new: true },
        );
        if (!result) throw new NotFoundException('User not found');
        return result;
    }

    @Delete(':id')
    @AuthPermissions(Permissions.RentalUserDelete)
    async remove(@CurrentUser() actor: User, @Param('id') id: string) {
        await this.rentalUsersService.findOneAccessible(actor, id);
        return this.rentalUsersService.deleteWithValidation(id);
    }

    @Post(':id/refresh')
    @AuthPermissions(Permissions.RentalUserRead)
    async refresh(@CurrentUser() actor: User, @Param('id') id: string) {
        await this.rentalUsersService.findOneAccessible(actor, id);
        return this.rentalUsersService.refreshUserData(id);
    }

    @Get(':id/report/:year')
    @AuthPermissions(Permissions.ReportRead)
    async getReport(@CurrentUser() actor: User, @Param('id') id: string, @Param('year') year: string) {
        await this.rentalUsersService.findOneAccessible(actor, id);
        return this.rentalUsersService.getUserReport(id, parseInt(year));
    }
}
