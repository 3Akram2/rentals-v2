import { Injectable, Logger } from '@nestjs/common';
import { User, UserDocument } from './user.model';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Databases } from 'src/shared/constants';
import AbstractMongooseRepository from 'src/shared/mongo/AbstractMongooseRepository';

@Injectable()
export class UsersRepo extends AbstractMongooseRepository<User, UserDocument> {
    private logger = new Logger(UsersRepo.name);

    constructor(
        @InjectModel(User.name, Databases.Primary)
        Model_: mongoose.Model<UserDocument>,
    ) {
        super(Model_);
    }
}
