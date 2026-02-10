import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Allow, IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class PaginateFilter {
    @IsNumber()
    page: number;

    @IsNumber()
    pageSize: number;
}

export class SortFilter {
    @IsString()
    field: string;

    @IsNumber()
    @IsIn([1, -1])
    direction: number;
}

export class SearchFilter {
    @IsString()
    searchKey: string;

    @IsString({ each: true })
    @IsArray()
    searchFields: string[];
}

export class RangeFilter {
    @IsString()
    field: string;

    @IsOptional()
    from: Date | number;

    @IsOptional()
    to: Date | number;
}

export class PopulateFilter {
    @IsString()
    path: string;

    @IsString()
    @IsOptional()
    select?: string;

    @IsString()
    @IsOptional()
    model?: string;

    @Allow()
    @IsOptional()
    match?: any;
}

export class GenericFilterQuery {
    @Allow()
    @ApiPropertyOptional({
        example: {
            username: 'admin',
            age: 5,
        },
    })
    equal?: { [key: string]: any };

    @Allow()
    @ApiPropertyOptional({
        example: {
            state: ['pending', 'pending'],
            country: ['usa', 'uk'],
        },
    })
    in?: { [key: string]: any[] };

    @Allow()
    @ApiPropertyOptional({
        example: {
            username: 'admin',
            age: 5,
        },
    })
    or?: { [key: string]: any };

    @ValidateNested()
    @Type(() => SearchFilter)
    search?: SearchFilter;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => RangeFilter)
    range?: RangeFilter[];

    @ValidateNested()
    @Type(() => PaginateFilter)
    paginate?: PaginateFilter;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PopulateFilter)
    populate?: PopulateFilter[];

    @ValidateNested()
    @Type(() => SortFilter)
    sort?: SortFilter;

    @ValidateNested({ each: true })
    @Type(() => SortFilter)
    @IsOptional()
    @ApiPropertyOptional({
        example: [
            { field: 'name', direction: 1 },
            { field: 'age', direction: -1 },
        ],
    })
    @IsArray()
    multipleSort?: SortFilter[];

    @Allow()
    @ApiPropertyOptional({
        example: ['name status', '-password'],
    })
    select?: string;

    @Allow()
    @ApiPropertyOptional({
        example: {
            username: 'admin',
            age: 5,
        },
    })
    notEqual?: { [key: string]: any };

    @Allow()
    @ApiPropertyOptional({
        example: {
            state: ['pending', 'pending'],
            country: ['usa', 'uk'],
        },
    })
    notIn?: { [key: string]: any[] };
}
