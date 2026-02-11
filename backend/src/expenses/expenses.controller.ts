import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { AuthPermissions } from 'src/app-auth/guards/app-permissions.guard';
import { Permissions } from 'src/groups/enums/permissions.enum';
import { CurrentUser } from 'src/app-auth/user.decorator';
import { User } from 'src/users/user.model';
import { BuildingAccessService } from 'src/app-auth/building-access.service';

@ApiTags(Endpoints.Expenses)
@Controller(Endpoints.Expenses)
export class ExpensesController {
    constructor(
        private readonly expensesService: ExpensesService,
        private readonly buildingAccessService: BuildingAccessService,
    ) {}

    @Get('building/:buildingId/year/:year')
    @AuthPermissions(Permissions.ExpenseRead)
    async findByBuildingAndYear(
        @Param('buildingId') buildingId: string,
        @Param('year') year: string,
        @CurrentUser() user: User,
    ) {
        await this.buildingAccessService.assertBuildingAccess(user, buildingId);
        return this.expensesService.findAll(
            { buildingId, year: parseInt(year) },
            { sort: { createdAt: -1 } },
        );
    }

    @Post()
    @AuthPermissions(Permissions.ExpenseCreate)
    async create(@Body() data: CreateExpenseDto, @CurrentUser() user: User) {
        await this.buildingAccessService.assertBuildingAccess(user, data.buildingId);
        return this.expensesService.create(data as any);
    }

    @Put(':id')
    @AuthPermissions(Permissions.ExpenseUpdate)
    async update(@Param('id') id: string, @Body() data: UpdateExpenseDto, @CurrentUser() user: User) {
        const expense = await this.expensesService.findById(id);
        if (!expense) throw new NotFoundException('Expense not found');

        await this.buildingAccessService.assertBuildingAccess(user, String((expense as any).buildingId));

        const result = await this.expensesService.findOneAndUpdate(
            { _id: id },
            { $set: data },
            { new: true },
        );
        if (!result) throw new NotFoundException('Expense not found');
        return result;
    }

    @Delete(':id')
    @AuthPermissions(Permissions.ExpenseDelete)
    async remove(@Param('id') id: string, @CurrentUser() user: User) {
        const expense = await this.expensesService.findById(id);
        if (!expense) throw new NotFoundException('Expense not found');

        await this.buildingAccessService.assertBuildingAccess(user, String((expense as any).buildingId));

        const result = await this.expensesService.deleteById(id);
        if (!result) throw new NotFoundException('Expense not found');
        return { message: 'Expense deleted successfully' };
    }
}
