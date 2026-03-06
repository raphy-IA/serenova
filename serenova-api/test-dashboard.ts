
import { dashboardService } from './src/modules/dashboard/dashboard.service';
import { prisma } from './src/config/database';

async function test() {
    try {
        console.log('Testing getKpisGlobaux...');
        // On cherche un utilisateur ADMIN ou SUPER_ADMIN pour tester
        const user = await prisma.user.findFirst({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
        });

        if (!user) {
            console.log('No user found to test with.');
            return;
        }

        console.log(`Using user: ${user.email} (${user.role})`);
        const stats = await dashboardService.getKpisGlobaux(user.id, user.role, user.organisationId || undefined);
        console.log('SUCCESS:', JSON.stringify(stats, null, 2));
    } catch (err) {
        console.error('FAILED:', err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
