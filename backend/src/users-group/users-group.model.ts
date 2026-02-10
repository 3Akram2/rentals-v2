import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Allow, IsString, IsOptional } from 'class-validator';
import { User } from '../users/user.model';

@Schema({ timestamps: true, strictQuery: false })
export class UsersGroup {
    constructor(partial: Partial<UsersGroup>) {
        Object.assign(this, partial);
    }

    @Allow()
    _id?: string;

    @Prop({ required: true })
    @IsString()
    name?: string;

    @Prop({ default: [], type: [{ type: MongooseSchema.Types.ObjectId, ref: () => User }] })
    @Allow()
    userIds?: string[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: () => User })
    @IsString()
    @IsOptional()
    createdBy?: string;

    @Prop({ default: true })
    @Allow()
    active?: boolean;

    @Prop({ default: false })
    @Allow()
    deleted?: boolean;

    @Prop()
    @Allow()
    deletedAt?: Date;
}

export type UsersGroupDocument = HydratedDocument<UsersGroup>;

export const UsersGroupSchema = SchemaFactory.createForClass(UsersGroup);
