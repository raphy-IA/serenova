import { prisma } from '../../config/database';
import { CreateLocataireInput, UpdateLocataireInput } from './locataires.schema';

export const locatairesService = {
    async createLocataire(userId: string, organisationId: string | undefined, data: CreateLocataireInput) {
        return prisma.locataire.create({
            data: {
                userId,
                organisationId,
                civilite: data.civilite,
                nom: data.nom,
                prenom: data.prenom,
                raisonSociale: data.raisonSociale,
                dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
                nationalite: data.nationalite,
                pieceIdentite: data.pieceIdentite,
                numIdentite: data.numIdentite,
                telephone: data.telephone,
                telephoneSecondaire: data.telephoneSecondaire,
                email: data.email,
                employeur: data.employeur,
                revenus: data.revenus !== undefined ? data.revenus : undefined,
                garant: data.garant ?? undefined,
                documents: data.documents ?? [],
            },
        });
    },

    async getLocataires(userId: string, userRole: string, organisationId: string | undefined, page = 1, limit = 20, search?: string) {
        const skip = (page - 1) * limit;
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const where: any = {};

        // Filtrage par organisation (impersonnification ou appartenance)
        if (organisationId) {
            where.organisationId = organisationId;
        }

        // Restrictions pour les rôles subalternes (ne voient que leurs propres attributions)
        if (!isSuperAdmin && !isAdminOrManager) {
            where.OR = [
                { userId },
                {
                    baux: {
                        some: {
                            espace: { site: { userId } }
                        }
                    }
                }
            ];
        }

        // Recherche par nom, prénom ou téléphone
        if (search) {
            where.AND = [
                {
                    OR: [
                        { nom: { contains: search, mode: 'insensitive' as const } },
                        { prenom: { contains: search, mode: 'insensitive' as const } },
                        { telephone: { contains: search } },
                        { email: { contains: search, mode: 'insensitive' as const } },
                    ]
                }
            ];
        }

        const [locataires, total] = await Promise.all([
            prisma.locataire.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    baux: {
                        where: { statut: 'ACTIF' },
                        take: 1,
                        include: {
                            espace: { select: { identifiant: true, site: { select: { nom: true } } } }
                        }
                    },
                    _count: { select: { baux: true } }
                }
            }),
            prisma.locataire.count({ where }),
        ]);

        return { locataires, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    },

    async getLocataireById(id: string, userId: string, userRole: string, organisationId: string | undefined) {
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isAdminOrManager = ['ADMIN', 'GESTIONNAIRE'].includes(userRole);

        const where: any = { id };
        if (organisationId) {
            where.organisationId = organisationId;
        }

        if (!isSuperAdmin && !isAdminOrManager) {
            where.baux = { some: { espace: { site: { userId } } } };
        }

        const locataire = await prisma.locataire.findFirst({
            where,
            include: {
                baux: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        espace: {
                            include: {
                                site: { select: { id: true, nom: true } },
                                loyer: true
                            }
                        },
                        paiements: {
                            orderBy: { createdAt: 'desc' },
                            take: 5
                        }
                    }
                },
                _count: { select: { baux: true } }
            }
        });

        if (!locataire) throw { statusCode: 404, message: 'Locataire introuvable ou accès non autorisé.' };
        return locataire;
    },

    async updateLocataire(id: string, userId: string, userRole: string, organisationId: string | undefined, data: UpdateLocataireInput) {
        await this.getLocataireById(id, userId, userRole, organisationId);
        return prisma.locataire.update({
            where: { id },
            data: {
                civilite: data.civilite,
                nom: data.nom,
                prenom: data.prenom,
                raisonSociale: data.raisonSociale,
                dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
                nationalite: data.nationalite,
                pieceIdentite: data.pieceIdentite,
                numIdentite: data.numIdentite,
                telephone: data.telephone,
                telephoneSecondaire: data.telephoneSecondaire,
                email: data.email,
                employeur: data.employeur,
                revenus: data.revenus !== undefined ? data.revenus : undefined,
                garant: data.garant !== undefined ? data.garant : undefined,
                documents: data.documents,
            },
        });
    },

    async deleteLocataire(id: string, userId: string, userRole: string, organisationId: string | undefined) {
        const locataire = await this.getLocataireById(id, userId, userRole, organisationId);
        if (locataire._count.baux > 0) {
            throw { statusCode: 400, message: 'Impossible de supprimer un locataire ayant un historique de baux. Vous pouvez uniquement modifier ses informations.' };
        }
        return prisma.locataire.delete({ where: { id } });
    },
};
