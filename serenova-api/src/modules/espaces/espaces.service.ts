import { prisma } from '../../config/database';
import { CreateEspaceInput, UpdateEspaceInput } from './espaces.schema';

type LoyerInput = NonNullable<CreateEspaceInput['loyer']>;

export const espacesService = {
    async createEspace(siteId: string, userId: string, data: CreateEspaceInput) {
        const site = await prisma.site.findFirst({ where: { id: siteId, userId } });
        if (!site) throw { statusCode: 404, message: 'Site introuvable ou accès non autorisé.' };

        const espace = await prisma.espace.create({
            data: {
                siteId,
                identifiant: data.identifiant,
                label: data.label,
                type: data.type,
                etage: data.etage,
                numeroPorce: data.numeroPorce,
                surface: data.surface,
                surfaceTotale: data.surfaceTotale,
                nbPieces: data.nbPieces,
                nbChambres: data.nbChambres,
                nbSallesBain: data.nbSallesBain,
                cuisine: data.cuisine,
                balcon: data.balcon ?? false,
                exposition: data.exposition,
                chauffage: data.chauffage,
                meuble: data.meuble ?? 'NON_MEUBLE',
                etatGeneral: data.etatGeneral ?? 'BON',
                statut: data.statut ?? 'LIBRE',
                equipements: data.equipements ?? [],
                photos: data.photos ?? [],
                ...(data.loyer && {
                    loyer: {
                        create: {
                            montantBase: data.loyer.montantBase,
                            charges: data.loyer.charges ?? 0,
                            typeCharges: data.loyer.typeCharges ?? 'INCLUSES',
                            caution: data.loyer.caution,
                            moisAvance: data.loyer.moisAvance ?? 1,
                            devise: data.loyer.devise ?? 'EUR',
                            periodicite: data.loyer.periodicite ?? 'MENSUELLE',
                            jourEcheance: data.loyer.jourEcheance ?? 5,
                            indexation: data.loyer.indexation ?? false,
                            indexIndice: data.loyer.indexIndice,
                            indexPourcentage: data.loyer.indexPourcentage,
                            delaiGrace: data.loyer.delaiGrace ?? 5,
                            typePenalite: data.loyer.typePenalite ?? 'AUCUNE',
                            penaliteTaux: data.loyer.penaliteTaux,
                            penaliteMontant: data.loyer.penaliteMontant,
                        }
                    }
                }),
            },
            include: { loyer: true }
        });

        await prisma.site.update({
            where: { id: siteId },
            data: { nbEspaces: { increment: 1 } }
        });

        return espace;
    },

    async getEspacesBySite(siteId: string, userId: string, page = 1, limit = 20) {
        const site = await prisma.site.findFirst({ where: { id: siteId, userId } });
        if (!site) throw { statusCode: 404, message: 'Site introuvable ou accès non autorisé.' };

        const skip = (page - 1) * limit;
        const [espaces, total] = await Promise.all([
            prisma.espace.findMany({
                where: { siteId },
                skip,
                take: limit,
                orderBy: { identifiant: 'asc' },
                include: {
                    loyer: true,
                    _count: { select: { baux: true } }
                }
            }),
            prisma.espace.count({ where: { siteId } }),
        ]);

        return { espaces, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    },

    async getAllEspaces(userId: string, opts: { search?: string; statut?: string; siteId?: string; type?: string; page?: number; limit?: number } = {}) {
        const { search, statut, siteId, type, page = 1, limit = 30 } = opts;
        const skip = (page - 1) * limit;

        const where: any = { site: { userId } };
        if (statut) where.statut = statut;
        if (siteId) where.siteId = siteId;
        if (type) where.type = type;
        if (search) {
            where.OR = [
                { identifiant: { contains: search, mode: 'insensitive' } },
                { label: { contains: search, mode: 'insensitive' } },
                { site: { nom: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [espaces, total] = await Promise.all([
            prisma.espace.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ site: { nom: 'asc' } }, { identifiant: 'asc' }],
                include: {
                    loyer: true,
                    site: { select: { id: true, nom: true, ville: true } },
                    baux: {
                        where: { statut: 'ACTIF' },
                        take: 1,
                        include: {
                            locataire: { select: { id: true, nom: true, prenom: true } }
                        }
                    },
                    _count: { select: { baux: true } }
                }
            }),
            prisma.espace.count({ where }),
        ]);

        return { espaces, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    },

    async getEspaceById(id: string, userId: string) {
        const espace = await prisma.espace.findFirst({
            where: { id, site: { userId } },
            include: {
                loyer: true,
                site: { select: { id: true, nom: true, userId: true } },
                baux: {
                    orderBy: { dateEntree: 'desc' },
                    include: {
                        locataire: { select: { id: true, nom: true, prenom: true, telephone: true } }
                    }
                },
                _count: { select: { baux: true } }
            }
        });
        if (!espace) throw { statusCode: 404, message: 'Espace introuvable ou accès non autorisé.' };
        return espace;
    },

    async updateEspace(id: string, userId: string, data: UpdateEspaceInput) {
        await this.getEspaceById(id, userId);
        return prisma.espace.update({
            where: { id },
            data: {
                identifiant: data.identifiant,
                label: data.label,
                type: data.type,
                etage: data.etage,
                numeroPorce: data.numeroPorce,
                surface: data.surface,
                surfaceTotale: data.surfaceTotale,
                nbPieces: data.nbPieces,
                nbChambres: data.nbChambres,
                nbSallesBain: data.nbSallesBain,
                cuisine: data.cuisine,
                balcon: data.balcon,
                exposition: data.exposition,
                chauffage: data.chauffage,
                meuble: data.meuble,
                etatGeneral: data.etatGeneral,
                statut: data.statut,
                equipements: data.equipements,
                photos: data.photos,
            },
            include: { loyer: true }
        });
    },

    async updateLoyer(espaceId: string, userId: string, loyerData: LoyerInput) {
        await this.getEspaceById(espaceId, userId);
        return prisma.loyer.upsert({
            where: { espaceId },
            update: {
                montantBase: loyerData.montantBase,
                charges: loyerData.charges ?? 0,
                typeCharges: loyerData.typeCharges ?? 'INCLUSES',
                caution: loyerData.caution,
                moisAvance: loyerData.moisAvance ?? 1,
                devise: loyerData.devise ?? 'EUR',
                periodicite: loyerData.periodicite ?? 'MENSUELLE',
                jourEcheance: loyerData.jourEcheance ?? 5,
                indexation: loyerData.indexation ?? false,
                indexIndice: loyerData.indexIndice,
                indexPourcentage: loyerData.indexPourcentage,
                delaiGrace: loyerData.delaiGrace ?? 5,
                typePenalite: loyerData.typePenalite ?? 'AUCUNE',
                penaliteTaux: loyerData.penaliteTaux,
                penaliteMontant: loyerData.penaliteMontant,
            },
            create: {
                espaceId,
                montantBase: loyerData.montantBase,
                charges: loyerData.charges ?? 0,
                typeCharges: loyerData.typeCharges ?? 'INCLUSES',
                caution: loyerData.caution,
                moisAvance: loyerData.moisAvance ?? 1,
                devise: loyerData.devise ?? 'EUR',
                periodicite: loyerData.periodicite ?? 'MENSUELLE',
                jourEcheance: loyerData.jourEcheance ?? 5,
                indexation: loyerData.indexation ?? false,
                indexIndice: loyerData.indexIndice,
                delaiGrace: loyerData.delaiGrace ?? 5,
                typePenalite: loyerData.typePenalite ?? 'AUCUNE',
            }
        });
    },

    async deleteEspace(id: string, userId: string) {
        const espace = await this.getEspaceById(id, userId);
        if (espace._count.baux > 0) {
            throw { statusCode: 400, message: 'Impossible de supprimer un espace ayant un historique de baux.' };
        }

        // Supprimer le loyer associé s'il existe
        await prisma.loyer.deleteMany({ where: { espaceId: id } });

        await prisma.espace.delete({ where: { id } });
        await prisma.site.update({
            where: { id: espace.siteId },
            data: { nbEspaces: { decrement: 1 } }
        });
        return { deleted: true };
    },
};
