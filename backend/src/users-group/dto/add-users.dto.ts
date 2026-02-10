import { IsArray, IsMongoId } from 'class-validator';

export class AddUsersDto {
    @IsArray()
    @IsMongoId({ each: true })
    userIds: string[];
}
