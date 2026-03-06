import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // 1. Récupérer l'organisation par défaut
    const defaultOrg = await prisma.organisation.findFirst({
        where: { nom: 'Serenova Corp' }
    });

    if (!defaultOrg) {
        console.error('Organisation par défaut non trouvée. Veuillez d\'abord lancer le seed.');
        return;
    }

    console.log(`Migration vers l'organisation: ${defaultOrg.nom} (${defaultOrg.id})`);

    // 2. Rattacher les sites sans organisation
    const sites = await prisma.site.updateMany({
        where: { organisationId: null },
        data: { organisationId: defaultOrg.id }
    });
    console.log(`- ${sites.count} sites rattachés.`);

    // 3. Rattacher les locataires sans organisation
    const locataires = await prisma.locataire.updateMany({
        where: { organisationId: null },
        data: { organisationId: defaultOrg.id }
    });
    console.log(`- ${locataires.count} locataires rattachés.`);

    // 4. Rattacher les baux
    const baux = await prisma.bail.updateMany({
        where: { organisationId: null },
        data: { organisationId: defaultOrg.id }
    });
    console.log(`- ${baux.count} baux rattachés.`);

    // 5. Rattacher les paiements
    const paiements = await prisma.paiement.updateMany({
        where: { organisationId: null },
        data: { organisationId: defaultOrg.id }
    });
    console.log(`- ${paiements.count} paiements rattachés.`);

    // 6. Rattacher les alertes
    const alertes = await prisma.alerte.updateMany({
        where: { organisationId: null },
        data: { organisationId: defaultOrg.id }
    });
    console.log(`- ${alertes.count} alertes rattachées.`);

    // 7. S'assurer que tous les utilisateurs existants ont une organisation (si pas SUPER_ADMIN)
    const users = await prisma.user.updateMany({
        where: {
            organisationId: null,
            role: { not: 'SUPER_ADMIN' }
        },
        data: { organisationId: defaultOrg.id }
    });
    console.log(`- ${users.count} utilisateurs rattachés.`);

    console.log('Migration terminée avec succès.');
}

main()
    .catch(e => console.error('Erreur lors de la migration:', e))
    .finally(() => prisma.$disconnect());
