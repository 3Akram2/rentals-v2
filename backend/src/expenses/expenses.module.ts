import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { Expense, ExpenseSchema } from './expense.model';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { ExpensesRepo } from './expenses.repo';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }], Databases.Primary),
    ],
    controllers: [ExpensesController],
    providers: [ExpensesService, ExpensesRepo],
    exports: [ExpensesService],
})
export class ExpensesModule {}
