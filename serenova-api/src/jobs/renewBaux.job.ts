import Bull from 'bull';
import { prisma } from '../config/database';
import { redisConfig } from '../config/redis';
import { notifyBailOwner } from '../services/notifications.service';

// -----------------------------------------------------------------------
// JOB: Renouvellement automatique des baux
// Cron quotidien à 05h00 — pour les baux avec renouvellementAuto=true
// dont la dateFin est passée ce jour ou hier, on renouvelle le cycle :
//   • Nouvelle dateEntree = ancienne dateFin
//   • Nouvelle dateFin    = dateEntree + dureesMois
// Si une évolution de loyer est en attente à cette date, on l'applique.
// -----------------------------------------------------------------------
export const renewBauxQueue = new Bull('renew-baux', { redis: redisConfig });

renewBauxQueue.process(async () => {
    console.log('🔁 [CRON] Renouvellement des baux automatiques...');

    const maintenant = new Date();
    const debutJour = new Date(maintenant);
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date(maintenant);
    finJour.setHours(23, 59, 59, 999);

    // Trouver les baux actifs avec renouvellementAuto=true dont la dateFin est aujourd'hui ou passée
    const bauxARenouveler = await prisma.bail.findMany({
        where: {
            statut: 'ACTIF',
            renouvellementAuto: true,
            dateFin: { lte: finJour },
            dureesMois: { gt: 0 },
        },
        include: {
            locataire: { select: { nom: true, prenom: true } },
            espace: {
                select: {
                    identifiant: true,
                    site: { select: { nom: true } }
                }
            },
            evolutions: {
                where: { applique: false },
                orderBy: { dateEffet: 'asc' },
                take: 1,
            }
        }
    });

    let renouvellements = 0;

    for (const bail of bauxARenouveler) {
        try {
            const ancienneDateFin = bail.dateFin!;
            const nouvelleDateEntree = ancienneDateFin;
            const duree = bail.dureesMois ?? 12;

            // Calculer la nouvelle dateFin
            const nouvelleDateFin = new Date(nouvelleDateEntree);
            nouvelleDateFin.setMonth(nouvelleDateFin.getMonth() + duree);

            // Appliquer l'évolution de loyer si elle existe
            const evolution = bail.evolutions[0];
            const nouveauLoyer = evolution
                ? Number(evolution.nouveauLoyerMensuel)
                : Number(bail.loyerMensuel);

            // Mettre à jour le bail avec les nouvelles dates et le nouveau loyer
            await prisma.bail.update({
                where: { id: bail.id },
                data: {
                    dateEntree: nouvelleDateEntree,
                    dateFin: nouvelleDateFin,
                    loyerMensuel: nouveauLoyer,
                }
            });

            // Marquer l'évolution comme appliquée si elle existe
            if (evolution) {
                await prisma.evolutionBail.update({
                    where: { id: evolution.id },
                    data: { applique: true }
                });
                console.log(`  📈 Évolution appliquée: ${bail.loyerMensuel} → ${nouveauLoyer} FCFA`);
            }

            // Créer une alerte informative de renouvellement
            await prisma.alerte.create({
                data: {
                    bailId: bail.id,
                    type: 'BAIL_EXPIRANT',
                    message: `Bail renouvelé automatiquement — ${bail.locataire.nom} — Nouveau cycle: ${nouvelleDateEntree.toLocaleDateString('fr-FR')} → ${nouvelleDateFin.toLocaleDateString('fr-FR')}`,
                    dateEcheance: nouvelleDateFin,
                    statut: 'EN_ATTENTE',
                }
            });

            // Notification push
            await notifyBailOwner(bail.id, 'BAIL_RENOUVELE', {
                locataire: `${bail.locataire.nom} ${bail.locataire.prenom ?? ''}`,
                espace: bail.espace.identifiant,
                site: bail.espace.site.nom,
                dateEntree: nouvelleDateEntree.toLocaleDateString('fr-FR'),
                dateFin: nouvelleDateFin.toLocaleDateString('fr-FR'),
                loyer: nouveauLoyer.toLocaleString(),
                bailId: bail.id,
            });

            renouvellements++;
            console.log(`✅ Bail ${bail.id} renouvelé: ${nouvelleDateEntree.toLocaleDateString('fr-FR')} → ${nouvelleDateFin.toLocaleDateString('fr-FR')} (${duree} mois)`);
        } catch (err) {
            console.error(`❌ Erreur renouvellement du bail ${bail.id}:`, err);
        }
    }

    console.log(`✅ [CRON] Renouvellements: ${renouvellements} baux renouvelés`);
    return { renouvellements };
});

renewBauxQueue.on('failed', (job, err) => {
    console.error(`❌ [CRON] renewBauxQueue job ${job.id} failed:`, err.message);
});
