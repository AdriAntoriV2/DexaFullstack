
import { ApiProperty } from '@nestjs/swagger';

export class AttendanceOverviewEmployeeDto {
    @ApiProperty({ example: 'employee@company.com' })
    companyEmail!: string;

    @ApiProperty({ example: 'Test Employee' })
    fullName!: string;
}

export class AttendanceOverviewItemDto {
    @ApiProperty({ format: 'uuid' })
    id!: string;

    @ApiProperty({ format: 'uuid' })
    employeeId!: string;

    @ApiProperty({ type: AttendanceOverviewEmployeeDto })
    employee!: AttendanceOverviewEmployeeDto;

    @ApiProperty({ example: '2026-10-14', format: 'date' })
    attendanceDate!: string;

    @ApiProperty({
        example: '2026-10-14T01:05:00.000Z',
        nullable: true,
        format: 'date-time',
    })
    checkInAt!: string | null;

    @ApiProperty({
        example: '2026-10-14T10:02:00.000Z',
        nullable: true,
        format: 'date-time',
    })
    checkOutAt!: string | null;

    @ApiProperty({ format: 'date-time' })
    createdAt!: string;

    @ApiProperty({ format: 'date-time' })
    updatedAt!: string;
}

export class AttendanceOverviewResponseDto {
    @ApiProperty({ type: [AttendanceOverviewItemDto] })
    data!: AttendanceOverviewItemDto[];

    @ApiProperty({ example: 1 })
    page!: number;

    @ApiProperty({ example: 10 })
    limit!: number;

    @ApiProperty({ example: 25 })
    total!: number;

    @ApiProperty({ example: 3 })
    totalPages!: number;
}
