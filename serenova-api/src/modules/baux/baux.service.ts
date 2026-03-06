import { prisma } from '../../config/database';
import { CreateBailInput, UpdateBailInput, ResilierBailInput } from './baux.schema';
import { notifyBailOwner } from '../../services/notifications.service';

export const bauxService = {
    async createBail(userId: string, userRole: string, organisationId: string | undefined, data: CreateBailInput) {
        // Vérifier l'appartenance de l'espace
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const where: any = { id: data.espaceId };
        if (!isSuperAdmin) {
            where.site = { organisationId };
            if (!isAdminOrManager) {
                where.site.userId = userId;
            }
        }

        const espace = await prisma.espace.findFirst({
            where,
            include: { loyer: true }
        });
        if (!espace) throw { statusCode: 404, message: 'Espace introuvable ou accès non autorisé.' };
        if (espace.statut === 'OCCUPE') throw { statusCode: 400, message: 'L\'espace est déjà occupé.' };

        const bail = await prisma.bail.create({
            data: {
                espaceId: data.espaceId,
                locataireId: data.locataireId,
                dateEntree: new Date(data.dateEntree),
                dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
                dureesMois: data.dureesMois,
                renouvellementAuto: data.renouvellementAuto ?? true,
                preivisMois: data.preivisMois ?? 1,
                montantCaution: data.montantCaution,
                cautionNombreMois: data.cautionNombreMois,
                loyerMensuel: data.loyerMensuel,
                nbMoisAvance: data.nbMoisAvance,
                statut: 'ACTIF',
            },
            include: {
                espace: { include: { loyer: true, site: { select: { id: true, nom: true } } } },
                locataire: { select: { id: true, nom: true, prenom: true, telephone: true, email: true } },
            }
        });

        // Marquer l'espace comme OCCUPE
        await prisma.espace.update({
            where: { id: data.espaceId },
            data: { statut: 'OCCUPE' }
        });

        // Créer automatiquement les alertes initiales
        await this._createAlertesBail(bail.id, bail.espace.loyer);

        // Notification push: Nouveau Bail
        await notifyBailOwner(bail.id, 'NOUVEAU_BAIL', {
            locataire: `${bail.locataire.nom} ${bail.locataire.prenom ?? ''}`,
            espace: bail.espace.identifiant,
            site: bail.espace.site.nom,
            dateEntree: bail.dateEntree.toLocaleDateString('fr-FR'),
            bailId: bail.id,
        });

        return bail;
    },

    async getBaux(userId: string, userRole: string, organisationId: string | undefined, page = 1, limit = 20, statut?: string, search?: string) {
        const skip = (page - 1) * limit;
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const siteFilter: any = {};
        if (organisationId) { siteFilter.organisationId = organisationId; }
        if (!isSuperAdmin && !isAdminOrManager) { siteFilter.userId = userId; }

        const where: any = {
            ...(Object.keys(siteFilter).length > 0 && { espace: { site: siteFilter } }),
            ...(statut && { statut: statut as any }),
            ...(search && {
                OR: [
                    { locataire: { nom: { contains: search, mode: 'insensitive' } } },
                    { locataire: { prenom: { contains: search, mode: 'insensitive' } } },
                    { numBail: { contains: search, mode: 'insensitive' } },
                    { espace: { identifiant: { contains: search, mode: 'insensitive' } } },
                    { espace: { site: { nom: { contains: search, mode: 'insensitive' } } } },
                ]
            }),
        };

        const [baux, total] = await Promise.all([
            prisma.bail.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    locataire: { select: { nom: true, prenom: true, telephone: true, civilite: true } },
                    espace: {
                        select: {
                            identifiant: true,
                            type: true,
                            loyer: { select: { montantBase: true, devise: true } },
                            site: { select: { nom: true } }
                        }
                    },
                    alertes: {
                        where: { statut: 'EN_ATTENTE' },
                        select: { type: true, message: true, dateEcheance: true }
                    },
                    _count: { select: { paiements: true, alertes: { where: { statut: 'EN_ATTENTE' } } } }
                }
            }),
            prisma.bail.count({ where }),
        ]);

        return { baux, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    },

    async getBailById(id: string, userId: string, userRole: string, organisationId: string | undefined) {
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const siteFilter: any = {};
        if (organisationId) { siteFilter.organisationId = organisationId; }
        if (!isSuperAdmin && !isAdminOrManager) { siteFilter.userId = userId; }

        const where: any = { id };
        if (Object.keys(siteFilter).length > 0) {
            where.espace = { site: siteFilter };
        }

        const bail = await prisma.bail.findFirst({
            where,
            include: {
                locataire: true,
                espace: {
                    include: {
                        loyer: true,
                        site: { select: { id: true, nom: true, adresse: true, ville: true } }
                    }
                },
                paiements: { orderBy: { moisConcerne: 'desc' }, take: 12 },
                alertes: { orderBy: { dateEcheance: 'asc' }, take: 10 },
                _count: { select: { paiements: true, alertes: true } }
            }
        });
        if (!bail) throw { statusCode: 404, message: 'Bail introuvable ou accès non autorisé.' };
        return bail;
    },

    async updateBail(id: string, userId: string, userRole: string, organisationId: string | undefined, data: UpdateBailInput) {
        await this.getBailById(id, userId, userRole, organisationId);
        return prisma.bail.update({
            where: { id },
            data: {
                dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
                dureesMois: data.dureesMois,
                renouvellementAuto: data.renouvellementAuto,
                preivisMois: data.preivisMois,
            },
        });
    },

    async resilierBail(id: string, userId: string, userRole: string, organisationId: string | undefined, data: ResilierBailInput) {
        const bail = await this.getBailById(id, userId, userRole, organisationId);
        if (bail.statut !== 'ACTIF') throw { statusCode: 400, message: 'Ce bail n\'est pas actif.' };

        const updated = await prisma.bail.update({
            where: { id },
            data: {
                statut: 'RESILIE',
                dateSortie: new Date(data.dateSortie),
                motifSortie: data.motifSortie,
            },
        });

        // Libérer l'espace
        await prisma.espace.update({
            where: { id: bail.espaceId },
            data: { statut: 'LIBRE' }
        });

        // Notification push: Bail résilié
        await notifyBailOwner(bail.id, 'BAIL_RESILIE', {
            locataire: `${bail.locataire.nom} ${bail.locataire.prenom ?? ''}`,
            espace: bail.espace.identifiant,
            dateSortie: updated.dateSortie!.toLocaleDateString('fr-FR'),
            motif: updated.motifSortie ?? 'Non précisé',
            bailId: bail.id,
        });

        return updated;
    },

    // Création automatique d'alertes à la création du bail
    async _createAlertesBail(bailId: string, loyer: any) {
        const alertes = [];
        if (loyer) {
            alertes.push({
                bailId,
                type: 'IMPAYE' as const,
                message: 'Vérification du paiement du loyer',
                dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // J+30
                statut: 'EN_ATTENTE' as const,
            });
        }
        if (alertes.length > 0) {
            await prisma.alerte.createMany({ data: alertes });
        }
    },

    async annulerBail(id: string, userId: string, userRole: string, organisationId: string | undefined) {
        const bail = await this.getBailById(id, userId, userRole, organisationId);
        if (bail.statut === 'RESILIE' || bail.statut === 'EXPIRE') {
            throw { statusCode: 400, message: 'Impossible d\'annuler un bail déjà terminé.' };
        }

        const updated = await prisma.bail.update({
            where: { id },
            data: { statut: 'ANNULE' }
        });

        // Libérer l'espace
        await prisma.espace.update({
            where: { id: bail.espaceId },
            data: { statut: 'LIBRE' }
        });

        return updated;
    },

    async suspendreBail(id: string, userId: string, userRole: string, organisationId: string | undefined) {
        const bail = await this.getBailById(id, userId, userRole, organisationId);
        if (bail.statut !== 'ACTIF') throw { statusCode: 400, message: 'Seul un bail actif peut être suspendu.' };

        return prisma.bail.update({
            where: { id },
            data: { statut: 'SUSPENDU' }
        });
    },

    async planifierEvolution(id: string, userId: string, userRole: string, organisationId: string | undefined, data: { nouveauLoyerMensuel: number, dateEffet: string }) {
        await this.getBailById(id, userId, userRole, organisationId);

        return prisma.evolutionBail.create({
            data: {
                bailId: id,
                nouveauLoyerMensuel: data.nouveauLoyerMensuel,
                dateEffet: new Date(data.dateEffet),
            }
        });
    },

    async deleteBail(id: string, userId: string, userRole: string, organisationId: string | undefined) {
        const bail = await this.getBailById(id, userId, userRole, organisationId);

        // INTERDICTION de supprimer si des paiements existent
        if (bail._count.paiements > 0) {
            throw { statusCode: 400, message: 'Impossible de supprimer un bail ayant un historique de paiements. Utilisez l\'annulation ou la résiliation.' };
        }

        // Pendant la suppression (si autorisée), on libère l'espace si le bail était actif
        if (bail.statut === 'ACTIF') {
            await prisma.espace.update({
                where: { id: bail.espaceId },
                data: { statut: 'LIBRE' }
            });
        }

        // Supprimer les dépendances (alertes, evolutions)
        await prisma.alerte.deleteMany({ where: { bailId: id } });
        await prisma.evolutionBail.deleteMany({ where: { bailId: id } });

        return prisma.bail.delete({ where: { id } });
    }
};
