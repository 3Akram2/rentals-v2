import { IsBoolean } from 'class-validator';

export class UpdateUsersGroupStatusDto {
    @IsBoolean()
    active: boolean;
}
