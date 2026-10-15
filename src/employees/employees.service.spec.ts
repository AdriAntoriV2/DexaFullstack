import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

import { EmployeesService } from './employees.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditPublisherService } from '../audit/audit-publisher.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

describe('EmployeesService', () => {
  let service: EmployeesService;

  const auditPublisher = {
    publishProfileChanged: vi.fn().mockResolvedValue(undefined),
  };

  const notificationsService = {
    notifyProfileUpdated: vi.fn().mockResolvedValue(undefined),
    notifyPasswordChanged: vi.fn().mockResolvedValue(undefined),
  };

  const prisma = {
    employee: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();

    auditPublisher.publishProfileChanged.mockResolvedValue(undefined);
    notificationsService.notifyProfileUpdated.mockResolvedValue(undefined);
    notificationsService.notifyPasswordChanged.mockResolvedValue(undefined);

    service = new EmployeesService(
      prisma as unknown as PrismaService,
      auditPublisher as unknown as AuditPublisherService,
      notificationsService as unknown as NotificationsService,
    );
  });

  it('lists employees', async () => {
    const employees = [
      { id: 'employee-1', companyEmail: 'one@company.com' },
      { id: 'employee-2', companyEmail: 'two@company.com' },
    ];

    prisma.employee.findMany.mockResolvedValue(employees);

    await expect(service.findAll()).resolves.toEqual(employees);
    expect(prisma.employee.findMany).toHaveBeenCalledOnce();
  });

  it('returns an employee by ID', async () => {
    const employee = {
      id: 'employee-1',
      companyEmail: 'one@company.com',
    };

    prisma.employee.findUnique.mockResolvedValue(employee);

    await expect(service.findById('employee-1')).resolves.toEqual(employee);
  });

  it('throws when an employee does not exist', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('translates duplicate email errors during creation', async () => {
    prisma.employee.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create({
        companyEmail: 'existing@company.com',
        password: 'ExamplePassword123',
        fullName: 'Example Employee',
        position: 'Developer',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('changes password and notifies HR when the current password is correct', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      passwordHash: 'old-hash',
    });
    vi.mocked(compare).mockImplementation(async () => true);
    vi.mocked(hash).mockImplementation(async () => 'new-hash');
    prisma.employee.update.mockResolvedValue({});

    await expect(
      service.changeMyPassword(
        'employee-1',
        'CurrentPassword123',
        'NewPassword456',
      ),
    ).resolves.toEqual({ message: 'Password changed successfully' });

    expect(compare).toHaveBeenCalledWith(
      'CurrentPassword123',
      'old-hash',
    );
    expect(hash).toHaveBeenCalledWith('NewPassword456', 12);
    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: 'employee-1' },
      data: { passwordHash: 'new-hash' },
    });
    expect(notificationsService.notifyPasswordChanged).toHaveBeenCalledOnce();
    expect(notificationsService.notifyPasswordChanged).toHaveBeenCalledWith(
      'employee-1',
    );
  });

  it('rejects a password change and does not notify HR when the current password is incorrect', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      passwordHash: 'old-hash',
    });
    vi.mocked(compare).mockImplementation(async () => false);

    await expect(
      service.changeMyPassword(
        'employee-1',
        'WrongPassword123',
        'NewPassword456',
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(prisma.employee.update).not.toHaveBeenCalled();
    expect(notificationsService.notifyPasswordChanged).not.toHaveBeenCalled();
  });

  it('rejects a password change when the employee does not exist', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);

    await expect(
      service.changeMyPassword(
        'missing-id',
        'CurrentPassword123',
        'NewPassword456',
      ),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.employee.update).not.toHaveBeenCalled();
    expect(notificationsService.notifyPasswordChanged).not.toHaveBeenCalled();
  });
});