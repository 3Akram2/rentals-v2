import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreatePaymentDto {
    @IsString()
    @IsNotEmpty()
    propertyId: string;

    @IsNumber()
    year: number;

    @IsNumber()
    @Min(1)
    @Max(12)
    month: number;

    @IsNumber()
    @Min(0)
    amount: number;
}
