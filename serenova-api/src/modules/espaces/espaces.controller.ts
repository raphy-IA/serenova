import { Response, NextFunction } from 'express';
import { espacesService } from './espaces.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { CreateEspaceInput, UpdateEspaceInput } from './espaces.schema';

export const espacesController = {
    async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const siteId = String(req.params.siteId);
            const result = await espacesService.createEspace(siteId, userId, req.body as CreateEspaceInput);
            res.status(201).json({ status: 'success', message: 'Espace créé avec succès', data: result });
        } catch (error) { next(error); }
    },

    async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const siteId = String(req.params.siteId);
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const result = await espacesService.getEspacesBySite(siteId, userId, page, limit);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },

    async getAllGlobal(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const result = await espacesService.getAllEspaces(userId, {
                search: req.query.search as string | undefined,
                statut: req.query.statut as string | undefined,
                siteId: req.query.siteId as string | undefined,
                type: req.query.type as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 30,
            });
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },

    async getOne(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const id = String(req.params.id);
            const result = await espacesService.getEspaceById(id, userId);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },

    async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const id = String(req.params.id);
            const result = await espacesService.updateEspace(id, userId, req.body as UpdateEspaceInput);
            res.status(200).json({ status: 'success', message: 'Espace mis à jour', data: result });
        } catch (error) { next(error); }
    },

    async updateLoyer(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const id = String(req.params.id);
            const result = await espacesService.updateLoyer(id, userId, req.body);
            res.status(200).json({ status: 'success', message: 'Configuration loyer mise à jour', data: result });
        } catch (error) { next(error); }
    },

    async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const id = String(req.params.id);
            await espacesService.deleteEspace(id, userId);
            res.status(200).json({ status: 'success', message: 'Espace supprimé avec succès' });
        } catch (error) { next(error); }
    },
};
