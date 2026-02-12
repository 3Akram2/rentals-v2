import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MemberDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    kirats: number;

    @IsOptional()
    @IsString()
    userId?: string;
}

export class OwnerGroupDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    kirats: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MemberDto)
    members?: MemberDto[];
}

export class CreateBuildingDto {
    @IsString()
    @IsNotEmpty()
    number: string;

    @IsOptional()
    @IsString()
    moderatorAdminUserId?: string;
    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsNumber()
    @IsEnum([22, 24])
    totalKirats?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OwnerGroupDto)
    ownerGroups?: OwnerGroupDto[];
}
