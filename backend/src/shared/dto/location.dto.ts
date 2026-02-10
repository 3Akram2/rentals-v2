import { IsNumber } from 'class-validator';

export class LocationDto {
    @IsNumber()
    longitude: number;

    @IsNumber()
    latitude: number;
}
