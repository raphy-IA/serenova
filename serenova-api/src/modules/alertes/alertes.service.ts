import { prisma } from '../../config/database';

export const alertesService = {
    async getAlertes(userId: string, userRole: string, organisationId: string | undefined, statut?: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const siteFilter: any = {};
        if (organisationId) { siteFilter.organisationId = organisationId; }
        if (!isSuperAdmin && !isAdminOrManager) { siteFilter.userId = userId; }

        const where = {
            ...(Object.keys(siteFilter).length > 0 && { bail: { espace: { site: siteFilter } } }),
            ...(statut && { statut: statut as any }),
        };
        const [alertes, total] = await Promise.all([
            prisma.alerte.findMany({
                where,
                skip,
                take: limit,
                orderBy: { dateEcheance: 'asc' },
                include: {
                    bail: {
                        include: {
                            locataire: { select: { nom: true, prenom: true, telephone: true, civilite: true } },
                            espace: { select: { identifiant: true, site: { select: { nom: true } } } }
                        }
                    }
                }
            }),
            prisma.alerte.count({ where }),
        ]);
        return { alertes, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    },

    async updateAlerteStatut(id: string, userId: string, userRole: string, organisationId: string | undefined, statut: 'RESOLUE' | 'IGNOREE') {
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const siteFilter: any = {};
        if (organisationId) { siteFilter.organisationId = organisationId; }
        if (!isSuperAdmin && !isAdminOrManager) { siteFilter.userId = userId; }

        const where: any = { id };
        if (Object.keys(siteFilter).length > 0) {
            where.bail = { espace: { site: siteFilter } };
        }

        const alerte = await prisma.alerte.findFirst({
            where
        });
        if (!alerte) throw { statusCode: 404, message: 'Alerte introuvable ou accès non autorisé.' };
        return prisma.alerte.update({ where: { id }, data: { statut } });
    },
};
