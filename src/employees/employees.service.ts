import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateEmployeeDto } from './dto/create-employee.dto.js';
import type { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import type { UpdateMyProfileDto } from './dto/update-my-profile.dto.js';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) { }

  private readonly publicEmployeeSelect = {
    id: true,
    companyEmail: true,
    fullName: true,
    photoUrl: true,
    position: true,
    phoneNumber: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async findAll() {
    return this.prisma.employee.findMany({
      select: this.publicEmployeeSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: this.publicEmployeeSelect,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    const passwordHash = await hash(dto.password, 12);

    try {
      return await this.prisma.employee.create({
        data: {
          companyEmail: dto.companyEmail,
          passwordHash,
          fullName: dto.fullName,
          position: dto.position,
          phoneNumber: dto.phoneNumber,
        },
        select: this.publicEmployeeSelect,
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An employee with this email already exists',
        );
      }

      throw error;
    }
  }

  async updateMyProfile(
    id: string,
    dto: UpdateMyProfileDto,
  ) {
    await this.findById(id);

    return this.prisma.employee.update({
      where: { id },
      data: dto,
      select: this.publicEmployeeSelect,
    });
  }

  async updateByHr(
    id: string,
    dto: UpdateEmployeeDto,
  ) {
    await this.findById(id);

    try {
      return await this.prisma.employee.update({
        where: { id },
        data: dto,
        select: this.publicEmployeeSelect,
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An employee with this email already exists',
        );
      }

      throw error;
    }
  }

  async changeMyPassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: { passwordHash: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const isPasswordValid = await compare(
      currentPassword,
      employee.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await hash(newPassword, 12);

    await this.prisma.employee.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

}