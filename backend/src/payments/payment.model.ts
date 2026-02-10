import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Payment {
    _id?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Property', required: true })
    propertyId: string;

    @Prop({ required: true })
    year: number;

    @Prop({ required: true, min: 1, max: 12 })
    month: number;

    @Prop({ required: true, min: 0 })
    amount: number;
}

export type PaymentDocument = HydratedDocument<Payment>;
export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Unique index
PaymentSchema.index({ propertyId: 1, year: 1, month: 1 }, { unique: true });
