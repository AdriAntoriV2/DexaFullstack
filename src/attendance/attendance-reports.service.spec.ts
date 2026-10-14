
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AttendanceService } from './attendance.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { getJakartaDate } from './attendance-date.util.js';

describe('AttendanceService reports', () => {
  const prisma = {
    $transaction: vi.fn(),
    attendance: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };

  let service: AttendanceService;

  beforeEach(() => {
    vi.resetAllMocks();

    // Simulate Prisma's array-form transaction resolving both queries.
    prisma.$transaction.mockImplementation(
      async (queries: Promise<unknown>[]) =>
        Promise.all(queries),
    );

    service = new AttendanceService(
      prisma as unknown as PrismaService,
    );
  });

  it('returns paginated attendance history', async () => {
    const records = [
      {
        id: 'attendance-1',
        employeeId: 'employee-1',
        attendanceDate: new Date('2026-10-14T00:00:00.000Z'),
        checkInAt: new Date('2026-10-14T01:00:00.000Z'),
        checkOutAt: new Date('2026-10-14T10:00:00.000Z'),
        createdAt: new Date('2026-10-14T01:00:00.000Z'),
        updatedAt: new Date('2026-10-14T10:00:00.000Z'),
      },
    ];

    prisma.attendance.findMany.mockResolvedValue(records);
    prisma.attendance.count.mockResolvedValue(21);

    const result = await service.getMyHistory('employee-1', {
      page: 2,
      limit: 10,
    });

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(21);
    expect(result.totalPages).toBe(3);
    expect(result.data[0]?.attendanceDate).toBe('2026-10-14');
  });

  it('returns a monthly summary for completed and incomplete records', async () => {
    prisma.attendance.findMany.mockResolvedValue([
      {
        checkInAt: new Date('2026-10-14T01:00:00.000Z'),
        checkOutAt: new Date('2026-10-14T10:00:00.000Z'),
      },
      {
        checkInAt: new Date('2026-10-15T01:00:00.000Z'),
        checkOutAt: null,
      },
    ]);

    const result = await service.getMySummary('employee-1', '2026-10');

    expect(result).toEqual({
      month: '2026-10',
      employeeId: 'employee-1',
      recordedDays: 2,
      completedDays: 1,
      incompleteDays: 1,
      totalDurationMinutes: 540,
    });

    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          employeeId: 'employee-1',
          attendanceDate: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lt: new Date('2026-11-01T00:00:00.000Z'),
          },
        },
      }),
    );
  });

  it('rejects an invalid summary month', async () => {
    await expect(
      service.getMySummary('employee-1', '2026-13'),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.attendance.findMany).not.toHaveBeenCalled();
  });

  it('defaults my history to the current Jakarta month through today', async () => {
    prisma.attendance.findMany.mockResolvedValue([]);
    prisma.attendance.count.mockResolvedValue(0);

    const result = await service.getMyHistory('employee-1', {
      page: 1,
      limit: 10,
    });

    const today = getJakartaDate();
    const expectedFrom = `${today.slice(0, 7)}-01`;

    expect(result.total).toBe(0);
    expect(prisma.$transaction).toHaveBeenCalledOnce();

    const expectedWhere = {
      employeeId: 'employee-1',
      attendanceDate: {
        gte: new Date(`${expectedFrom}T00:00:00.000Z`),
        lte: new Date(`${today}T00:00:00.000Z`),
      },
    };

    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );

    expect(prisma.attendance.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });

  it('filters my history by an explicitly requested date range', async () => {
    prisma.attendance.findMany.mockResolvedValue([]);
    prisma.attendance.count.mockResolvedValue(0);

    await service.getMyHistory('employee-1', {
      from: '2026-10-05',
      to: '2026-10-10',
      page: 1,
      limit: 10,
    });

    const expectedWhere = {
      employeeId: 'employee-1',
      attendanceDate: {
        gte: new Date('2026-10-05T00:00:00.000Z'),
        lte: new Date('2026-10-10T00:00:00.000Z'),
      },
    };

    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );

    expect(prisma.attendance.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });

  it('rejects invalid calendar dates in my history filters', async () => {
    await expect(
      service.getMyHistory('employee-1', {
        from: '2026-02-30',
        page: 1,
        limit: 10,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a reversed date range in my history filters', async () => {
    await expect(
      service.getMyHistory('employee-1', {
        from: '2026-10-10',
        to: '2026-10-05',
        page: 1,
        limit: 10,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not apply the employee current-month default to HR history', async () => {
    prisma.attendance.findMany.mockResolvedValue([]);
    prisma.attendance.count.mockResolvedValue(0);

    await service.getEmployeeHistory('employee-1', {
      page: 1,
      limit: 10,
    });

    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { employeeId: 'employee-1' },
      }),
    );

    expect(prisma.attendance.count).toHaveBeenCalledWith({
      where: { employeeId: 'employee-1' },
    });
  });
});
