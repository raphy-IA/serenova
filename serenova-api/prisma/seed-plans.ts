import { PrismaClient, PeriodicitePlan, SubscriptionStatut } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding plans...');

    const plans = [
        {
            nom: 'STARTER',
            prix: 15000,
            periodicite: PeriodicitePlan.MENSUEL,
            limites: { sites: 5, baux: 20, users: 2 },
        },
        {
            nom: 'PRO',
            prix: 45000,
            periodicite: PeriodicitePlan.MENSUEL,
            limites: { sites: 20, baux: 100, users: 10 },
        },
        {
            nom: 'ENTERPRISE',
            prix: 150000,
            periodicite: PeriodicitePlan.MENSUEL,
            limites: { sites: 9999, baux: 9999, users: 9999 },
        },
    ];

    for (const planData of plans) {
        const plan = await prisma.plan.upsert({
            where: { nom: planData.nom },
            update: planData,
            create: planData,
        });
        console.log(`Plan ${plan.nom} created / updated.`);
    }

    // Assign STARTER plan to all organisations without subscription
    const organisations = await prisma.organisation.findMany({
        where: { subscription: null },
    });

    const starterPlan = await prisma.plan.findUnique({ where: { nom: 'STARTER' } });

    if (starterPlan) {
        for (const org of organisations) {
            await prisma.subscription.create({
                data: {
                    organisationId: org.id,
                    planId: starterPlan.id,
                    statut: SubscriptionStatut.ACTIF,
                },
            });
            console.log(`Org ${org.nom} subscribed to STARTER.`);
        }
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
