
import { Type } from 'class-transformer';
import {
  ApiPropertyOptional,
  ApiQuery,
} from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class AttendanceHistoryQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Inclusive start date in YYYY-MM-DD format.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from must be in YYYY-MM-DD format.',
  })
  from?: string;

  @ApiPropertyOptional({
    example: '2026-10-14',
    description: 'Inclusive end date in YYYY-MM-DD format.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to must be in YYYY-MM-DD format.',
  })
  to?: string;

  @ApiPropertyOptional({
    type: Number,
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
    type: Number,
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

function currentJakartaMonth(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}`;
}

export class AttendanceMonthQueryDto {
  @ApiPropertyOptional({
    example: '2026-10',
    description: 'Calendar month in YYYY-MM format, interpreted in Asia/Jakarta.',
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format.',
  })
  month = currentJakartaMonth();
}
