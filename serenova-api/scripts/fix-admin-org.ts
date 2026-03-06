import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const organisation = await prisma.organisation.findFirst({
        where: { nom: 'Serenova Corp' }
    });

    if (!organisation) {
        console.error('Organisation "Serenova Corp" non trouvée.');
        return;
    }

    const result = await prisma.user.updateMany({
        where: { email: 'admin@serenova.app' },
        data: { organisationId: organisation.id }
    });

    console.log(`Mis à jour ${result.count} utilisateur(s) avec l'organisation ID: ${organisation.id}`);
}

main().finally(() => prisma.$disconnect());
