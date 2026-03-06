import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
    const email = 'admin@serenova.app';
    const newPassword = 'Admin123!';
    const passwordHash = await bcrypt.hash(newPassword, 12);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { passwordHash, role: 'ADMIN' },
            create: {
                email,
                passwordHash,
                firstName: 'Admin',
                lastName: 'Serenova',
                role: 'ADMIN',
            },
        });
        console.log(`✅ Mot de passe réinitialisé pour ${email}`);
        console.log(`🔑 Nouveau mot de passe : ${newPassword}`);
    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
