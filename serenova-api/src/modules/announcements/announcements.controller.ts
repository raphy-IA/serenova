import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';

export const announcementsController = {
    // 1. Récupérer toutes les annonces (SuperAdmin uniquement)
    async getAllAnnouncements(req: Request, res: Response, next: NextFunction) {
        try {
            const announcements = await prisma.announcement.findMany({
                orderBy: { createdAt: 'desc' }
            });
            res.status(200).json({ status: 'success', data: announcements });
        } catch (error) { next(error); }
    },

    // 2. Récupérer uniquement les annonces actives (Public/Utilisateurs connectés)
    async getActiveAnnouncements(req: Request, res: Response, next: NextFunction) {
        try {
            const activeAnnouncements = await prisma.announcement.findMany({
                where: { actif: true },
                orderBy: { createdAt: 'desc' },
                take: 3 // On limite à 3 pour ne pas surcharger l'UI
            });
            res.status(200).json({ status: 'success', data: activeAnnouncements });
        } catch (error) { next(error); }
    },

    // 3. Créer une annonce (SuperAdmin)
    async createAnnouncement(req: Request, res: Response, next: NextFunction) {
        try {
            const { titre, message, type, actif } = req.body;

            const newAnnouncement = await prisma.announcement.create({
                data: { titre, message, type, actif }
            });

            res.status(201).json({ status: 'success', data: newAnnouncement });
        } catch (error) { next(error); }
    },

    // 4. Mettre à jour une annonce (SuperAdmin)
    async updateAnnouncement(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const { titre, message, type, actif } = req.body;

            const existingAnnouncement = await prisma.announcement.findUnique({ where: { id } });
            if (!existingAnnouncement) {
                return res.status(404).json({ status: 'error', message: 'Annonce introuvable' });
            }

            const updatedAnnouncement = await prisma.announcement.update({
                where: { id },
                data: { titre, message, type, actif }
            });

            res.status(200).json({ status: 'success', data: updatedAnnouncement });
        } catch (error) { next(error); }
    },

    // 5. Supprimer une annonce (SuperAdmin)
    async deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;

            const existingAnnouncement = await prisma.announcement.findUnique({ where: { id } });
            if (!existingAnnouncement) {
                return res.status(404).json({ status: 'error', message: 'Annonce introuvable' });
            }

            await prisma.announcement.delete({ where: { id } });

            res.status(200).json({ status: 'success', message: 'Annonce supprimée avec succès' });
        } catch (error) { next(error); }
    }
};
