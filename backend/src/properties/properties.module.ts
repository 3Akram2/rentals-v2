import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { Property, PropertySchema } from './property.model';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertiesRepo } from './properties.repo';
import { PaymentsModule } from '../payments/payments.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Property.name, schema: PropertySchema }], Databases.Primary),
        forwardRef(() => PaymentsModule),
    ],
    controllers: [PropertiesController],
    providers: [PropertiesService, PropertiesRepo],
    exports: [PropertiesService],
})
export class PropertiesModule {}
