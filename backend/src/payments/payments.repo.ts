import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Databases } from 'src/shared/constants';
import AbstractMongooseRepository from 'src/shared/mongo/AbstractMongooseRepository';
import { Payment, PaymentDocument } from './payment.model';

@Injectable()
export class PaymentsRepo extends AbstractMongooseRepository<Payment, PaymentDocument> {
    constructor(
        @InjectModel(Payment.name, Databases.Primary)
        Model_: mongoose.Model<PaymentDocument>,
    ) {
        super(Model_);
    }
}
