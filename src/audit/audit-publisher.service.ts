import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import amqp, {
  type ChannelModel,
  type ConfirmChannel,
} from 'amqplib';
import { randomUUID } from 'node:crypto';

const PROFILE_CHANGED_EVENT = 'employee.profile.changed';
const PROFILE_CHANGED_QUEUE = 'employee.profile.changed';
const PROFILE_CHANGED_DEAD_QUEUE = 'employee.profile.changed.dead';

export interface ProfileChangedEvent {
  eventId: string;
  eventType: typeof PROFILE_CHANGED_EVENT;
  employeeId: string;
  changedFields: string[];
  occurredAt: string;
}

@Injectable()
export class AuditPublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(AuditPublisherService.name);
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;
  private connecting?: Promise<ConfirmChannel>;

  async publishProfileChanged(
    employeeId: string,
    changedFields: string[],
  ): Promise<void> {
    if (changedFields.length === 0) return;

    const channel = await this.getChannel();
    const event: ProfileChangedEvent = {
      eventId: randomUUID(),
      eventType: PROFILE_CHANGED_EVENT,
      employeeId,
      changedFields,
      occurredAt: new Date().toISOString(),
    };

    channel.sendToQueue(
      PROFILE_CHANGED_QUEUE,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: 'application/json',
        messageId: event.eventId,
        timestamp: Date.now(),
      },
    );

    await channel.waitForConfirms();

    this.logger.log(
      `Published ${PROFILE_CHANGED_EVENT} for employee ${employeeId}`,
    );
  }

  private async getChannel(): Promise<ConfirmChannel> {
    if (this.channel) return this.channel;
    if (this.connecting) return this.connecting;

    this.connecting = this.connect();

    try {
      return await this.connecting;
    } finally {
      this.connecting = undefined;
    }
  }

  private async connect(): Promise<ConfirmChannel> {
    const url = process.env.RABBITMQ_URL;
    if (!url) throw new Error('RABBITMQ_URL is required');

    const connection = await amqp.connect(url);
    this.connection = connection;

    connection.on('error', (error) => {
      this.logger.error(`RabbitMQ connection error: ${error.message}`);
    });

    connection.on('close', () => {
      this.connection = undefined;
      this.channel = undefined;
    });

    const channel = await connection.createConfirmChannel();
    this.channel = channel;

    channel.on('error', (error) => {
      this.logger.error(`RabbitMQ channel error: ${error.message}`);
    });

    channel.on('close', () => {
      this.channel = undefined;
    });

    await channel.assertQueue(PROFILE_CHANGED_DEAD_QUEUE, {
      durable: true,
    });

    await channel.assertQueue(PROFILE_CHANGED_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': PROFILE_CHANGED_DEAD_QUEUE,
      },
    });

    return channel;
  }

  async onModuleDestroy(): Promise<void> {
    const channel = this.channel;
    const connection = this.connection;

    this.channel = undefined;
    this.connection = undefined;

    try {
      await channel?.close();
    } catch {
      // The channel may already be closed.
    }

    try {
      await connection?.close();
    } catch {
      // The connection may already be closed.
    }
  }
}