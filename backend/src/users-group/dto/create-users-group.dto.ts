import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class CreateUsersGroupDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsArray()
    @IsString({ each: true })
    userIds: string[];
}
