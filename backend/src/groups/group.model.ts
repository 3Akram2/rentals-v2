import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Allow, IsBoolean, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { Permissions } from './enums/permissions.enum';

@Schema({ timestamps: true, strictQuery: false })
export class Group {
    constructor(partial: Partial<Group>) {
        Object.assign(this, partial);
    }

    @Allow()
    _id?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId })
    @IsMongoId()
    @IsOptional()
    createdBy?: string;

    @Prop()
    @IsString()
    @IsOptional()
    name?: string;

    @Prop({ type: Array, default: [] })
    @IsEnum(Permissions, { each: true })
    @IsOptional()
    permissions?: Permissions[];

    @Prop({ default: false })
    @IsBoolean()
    @IsOptional()
    isGlobal?: boolean;

    @Prop({ default: false })
    @Allow()
    deleted?: boolean;

    @Prop()
    @Allow()
    deletedAt?: Date;
}

export type GroupDocument = HydratedDocument<Group>;

export const GroupSchema = SchemaFactory.createForClass(Group);
