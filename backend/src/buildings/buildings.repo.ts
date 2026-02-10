import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Databases } from 'src/shared/constants';
import AbstractMongooseRepository from 'src/shared/mongo/AbstractMongooseRepository';
import { Building, BuildingDocument } from './building.model';

@Injectable()
export class BuildingsRepo extends AbstractMongooseRepository<Building, BuildingDocument> {
    constructor(
        @InjectModel(Building.name, Databases.Primary)
        Model_: mongoose.Model<BuildingDocument>,
    ) {
        super(Model_);
    }
}
