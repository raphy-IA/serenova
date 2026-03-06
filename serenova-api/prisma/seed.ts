import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Default Organisation if not exists
    let organisation = await prisma.organisation.findFirst({
        where: { nom: 'Serenova Corp' }
    });

    if (!organisation) {
        organisation = await prisma.organisation.create({
            data: {
                nom: 'Serenova Corp',
                email: 'contact@serenova.app',
                statut: 'ACTIF'
            }
        });
        console.log('Created Organisation:', organisation.nom);
    } else {
        console.log('Organisation already exists:', organisation.nom);
    }

    // 2. Create Super Admin (Global) if not exists
    let superAdmin = await prisma.user.findUnique({
        where: { email: 'superadmin@serenova.app' }
    });

    if (!superAdmin) {
        superAdmin = await prisma.user.create({
            data: {
                email: 'superadmin@serenova.app',
                passwordHash,
                firstName: 'Super',
                lastName: 'Admin',
                role: Role.SUPER_ADMIN,
            },
        });
        console.log('Created Super Admin User:', superAdmin.email);
    }

    // 3. Create Admin User for the Organisation if not exists
    let admin = await prisma.user.findUnique({
        where: { email: 'admin@serenova.app' }
    });

    if (!admin) {
        admin = await prisma.user.create({
            data: {
                email: 'admin@serenova.app',
                passwordHash,
                firstName: 'Admin',
                lastName: 'Serenova',
                role: Role.ADMIN,
                organisationId: organisation.id,
            },
        });
        console.log('Created Admin User (Org):', admin.email);
    }

    // 4. Create Subscription Plans if not exist
    const plans = [
        {
            nom: 'Starter',
            prix: 15000,
            periodicite: 'MENSUEL' as any,
            limites: { sites: 1, baux: 10, users: 2 }
        },
        {
            nom: 'Pro',
            prix: 35000,
            periodicite: 'MENSUEL' as any,
            limites: { sites: 5, baux: 50, users: 5 }
        },
        {
            nom: 'Entreprise',
            prix: 75000,
            periodicite: 'MENSUEL' as any,
            limites: { sites: 9999, baux: 9999, users: 9999 }
        }
    ];

    for (const planData of plans) {
        await prisma.plan.upsert({
            where: { nom: planData.nom },
            update: {
                prix: planData.prix,
                periodicite: planData.periodicite,
                limites: planData.limites
            },
            create: planData
        });
        console.log(`Upserted Plan: ${planData.nom}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
