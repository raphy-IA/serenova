import { prisma } from '../../config/database';
import { CreatePaiementInput } from './paiements.schema';
import { notifyBailOwner } from '../../services/notifications.service';

export const paiementsService = {
    async createPaiement(userId: string, userRole: string, organisationId: string | undefined, data: CreatePaiementInput) {
        // Vérifier que le bail appartient à l'organisation
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const bailFilter: any = { id: data.bailId };
        if (!isSuperAdmin) {
            bailFilter.espace = { site: { organisationId } };
            if (!isAdminOrManager) {
                bailFilter.espace.site.userId = userId;
            }
        }

        const bail = await prisma.bail.findFirst({
            where: bailFilter,
            include: { espace: { include: { loyer: true } } }
        });
        if (!bail) throw { statusCode: 404, message: 'Bail introuvable ou accès non autorisé.' };
        if (bail.statut !== 'ACTIF') throw { statusCode: 400, message: 'Ce bail n\'est pas actif.' };

        const paiement = await prisma.paiement.create({
            data: {
                bailId: data.bailId,
                typePaiement: data.typePaiement,
                moisConcerne: data.moisConcerne ? new Date(data.moisConcerne) : undefined,
                montant: data.montant,
                datePaiement: new Date(data.datePaiement),
                modePaiement: data.modePaiement,
                reference: data.reference,
                notes: data.notes,
                statut: 'VALIDE',
            },
            include: {
                bail: {
                    include: {
                        locataire: { select: { nom: true, prenom: true } },
                        espace: { select: { identifiant: true, site: { select: { nom: true } } } }
                    }
                }
            }
        });

        // Si c'est un paiement de loyer, résoudre les alertes d'impayé du mois concerné
        if (data.typePaiement === 'LOYER' && data.moisConcerne) {
            await prisma.alerte.updateMany({
                where: {
                    bailId: data.bailId,
                    type: 'IMPAYE',
                    statut: 'EN_ATTENTE',
                },
                data: { statut: 'RESOLUE' }
            });
        }

        // Notification push: Paiement reçu
        await notifyBailOwner(data.bailId, 'PAIEMENT_RECU', {
            locataire: `${paiement.bail.locataire.nom} ${paiement.bail.locataire.prenom ?? ''}`,
            montant: data.montant.toString(),
            devise: 'XOF', // TODO: utiliser devise du loyer si possible
            mois: data.moisConcerne ? `${new Date(data.moisConcerne).getMonth() + 1}/${new Date(data.moisConcerne).getFullYear()}` : 'Non spécifié',
            paiementId: paiement.id,
        });

        return paiement;
    },

    async getPaiements(userId: string, userRole: string, organisationId: string | undefined, bailId?: string, mois?: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        // Parse le filtre de mois...
        let moisFilter: { gte: Date; lt: Date } | undefined;
        // ... (logique inchangée) ...
        if (mois && /^\d{4}-\d{2}$/.test(mois)) {
            const [year, month] = mois.split('-').map(Number);
            moisFilter = {
                gte: new Date(year, month - 1, 1),
                lt: new Date(year, month, 1),
            };
        }

        const siteFilter: any = {};
        if (organisationId) { siteFilter.organisationId = organisationId; }
        if (!isSuperAdmin && !isAdminOrManager) { siteFilter.userId = userId; }

        const where: any = {
            ...(Object.keys(siteFilter).length > 0 && { bail: { espace: { site: siteFilter } } }),
            ...(bailId && { bailId }),
            ...(moisFilter && { moisConcerne: moisFilter }),
        };

        const [paiements, total] = await Promise.all([
            prisma.paiement.findMany({
                where,
                skip,
                take: limit,
                orderBy: { datePaiement: 'desc' },
                include: {
                    bail: {
                        include: {
                            locataire: { select: { nom: true, prenom: true, civilite: true } },
                            espace: { select: { identifiant: true, site: { select: { nom: true } } } }
                        }
                    }
                }
            }),
            prisma.paiement.count({ where }),
        ]);

        return { paiements, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    },

    async getPaiementById(id: string, userId: string, userRole: string, organisationId: string | undefined) {
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const siteFilter: any = {};
        if (organisationId) { siteFilter.organisationId = organisationId; }
        if (!isSuperAdmin && !isAdminOrManager) { siteFilter.userId = userId; }

        const where: any = { id };
        if (Object.keys(siteFilter).length > 0) {
            where.bail = { espace: { site: siteFilter } };
        }
        const paiement = await prisma.paiement.findFirst({
            where,
            include: {
                bail: {
                    include: {
                        locataire: true,
                        espace: {
                            include: {
                                loyer: true,
                                site: { select: { nom: true, adresse: true, ville: true } }
                            }
                        }
                    }
                }
            }
        });
        if (!paiement) throw { statusCode: 404, message: 'Paiement introuvable ou accès non autorisé.' };
        return paiement;
    },

    async annulerPaiement(id: string, userId: string, userRole: string, organisationId: string | undefined) {
        const paiement = await this.getPaiementById(id, userId, userRole, organisationId);
        if (paiement.statut === 'ANNULE') throw { statusCode: 400, message: 'Ce paiement est déjà annulé.' };

        return prisma.paiement.update({
            where: { id },
            data: { statut: 'ANNULE' }
        });
    },

    // Données pour génération de quittance PDF (utilisées par pdf.service.ts)
    async getQuittanceData(id: string, userId: string, userRole: string, organisationId: string | undefined) {
        return this.getPaiementById(id, userId, userRole, organisationId);
    },

    async getBailBalance(bailId: string, userId: string, userRole: string, organisationId: string | undefined) {
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const siteFilter: any = {};
        if (organisationId) { siteFilter.organisationId = organisationId; }
        if (!isSuperAdmin && !isAdminOrManager) { siteFilter.userId = userId; }

        const where: any = { id: bailId };
        if (Object.keys(siteFilter).length > 0) {
            where.espace = { site: siteFilter };
        }

        const bail = await prisma.bail.findFirst({
            where,
            include: {
                paiements: { where: { statut: 'VALIDE' } },
                evolutions: { where: { applique: true } },
                espace: { include: { loyer: true } }
            }
        });

        if (!bail) throw { statusCode: 404, message: 'Bail introuvable.' };

        const now = new Date();
        const start = new Date(bail.dateEntree);
        start.setDate(1); // Normaliser au début du mois
        start.setHours(0, 0, 0, 0);

        const end = new Date(now);
        end.setDate(1);
        end.setHours(0, 0, 0, 0);

        // 1. Calcul Caution
        const montantCautionDu = Number(bail.montantCaution || 0);
        const montantCautionPaye = bail.paiements
            .filter(p => p.typePaiement === 'CAUTION')
            .reduce((sum, p) => sum + Number(p.montant), 0);

        const cautionPending = Math.max(0, montantCautionDu - montantCautionPaye);

        // 2. Calcul Loyers par mois
        const unpaidMonths = [];
        let current = new Date(start);

        while (current <= end) {
            const monthStr = current.toISOString();

            // Trouver le loyer applicable à ce mois (évolution)
            let loyerDu = Number(bail.loyerMensuel || bail.espace.loyer?.montantBase || 0);
            const evolutionApplicable = bail.evolutions
                .filter(e => new Date(e.dateEffet) <= current)
                .sort((a, b) => new Date(b.dateEffet).getTime() - new Date(a.dateEffet).getTime())[0];

            if (evolutionApplicable) {
                loyerDu = Number(evolutionApplicable.nouveauLoyerMensuel);
            }

            const payeCeMois = bail.paiements
                .filter(p => p.typePaiement === 'LOYER' && p.moisConcerne && new Date(p.moisConcerne).getTime() === current.getTime())
                .reduce((sum, p) => sum + Number(p.montant), 0);

            if (payeCeMois < loyerDu) {
                unpaidMonths.push({
                    month: new Date(current),
                    due: loyerDu,
                    paid: payeCeMois,
                    pending: loyerDu - payeCeMois
                });
            }

            current.setMonth(current.getMonth() + 1);
        }

        const totalPendingRents = unpaidMonths.reduce((sum, m) => sum + m.pending, 0);

        return {
            cautionPending,
            unpaidMonths,
            totalPending: cautionPending + totalPendingRents,
            devise: bail.espace.loyer?.devise || 'FCFA'
        };
    },

    async processSmartPayment(userId: string, userRole: string, organisationId: string | undefined, data: any) {
        const { bailId, montant, datePaiement, modePaiement, reference, notes } = data;

        let balance = await this.getBailBalance(bailId, userId, userRole, organisationId);
        let amountRemaining = Number(montant);
        const createdPaiements = [];

        // 1. Payer la caution en priorité
        if (balance.cautionPending > 0 && amountRemaining > 0) {
            const amountForCaution = Math.min(amountRemaining, balance.cautionPending);
            const p = await prisma.paiement.create({
                data: {
                    bailId,
                    typePaiement: 'CAUTION',
                    montant: amountForCaution,
                    datePaiement: new Date(datePaiement),
                    modePaiement,
                    reference: reference ? `${reference} (Caution)` : undefined,
                    notes,
                    statut: 'VALIDE'
                }
            });
            createdPaiements.push(p);
            amountRemaining -= amountForCaution;
        }

        // 2. Payer les loyers en retard (du plus ancien au plus récent)
        for (const month of balance.unpaidMonths) {
            if (amountRemaining <= 0) break;

            const amountForMonth = Math.min(amountRemaining, month.pending);
            const p = await prisma.paiement.create({
                data: {
                    bailId,
                    typePaiement: 'LOYER',
                    moisConcerne: month.month,
                    montant: amountForMonth,
                    datePaiement: new Date(datePaiement),
                    modePaiement,
                    reference: reference ? `${reference} (Loyer ${month.month.getMonth() + 1}/${month.month.getFullYear()})` : undefined,
                    notes,
                    statut: 'VALIDE'
                }
            });
            createdPaiements.push(p);
            amountRemaining -= amountForMonth;

            // Résoudre les alertes si le mois est maintenant soldé
            if (month.paid + amountForMonth >= month.due) {
                await prisma.alerte.updateMany({
                    where: {
                        bailId,
                        type: 'IMPAYE',
                        statut: 'EN_ATTENTE',
                        dateEcheance: {
                            gte: new Date(month.month.getFullYear(), month.month.getMonth(), 1),
                            lt: new Date(month.month.getFullYear(), month.month.getMonth() + 1, 1)
                        }
                    },
                    data: { statut: 'RESOLUE' }
                });
            }
        }

        // 3. S'il reste de l'argent, c'est une avance
        if (amountRemaining > 0) {
            const p = await prisma.paiement.create({
                data: {
                    bailId,
                    typePaiement: 'AVANCE',
                    montant: amountRemaining,
                    datePaiement: new Date(datePaiement),
                    modePaiement,
                    reference,
                    notes: notes ? `${notes} (Surplus)` : 'Paiement par avance',
                    statut: 'VALIDE'
                }
            });
            createdPaiements.push(p);
        }

        return {
            success: true,
            count: createdPaiements.length,
            totalProcessed: montant,
            paiements: createdPaiements
        };
    },

    async getTresorerieStats(userId: string, userRole: string, organisationId: string | undefined, annee?: number) {
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);
        const year = annee || new Date().getFullYear();

        const siteFilter: any = {};
        if (organisationId) {
            siteFilter.organisationId = organisationId;
        }

        if (!isSuperAdmin && !isAdminOrManager) {
            siteFilter.userId = userId;
        }

        const whereFilter: any = {
            bail: { espace: { site: siteFilter } }
        };

        // Si on a un organisationId, on peut filtrer directement sur organisationId si le modèle le supporte
        // Mais pour la cohérence avec le reste, on passe par la relation site

        // Période de l'année sélectionnée
        const debutAnnee = new Date(year, 0, 1);
        const finAnnee = new Date(year, 11, 31, 23, 59, 59);

        const [
            // Total encaissé sur l'année (paiements VALIDES)
            totalEncaisse,
            // Total annulé
            totalAnnule,
            // Loyers en attente (alertes IMPAYE actives)
            alertesImpayes,
            // Tous les paiements de l'année pour la ventilation mensuelle
            paiementsAnnee,
        ] = await Promise.all([
            prisma.paiement.aggregate({
                where: {
                    ...whereFilter,
                    statut: 'VALIDE',
                    datePaiement: { gte: debutAnnee, lte: finAnnee },
                },
                _sum: { montant: true },
                _count: true,
            }),
            prisma.paiement.aggregate({
                where: {
                    ...whereFilter,
                    statut: 'ANNULE',
                    datePaiement: { gte: debutAnnee, lte: finAnnee },
                },
                _sum: { montant: true },
                _count: true,
            }),
            prisma.alerte.findMany({
                where: {
                    ...whereFilter,
                    type: 'IMPAYE',
                    statut: 'EN_ATTENTE',
                },
                include: { bail: { select: { loyerMensuel: true } } }
            }),
            prisma.paiement.findMany({
                where: {
                    ...whereFilter,
                    statut: 'VALIDE',
                    datePaiement: { gte: debutAnnee, lte: finAnnee },
                },
                select: {
                    montant: true,
                    datePaiement: true,
                    typePaiement: true,
                    modePaiement: true,
                }
            }),
        ]);

        // Ventilation mensuelle (12 mois)
        const ventilationMensuelle = Array.from({ length: 12 }, (_, i) => {
            const moisPaiements = paiementsAnnee.filter(p => {
                const d = new Date(p.datePaiement);
                return d.getFullYear() === year && d.getMonth() === i;
            });
            return {
                mois: i + 1,
                label: new Date(year, i, 1).toLocaleDateString('fr-FR', { month: 'short' }),
                total: moisPaiements.reduce((s, p) => s + Number(p.montant), 0),
                loyers: moisPaiements.filter(p => p.typePaiement === 'LOYER').reduce((s, p) => s + Number(p.montant), 0),
                cautions: moisPaiements.filter(p => p.typePaiement === 'CAUTION').reduce((s, p) => s + Number(p.montant), 0),
                avances: moisPaiements.filter(p => p.typePaiement === 'AVANCE').reduce((s, p) => s + Number(p.montant), 0),
            };
        });

        // Ventilation par mode de paiement
        const parMode: Record<string, number> = {};
        for (const p of paiementsAnnee) {
            parMode[p.modePaiement] = (parMode[p.modePaiement] || 0) + Number(p.montant);
        }

        // Montant total impayé
        const montantTotalImpayes = alertesImpayes.reduce((sum, a) => sum + Number(a.bail.loyerMensuel || 0), 0);

        return {
            annee: year,
            kpis: {
                totalEncaisse: Number(totalEncaisse._sum.montant || 0),
                nombreTransactions: totalEncaisse._count,
                totalAnnule: Number(totalAnnule._sum.montant || 0),
                nombreAnnules: totalAnnule._count,
                montantImpayes: montantTotalImpayes,
                nombreImpayes: alertesImpayes.length,
            },
            ventilationMensuelle,
            parMode,
        };
    },
};
