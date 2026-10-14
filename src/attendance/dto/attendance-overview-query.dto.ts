
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt,
    IsOptional,
    Matches,
    Max,
    Min,
} from 'class-validator';

export class AttendanceOverviewQueryDto {
    @ApiPropertyOptional({
        example: '2026-10-01',
        description: 'Inclusive start date in YYYY-MM-DD format (Jakarta calendar date).',
    })
    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'from must be in YYYY-MM-DD format.',
    })
    from?: string;

    @ApiPropertyOptional({
        example: '2026-10-14',
        description: 'Inclusive end date in YYYY-MM-DD format (Jakarta calendar date).',
    })
    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'to must be in YYYY-MM-DD format.',
    })
    to?: string;

    @ApiPropertyOptional({
        example: 1,
        minimum: 1,
        default: 1,
        description: 'Page number, starting at 1.',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @ApiPropertyOptional({
        example: 10,
        minimum: 1,
        maximum: 100,
        default: 10,
        description: 'Number of records per page.',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 10;
}
