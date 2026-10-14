
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';

import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

vi.mock('bcryptjs', () => ({
    compare: vi.fn(),
}));

describe('AuthService', () => {
    let service: AuthService;

    const prisma = {
        employee: {
            findUnique: vi.fn(),
        },
    };

    const jwt = {
        signAsync: vi.fn(),
    };

    beforeEach(() => {
        vi.resetAllMocks();

        service = new AuthService(
            prisma as unknown as PrismaService,
            jwt as unknown as JwtService,
        );
    });

    it('rejects an unknown email', async () => {
        prisma.employee.findUnique.mockResolvedValue(null);

        await expect(
            service.login({
                companyEmail: 'missing@company.com',
                password: 'ExamplePassword123',
            }),
        ).rejects.toThrow(UnauthorizedException);

        expect(compare).not.toHaveBeenCalled();
    });

    it('rejects an incorrect password', async () => {
        prisma.employee.findUnique.mockResolvedValue({
            id: 'employee-id',
            companyEmail: 'employee@company.com',
            passwordHash: 'hashed-password',
            fullName: 'Example Employee',
            position: 'Developer',
            role: 'EMPLOYEE',
            phoneNumber: null,
            photoUrl: null,
        });

        vi.mocked(compare).mockResolvedValue(false as never);

        await expect(
            service.login({
                companyEmail: 'employee@company.com',
                password: 'WrongPassword123',
            }),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('returns an access token for valid credentials', async () => {
        prisma.employee.findUnique.mockResolvedValue({
            id: 'employee-id',
            companyEmail: 'employee@company.com',
            passwordHash: 'hashed-password',
            fullName: 'Example Employee',
            position: 'Developer',
            role: 'EMPLOYEE',
            phoneNumber: null,
            photoUrl: null,
        });

        vi.mocked(compare).mockResolvedValue(true as never);
        jwt.signAsync.mockResolvedValue('test-jwt-token');

        const result = await service.login({
            companyEmail: 'employee@company.com',
            password: 'ExamplePassword123',
        });

        expect(jwt.signAsync).toHaveBeenCalledWith({
            sub: 'employee-id',
            role: 'EMPLOYEE',
        });

        expect(result.accessToken).toBe('test-jwt-token');
        expect(JSON.stringify(result)).not.toContain('passwordHash');
    });
});
