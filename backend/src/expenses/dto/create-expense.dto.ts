import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';

export class CreateExpenseDto {
    @IsString()
    @IsNotEmpty()
    buildingId: string;

    @IsNumber()
    year: number;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsOptional()
    @IsString()
    ownerGroupId?: string;

    @IsOptional()
    @IsString()
    @IsEnum(['proportional', 'equal'])
    expenseType?: string;
}
