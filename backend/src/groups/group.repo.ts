import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Databases } from 'src/shared/constants';
import AbstractMongooseRepository from 'src/shared/mongo/AbstractMongooseRepository';
import { Group, GroupDocument } from './group.model';

@Injectable()
export class GroupRepo extends AbstractMongooseRepository<Group, GroupDocument> {
    private logger = new Logger(GroupRepo.name);

    constructor(
        @InjectModel(Group.name, Databases.Primary)
        Model_: mongoose.Model<GroupDocument>,
    ) {
        super(Model_);
    }
}
