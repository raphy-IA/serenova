import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from './auth.middleware';

type LimitType = 'sites' | 'baux' | 'users';

export const planGuard = (resource: LimitType) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // SuperAdmins bypass limits
            if (req.user?.role === 'SUPER_ADMIN') {
                return next();
            }

            const organisationId = req.user?.organisationId;
            if (!organisationId) {
                return res.status(403).json({ status: 'error', message: 'Utilisateur non rattaché à une organisation.' });
            }

            // Get current subscription and limits
            const subscription = await prisma.subscription.findUnique({
                where: { organisationId },
                include: { plan: true }
            });

            if (!subscription) {
                return res.status(403).json({ status: 'error', message: "Aucun abonnement actif pour cette organisation." });
            }

            if (subscription.statut !== 'ACTIF') {
                return res.status(403).json({ status: 'error', message: `Votre abonnement est actuellement ${subscription.statut.toLowerCase()}.` });
            }

            const limites = subscription.plan.limites as { sites?: number; baux?: number; users?: number };
            const limitValue = limites[resource];

            // If no limit defined or limit is exactly 9999 (Enterprise unlimited flag)
            if (limitValue === undefined || limitValue >= 9999) {
                return next();
            }

            // Count current usage
            let currentCount = 0;
            switch (resource) {
                case 'sites':
                    currentCount = await prisma.site.count({ where: { organisationId } });
                    break;
                case 'baux':
                    currentCount = await prisma.bail.count({ where: { organisationId } });
                    break;
                case 'users':
                    currentCount = await prisma.user.count({ where: { organisationId } });
                    break;
            }

            if (currentCount >= limitValue) {
                return res.status(403).json({
                    status: 'error',
                    message: `Limite atteinte. Votre plan "${subscription.plan.nom}" permet un maximum de ${limitValue} ${resource}. Veuillez passer au plan supérieur.`
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
