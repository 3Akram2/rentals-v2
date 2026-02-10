import { IsArray, IsMongoId } from 'class-validator';

export class RemoveUsersDto {
    @IsArray()
    @IsMongoId({ each: true })
    userIds: string[];
}
