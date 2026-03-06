import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AuditLogger } from '../../utils/audit.logger';

const subscriptionSchema = z.object({
    planId: z.string().min(1),
    statut: z.enum(['ACTIF', 'SUSPENDU', 'EXPIRE', 'RESILIE']),
    autoRenouvellement: z.boolean().optional(),
});

export const updateOrganisationSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user!.role !== 'SUPER_ADMIN') {
            throw { statusCode: 403, message: 'Seul le Super Administrateur peut modifier les abonnements.' };
        }

        const organisationId = String(req.params.id);
        const validatedData = subscriptionSchema.parse(req.body);

        // Verify plan exists
        const plan = await prisma.plan.findUnique({ where: { id: validatedData.planId } });
        if (!plan) throw { statusCode: 404, message: 'Plan introuvable.' };

        // Check for existing subscription
        let oldSubscription = await prisma.subscription.findUnique({
            where: { organisationId },
            include: { plan: true }
        });

        let subscription;

        if (oldSubscription) {
            subscription = await prisma.subscription.update({
                where: { organisationId },
                data: validatedData,
                include: { plan: true }
            });
        } else {
            subscription = await prisma.subscription.create({
                data: {
                    organisationId,
                    ...validatedData,
                },
                include: { plan: true }
            });
        }

        await AuditLogger.log({
            userId: req.user?.id,
            action: oldSubscription ? 'UPDATE_SUBSCRIPTION' : 'CREATE_SUBSCRIPTION',
            entityType: 'Subscription',
            entityId: subscription.id,
            oldValue: oldSubscription,
            newValue: subscription
        });

        res.status(200).json({ status: 'success', message: 'Abonnement mis à jour', data: subscription });
    } catch (error) { next(error); }
};

export const getAllSubscriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user!.role !== 'SUPER_ADMIN') {
            throw { statusCode: 403, message: 'Accès réservé au Super Administrateur.' };
        }

        const subscriptions = await prisma.subscription.findMany({
            include: {
                organisation: {
                    select: { id: true, nom: true, type: true, email: true, statut: true, createdAt: true }
                },
                plan: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ status: 'success', data: subscriptions });
    } catch (error) { next(error); }
};

