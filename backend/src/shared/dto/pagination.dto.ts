import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class Pagination {
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === '' || value.toLowerCase() === 'true')
    public $getAll?: boolean;

    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => Math.max(parseInt(value), 1))
    public $page?: number;

    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    public $pageSize?: number;

    //not usable, just for swagger plugin to pick up
    @ApiProperty({
        description: "comma-separated list of entity properties to select, use '-' to exclude instead.",
        example: '-email,name,age',
    })
    public $select?: string;

    //not usable, just for swagger plugin to pick up
    @ApiProperty({
        isArray: true,
        description: 'paths of reference properties to populate.',
        example: ['createdBy.testedBy.owner', 'testedBy'],
    })
    public $populate?: string[];

    //not usable, just for swagger plugin to pick up
    @ApiProperty({
        description:
            'pipe of keyword and comma-separated list of entity properties to apply regular expression on, it is "OR" operation.',
        examples: {
            start: { value: 'start:ahm|username,email' },
            end: { value: 'end:ahm|username,email' },
            contains: { value: 'ahm|username,email' },
        },
    })
    public $find?: string;
}
