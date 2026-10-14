import { hash } from 'bcryptjs';
export async function seedHrAccount(prisma, input) {
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
//# sourceMappingURL=hr-seed.js.map