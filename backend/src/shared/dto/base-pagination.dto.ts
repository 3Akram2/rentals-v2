import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BasePaginationDto {
    @IsNumber()
    @IsOptional()
    skip?: number = 0;

    @IsNumber()
    @IsOptional()
    limit?: number = 10;
}
