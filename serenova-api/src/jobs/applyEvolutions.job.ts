import Bull from 'bull';
import { prisma } from '../config/database';
import { redisConfig } from '../config/redis';

// -----------------------------------------------------------------------
// JOB: Application des évolutions de loyer planifiées
// Cron quotidien — vérifie s'il y a des évolutions de loyer qui doivent 
// être appliquées à la date d'aujourd'hui ou passée.
// -----------------------------------------------------------------------
export const applyEvolutionsQueue = new Bull('apply-evolutions', { redis: redisConfig });

applyEvolutionsQueue.process(async (job) => {
    console.log('🔍 [CRON] Vérification des évolutions de loyer à appliquer...');

    const maintenant = new Date();

    // Trouver les évolutions non appliquées dont la date d'effet est passée ou aujourd'hui
    const evolutions = await prisma.evolutionBail.findMany({
        where: {
            applique: false,
            dateEffet: { lte: maintenant }
        },
        include: {
            bail: true
        }
    });

    let evolutionsAppliquees = 0;

    for (const evo of evolutions) {
        try {
            // Mettre à jour le loyer mensuel du bail
            await prisma.bail.update({
                where: { id: evo.bailId },
                data: {
                    loyerMensuel: evo.nouveauLoyerMensuel,
                }
            });

            // Marquer l'évolution comme appliquée
            await prisma.evolutionBail.update({
                where: { id: evo.id },
                data: { applique: true }
            });

            evolutionsAppliquees++;
            console.log(`✅ Évolution appliquée pour le bail ${evo.bailId} : nouveau loyer ${evo.nouveauLoyerMensuel}`);
        } catch (error) {
            console.error(`❌ Erreur lors de l'application de l'évolution ${evo.id} :`, error);
        }
    }

    console.log(`✅ [CRON] Évolutions: ${evolutionsAppliquees} appliquées.`);
    return { evolutionsAppliquees };
});

applyEvolutionsQueue.on('failed', (job, err) => {
    console.error(`❌ [CRON] applyEvolutionsQueue job ${job.id} failed:`, err.message);
});
