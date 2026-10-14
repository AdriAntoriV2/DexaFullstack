import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { companyEmail: dto.companyEmail },
    });

    if (
      !employee ||
      !(await compare(dto.password, employee.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: employee.id,
      role: employee.role,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      employee: {
        id: employee.id,
        companyEmail: employee.companyEmail,
        fullName: employee.fullName,
        photoUrl: employee.photoUrl,
        position: employee.position,
        phoneNumber: employee.phoneNumber,
        role: employee.role,
      },
    };
  }
}