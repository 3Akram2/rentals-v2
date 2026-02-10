import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

// import * as mongoose from 'mongoose';
// export const UserSchema = new mongoose.Schema({
//   name: String,
// });

export enum ConfigKeys {
    DB_VERSION = 'DB_VERSION',
    LAST_BRANCH_CODE = 'LAST_BRANCH_CODE',
    LAST_ORDER_CANCELLATION_REASON_CODE = 'LAST_ORDER_CANCELLATION_REASON_CODE',
    DESIGN_COLOR_PALETTE = 'DESIGN_COLOR_PALETTE',
}

@Schema({ timestamps: true, strictQuery: false })
export class Config {
    constructor(partial: Partial<Config>) {
        Object.assign(this, partial);
    }

    _id?: MongooseSchema.Types.ObjectId;

    @Prop({ type: String, required: true, index: true, unique: true })
    key: string;

    @Prop()
    numberValue?: number;
    @Prop({ default: undefined })
    numberValues?: number[];

    @Prop()
    stringValue?: string;
    @Prop({ default: undefined })
    stringValues?: string[];

    @Prop()
    dateValue?: Date;
    @Prop({ default: undefined })
    dateValues?: Date[];

    @Prop({ type: MongooseSchema.Types.ObjectId })
    refValue?: string;
    @Prop({ type: [MongooseSchema.Types.ObjectId], default: undefined })
    refValues?: string[];

    @Prop()
    booleanValue?: boolean;
    @Prop({ default: undefined })
    booleanValues?: boolean;

    @Prop({ type: {} }) //since type is empty, so the value will be accepted as is but without adding _id nor timestamps
    objectValue?: object;
    @Prop({ type: [{}], default: undefined })
    objectValues?: object[];
}

export type ConfigDocument = HydratedDocument<Config>;
export const ConfigSchema = SchemaFactory.createForClass(Config);
