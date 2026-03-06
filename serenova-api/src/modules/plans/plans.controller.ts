import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AuditLogger } from '../../utils/audit.logger';

const planSchema = z.object({
    nom: z.string().min(2),
    prix: z.number().min(0),
    periodicite: z.enum(['MENSUEL', 'ANNUEL']),
    limites: z.object({
        sites: z.number().min(1),
        baux: z.number().min(1),
        users: z.number().min(1),
    }),
});

export const getPlans = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const plans = await prisma.plan.findMany({
            orderBy: { prix: 'asc' },
            include: {
                _count: {
                    select: { subscriptions: true }
                }
            }
        });
        res.status(200).json({ status: 'success', data: plans });
    } catch (error) { next(error); }
};

export const getPlanById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = String(req.params.id);
        const plan = await prisma.plan.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { subscriptions: true }
                }
            }
        });
        if (!plan) throw { statusCode: 404, message: 'Plan introuvable' };
        res.status(200).json({ status: 'success', data: plan });
    } catch (error) { next(error); }
};

export const createPlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const validatedData = planSchema.parse(req.body);

        const plan = await prisma.plan.create({
            data: validatedData,
        });

        await AuditLogger.log({
            userId: req.user?.id,
            action: 'CREATE_PLAN',
            entityType: 'Plan',
            entityId: plan.id,
            newValue: plan,
        });

        res.status(201).json({ status: 'success', data: plan });
    } catch (error) { next(error); }
};

export const updatePlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = String(req.params.id);
        const validatedData = planSchema.partial().parse(req.body);

        const oldPlan = await prisma.plan.findUnique({ where: { id } });
        if (!oldPlan) throw { statusCode: 404, message: 'Plan introuvable' };

        const plan = await prisma.plan.update({
            where: { id },
            data: validatedData,
        });

        await AuditLogger.log({
            userId: req.user?.id,
            action: 'UPDATE_PLAN',
            entityType: 'Plan',
            entityId: plan.id,
            oldValue: oldPlan,
            newValue: plan,
        });

        res.status(200).json({ status: 'success', data: plan });
    } catch (error) { next(error); }
};

export const deletePlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = String(req.params.id);

        const count = await prisma.subscription.count({ where: { planId: id } });
        if (count > 0) {
            throw { statusCode: 400, message: "Impossible de supprimer ce plan car des organisations y sont abonnées." };
        }

        const deletedPlan = await prisma.plan.delete({ where: { id } });

        await AuditLogger.log({
            userId: req.user?.id,
            action: 'DELETE_PLAN',
            entityType: 'Plan',
            entityId: id,
            oldValue: deletedPlan,
        });

        res.status(200).json({ status: 'success', message: 'Plan supprimé avec succès.' });
    } catch (error) { next(error); }
};
