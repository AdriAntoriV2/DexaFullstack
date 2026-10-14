
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AttendanceService } from './attendance.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

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

    prisma.$transaction.mockResolvedValue([records, 21]);

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
        where: expect.objectContaining({
          employeeId: 'employee-1',
          attendanceDate: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lt: new Date('2026-11-01T00:00:00.000Z'),
          },
        }),
      }),
    );
  });

  it('rejects an invalid summary month', async () => {
    await expect(
      service.getMySummary('employee-1', '2026-13'),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.attendance.findMany).not.toHaveBeenCalled();
  });
});
