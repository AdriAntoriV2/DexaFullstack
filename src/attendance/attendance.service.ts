
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  getJakartaDate,
  getJakartaTimingStatus,
  toPrismaDate,
} from './attendance-date.util.js';
import type { AttendanceHistoryQueryDto } from './dto/attendance-history-query.dto.js';
import type { AttendanceOverviewQueryDto } from './dto/attendance-overview-query.dto.js';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) { }

  async checkIn(employeeId: string) {
    const now = new Date();
    const attendanceDate = toPrismaDate(getJakartaDate(now));

    try {
      const attendance = await this.prisma.attendance.create({
        data: {
          employeeId,
          attendanceDate,
          checkInAt: now,
          checkInStatus: getJakartaTimingStatus(now, 8),
        },
        select: {
          id: true,
          employeeId: true,
          attendanceDate: true,
          checkInAt: true,
          checkOutAt: true,
          checkInStatus: true,
          checkOutStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return this.serializeAttendance(attendance);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You have already checked in for today.',
        );
      }

      throw error;
    }
  }

  async checkOut(employeeId: string) {
    const now = new Date();
    const attendanceDate = toPrismaDate(getJakartaDate(now));

    const result = await this.prisma.attendance.updateMany({
      where: {
        employeeId,
        attendanceDate,
        checkInAt: { not: null },
        checkOutAt: null,
      },
      data: {
        checkOutAt: now,
        checkOutStatus: getJakartaTimingStatus(now, 17),
      },
    });

    if (result.count === 0) {
      const existing = await this.prisma.attendance.findUnique({
        where: {
          employeeId_attendanceDate: {
            employeeId,
            attendanceDate,
          },
        },
        select: {
          id: true,
          employeeId: true,
          attendanceDate: true,
          checkInAt: true,
          checkOutAt: true,
          checkInStatus: true,
          checkOutStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!existing) {
        throw new BadRequestException(
          'You must check in before checking out.',
        );
      }

      if (!existing.checkInAt) {
        throw new BadRequestException(
          'You must check in before checking out.',
        );
      }

      throw new ConflictException(
        'You have already checked out for today.',
      );
    }

    const attendance = await this.prisma.attendance.findUniqueOrThrow({
      where: {
        employeeId_attendanceDate: {
          employeeId,
          attendanceDate,
        },
      },
      select: {
        id: true,
        employeeId: true,
        attendanceDate: true,
        checkInAt: true,
        checkOutAt: true,
        checkInStatus: true,
        checkOutStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.serializeAttendance(attendance);
  }

  async getToday(employeeId: string) {
    const attendanceDate = toPrismaDate(getJakartaDate());

    const attendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId,
          attendanceDate,
        },
      },
      select: {
        id: true,
        employeeId: true,
        attendanceDate: true,
        checkInAt: true,
        checkOutAt: true,
        checkInStatus: true,
        checkOutStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!attendance) {
      return {
        attendanceDate: getJakartaDate(),
        checkedIn: false,
        attendance: null,
      };
    }

    return {
      attendanceDate: getJakartaDate(),
      checkedIn: attendance.checkInAt !== null,
      attendance: this.serializeAttendance(attendance),
    };
  }

  async getMyHistory(
    employeeId: string,
    query: AttendanceHistoryQueryDto,
  ) {
    return this.getHistory(employeeId, query, true);
  }

  async getEmployeeHistory(
    employeeId: string,
    query: AttendanceHistoryQueryDto,
  ) {
    return this.getHistory(employeeId, query, false);
  }

  private async getHistory(
    employeeId: string,
    query: AttendanceHistoryQueryDto,
    useCurrentMonthDefault: boolean,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    let from = query.from;
    let to = query.to;

    // Default only when the employee provides neither date filter.
    if (useCurrentMonthDefault && !from && !to) {
      const today = getJakartaDate();
      from = `${today.slice(0, 7)}-01`;
      to = today;
    }

    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    try {
      if (from) {
        fromDate = toPrismaDate(from);
      }

      if (to) {
        toDate = toPrismaDate(to);
      }
    } catch {
      throw new BadRequestException(
        'from and to must be valid calendar dates in YYYY-MM-DD format.',
      );
    }

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException(
        'from must be earlier than or equal to to.',
      );
    }

    const attendanceDate: { gte?: Date; lte?: Date } = {};

    if (fromDate) {
      attendanceDate.gte = fromDate;
    }

    if (toDate) {
      attendanceDate.lte = toDate;
    }

    const where = {
      employeeId,
      ...(Object.keys(attendanceDate).length > 0
        ? { attendanceDate }
        : {}),
    };

    const records = await this.prisma.attendance.findMany({
      where,
      orderBy: [
        { attendanceDate: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        employeeId: true,
        attendanceDate: true,
        checkInAt: true,
        checkOutAt: true,
        checkInStatus: true,
        checkOutStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = await this.prisma.attendance.count({ where });
    return {
      data: records.map((record) => this.serializeAttendance(record)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }


  async getMySummary(employeeId: string, month: string) {
    return this.getSummary(employeeId, month);
  }

  async getEmployeeSummary(employeeId: string, month: string) {
    return this.getSummary(employeeId, month);
  }

  private async getSummary(employeeId: string, month: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException(
        'month must be in YYYY-MM format.',
      );
    }

    const startDate = new Date(`${month}-01T00:00:00.000Z`);

    if (
      Number.isNaN(startDate.getTime()) ||
      startDate.toISOString().slice(0, 7) !== month
    ) {
      throw new BadRequestException('Invalid month.');
    }

    const nextMonth = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth() + 1,
        1,
      ),
    );

    const records = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        attendanceDate: {
          gte: startDate,
          lt: nextMonth,
        },
      },
      select: {
        checkInAt: true,
        checkOutAt: true,
      },
    });

    const completedRecords = records.filter(
      (record) => record.checkInAt !== null && record.checkOutAt !== null,
    );

    const totalDurationMs = completedRecords.reduce((total, record) => {
      const duration =
        record.checkOutAt!.getTime() - record.checkInAt!.getTime();

      // Ignore negative durations if data has been manually corrupted.
      return total + Math.max(0, duration);
    }, 0);

    return {
      month,
      employeeId,
      recordedDays: records.length,
      completedDays: completedRecords.length,
      incompleteDays: records.length - completedRecords.length,
      totalDurationMinutes: Math.floor(totalDurationMs / 60_000),
    };
  }

  private serializeAttendance<T extends { attendanceDate: Date }>(
    attendance: T,
  ) {
    return {
      ...attendance,
      attendanceDate: attendance.attendanceDate.toISOString().slice(0, 10),
    };
  }

  async getEmployeeOverview(query: AttendanceOverviewQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    try {
      if (query.from) {
        fromDate = toPrismaDate(query.from);
      }

      if (query.to) {
        toDate = toPrismaDate(query.to);
      }
    } catch {
      throw new BadRequestException(
        'from and to must be valid calendar dates in YYYY-MM-DD format.',
      );
    }

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException(
        'from must be earlier than or equal to to.',
      );
    }

    const attendanceDate: { gte?: Date; lte?: Date } = {};

    if (fromDate) {
      attendanceDate.gte = fromDate;
    }

    if (toDate) {
      attendanceDate.lte = toDate;
    }

    const where = Object.keys(attendanceDate).length
      ? { attendanceDate }
      : {};

    const [records, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: {
              companyEmail: true,
              fullName: true,
              photoUrl: true
            },
          },
        },
        orderBy: [
          { attendanceDate: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data: records.map((record) => ({
        ...record,
        attendanceDate: record.attendanceDate.toISOString().slice(0, 10),
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
