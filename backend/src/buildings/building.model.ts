import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: true })
export class Member {
    _id?: string;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, min: 0 })
    kirats: number;

    @Prop({ type: MongooseSchema.Types.ObjectId, default: null })
    userId: string;
}
export const MemberSchema = SchemaFactory.createForClass(Member);

@Schema({ _id: true })
export class OwnerGroup {
    _id?: string;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, min: 0 })
    kirats: number;

    @Prop({ type: [MemberSchema], default: [] })
    members: Member[];
}
export const OwnerGroupSchema = SchemaFactory.createForClass(OwnerGroup);

@Schema({ timestamps: true })
export class Building {
    _id?: string;

    @Prop({ required: true, trim: true })
    number: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
    moderatorAdminUserId?: string;
    @Prop({ trim: true, default: '' })
    address: string;

    @Prop({ default: 24, enum: [22, 24] })
    totalKirats: number;

    @Prop({ type: [OwnerGroupSchema], default: [] })
    ownerGroups: OwnerGroup[];
}

export type BuildingDocument = HydratedDocument<Building>;
export const BuildingSchema = SchemaFactory.createForClass(Building);
