import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Expense {
    _id?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Building', required: true })
    buildingId: string;

    @Prop({ required: true })
    year: number;

    @Prop({ required: true, trim: true })
    description: string;

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({ type: MongooseSchema.Types.ObjectId, default: null })
    ownerGroupId: string;

    @Prop({ enum: ['proportional', 'equal'], default: 'proportional' })
    expenseType: string;
}

export type ExpenseDocument = HydratedDocument<Expense>;
export const ExpenseSchema = SchemaFactory.createForClass(Expense);
