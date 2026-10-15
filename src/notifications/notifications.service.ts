
import { Injectable, MessageEvent } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, Subject } from 'rxjs';

export interface HrNotification {
    id: string;
    type: 'EMPLOYEE_PROFILE_UPDATED';
    employeeId: string;
    changedFields: string[];
    message: string;
    occurredAt: string;
}

export interface HrNotificationEvent {
    data: HrNotification;
    type: HrNotification['type'];
    id: string;
}

@Injectable()
export class NotificationsService {
    private readonly events = new Subject<HrNotification>();

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


    notifyProfileUpdated(
        employeeId: string,
        changedFields: string[],
    ): void {
        if (changedFields.length === 0) return;

        this.events.next({
            id: randomUUID(),
            type: 'EMPLOYEE_PROFILE_UPDATED',
            employeeId,
            changedFields,
            message: 'An employee updated their profile.',
            occurredAt: new Date().toISOString(),
        });
    }
}
