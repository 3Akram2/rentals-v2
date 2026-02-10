import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';

export class CreatePropertyDto {
    @IsString()
    @IsNotEmpty()
    buildingId: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(['apartment', 'store'])
    type: string;

    @IsString()
    @IsNotEmpty()
    unit: string;

    @IsOptional()
    @IsString()
    renterName?: string;

    @IsOptional()
    @IsString()
    renterId?: string;

    @IsOptional()
    @IsString()
    @IsEnum(['blocked', 'flexible', 'fixed'])
    paymentType?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    fixedRent?: number;
}
