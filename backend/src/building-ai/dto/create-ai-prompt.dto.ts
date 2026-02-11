import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateAiPromptDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(120)
    title?: string;

    @IsString()
    @MinLength(10)
    @MaxLength(8000)
    content: string;
}
