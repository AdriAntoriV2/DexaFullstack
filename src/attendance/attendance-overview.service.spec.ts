
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AttendanceService } from './attendance.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AttendanceService employee overview', () => {
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

    it('returns paginated attendance across employees', async () => {
        const records = [
            {
                id: 'attendance-1',
                employeeId: 'employee-1',
                employee: {
                    companyEmail: 'employee@company.com',
                    fullName: 'Test Employee',
                },
                attendanceDate: new Date('2026-10-14T00:00:00.000Z'),
                checkInAt: new Date('2026-10-14T01:00:00.000Z'),
                checkOutAt: null,
                createdAt: new Date('2026-10-14T01:00:00.000Z'),
                updatedAt: new Date('2026-10-14T01:00:00.000Z'),
            },
        ];

        prisma.$transaction.mockResolvedValue([records, 21]);

        const result = await service.getEmployeeOverview({
            page: 2,
            limit: 10,
        });

        expect(result).toMatchObject({
            page: 2,
            limit: 10,
            total: 21,
            totalPages: 3,
            data: [
                {
                    id: 'attendance-1',
                    attendanceDate: '2026-10-14',
                    employee: {
                        companyEmail: 'employee@company.com',
                        fullName: 'Test Employee',
                    },
                },
            ],
        });

        expect(prisma.$transaction).toHaveBeenCalledOnce();
    });

    it('applies inclusive date filters', async () => {
        prisma.$transaction.mockResolvedValue([[], 0]);

        await service.getEmployeeOverview({
            from: '2026-10-01',
            to: '2026-10-14',
            page: 1,
            limit: 10,
        });

        expect(prisma.attendance.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    attendanceDate: {
                        gte: new Date('2026-10-01T00:00:00.000Z'),
                        lte: new Date('2026-10-14T00:00:00.000Z'),
                    },
                },
                orderBy: [
                    { attendanceDate: 'desc' },
                    { createdAt: 'desc' },
                ],
                skip: 0,
                take: 10,
            }),
        );
    });

    it('rejects invalid calendar dates', async () => {
        await expect(
            service.getEmployeeOverview({
                from: '2026-02-31',
                page: 1,
                limit: 10,
            }),
        ).rejects.toThrow(BadRequestException);

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a start date later than the end date', async () => {
        await expect(
            service.getEmployeeOverview({
                from: '2026-10-15',
                to: '2026-10-14',
                page: 1,
                limit: 10,
            }),
        ).rejects.toThrow(BadRequestException);

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });
});
