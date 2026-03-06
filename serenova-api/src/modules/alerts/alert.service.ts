import { prisma } from '../../config/database';

export const alertService = {
    /**
     * Scan leases that expire within the next 30 days and create BAIL_EXPIRANT alerts
     */
    async checkExpiringLeases() {
        console.log('[AlertService] Checking for expiring leases...');
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);

        const expiringBaux = await prisma.bail.findMany({
            where: {
                statut: 'ACTIF',
                dateFin: {
                    lte: in30Days,
                    gte: new Date(), // Has not completely expired yet
                }
            },
            include: { espace: true, locataire: true }
        });

        for (const bail of expiringBaux) {
            // Check if alert already exists to prevent duplication
            const existingAlert = await prisma.alerte.findFirst({
                where: {
                    bailId: bail.id,
                    type: 'BAIL_EXPIRANT',
                    statut: { in: ['EN_ATTENTE', 'ENVOYEE'] }
                }
            });

            if (!existingAlert) {
                await prisma.alerte.create({
                    data: {
                        bailId: bail.id,
                        organisationId: bail.organisationId,
                        type: 'BAIL_EXPIRANT',
                        message: `Le bail de ${bail.locataire.nom} pour l'espace ${bail.espace.identifiant} expire le ${bail.dateFin!.toLocaleDateString('fr-FR')}.`,
                        dateEcheance: bail.dateFin!,
                        statut: 'EN_ATTENTE'
                    }
                });
                console.log(`[AlertService] Created BAIL_EXPIRANT alert for bail ${bail.id}`);
            }
        }
    },

    /**
     * Scan for unpaid rents based on 'Loyer' terms
     * Simplified logic: If we are past the 'jourEcheance' + 'delaiGrace' of the current month
     * and there is no 'VALIDE' paiement registered for this month's rent.
     */
    async checkOverduePayments() {
        console.log('[AlertService] Checking for overdue payments (impayés)...');
        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const activeBaux = await prisma.bail.findMany({
            where: { statut: 'ACTIF' },
            include: { espace: { include: { loyer: true } }, locataire: true }
        });

        for (const bail of activeBaux) {
            const loyer = bail.espace.loyer;
            if (!loyer) continue;

            // Calculate limit day
            const limitDay = loyer.jourEcheance + loyer.delaiGrace;
            if (today.getDate() > limitDay) {
                // Check if a payment exists for this month
                const paymentThisMonth = await prisma.paiement.findFirst({
                    where: {
                        bailId: bail.id,
                        typePaiement: 'LOYER',
                        statut: 'VALIDE',
                        moisConcerne: {
                            gte: currentMonthStart,
                            lt: new Date(today.getFullYear(), today.getMonth() + 1, 1)
                        }
                    }
                });

                if (!paymentThisMonth) {
                    // Check if alert already exists
                    const existingAlert = await prisma.alerte.findFirst({
                        where: {
                            bailId: bail.id,
                            type: 'IMPAYE',
                            statut: { in: ['EN_ATTENTE', 'ENVOYEE'] },
                            // Ensure we don't spam if they already have an unresolved impayé alert for this period
                            createdAt: { gte: currentMonthStart }
                        }
                    });

                    if (!existingAlert) {
                        const dueDate = new Date(today.getFullYear(), today.getMonth(), loyer.jourEcheance);
                        await prisma.alerte.create({
                            data: {
                                bailId: bail.id,
                                organisationId: bail.organisationId,
                                type: 'IMPAYE',
                                message: `Retard de paiement détecté pour ${bail.locataire.nom} (${bail.espace.identifiant}). Loyer dû le ${dueDate.toLocaleDateString('fr-FR')}.`,
                                dateEcheance: dueDate,
                                statut: 'EN_ATTENTE'
                            }
                        });
                        console.log(`[AlertService] Created IMPAYE alert for bail ${bail.id}`);
                    }
                }
            }
        }
    },

    /**
     * Runs all background checks
     */
    async runDailyChecks() {
        try {
            await this.checkExpiringLeases();
            await this.checkOverduePayments();
        } catch (error) {
            console.error('[AlertService] Error running daily checks:', error);
        }
    }
};
