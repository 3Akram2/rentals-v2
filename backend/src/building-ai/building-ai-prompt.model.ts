import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class BuildingAiPrompt {
    _id?: string;

    @Prop({ required: true, min: 1 })
    version: number;

    @Prop({ required: true, trim: true, default: 'Prompt' })
    title: string;

    @Prop({ required: true, trim: true })
    content: string;

    @Prop({ default: false })
    active: boolean;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    createdBy: string;
}

export type BuildingAiPromptDocument = HydratedDocument<BuildingAiPrompt>;
export const BuildingAiPromptSchema = SchemaFactory.createForClass(BuildingAiPrompt);

BuildingAiPromptSchema.index({ version: -1 }, { unique: true });
BuildingAiPromptSchema.index({ active: 1 });
