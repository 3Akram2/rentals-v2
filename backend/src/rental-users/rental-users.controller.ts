import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { Public } from 'src/app-auth/guards/app-auth.base.guard';
import { RentalUsersService } from './rental-users.service';
import { CreateRentalUserDto } from './dto/create-rental-user.dto';
import { UpdateRentalUserDto } from './dto/update-rental-user.dto';

@ApiTags(Endpoints.RentalUsers)
@Controller(Endpoints.RentalUsers)
export class RentalUsersController {
    constructor(private readonly rentalUsersService: RentalUsersService) {}

    @Get()
    @Public()
    async findAll(@Query('status') status?: string, @Query('search') search?: string) {
        const query: any = {};
        if (status) query.status = status;
        if (search) query.name = { $regex: search, $options: 'i' };
        return this.rentalUsersService.findAll(query, { sort: { name: 1 } });
    }

    @Get(':id')
    @Public()
    async findOne(@Param('id') id: string) {
        const user = await this.rentalUsersService.findById(id);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    @Post()
    @Public()
    async create(@Body() data: CreateRentalUserDto) {
        return this.rentalUsersService.create({
            name: data.name,
            phone: data.phone,
            notes: data.notes,
            status: data.status || 'active',
        } as any);
    }

    @Put(':id')
    @Public()
    async update(@Param('id') id: string, @Body() data: UpdateRentalUserDto) {
        const result = await this.rentalUsersService.findOneAndUpdate(
            { _id: id },
            { $set: { name: data.name, phone: data.phone, notes: data.notes, status: data.status } },
            { new: true },
        );
        if (!result) throw new NotFoundException('User not found');
        return result;
    }

    @Delete(':id')
    @Public()
    async remove(@Param('id') id: string) {
        return this.rentalUsersService.deleteWithValidation(id);
    }

    @Post(':id/refresh')
    @Public()
    async refresh(@Param('id') id: string) {
        return this.rentalUsersService.refreshUserData(id);
    }

    @Get(':id/report/:year')
    @Public()
    async getReport(@Param('id') id: string, @Param('year') year: string) {
        return this.rentalUsersService.getUserReport(id, parseInt(year));
    }
}
