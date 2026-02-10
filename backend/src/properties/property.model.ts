import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Property {
    _id?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Building', required: true })
    buildingId: string;

    @Prop({ required: true, enum: ['apartment', 'store'] })
    type: string;

    @Prop({ required: true, trim: true })
    unit: string;

    @Prop({ trim: true, default: '' })
    renterName: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
    renterId: string;

    @Prop({ enum: ['blocked', 'flexible', 'fixed'], default: 'flexible' })
    paymentType: string;

    @Prop({ default: 0 })
    fixedRent: number;
}

export type PropertyDocument = HydratedDocument<Property>;
export const PropertySchema = SchemaFactory.createForClass(Property);
