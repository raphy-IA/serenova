import Bull from 'bull';
import { prisma } from '../config/database';
import { redisConfig } from '../config/redis';
import { notifyBailOwner } from '../services/notifications.service';

// -----------------------------------------------------------------------
// JOB: Vérification des baux expirants
// Cron quotidien — crée des alertes à 60j, 30j, 7j avant la fin du bail
// TypeAlerte: BAIL_EXPIRANT (valeur Prisma)
// -----------------------------------------------------------------------
export const bauxExpirantsQueue = new Bull('baux-expirants', { redis: redisConfig });

const SEUILS_JOURS = [60, 30, 7];

bauxExpirantsQueue.process(async (job) => {
    console.log('🔍 [CRON] Vérification des baux expirants...');

    const maintenant = new Date();
    let alertesCreees = 0;

    for (const seuilJours of SEUILS_JOURS) {
        const dateCible = new Date(maintenant);
        dateCible.setDate(dateCible.getDate() + seuilJours);
        const debut = new Date(dateCible);
        debut.setHours(0, 0, 0, 0);
        const fin = new Date(dateCible);
        fin.setHours(23, 59, 59, 999);

        const bauxExpirants = await prisma.bail.findMany({
            where: {
                statut: 'ACTIF',
                dateFin: { gte: debut, lte: fin }
            },
            include: {
                locataire: { select: { nom: true, prenom: true } },
                espace: {
                    select: {
                        id: true,
                        identifiant: true,
                        site: { select: { nom: true } }
                    }
                },
                alertes: {
                    where: {
                        type: 'BAIL_EXPIRANT',
                        message: { contains: `${seuilJours}j` },
                        statut: 'EN_ATTENTE'
                    }
                }
            }
        });

        for (const bail of bauxExpirants) {
            if (bail.alertes.length > 0) continue;

            await prisma.alerte.create({
                data: {
                    bailId: bail.id,
                    organisationId: bail.organisationId,
                    type: 'BAIL_EXPIRANT',
                    message: `Bail expirant dans ${seuilJours}j — ${bail.locataire.nom} ${bail.locataire.prenom ?? ''} — ${bail.espace.site.nom}`,
                    dateEcheance: bail.dateFin!,
                    statut: 'EN_ATTENTE',
                }
            });
            alertesCreees++;
            console.log(`📅 Alerte BAIL_EXPIRANT (${seuilJours}j) — Bail ${bail.id}`);

            // Notification push au gestionnaire
            await notifyBailOwner(bail.id, 'BAIL_EXPIRANT', {
                locataire: `${bail.locataire.nom} ${bail.locataire.prenom ?? ''}`,
                jours: seuilJours.toString(),
                dateFin: bail.dateFin!.toLocaleDateString('fr-FR'),
                bailId: bail.id,
            });
        }
    }

    console.log(`✅ [CRON] Baux expirants: ${alertesCreees} alertes créées`);
    return { alertesCreees };
});

bauxExpirantsQueue.on('failed', (job, err) => {
    console.error(`❌ [CRON] bauxExpirantsQueue job ${job.id} failed:`, err.message);
});
