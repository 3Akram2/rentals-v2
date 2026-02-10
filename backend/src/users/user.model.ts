import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Allow, IsBoolean, IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { Group } from '../groups/group.model';
import { NormalizeEmail, ToLowerCase } from 'src/shared/transformers';
import { UsersGroup } from 'src/users-group/users-group.model';

@Schema({ timestamps: true, strictQuery: false })
export class User {
    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }

    _id?: string;

    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: () => Group }],
        default: [],
    })
    @IsString({ each: true })
    @IsOptional()
    groups?: string[];

    @Prop({ index: true })
    @IsOptional()
    @IsString()
    @Matches(/^\S+|\S+$/, {
        message: 'Username must not contain spaces in the middle',
    })
    @ToLowerCase()
    username?: string;

    @Prop({ index: true })
    @IsEmail()
    @NormalizeEmail()
    @IsOptional()
    email?: string;

    @Prop()
    @IsString()
    @Matches(/^[\p{L}\s]+$/u)
    @IsOptional()
    name?: string;

    @Prop()
    @IsOptional()
    @IsString()
    password?: string;

    @Prop()
    @IsOptional()
    @IsString()
    profileImage?: string;

    @Prop({ default: [], type: [{ type: MongooseSchema.Types.ObjectId, ref: () => UsersGroup }] })
    @Allow()
    userGroupsIds?: string[];

    @Prop({ default: [], type: [{ type: MongooseSchema.Types.ObjectId, ref: () => UsersGroup }] })
    @Allow()
    inactiveUserGroupsIds?: string[];

    @Prop({ default: false })
    @Allow()
    deleted?: boolean;

    @Prop()
    @Allow()
    deletedAt?: Date;

    @Prop({ default: true })
    @IsBoolean()
    @IsOptional()
    active?: boolean;

    @Prop({ type: MongooseSchema.Types.ObjectId })
    @IsString()
    @IsOptional()
    createdBy?: string;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);

export class LocalAuthBody {
    public username: string;
    public password: string;
}

export class JWTAuthBody {
    public accessToken: string;
    public rememberMe: boolean;
}

export class ResetPasswordDto {
    @IsString()
    public oldPassword: string;
    @IsString()
    public password: string;
}
