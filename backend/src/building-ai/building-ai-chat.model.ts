import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class BuildingAiChat {
    _id?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    actorId: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Building', required: true })
    buildingId: string;

    @Prop({ required: true, trim: true })
    question: string;

    @Prop({ required: true })
    answer: string;

    @Prop({ required: true })
    model: string;

    @Prop({ default: 0 })
    currentYear: number;

    @Prop({ default: 0 })
    previousYear: number;
}

export type BuildingAiChatDocument = HydratedDocument<BuildingAiChat>;
export const BuildingAiChatSchema = SchemaFactory.createForClass(BuildingAiChat);

BuildingAiChatSchema.index({ buildingId: 1, createdAt: -1 });
BuildingAiChatSchema.index({ actorId: 1, createdAt: -1 });
