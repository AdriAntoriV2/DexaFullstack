
import { ApiProperty } from '@nestjs/swagger';

export class AttendanceResponseDto {
  @ApiProperty({
    example: 'c8b30f5e-88cb-4c6e-8bb1-13a3b6cb20a1',
  })
  id!: string;

  @ApiProperty({
    example: '7d06f1f4-1a52-47f6-a7e0-6d26d3191b51',
  })
  employeeId!: string;

  @ApiProperty({
    example: '2026-10-14',
    description: 'Attendance calendar date in Asia/Jakarta (WIB), YYYY-MM-DD.',
  })
  attendanceDate!: string;

  @ApiProperty({
    example: '2026-10-14T01:05:00.000Z',
    description: 'Actual check-in instant in ISO 8601 format (UTC).',
    nullable: true,
  })
  checkInAt!: string | null;

  @ApiProperty({
    example: '2026-10-14T10:02:00.000Z',
    description: 'Actual check-out instant in ISO 8601 format (UTC), or null.',
    nullable: true,
  })
  checkOutAt!: string | null;

  @ApiProperty({
    enum: ['EARLY', 'ON_TIME', 'LATE'],
    example: 'LATE',
    nullable: true,
    description: 'Check-in timing status based on 08:00 Asia/Jakarta.',
  })
  checkInStatus!: 'EARLY' | 'ON_TIME' | 'LATE' | null;

  @ApiProperty({
    enum: ['EARLY', 'ON_TIME', 'LATE'],
    example: 'ON_TIME',
    nullable: true,
    description: 'Check-out timing status based on 17:00 Asia/Jakarta.',
  })
  checkOutStatus!: 'EARLY' | 'ON_TIME' | 'LATE' | null;

  @ApiProperty({
    example: '2026-10-14T01:05:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-10-14T01:05:00.000Z',
  })
  updatedAt!: string;
}

export class TodayAttendanceResponseDto {
  @ApiProperty({
    example: '2026-10-14',
    description: 'Current calendar date in Asia/Jakarta (WIB).',
  })
  attendanceDate!: string;

  @ApiProperty({
    example: true,
    description: 'Whether the employee has checked in today.',
  })
  checkedIn!: boolean;

  @ApiProperty({
    type: () => AttendanceResponseDto,
    nullable: true,
    description: 'Attendance record, or null if no record exists today.',
  })
  attendance!: AttendanceResponseDto | null;
}

export class AttendanceErrorResponseDto {
  @ApiProperty({ example: 409 })
  statusCode!: number;

  @ApiProperty({ example: 'You have already checked in for today.' })
  message!: string;

  @ApiProperty({ example: 'Conflict' })
  error!: string;
}
