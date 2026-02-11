import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Databases } from 'src/shared/constants';
import AbstractMongooseRepository from 'src/shared/mongo/AbstractMongooseRepository';
import { BuildingAiPrompt, BuildingAiPromptDocument } from './building-ai-prompt.model';

@Injectable()
export class BuildingAiPromptRepo extends AbstractMongooseRepository<BuildingAiPrompt, BuildingAiPromptDocument> {
    constructor(
        @InjectModel(BuildingAiPrompt.name, Databases.Primary)
        Model_: mongoose.Model<BuildingAiPromptDocument>,
    ) {
        super(Model_);
    }
}
