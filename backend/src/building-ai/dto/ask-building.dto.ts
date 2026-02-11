import { IsString, MinLength, MaxLength } from 'class-validator';

export class AskBuildingDto {
    @IsString()
    @MinLength(2)
    @MaxLength(1000)
    question: string;
}
