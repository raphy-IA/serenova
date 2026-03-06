import Bull from 'bull';
import { prisma } from '../config/database';
import { redisConfig } from '../config/redis';

// -----------------------------------------------------------------------
// JOB: Détection des espaces vacants depuis trop longtemps
// Cron hebdomadaire — alerte pour les espaces LIBRE depuis + de 30 jours
// TypeAlerte: ESPACE_VACANT (valeur Prisma)
// -----------------------------------------------------------------------
export const espacesVacantsQueue = new Bull('espaces-vacants', { redis: redisConfig });

const SEUIL_VACANCE_JOURS = 30;

espacesVacantsQueue.process(async (job) => {
    console.log('🔍 [CRON] Vérification des espaces vacants...');

    const dateSeuilVacance = new Date();
    dateSeuilVacance.setDate(dateSeuilVacance.getDate() - SEUIL_VACANCE_JOURS);

    const espacesVacants = await prisma.espace.findMany({
        where: {
            statut: 'LIBRE',
            createdAt: { lte: dateSeuilVacance },
        },
        select: {
            id: true,
            identifiant: true,
            siteId: true,
            site: { select: { nom: true } },
            baux: {
                where: { statut: { in: ['EXPIRE', 'RESILIE'] } },
                orderBy: { updatedAt: 'desc' },
                take: 1,
                select: { id: true, updatedAt: true, alertes: { where: { type: 'ESPACE_VACANT', statut: 'EN_ATTENTE' }, take: 1 } }
            }
        }
    });

    let alertesCreees = 0;

    for (const espace of espacesVacants) {
        const dernierBail = espace.baux[0];
        if (!dernierBail) continue;

        // Vérifier si l'espace est réellement vacant depuis le seuil
        const vacantDepuisAssez = dernierBail.updatedAt <= dateSeuilVacance;
        const alerteExistante = dernierBail.alertes.length > 0;

        if (vacantDepuisAssez && !alerteExistante) {
            await prisma.alerte.create({
                data: {
                    bailId: dernierBail.id,
                    type: 'ESPACE_VACANT',
                    message: `Espace vacant depuis + ${SEUIL_VACANCE_JOURS}j — ${espace.identifiant} — ${espace.site.nom}`,
                    dateEcheance: new Date(),
                    statut: 'EN_ATTENTE',
                }
            });
            alertesCreees++;
            console.log(`🏠 Alerte ESPACE_VACANT — ${espace.identifiant} — ${espace.site.nom}`);
        }
    }

    console.log(`✅ [CRON] Espaces vacants: ${alertesCreees} alertes créées`);
    return { espacesAnalyses: espacesVacants.length, alertesCreees };
});

espacesVacantsQueue.on('failed', (job, err) => {
    console.error(`❌ [CRON] espacesVacantsQueue job ${job.id} failed:`, err.message);
});
