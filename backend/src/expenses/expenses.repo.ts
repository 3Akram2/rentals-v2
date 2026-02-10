import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Databases } from 'src/shared/constants';
import AbstractMongooseRepository from 'src/shared/mongo/AbstractMongooseRepository';
import { Expense, ExpenseDocument } from './expense.model';

@Injectable()
export class ExpensesRepo extends AbstractMongooseRepository<Expense, ExpenseDocument> {
    constructor(
        @InjectModel(Expense.name, Databases.Primary)
        Model_: mongoose.Model<ExpenseDocument>,
    ) {
        super(Model_);
    }
}
