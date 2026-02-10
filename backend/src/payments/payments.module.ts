import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { Payment, PaymentSchema } from './payment.model';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsRepo } from './payments.repo';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }], Databases.Primary),
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService, PaymentsRepo],
    exports: [PaymentsService],
})
export class PaymentsModule {}
