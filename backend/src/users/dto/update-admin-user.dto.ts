import { ArrayUnique, IsArray, IsBoolean, IsEmail, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdminUserDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @IsArray()
    @ArrayUnique()
    @IsMongoId({ each: true })
    @IsOptional()
    groups?: string[];

    @IsArray()
    @ArrayUnique()
    @IsMongoId({ each: true })
    @IsOptional()
    allowedBuildingIds?: string[];

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
