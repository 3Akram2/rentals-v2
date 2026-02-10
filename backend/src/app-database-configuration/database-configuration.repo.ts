import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Databases } from 'src/shared/constants';
import AbstractMongooseRepository from 'src/shared/mongo/AbstractMongooseRepository';
import { Config, ConfigDocument } from './configs.model';

@Injectable()
export class DatabaseConfigurationRepo extends AbstractMongooseRepository<Config, ConfigDocument> {
    private logger = new Logger(DatabaseConfigurationRepo.name);

    constructor(
        @InjectModel(Config.name, Databases.Primary)
        model_: mongoose.Model<ConfigDocument>,
    ) {
        super(model_);
    }
}
