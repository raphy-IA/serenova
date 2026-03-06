import Bull from 'bull';
import { prisma } from '../config/database';
import { redisConfig } from '../config/redis';
import { notifyBailOwner } from '../services/notifications.service';

// -----------------------------------------------------------------------
// JOB: Vérification des impayés
// Cron toutes les heures — détecte les baux actifs dont les locataires
// n'ont pas payé leur loyer dans les délais contractuels + délai de grâce.
// -----------------------------------------------------------------------
export const impayesQueue = new Bull('impayes', { redis: redisConfig });

impayesQueue.process(async (job) => {
    console.log('🔍 [CRON] Vérification des impayés...');

    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

    const bauxActifs = await prisma.bail.findMany({
        where: { statut: 'ACTIF' },
        include: {
            espace: {
                include: {
                    loyer: true,
                    site: { select: { userId: true, nom: true } }
                }
            },
            locataire: { select: { nom: true, prenom: true } },
            paiements: {
                where: {
                    typePaiement: 'LOYER',
                    statut: 'VALIDE',
                    moisConcerne: { gte: debutMois }
                }
            },
            alertes: {
                where: {
                    type: 'IMPAYE',
                    statut: 'EN_ATTENTE',
                    dateEcheance: { gte: debutMois }
                }
            }
        }
    });

    let alertesCreees = 0;

    for (const bail of bauxActifs) {
        if (!bail.espace.loyer) continue;

        const jourEcheance = bail.espace.loyer.jourEcheance ?? 5;
        const delaiGrace = bail.espace.loyer.delaiGrace ?? 5;
        const joursDepuisDebut = maintenant.getDate();
        const delaiDepasse = joursDepuisDebut > jourEcheance + delaiGrace;
        const aPaye = bail.paiements.length > 0;
        const alerteExistante = bail.alertes.length > 0;

        if (delaiDepasse && !aPaye && !alerteExistante) {
            const montantDu = Number(bail.loyerMensuel || 0) + Number(bail.espace.loyer?.charges ?? 0);
            await prisma.alerte.create({
                data: {
                    bailId: bail.id,
                    organisationId: bail.organisationId,
                    type: 'IMPAYE',
                    message: `Loyer impayé — ${bail.locataire.nom} ${bail.locataire.prenom ?? ''} — ${montantDu} ${bail.espace.loyer.devise} attendu le ${jourEcheance}/${maintenant.getMonth() + 1}/${maintenant.getFullYear()}`,
                    dateEcheance: new Date(maintenant.getFullYear(), maintenant.getMonth(), jourEcheance),
                    statut: 'EN_ATTENTE',
                }
            });
            alertesCreees++;
            console.log(`⚠️  Alerte impayé — Bail ${bail.id} — ${bail.locataire.nom}`);

            // Notification push au propriétaire du bail
            await notifyBailOwner(bail.id, 'IMPAYE', {
                locataire: `${bail.locataire.nom} ${bail.locataire.prenom ?? ''}`,
                montant: montantDu.toString(),
                devise: bail.espace.loyer.devise,
                date: `${jourEcheance}/${maintenant.getMonth() + 1}/${maintenant.getFullYear()}`,
                bailId: bail.id,
            });
        }
    }

    console.log(`✅ [CRON] Impayés: ${alertesCreees}/${bauxActifs.length} alertes créées`);
    return { bauxAnalyses: bauxActifs.length, alertesCreees };
});

impayesQueue.on('failed', (job, err) => {
    console.error(`❌ [CRON] impayesQueue job ${job.id} failed:`, err.message);
});
