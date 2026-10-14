
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { EmployeesService } from './employees.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('EmployeesService', () => {
  let service: EmployeesService;

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
    service = new EmployeesService(prisma as unknown as PrismaService);
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
});
