import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('NotificationsService', () => {
  const prisma = {
    hrNotification: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  let service: NotificationsService;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new NotificationsService(
      prisma as unknown as PrismaService,
    );

    prisma.hrNotification.create.mockImplementation(async ({ data }) => ({
      id: 'notification-1',
      ...data,
      occurredAt: new Date('2026-10-15T03:00:00.000Z'),
      readAt: null,
    }));
  });

  it('persists and emits a notification when an employee updates their profile', async () => {
    const next = vi.fn();
    const subscription = service.stream().subscribe(next);

    await service.notifyProfileUpdated('employee-1', [
      'phoneNumber',
      'photoUrl',
    ]);

    expect(prisma.hrNotification.create).toHaveBeenCalledOnce();
    expect(prisma.hrNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'EMPLOYEE_PROFILE_UPDATED',
        employeeId: 'employee-1',
        changedFields: ['phoneNumber', 'photoUrl'],
        message: 'An employee updated their profile.',
      }),
    });

    expect(next).toHaveBeenCalledOnce();

    const event = next.mock.calls[0][0];
    expect(event.type).toBe('EMPLOYEE_PROFILE_UPDATED');
    expect(event.data).toMatchObject({
      type: 'EMPLOYEE_PROFILE_UPDATED',
      employeeId: 'employee-1',
      changedFields: ['phoneNumber', 'photoUrl'],
      message: 'An employee updated their profile.',
      occurredAt: '2026-10-15T03:00:00.000Z',
      readAt: null,
    });

    expect(event.data.id).toBeTruthy();

    subscription.unsubscribe();
  });

  it('does not persist or emit a profile notification when no fields changed', async () => {
    const next = vi.fn();
    const subscription = service.stream().subscribe(next);

    await service.notifyProfileUpdated('employee-1', []);

    expect(prisma.hrNotification.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();

    subscription.unsubscribe();
  });

  it('persists and emits a notification when an employee changes their password', async () => {
    const next = vi.fn();
    const subscription = service.stream().subscribe(next);

    await service.notifyPasswordChanged('employee-1');

    expect(prisma.hrNotification.create).toHaveBeenCalledOnce();
    expect(prisma.hrNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'EMPLOYEE_PASSWORD_CHANGED',
        employeeId: 'employee-1',
        changedFields: ['password'],
        message: 'An employee changed their password.',
      }),
    });

    expect(next).toHaveBeenCalledOnce();

    const event = next.mock.calls[0][0];
    expect(event.type).toBe('EMPLOYEE_PASSWORD_CHANGED');
    expect(event.data).toMatchObject({
      type: 'EMPLOYEE_PASSWORD_CHANGED',
      employeeId: 'employee-1',
      changedFields: ['password'],
      message: 'An employee changed their password.',
      occurredAt: '2026-10-15T03:00:00.000Z',
      readAt: null,
    });

    expect(event.data.id).toBeTruthy();

    expect(JSON.stringify(event)).not.toContain('passwordHash');

    subscription.unsubscribe();
  });

  it('does not emit a notification when persistence fails', async () => {
    prisma.hrNotification.create.mockRejectedValueOnce(
      new Error('Database unavailable'),
    );

    const next = vi.fn();
    const subscription = service.stream().subscribe(next);

    await expect(
      service.notifyPasswordChanged('employee-1'),
    ).rejects.toThrow('Database unavailable');

    expect(next).not.toHaveBeenCalled();

    subscription.unsubscribe();
  });
});