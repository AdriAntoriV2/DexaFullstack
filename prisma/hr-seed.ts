
import { hash } from 'bcryptjs';
import type { PrismaService } from '../src/prisma/prisma.service.js';

export interface HrSeedInput {
  companyEmail: string;
  password: string;
  fullName: string;
  position: string;
}

export async function seedHrAccount(
  prisma: Pick<PrismaService, 'employee'>,
  input: HrSeedInput,
) {
  const passwordHash = await hash(input.password, 12);

  return prisma.employee.upsert({
    where: {
      companyEmail: input.companyEmail,
    },
    create: {
      companyEmail: input.companyEmail,
      passwordHash,
      fullName: input.fullName,
      position: input.position,
      role: 'HR',
    },
    update: {
      passwordHash,
      fullName: input.fullName,
      position: input.position,
      role: 'HR',
    },
    select: {
      id: true,
      companyEmail: true,
      fullName: true,
      position: true,
      role: true,
    },
  });
}
