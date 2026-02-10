import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateRentalUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    @IsEnum(['active', 'inactive'])
    status?: string;
}
