import { IsString, MinLength, MaxLength, IsOptional, IsArray } from 'class-validator';

export class AskHistoryMessageDto {
    @IsString()
    role: 'user' | 'assistant';

    @IsString()
    @MinLength(1)
    @MaxLength(4000)
    text: string;
}

export class AskBuildingDto {
    @IsString()
    @MinLength(2)
    @MaxLength(1000)
    question: string;

    @IsOptional()
    @IsArray()
    history?: AskHistoryMessageDto[];
}
