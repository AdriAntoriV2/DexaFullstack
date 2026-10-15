import {
  Injectable,
  MessageEvent,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service.js';

export type HrNotificationType =
  | 'EMPLOYEE_PROFILE_UPDATED'
  | 'EMPLOYEE_PASSWORD_CHANGED';

export interface HrNotification {
  id: string;
  type: HrNotificationType;
  employeeId: string;
  changedFields: string[];
  message: string;
  occurredAt: string;
  readAt: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly events = new Subject<HrNotification>();

  constructor(private readonly prisma: PrismaService) {}

  stream(): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const subscription = this.events.subscribe((notification) => {
        subscriber.next({
          data: notification,
          type: notification.type,
          id: notification.id,
        });
      });

      return () => subscription.unsubscribe();
    });
  }

  async list() {
    const [notifications, unreadCount] = await Promise.all([
      this.prisma.hrNotification.findMany({
        orderBy: { occurredAt: 'desc' },
        take: 50,
      }),
      this.prisma.hrNotification.count({
        where: { readAt: null },
      }),
    ]);

    return {
      data: notifications.map((notification) => ({
        ...notification,
        occurredAt: notification.occurredAt.toISOString(),
        readAt: notification.readAt?.toISOString() ?? null,
      })),
      unreadCount,
    };
  }

  async markRead(id: string) {
    const result = await this.prisma.hrNotification.updateMany({
      where: { id, readAt: null },
      data: { readAt: new Date() },
    });

    if (result.count === 0) {
      const existing = await this.prisma.hrNotification.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existing) {
        throw new NotFoundException('Notification not found.');
      }
    }

    return { success: true };
  }

  async markAllRead() {
    const result = await this.prisma.hrNotification.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    });

    return { success: true, updatedCount: result.count };
  }

  async notifyProfileUpdated(
    employeeId: string,
    changedFields: string[],
  ): Promise<void> {
    if (changedFields.length === 0) return;

    await this.createAndPublish({
      type: 'EMPLOYEE_PROFILE_UPDATED',
      employeeId,
      changedFields,
      message: 'An employee updated their profile.',
    });
  }

  async notifyPasswordChanged(employeeId: string): Promise<void> {
    await this.createAndPublish({
      type: 'EMPLOYEE_PASSWORD_CHANGED',
      employeeId,
      changedFields: ['password'],
      message: 'An employee changed their password.',
    });
  }

  private async createAndPublish(input: {
    type: HrNotificationType;
    employeeId: string;
    changedFields: string[];
    message: string;
  }): Promise<void> {
    const notification = await this.prisma.hrNotification.create({
      data: {
        id: randomUUID(),
        type: input.type,
        employeeId: input.employeeId,
        changedFields: input.changedFields,
        message: input.message,
      },
    });

    this.events.next({
      id: notification.id,
      type: input.type,
      employeeId: notification.employeeId,
      changedFields: notification.changedFields,
      message: notification.message,
      occurredAt: notification.occurredAt.toISOString(),
      readAt: notification.readAt?.toISOString() ?? null,
    });
  }
}