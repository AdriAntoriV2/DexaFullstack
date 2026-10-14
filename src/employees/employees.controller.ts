
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { EmployeesService } from './employees.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) { }

  @Get('me')
  @ApiOperation({ summary: 'Get my employee profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.employeesService.findById(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.employeesService.updateMyProfile(user.sub, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('HR')
  @ApiOperation({ summary: 'List all employees (HR only)' })
  @ApiResponse({ status: 200, description: 'Employees retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'HR role required' })
  findAll() {
    return this.employeesService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('HR')
  @ApiOperation({ summary: 'Create an employee (HR only)' })
  @ApiResponse({ status: 201, description: 'Employee created' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 403, description: 'HR role required' })
  @ApiResponse({ status: 409, description: 'Company email already exists' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('HR')
  @ApiOperation({ summary: 'Update employee details (HR only)' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee updated' })
  @ApiResponse({ status: 400, description: 'Invalid UUID or request body' })
  @ApiResponse({ status: 403, description: 'HR role required' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 409, description: 'Company email already exists' })
  updateByHr(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.updateByHr(id, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change my password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized or current password incorrect' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  changeMyPassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.employeesService.changeMyPassword(
      user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }

}
