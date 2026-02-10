import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { Building, BuildingSchema } from './building.model';
import { BuildingsService } from './buildings.service';
import { BuildingsController } from './buildings.controller';
import { BuildingsRepo } from './buildings.repo';
import { PropertiesModule } from '../properties/properties.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Building.name, schema: BuildingSchema }], Databases.Primary),
        forwardRef(() => PropertiesModule),
    ],
    controllers: [BuildingsController],
    providers: [BuildingsService, BuildingsRepo],
    exports: [BuildingsService],
})
export class BuildingsModule {}
