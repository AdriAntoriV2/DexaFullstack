import type { PrismaService } from '../src/prisma/prisma.service.js';
export interface HrSeedInput {
    companyEmail: string;
    password: string;
    fullName: string;
    position: string;
}
export declare function seedHrAccount(prisma: Pick<PrismaService, 'employee'>, input: HrSeedInput): Promise<{
    companyEmail: string;
    id: string;
    fullName: string;
    position: string;
    role: import("../src/generated/prisma/enums.js").EmployeeRole;
}>;
