import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

import { AttendanceService } from './attendance.service.js';
import {
    AttendanceErrorResponseDto,
    AttendanceResponseDto,
    TodayAttendanceResponseDto,
} from './dto/attendance-response.dto.js';
import {
    AttendanceHistoryQueryDto,
    AttendanceMonthQueryDto,
} from './dto/attendance-history-query.dto.js';
import {
    AttendanceHistoryResponseDto,
    AttendanceSummaryResponseDto,
} from './dto/attendance-report.dto.js';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
    constructor(
        private readonly attendanceService: AttendanceService,
    ) {}

    @Post('check-in')
    @ApiOperation({
        summary: 'Check in for today (Asia/Jakarta)',
        description:
            'Creates an attendance record for the authenticated employee using the current Jakarta calendar date. Duplicate check-ins return 409.',
    })
    @ApiCreatedResponse({
        description: 'Check-in recorded successfully.',
        type: AttendanceResponseDto,
        example: {
            id: 'c8b30f5e-88cb-4c6e-8bb1-13a3b6cb20a1',
            employeeId: '7d06f1f4-1a52-47f6-a7e0-6d26d3191b51',
            attendanceDate: '2026-10-14',
            checkInAt: '2026-10-14T01:05:00.000Z',
            checkOutAt: null,
            createdAt: '2026-10-14T01:05:00.000Z',
            updatedAt: '2026-10-14T01:05:00.000Z',
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Authentication required.',
        schema: {
            example: {
                statusCode: 401,
                message: 'Unauthorized',
            },
        },
    })
    @ApiConflictResponse({
        description: 'Already checked in today.',
        type: AttendanceErrorResponseDto,
        example: {
            statusCode: 409,
            message: 'You have already checked in for today.',
            error: 'Conflict',
        },
    })
    checkIn(@CurrentUser() user: JwtPayload) {
        return this.attendanceService.checkIn(user.sub);
    }

    @Post('check-out')
    @ApiOperation({
        summary: 'Check out for today (Asia/Jakarta)',
        description:
            'Records the current timestamp for an existing check-in. Checking out before check-in returns 400; duplicate check-outs return 409.',
    })
    @ApiCreatedResponse({
        description: 'Check-out recorded successfully.',
        type: AttendanceResponseDto,
        example: {
            id: 'c8b30f5e-88cb-4c6e-8bb1-13a3b6cb20a1',
            employeeId: '7d06f1f4-1a52-47f6-a7e0-6d26d3191b51',
            attendanceDate: '2026-10-14',
            checkInAt: '2026-10-14T01:05:00.000Z',
            checkOutAt: '2026-10-14T10:02:00.000Z',
            createdAt: '2026-10-14T01:05:00.000Z',
            updatedAt: '2026-10-14T10:02:00.000Z',
        },
    })
    @ApiBadRequestResponse({
        description: 'Check-in is required before check-out.',
        type: AttendanceErrorResponseDto,
        example: {
            statusCode: 400,
            message: 'You must check in before checking out.',
            error: 'Bad Request',
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Authentication required.',
        schema: {
            example: {
                statusCode: 401,
                message: 'Unauthorized',
            },
        },
    })
    @ApiConflictResponse({
        description: 'Already checked out today.',
        type: AttendanceErrorResponseDto,
        example: {
            statusCode: 409,
            message: 'You have already checked out for today.',
            error: 'Conflict',
        },
    })
    checkOut(@CurrentUser() user: JwtPayload) {
        return this.attendanceService.checkOut(user.sub);
    }

    @Get('me/today')
    @ApiOperation({
        summary: 'Get my attendance for today (Asia/Jakarta)',
        description:
            'Returns the authenticated employee’s attendance for the current Jakarta calendar date. If no record exists, attendance is null and checkedIn is false.',
    })
    @ApiOkResponse({
        description: 'Today’s attendance retrieved successfully.',
        type: TodayAttendanceResponseDto,
        examples: {
            checkedIn: {
                summary: 'Attendance exists',
                value: {
                    attendanceDate: '2026-10-14',
                    checkedIn: true,
                    attendance: {
                        id: 'c8b30f5e-88cb-4c6e-8bb1-13a3b6cb20a1',
                        employeeId: '7d06f1f4-1a52-47f6-a7e0-6d26d3191b51',
                        attendanceDate: '2026-10-14',
                        checkInAt: '2026-10-14T01:05:00.000Z',
                        checkOutAt: null,
                        createdAt: '2026-10-14T01:05:00.000Z',
                        updatedAt: '2026-10-14T01:05:00.000Z',
                    },
                },
            },
            notCheckedIn: {
                summary: 'No attendance record yet',
                value: {
                    attendanceDate: '2026-10-14',
                    checkedIn: false,
                    attendance: null,
                },
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Authentication required.',
        schema: {
            example: {
                statusCode: 401,
                message: 'Unauthorized',
            },
        },
    })
    getToday(@CurrentUser() user: JwtPayload) {
        return this.attendanceService.getToday(user.sub);
    }

    @Get('me/history')
    @ApiOperation({
        summary: 'Get my attendance history',
        description: 'Returns paginated attendance records for the authenticated employee.',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        example: 1,
        description: 'Page number, starting at 1.',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        example: 10,
        description: 'Number of records per page (1–100).',
    })
    @ApiOkResponse({
        description: 'Paginated attendance history.',
        type: AttendanceHistoryResponseDto,
        example: {
            data: [
                {
                    id: 'c8b30f5e-88cb-4c6e-8bb1-13a3b6cb20a1',
                    employeeId: '7d06f1f4-1a52-47f6-a7e0-6d26d3191b51',
                    attendanceDate: '2026-10-14',
                    checkInAt: '2026-10-14T01:05:00.000Z',
                    checkOutAt: '2026-10-14T10:02:00.000Z',
                    createdAt: '2026-10-14T01:05:00.000Z',
                    updatedAt: '2026-10-14T10:02:00.000Z',
                },
            ],
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
        },
    })
    getMyHistory(
        @CurrentUser() user: JwtPayload,
        @Query() query: AttendanceHistoryQueryDto,
    ) {
        return this.attendanceService.getMyHistory(user.sub, query);
    }

    @Get('me/summary')
    @ApiOperation({
        summary: 'Get my monthly attendance summary',
        description: 'Returns the authenticated employee’s attendance summary for a Jakarta calendar month.',
    })
    @ApiQuery({
        name: 'month',
        required: false,
        type: String,
        example: '2026-10',
        description: 'Calendar month in YYYY-MM format, interpreted in Asia/Jakarta.',
    })
    @ApiOkResponse({
        description: 'Monthly attendance summary.',
        type: AttendanceSummaryResponseDto,
        example: {
            month: '2026-10',
            employeeId: '7d06f1f4-1a52-47f6-a7e0-6d26d3191b51',
            recordedDays: 20,
            completedDays: 18,
            incompleteDays: 2,
            totalDurationMinutes: 8640,
        },
    })
    getMySummary(
        @CurrentUser() user: JwtPayload,
        @Query() query: AttendanceMonthQueryDto,
    ) {
        return this.attendanceService.getMySummary(user.sub, query.month);
    }

    @Get('employees/:id/history')
    @UseGuards(RolesGuard)
    @Roles('HR')
    @ApiOperation({
        summary: 'Get an employee attendance history (HR only)',
        description: 'Returns paginated attendance records for the specified employee.',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        example: 1,
        description: 'Page number, starting at 1.',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        example: 10,
        description: 'Number of records per page (1–100).',
    })
    @ApiOkResponse({
        description: 'Paginated employee attendance history.',
        type: AttendanceHistoryResponseDto,
        example: {
            data: [],
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
        },
    })
    @ApiForbiddenResponse({ description: 'HR role required.' })
    getEmployeeHistory(
        @Param('id', ParseUUIDPipe) id: string,
        @Query() query: AttendanceHistoryQueryDto,
    ) {
        return this.attendanceService.getEmployeeHistory(id, query);
    }

    @Get('employees/:id/summary')
    @UseGuards(RolesGuard)
    @Roles('HR')
    @ApiOperation({
        summary: 'Get an employee monthly attendance summary (HR only)',
    })
    @ApiQuery({
        name: 'month',
        required: false,
        type: String,
        example: '2026-10',
        description: 'Calendar month in YYYY-MM format, interpreted in Asia/Jakarta.',
    })
    @ApiOkResponse({
        description: 'Employee monthly attendance summary.',
        type: AttendanceSummaryResponseDto,
        example: {
            month: '2026-10',
            employeeId: '7d06f1f4-1a52-47f6-a7e0-6d26d3191b51',
            recordedDays: 20,
            completedDays: 18,
            incompleteDays: 2,
            totalDurationMinutes: 8640,
        },
    })
    @ApiForbiddenResponse({ description: 'HR role required.' })
    getEmployeeSummary(
        @Param('id', ParseUUIDPipe) id: string,
        @Query() query: AttendanceMonthQueryDto,
    ) {
        return this.attendanceService.getEmployeeSummary(id, query.month);
    }
}
