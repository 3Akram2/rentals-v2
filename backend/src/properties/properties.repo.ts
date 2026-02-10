import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Databases } from 'src/shared/constants';
import AbstractMongooseRepository from 'src/shared/mongo/AbstractMongooseRepository';
import { Property, PropertyDocument } from './property.model';

@Injectable()
export class PropertiesRepo extends AbstractMongooseRepository<Property, PropertyDocument> {
    constructor(
        @InjectModel(Property.name, Databases.Primary)
        Model_: mongoose.Model<PropertyDocument>,
    ) {
        super(Model_);
    }
}
