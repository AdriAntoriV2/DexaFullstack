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
      ...data,
      occurredAt: new Date('2026-10-15T03:00:00.000Z'),
      readAt: null,
    }));
  });

  it('emits a notification when an employee updates their profile', async () => {
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
      employeeId: 'employee-1',
      changedFields: ['phoneNumber', 'photoUrl'],
      readAt: null,
    });

    subscription.unsubscribe();
  });

  it('does not persist or emit a notification when no fields changed', async () => {
    const next = vi.fn();
    const subscription = service.stream().subscribe(next);

    await service.notifyProfileUpdated('employee-1', []);

    expect(prisma.hrNotification.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();

    subscription.unsubscribe();
  });
});
