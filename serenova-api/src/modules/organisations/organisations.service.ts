import { prisma } from '../../config/database';

export const organisationsService = {
    async createOrganisation(data: { nom: string, type: 'SOCIETE' | 'INDIVIDU', email?: string, telephone?: string, adresse?: string, ville?: string, planId?: string }) {
        const createData: any = {
            nom: data.nom,
            type: data.type,
            email: data.email,
            telephone: data.telephone,
            adresse: data.adresse,
            ville: data.ville,
            statut: 'ACTIF'
        };

        if (data.planId) {
            createData.subscription = {
                create: {
                    planId: data.planId,
                    statut: 'ACTIF',
                    autoRenouvellement: true
                }
            };
        }

        return prisma.organisation.create({
            data: createData,
            include: { subscription: { include: { plan: true } } }
        });
    },

    async getOrganisations(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [organisations, total] = await Promise.all([
            prisma.organisation.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            users: true,
                            sites: true,
                            locataires: true
                        }
                    },
                    subscription: {
                        include: { plan: true }
                    }
                }
            }),
            prisma.organisation.count()
        ]);
        return { organisations, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    },
    async getOrganisationById(id: string) {
        const organisation = await prisma.organisation.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                },
                _count: {
                    select: {
                        sites: true,
                        locataires: true
                    }
                },
                subscription: {
                    include: { plan: true }
                }
            }
        });

        if (!organisation) throw { statusCode: 404, message: 'Organisation introuvable.' };

        // Adapter les utilisateurs pour le frontend (fusionner nom/prénom)
        const formattedUsers = organisation.users.map(u => ({
            id: u.id,
            nom: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            email: u.email,
            role: u.role
        }));

        return { ...organisation, users: formattedUsers };
    },

    async updateOrganisation(id: string, data: any) {
        return prisma.organisation.update({
            where: { id },
            data: {
                ...data,
            }
        });
    }
};
