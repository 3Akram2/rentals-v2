import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Databases } from 'src/shared/constants';
import AbstractMongooseRepository from 'src/shared/mongo/AbstractMongooseRepository';
import { BuildingAiChat, BuildingAiChatDocument } from './building-ai-chat.model';

@Injectable()
export class BuildingAiChatRepo extends AbstractMongooseRepository<BuildingAiChat, BuildingAiChatDocument> {
    constructor(
        @InjectModel(BuildingAiChat.name, Databases.Primary)
        Model_: mongoose.Model<BuildingAiChatDocument>,
    ) {
        super(Model_);
    }
}
