import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const alertes = await prisma.alerte.findMany({
        where: { type: 'IMPAYE' },
        take: 5
    });
    console.log(JSON.stringify(alertes, null, 2));
}

main().finally(() => prisma.$disconnect());
