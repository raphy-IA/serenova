import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth.middleware';
import { saasConfigSchema } from './saas-config.schema';
import { AuditLogger } from '../../utils/audit.logger';

export const saasConfigController = {
    async getConfig(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (req.user!.role !== 'SUPER_ADMIN') {
                throw { statusCode: 403, message: 'Accès réservé au Super Administrateur.' };
            }

            let config = await (prisma as any).saasConfig.findFirst();

            if (!config) {
                config = await (prisma as any).saasConfig.create({ data: {} });
            }

            // Exclude secret keys partially for display, but here we return all for the admin form
            res.status(200).json({ status: 'success', data: config });
        } catch (error) {
            next(error);
        }
    },

    async updateConfig(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (req.user!.role !== 'SUPER_ADMIN') {
                throw { statusCode: 403, message: 'Accès réservé au Super Administrateur.' };
            }

            const validatedData = saasConfigSchema.parse(req.body);

            let config = await (prisma as any).saasConfig.findFirst();
            let updatedConfig;

            if (!config) {
                updatedConfig = await (prisma as any).saasConfig.create({
                    data: {
                        ...validatedData,
                        updatedById: req.user!.id
                    }
                });
            } else {
                updatedConfig = await (prisma as any).saasConfig.update({
                    where: { id: config.id },
                    data: {
                        ...validatedData,
                        updatedById: req.user!.id
                    }
                });
            }

            await AuditLogger.log({
                userId: req.user!.id,
                action: 'UPDATE_SAAS_CONFIG',
                entityType: 'SaaSConfig',
                entityId: updatedConfig.id,
                newValue: updatedConfig
            });

            res.status(200).json({ status: 'success', message: 'Configuration enregistrée', data: updatedConfig });
        } catch (error) {
            next(error);
        }
    }
};
