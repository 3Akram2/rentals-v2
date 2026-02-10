import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { Public } from 'src/app-auth/guards/app-auth.base.guard';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@ApiTags(Endpoints.Expenses)
@Controller(Endpoints.Expenses)
export class ExpensesController {
    constructor(private readonly expensesService: ExpensesService) {}

    @Get('building/:buildingId/year/:year')
    @Public()
    async findByBuildingAndYear(
        @Param('buildingId') buildingId: string,
        @Param('year') year: string,
    ) {
        return this.expensesService.findAll(
            { buildingId, year: parseInt(year) },
            { sort: { createdAt: -1 } },
        );
    }

    @Post()
    @Public()
    async create(@Body() data: CreateExpenseDto) {
        return this.expensesService.create(data as any);
    }

    @Put(':id')
    @Public()
    async update(@Param('id') id: string, @Body() data: UpdateExpenseDto) {
        const result = await this.expensesService.findOneAndUpdate(
            { _id: id },
            { $set: data },
            { new: true },
        );
        if (!result) throw new NotFoundException('Expense not found');
        return result;
    }

    @Delete(':id')
    @Public()
    async remove(@Param('id') id: string) {
        const result = await this.expensesService.deleteById(id);
        if (!result) throw new NotFoundException('Expense not found');
        return { message: 'Expense deleted successfully' };
    }
}
