import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { RentalUser, RentalUserSchema } from './rental-user.model';
import { RentalUsersService } from './rental-users.service';
import { RentalUsersController } from './rental-users.controller';
import { RentalUsersRepo } from './rental-users.repo';
import { BuildingsModule } from '../buildings/buildings.module';
import { PropertiesModule } from '../properties/properties.module';
import { PaymentsModule } from '../payments/payments.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: RentalUser.name, schema: RentalUserSchema }], Databases.Primary),
        BuildingsModule,
        PropertiesModule,
        PaymentsModule,
        ExpensesModule,
    ],
    controllers: [RentalUsersController],
    providers: [RentalUsersService, RentalUsersRepo],
    exports: [RentalUsersService],
})
export class RentalUsersModule {}
