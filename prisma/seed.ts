
import 'dotenv/config';

import { PrismaService } from '../src/prisma/prisma.service.js'
import { seedHrAccount } from './hr-seed.js';

async function main() {
  const companyEmail = process.env.HR_EMAIL;
  const password = process.env.HR_PASSWORD;
  const fullName = process.env.HR_FULL_NAME;
  const position = process.env.HR_POSITION;

  if (!companyEmail || !password || !fullName || !position) {
    throw new Error(
      'Missing HR_EMAIL, HR_PASSWORD, HR_FULL_NAME, or HR_POSITION in environment.',
    );
  }

  if (password.length < 8 || password.length > 72) {
    throw new Error('HR_PASSWORD must be between 8 and 72 characters.');
  }

  const prisma = new PrismaService();

  try {
    const hr = await seedHrAccount(prisma, {
      companyEmail,
      password,
      fullName,
      position,
    });

    console.log(`HR account seeded: ${hr.companyEmail} (${hr.role})`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error('Failed to seed HR account:', error);
  process.exitCode = 1;
});
