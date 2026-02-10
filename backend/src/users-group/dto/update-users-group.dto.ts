import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateUsersGroupDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsArray()
    @IsOptional()
    userIds?: string[];
}
