
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
import { AuditModule } from '../audit/audit.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    AuthModule, 
    AuditModule,
    NotificationsModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
