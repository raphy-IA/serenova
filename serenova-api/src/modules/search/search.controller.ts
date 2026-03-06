import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth.middleware';

export const searchController = {
    async globalSearch(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const query = String(req.query.q || '').trim();
            if (query.length < 2) {
                return res.status(200).json({ status: 'success', data: [] });
            }

            // L'isolation par organisationId est automatique via l'extension Prisma !

            const [sites, locataires, baux] = await Promise.all([
                prisma.site.findMany({
                    where: { nom: { contains: query, mode: 'insensitive' } },
                    take: 5
                }),
                prisma.locataire.findMany({
                    where: {
                        OR: [
                            { nom: { contains: query, mode: 'insensitive' } },
                            { prenom: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } }
                        ]
                    },
                    take: 5
                }),
                prisma.bail.findMany({
                    where: {
                        OR: [
                            { locataire: { nom: { contains: query, mode: 'insensitive' } } },
                            { espace: { identifiant: { contains: query, mode: 'insensitive' } } }
                        ]
                    },
                    include: { locataire: true, espace: true },
                    take: 5
                })
            ]);

            const results = [
                ...sites.map(s => ({ id: s.id, type: 'SITE', title: s.nom, subtitle: s.adresse, link: `/sites/${s.id}` })),
                ...locataires.map(l => ({ id: l.id, type: 'LOCATAIRE', title: `${l.prenom} ${l.nom}`, subtitle: l.email, link: `/locataires/${l.id}` })),
                ...baux.map(b => ({ id: b.id, type: 'BAIL', title: `Bail ${b.locataire.nom}`, subtitle: b.espace.identifiant, link: `/baux/${b.id}` }))
            ];

            res.status(200).json({ status: 'success', data: results });
        } catch (error) {
            next(error);
        }
    }
};
