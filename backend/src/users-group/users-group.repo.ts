import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Databases } from 'src/shared/constants';
import AbstractMongooseRepository from 'src/shared/mongo/AbstractMongooseRepository';
import { UsersGroup, UsersGroupDocument } from './users-group.model';

@Injectable()
export class UsersGroupRepo extends AbstractMongooseRepository<UsersGroup, UsersGroupDocument> {
    private logger = new Logger(UsersGroupRepo.name);

    constructor(
        @InjectModel(UsersGroup.name, Databases.Primary)
        Model_: mongoose.Model<UsersGroupDocument>,
    ) {
        super(Model_);
    }
}
