
import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AttendanceService } from './attendance.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AttendanceService', () => {
  let service: AttendanceService;

  const prisma = {
    attendance: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  };

  const employeeId = 'employee-uuid';

  const attendance = {
    id: 'attendance-uuid',
    employeeId,
    attendanceDate: new Date('2026-10-14T00:00:00.000Z'),
    checkInAt: new Date('2026-10-14T01:00:00.000Z'),
    checkOutAt: null,
    createdAt: new Date('2026-10-14T01:00:00.000Z'),
    updatedAt: new Date('2026-10-14T01:00:00.000Z'),
  };

  beforeEach(() => {
    vi.resetAllMocks();

    service = new AttendanceService(
      prisma as unknown as PrismaService,
    );
  });

  it('records a check-in', async () => {
    prisma.attendance.create.mockResolvedValue(attendance);

    const result = await service.checkIn(employeeId);

    expect(prisma.attendance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeId,
          checkInAt: expect.any(Date),
        }),
      }),
    );

    expect(result.attendanceDate).toBe('2026-10-14');
    expect(result.checkInAt).toEqual(attendance.checkInAt);
  });

  it('rejects a duplicate check-in', async () => {
    const duplicateError = Object.assign(
      new Error('Unique constraint failed'),
      {
        code: 'P2002',
        clientVersion: 'test',
      },
    );

    prisma.attendance.create.mockRejectedValue(duplicateError);

    await expect(service.checkIn(employeeId)).rejects.toThrow(
      ConflictException,
    );
  });

  it('records a check-out after check-in', async () => {
    prisma.attendance.updateMany.mockResolvedValue({ count: 1 });

    prisma.attendance.findUniqueOrThrow.mockResolvedValue({
      ...attendance,
      checkOutAt: new Date('2026-10-14T10:00:00.000Z'),
    });

    const result = await service.checkOut(employeeId);

    expect(prisma.attendance.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          employeeId,
          checkOutAt: null,
        }),
        data: {
          checkOutAt: expect.any(Date),
        },
      }),
    );

    expect(result.checkOutAt).toEqual(
      new Date('2026-10-14T10:00:00.000Z'),
    );
  });

  it('rejects check-out when no attendance record exists', async () => {
    prisma.attendance.updateMany.mockResolvedValue({ count: 0 });
    prisma.attendance.findUnique.mockResolvedValue(null);

    await expect(service.checkOut(employeeId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a duplicate check-out', async () => {
    prisma.attendance.updateMany.mockResolvedValue({ count: 0 });

    prisma.attendance.findUnique.mockResolvedValue({
      ...attendance,
      checkOutAt: new Date('2026-10-14T10:00:00.000Z'),
    });

    await expect(service.checkOut(employeeId)).rejects.toThrow(
      ConflictException,
    );
  });

  it('returns an empty result when the employee has not checked in today', async () => {
    prisma.attendance.findUnique.mockResolvedValue(null);

    const result = await service.getToday(employeeId);

    expect(result.checkedIn).toBe(false);
    expect(result.attendance).toBeNull();
  });

  it('returns today’s attendance when a record exists', async () => {
    prisma.attendance.findUnique.mockResolvedValue(attendance);

    const result = await service.getToday(employeeId);

    expect(result.checkedIn).toBe(true);
    expect(result.attendance?.id).toBe('attendance-uuid');
    expect(result.attendanceDate).toBe('2026-10-14');
  });
});
