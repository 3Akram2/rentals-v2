import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { Payment, PaymentSchema } from './payment.model';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsRepo } from './payments.repo';
import { PropertiesModule } from '../properties/properties.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }], Databases.Primary),
        forwardRef(() => PropertiesModule),
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService, PaymentsRepo],
    exports: [PaymentsService],
})
export class PaymentsModule {}
