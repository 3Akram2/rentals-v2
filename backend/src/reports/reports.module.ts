import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { BuildingsModule } from '../buildings/buildings.module';
import { PropertiesModule } from '../properties/properties.module';
import { PaymentsModule } from '../payments/payments.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
    imports: [BuildingsModule, PropertiesModule, PaymentsModule, ExpensesModule],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule {}
