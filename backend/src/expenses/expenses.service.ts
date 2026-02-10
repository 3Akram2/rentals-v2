import { Injectable } from '@nestjs/common';
import { Expense, ExpenseDocument } from './expense.model';
import AbstractMongooseService from 'src/shared/mongo/AbstractMongooseService';
import { ExpensesRepo } from './expenses.repo';

@Injectable()
export class ExpensesService extends AbstractMongooseService<Expense, ExpenseDocument, ExpensesRepo> {
    constructor(repo: ExpensesRepo) {
        super(repo);
    }
}
