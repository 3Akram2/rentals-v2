import { Injectable } from '@nestjs/common';
import { Payment, PaymentDocument } from './payment.model';
import AbstractMongooseService from 'src/shared/mongo/AbstractMongooseService';
import { PaymentsRepo } from './payments.repo';

@Injectable()
export class PaymentsService extends AbstractMongooseService<Payment, PaymentDocument, PaymentsRepo> {
    constructor(repo: PaymentsRepo) {
        super(repo);
    }
}
