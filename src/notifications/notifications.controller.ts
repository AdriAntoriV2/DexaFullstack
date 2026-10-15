import {
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { NotificationsService } from './notifications.service.js';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HR')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get recent HR notifications and unread count (HR only)',
  })
  list() {
    return this.notificationsService.list();
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all HR notifications as read (HR only)',
  })
  markAllRead() {
    return this.notificationsService.markAllRead();
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark an HR notification as read (HR only)',
  })
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }

  @Sse('stream')
  @ApiOperation({
    summary: 'Subscribe to live HR notifications (HR only)',
  })
  stream(): Observable<MessageEvent> {
    return this.notificationsService.stream();
  }
}