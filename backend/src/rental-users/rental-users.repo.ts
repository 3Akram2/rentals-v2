import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Databases } from 'src/shared/constants';
import AbstractMongooseRepository from 'src/shared/mongo/AbstractMongooseRepository';
import { RentalUser, RentalUserDocument } from './rental-user.model';

@Injectable()
export class RentalUsersRepo extends AbstractMongooseRepository<RentalUser, RentalUserDocument> {
    constructor(
        @InjectModel(RentalUser.name, Databases.Primary)
        Model_: mongoose.Model<RentalUserDocument>,
    ) {
        super(Model_);
    }
}
