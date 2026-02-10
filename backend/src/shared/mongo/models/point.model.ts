import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ArrayMaxSize, ArrayMinSize, IsArray } from 'class-validator';

@Schema({ timestamps: false, _id: false, strictQuery: false })
export class GeoPoint {
    constructor(partial: Partial<GeoPoint>) {
        Object.assign(this, partial);
    }

    @Prop({ default: 'Point' })
    type?: 'Point';

    // [lng, lat]
    @Prop({ type: [Number] })
    @IsArray()
    @ArrayMinSize(2)
    @ArrayMaxSize(2)
    coordinates?: number[];
}

export const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);
