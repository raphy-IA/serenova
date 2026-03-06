import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';

export const auditController = {
    // 1. Récupérer les logs d'audit configurables (SuperAdmin uniquement)
    async getAuditLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const skip = (page - 1) * limit;
            const { action, entityType, userId, organisationId } = req.query;

            const where: any = {};
            if (action) where.action = action;
            if (entityType) where.entityType = entityType;
            if (userId) where.userId = userId;
            if (organisationId) where.organisationId = organisationId;

            const logs = await prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { firstName: true, lastName: true, email: true, role: true } }
                }
            });

            const total = await prisma.auditLog.count({ where });

            res.status(200).json({
                status: 'success',
                data: logs,
                pagination: { total, page, limit, pages: Math.ceil(total / limit) }
            });
        } catch (error) { next(error); }
    }
};
