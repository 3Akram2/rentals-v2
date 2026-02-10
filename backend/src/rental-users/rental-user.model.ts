import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class BuildingOwned {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Building', required: true })
    buildingId: string;

    @Prop()
    buildingNumber: string;

    @Prop()
    kirats: number;

    @Prop()
    percentage: number;
}
export const BuildingOwnedSchema = SchemaFactory.createForClass(BuildingOwned);

@Schema({ _id: false })
export class PropertyRented {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Property', required: true })
    propertyId: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Building' })
    buildingId: string;

    @Prop()
    unit: string;

    @Prop()
    buildingNumber: string;
}
export const PropertyRentedSchema = SchemaFactory.createForClass(PropertyRented);

@Schema({ timestamps: true })
export class RentalUser {
    _id?: string;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ trim: true, default: '' })
    phone: string;

    @Prop({ trim: true, default: '' })
    notes: string;

    @Prop({ enum: ['active', 'inactive'], default: 'active' })
    status: string;

    @Prop({ type: [BuildingOwnedSchema], default: [] })
    buildingsOwned: BuildingOwned[];

    @Prop({ type: [PropertyRentedSchema], default: [] })
    propertiesRented: PropertyRented[];
}

export type RentalUserDocument = HydratedDocument<RentalUser>;
export const RentalUserSchema = SchemaFactory.createForClass(RentalUser);

RentalUserSchema.index({ name: 'text' });
RentalUserSchema.index({ status: 1 });
