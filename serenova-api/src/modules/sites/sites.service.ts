import { prisma } from '../../config/database';
import { StatutSite } from '@prisma/client';
import { CreateSiteInput, UpdateSiteInput } from './sites.schema';

export const sitesService = {
    async createSite(userId: string, organisationId: string | undefined, data: CreateSiteInput) {
        const site = await prisma.site.create({
            data: {
                userId,
                organisationId,
                nom: data.nom,
                type: data.type,
                adresse: data.adresse,
                ville: data.ville,
                codePostal: data.codePostal,
                pays: data.pays ?? 'France',
                latitude: data.latitude,
                longitude: data.longitude,
                nbEspaces: data.nbEspaces,
                anneeConstruction: data.anneeConstruction,
                surface: data.surface,
                nbEtages: data.nbEtages,
                ascenseur: data.ascenseur ?? false,
                parking: data.parking ?? false,
                statut: data.statut ?? 'ACTIF',
                description: data.description,
                gestionnaire: data.gestionnaire,
                assuranceCompagnie: data.assuranceCompagnie,
                assuranceRef: data.assuranceRef,
                assuranceExpiration: data.assuranceExpiration ? new Date(data.assuranceExpiration) : undefined,
                equipements: data.equipements ?? [],
                photos: data.photos ?? [],
            },
            include: {
                _count: { select: { espaces: true } }
            }
        });
        return site;
    },

    async getSitesByUser(userId: string, userRole: string, organisationId: string | undefined, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const where: any = { statut: StatutSite.ACTIF };

        // L'extension Prisma s'occupe de l'isolation par organisationId
        // si elle est présente dans le contexte.

        // Si ce n'est pas un admin, il ne voit que ses propres sites
        if (!isSuperAdmin && !isAdminOrManager) {
            where.userId = userId;
        }

        const [sites, total] = await Promise.all([
            prisma.site.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { espaces: true }
                    }
                }
            }),
            prisma.site.count({ where }),
        ]);

        return {
            sites,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async getSiteById(id: string, userId: string, userRole: string, organisationId: string | undefined) {
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const where: any = { id };

        // L'extension Prisma s'occupe de l'organisationId

        if (!isSuperAdmin && !isAdminOrManager) {
            where.userId = userId;
        }

        const site = await prisma.site.findFirst({
            where,
            include: {
                espaces: {
                    include: { loyer: true },
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: { espaces: true }
                }
            }
        });

        if (!site) {
            throw { statusCode: 404, message: 'Site introuvable ou accès non autorisé.' };
        }

        return site;
    },

    async updateSite(id: string, userId: string, userRole: string, organisationId: string | undefined, data: UpdateSiteInput) {
        // Vérifier l'existence et l'appartenance
        await this.getSiteById(id, userId, userRole, organisationId);

        const updatedSite = await prisma.site.update({
            where: { id },
            data: {
                ...data,
                assuranceExpiration: data.assuranceExpiration ? new Date(data.assuranceExpiration) : undefined,
            },
        });

        return updatedSite;
    },

    async deleteSite(id: string, userId: string, userRole: string, organisationId: string | undefined) {
        // Vérifier l'existence et l'appartenance
        await this.getSiteById(id, userId, userRole, organisationId);

        // Au lieu de supprimer physiquement, on masque (soft delete) en général,
        // mais pour respecter le strict CDC on fait un update statuts
        // Ou si souhaité, on peut physiquement supprimer avec delete()
        // Je choisis la suppression physique selon un comportement REST classique
        // s'il n'y a pas d'espaces attachés. Sinon il faut supprimer en cascade (Prisma le gère selon le schema, 
        // mais ici pas de onCascade défini explicitement, donc ça pourrait planter s'il y a des enfants).
        // On va modifier le statut pour "INACTIF" en approche safe.

        const deletedSite = await prisma.site.update({
            where: { id },
            data: { statut: 'INACTIF' }
        });

        return deletedSite;
    },
};
