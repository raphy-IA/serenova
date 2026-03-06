import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import { alertService } from './alert.service';

export const alertsController = {
    // Get all active alerts for the current organisation
    async getMyAlerts(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const organisationId = req.user!.organisationId;

            const alerts = await prisma.alerte.findMany({
                where: {
                    organisationId: organisationId as string,
                    statut: { in: ['EN_ATTENTE', 'ENVOYEE'] } // Active alerts only
                },
                include: {
                    bail: {
                        include: {
                            locataire: true,
                            espace: { include: { site: true } }
                        }
                    }
                },
                orderBy: { dateEcheance: 'asc' }
            });

            res.json({ success: true, count: alerts.length, data: alerts });
        } catch (error) {
            next(error);
        }
    },

    // Acknowledge or dismiss an alert
    async updateAlertStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { statut } = req.body; // 'RESOLUE' or 'IGNOREE'
            const organisationId = req.user!.organisationId;

            const existing = await prisma.alerte.findFirst({
                where: { id: id as string, organisationId: organisationId as string }
            });

            const alert = await prisma.alerte.update({
                where: { id: id as string },
                data: { statut: statut as any }
            });

            res.json({ success: true, message: 'Statut de l\'alerte mis à jour.', data: alert });
        } catch (error) {
            next(error);
        }
    },

    // Manual trigger for the SuperAdmin or Cron Job testing
    async triggerScan(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (req.user!.role !== 'SUPER_ADMIN') throw { statusCode: 403, message: 'Accès non autorisé' };

            await alertService.runDailyChecks();

            res.json({ success: true, message: 'Scan journalier exécuté avec succès.' });
        } catch (error) {
            next(error);
        }
    }
};
