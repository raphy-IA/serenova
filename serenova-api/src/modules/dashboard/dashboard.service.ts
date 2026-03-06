import { prisma } from '../../config/database';
import { TypeAlerte, StatutAlerte, StatutEspace, StatutSite, StatutPaiement, TypePaiement } from '@prisma/client';

export const dashboardService = {
    // KPIs globaux pour tous les sites du gestionnaire
    async getKpisGlobaux(userId: string, userRole: string, organisationId: string | undefined) {
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const siteFilter: any = {};
        if (organisationId) { siteFilter.organisationId = organisationId; }
        if (!isSuperAdmin && !isAdminOrManager) { siteFilter.userId = userId; }

        console.log('[Dashboard] Fetching KPIs with siteFilter:', JSON.stringify(siteFilter));
        const [
            totalSites,
            totalEspaces,
            espaceOccupes,
            espacesLibres,
            bauxActifs,
            alertesEnAttente,
            impayesMsgs,
            dernieresAlertesData
        ] = await Promise.all([
            prisma.site.count({ where: { ...siteFilter, statut: StatutSite.ACTIF } }),
            prisma.espace.count({ where: { site: siteFilter } }),
            prisma.espace.count({ where: { site: siteFilter, statut: StatutEspace.OCCUPE } }),
            prisma.espace.count({ where: { site: siteFilter, statut: StatutEspace.LIBRE } }),
            prisma.bail.count({ where: { espace: { site: siteFilter }, statut: 'ACTIF' } }),
            prisma.alerte.count({ where: { bail: { espace: { site: siteFilter } }, statut: StatutAlerte.EN_ATTENTE } }),
            prisma.alerte.findMany({
                where: { bail: { espace: { site: siteFilter } }, type: TypeAlerte.IMPAYE, statut: StatutAlerte.EN_ATTENTE },
                include: {
                    bail: { select: { loyerMensuel: true } }
                }
            }),
            prisma.alerte.findMany({
                where: { bail: { espace: { site: siteFilter } }, statut: 'EN_ATTENTE' },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    bail: {
                        include: {
                            locataire: { select: { nom: true, prenom: true } },
                            espace: { select: { identifiant: true } }
                        }
                    }
                }
            })
        ]);
        console.log('[Dashboard] KPIs fetched successfully:', { totalSites, totalEspaces, bauxActifs });

        const tauxOccupation = totalEspaces > 0 ? Math.round((espaceOccupes / totalEspaces) * 100) : 0;

        // Revenus du mois en cours
        const debutMois = new Date();
        debutMois.setDate(1);
        debutMois.setHours(0, 0, 0, 0);

        const revenusMoisAggregate = await prisma.paiement.aggregate({
            where: {
                bail: { espace: { site: siteFilter } },
                typePaiement: { in: ['LOYER', 'AVANCE'] },
                statut: 'VALIDE',
                datePaiement: { gte: debutMois },
            },
            _sum: { montant: true },
        });

        // Loyers théoriques mensuels (somme de tous les loyers actifs)
        const loyerTheorique = await prisma.loyer.aggregate({
            where: { espace: { site: siteFilter, statut: 'OCCUPE' } },
            _sum: { montantBase: true },
        });

        const revenusMois = Number(revenusMoisAggregate._sum.montant ?? 0);
        const loyerTheoriqueMois = Number(loyerTheorique._sum.montantBase ?? 0);
        const tauxRecouvrement = loyerTheoriqueMois > 0 ? Math.round((revenusMois / loyerTheoriqueMois) * 100) : 0;

        const impayes = impayesMsgs.length;
        // Calculate total impayés from the bail's loyerMensuel directly
        const montantTotalImpayes = impayesMsgs.reduce((sum, alerte) => {
            return sum + Number(alerte.bail.loyerMensuel ?? 0);
        }, 0);

        return {
            patrimoine: {
                totalSites,
                totalEspaces,
                tauxOccupation,
                espaceOccupes,
                espacesLibres,
            },
            baux: {
                bauxActifs,
                alertesEnAttente,
                impayes,
                montantTotalImpayes,
                dernieresAlertes: dernieresAlertesData.map(a => {
                    let montantInfo = null;
                    if (a.type === 'IMPAYE' && a.message) {
                        try {
                            const parts = a.message.split(' — ');
                            if (parts.length >= 3 && parts[2]) {
                                const amountStr = parts[2].split(' ')[0];
                                montantInfo = Number(amountStr) || null;
                            }
                        } catch (e) {
                            console.warn('[Dashboard] Error parsing alert message:', a.message);
                        }
                    }
                    return {
                        id: a.id,
                        type: a.type,
                        message: a.message,
                        montant: montantInfo,
                        locataire: a.bail?.locataire ? `${a.bail.locataire.prenom || ''} ${a.bail.locataire.nom}`.trim() : 'N/A',
                        espace: a.bail?.espace?.identifiant || 'N/A',
                        bailId: a.bail?.id,
                        createdAt: a.createdAt
                    };
                })
            },
            finances: {
                revenusMois,
                loyerTheoriqueMois,
                tauxRecouvrement,
            },
        };
    },

    // KPIs Plateforme (Réservé au SUPER_ADMIN) - Vision globale inter-organisations
    async getKpisPlateforme() {
        const [
            totalOrganisations,
            totalSites,
            totalEspaces,
            totalUsers,
            revenusPlateforme,
            orgTypes,
            loyerTotal,
            espacesOccupes,
            totalSubscriptionsActives,
            plansPrices
        ] = await Promise.all([
            prisma.organisation.count(),
            prisma.site.count(),
            prisma.espace.count(),
            prisma.user.count(),
            prisma.paiement.aggregate({
                where: { statut: 'VALIDE', typePaiement: { in: ['LOYER', 'AVANCE'] } },
                _sum: { montant: true }
            }),
            prisma.organisation.groupBy({
                by: ['type'],
                _count: true
            }),
            prisma.bail.aggregate({
                where: { statut: 'ACTIF' },
                _sum: { loyerMensuel: true }
            }),
            prisma.espace.count({
                where: { statut: 'OCCUPE' }
            }),
            prisma.subscription.count({
                where: { statut: 'ACTIF' }
            }),
            prisma.subscription.findMany({
                where: { statut: 'ACTIF' },
                include: { plan: { select: { prix: true, periodicite: true } } }
            })
        ]);

        // Calcul du MRR SaaS (Revenu Mensuel Récurrent des abonnements SÉRÉNOVA)
        const mrrSaaS = plansPrices.reduce((sum, sub) => {
            if (!sub.plan) return sum;
            const prix = Number(sub.plan.prix);
            // Si le plan est annuel, on ramène le MRR au mois (prix / 12)
            return sum + (sub.plan.periodicite === 'ANNUEL' ? prix / 12 : prix);
        }, 0);

        const revenusPrevus = Number(revenusPlateforme._sum.montant ?? 0); // Flux financier des locataires
        const loyerTotalTheorique = Number(loyerTotal._sum.loyerMensuel ?? 0);
        const tauxRecouvrement = loyerTotalTheorique > 0 ? Math.round((revenusPrevus / loyerTotalTheorique) * 100) : 0;
        const tauxOccupation = totalEspaces > 0 ? Math.round((espacesOccupes / totalEspaces) * 100) : 0;

        // Dernières organisations créées
        const dernieresOrganisations = await prisma.organisation.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                _count: { select: { users: true, sites: true } }
            }
        });

        return {
            systeme: {
                totalOrganisations,
                totalSites,
                totalEspaces,
                totalUsers,
                revenusCumules: revenusPrevus,
                loyerTotalTheorique,
                tauxRecouvrement,
                tauxOccupation
            },
            saas: {
                mrr: Math.round(mrrSaaS),
                activeSubscriptions: totalSubscriptionsActives
            },
            repartition: orgTypes.reduce((acc: any, curr) => {
                acc[curr.type] = curr._count;
                return acc;
            }, {}),
            dernieresOrganisations: dernieresOrganisations.map(o => ({
                id: o.id,
                nom: o.nom,
                type: o.type,
                users: o._count.users,
                sites: o._count.sites,
                createdAt: o.createdAt
            }))
        };
    },


    // Dashboard détaillé pour un site spécifique
    async getDashboardSite(siteId: string, userId: string, userRole: string, organisationId: string | undefined) {
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const where: any = { id: siteId };
        if (organisationId) {
            where.organisationId = organisationId;
        }

        if (!isSuperAdmin && !isAdminOrManager) {
            where.userId = userId;
        }

        const site = await prisma.site.findFirst({
            where,
            include: {
                espaces: {
                    include: {
                        loyer: true,
                        baux: {
                            where: { statut: 'ACTIF' },
                            take: 1,
                            include: {
                                locataire: { select: { nom: true, prenom: true, telephone: true, civilite: true } },
                                paiements: { orderBy: { moisConcerne: 'desc' }, take: 1 },
                            }
                        }
                    },
                    orderBy: { identifiant: 'asc' }
                }
            }
        });
        if (!site) throw { statusCode: 404, message: 'Site introuvable ou accès non autorisé.' };

        // Calcul stats du site
        const totalEspaces = site.espaces.length;
        const occupes = site.espaces.filter(e => e.statut === 'OCCUPE').length;
        const libres = site.espaces.filter(e => e.statut === 'LIBRE').length;
        const tauxOccupation = totalEspaces > 0 ? Math.round((occupes / totalEspaces) * 100) : 0;
        const revenuMensuelPotentiel = site.espaces
            .filter(e => e.loyer)
            .reduce((sum, e) => sum + Number(e.loyer?.montantBase ?? 0) + Number(e.loyer?.charges ?? 0), 0);

        return {
            site: {
                id: site.id,
                nom: site.nom,
                adresse: site.adresse,
                ville: site.ville,
                type: site.type,
                statut: site.statut,
            },
            stats: {
                totalEspaces,
                occupes,
                libres,
                tauxOccupation,
                revenuMensuelPotentiel,
            },
            espaces: site.espaces.map(e => ({
                id: e.id,
                identifiant: e.identifiant,
                label: e.label,
                type: e.type,
                statut: e.statut,
                surface: e.surface,
                loyer: e.loyer ? {
                    montantBase: Number(e.loyer.montantBase),
                    charges: Number(e.loyer.charges),
                    devise: e.loyer.devise,
                } : null,
                bailActif: e.baux[0] ? {
                    id: e.baux[0].id,
                    dateEntree: e.baux[0].dateEntree,
                    dateFin: e.baux[0].dateFin,
                    locataire: e.baux[0].locataire,
                    dernierPaiement: e.baux[0].paiements[0] ?? null,
                } : null,
            })),
        };
    },

    // Évolution des revenus sur les 12 derniers mois
    async getEvolutionRevenus(userId: string, userRole: string, organisationId: string | undefined, mois = 12) {
        const result = [];
        const now = new Date();
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const siteFilter: any = {};
        if (organisationId) {
            siteFilter.organisationId = organisationId;
        }

        if (!isSuperAdmin && !isAdminOrManager) {
            siteFilter.userId = userId;
        }

        for (let i = mois - 1; i >= 0; i--) {
            const debut = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const fin = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const [loyers, cautions, impayes] = await Promise.all([
                prisma.paiement.aggregate({
                    where: {
                        bail: { espace: { site: siteFilter } },
                        typePaiement: 'LOYER',
                        statut: 'VALIDE',
                        datePaiement: { gte: debut, lt: fin },
                    },
                    _sum: { montant: true },
                    _count: true,
                }),
                prisma.paiement.aggregate({
                    where: {
                        bail: { espace: { site: siteFilter } },
                        typePaiement: 'CAUTION',
                        statut: 'VALIDE',
                        datePaiement: { gte: debut, lt: fin },
                    },
                    _sum: { montant: true },
                }),
                prisma.alerte.count({
                    where: {
                        bail: { espace: { site: siteFilter } },
                        type: 'IMPAYE',
                        createdAt: { gte: debut, lt: fin },
                    }
                }),
            ]);

            result.push({
                mois: `${debut.getFullYear()}-${String(debut.getMonth() + 1).padStart(2, '0')}`,
                loyers: Number(loyers._sum.montant ?? 0),
                cautions: Number(cautions._sum.montant ?? 0),
                nbPaiements: loyers._count,
                impayes,
            });
        }

        return result;
    },
};
