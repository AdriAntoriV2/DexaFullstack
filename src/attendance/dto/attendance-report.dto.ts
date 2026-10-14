
import { ApiProperty } from '@nestjs/swagger';
import { AttendanceResponseDto } from './attendance-response.dto.js';

export class AttendanceHistoryResponseDto {
  @ApiProperty({ type: [AttendanceResponseDto] })
  data!: AttendanceResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;
}

export class AttendanceSummaryResponseDto {
  @ApiProperty({ example: '2026-10' })
  month!: string;

  @ApiProperty({
    example: '7d06f1f4-1a52-47f6-a7e0-6d26d3191b51',
    description: 'Employee whose attendance is summarized.',
  })
  employeeId!: string;

  @ApiProperty({ example: 20 })
  recordedDays!: number;

  @ApiProperty({ example: 18 })
  completedDays!: number;

  @ApiProperty({ example: 2 })
  incompleteDays!: number;

  @ApiProperty({
    example: 8640,
    description: 'Sum of completed check-in/check-out durations in minutes.',
  })
  totalDurationMinutes!: number;
}
