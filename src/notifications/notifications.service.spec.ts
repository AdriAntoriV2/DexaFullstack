import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';

describe('NotificationsService', () => {
  let service: NotificationsService;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits a notification when an employee updates their profile', () => {
    service = new NotificationsService();

    const next = vi.fn();
    const subscription = service.stream().subscribe(next);

    service.notifyProfileUpdated('employee-123', [
      'phoneNumber',
      'photoUrl',
    ]);

    expect(next).toHaveBeenCalledOnce();

    const event = next.mock.calls[0][0];

    expect(event.type).toBe('EMPLOYEE_PROFILE_UPDATED');
    expect(event.id).toBeTruthy();
    expect(event.data).toMatchObject({
      id: event.id,
      type: 'EMPLOYEE_PROFILE_UPDATED',
      employeeId: 'employee-123',
      changedFields: ['phoneNumber', 'photoUrl'],
      message: 'An employee updated their profile.',
    });
    expect(event.data.occurredAt).toBeTruthy();

    subscription.unsubscribe();
  });

  it('does not emit a notification when no fields changed', () => {
    service = new NotificationsService();

    const next = vi.fn();
    const subscription = service.stream().subscribe(next);

    service.notifyProfileUpdated('employee-123', []);

    expect(next).not.toHaveBeenCalled();

    subscription.unsubscribe();
  });
});