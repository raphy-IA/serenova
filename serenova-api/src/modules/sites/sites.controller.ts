import { Response, NextFunction } from 'express';
import { sitesService } from './sites.service';
import { CreateSiteInput, UpdateSiteInput } from './sites.schema';
import { AuthRequest } from '../../middleware/auth.middleware';

export const sitesController = {
    async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await sitesService.createSite(req.user!.id, req.user!.organisationId, req.body as CreateSiteInput);
            res.status(201).json({
                status: 'success',
                message: 'Site créé avec succès',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await sitesService.getSitesByUser(req.user!.id, req.user!.role, req.user!.organisationId, page, limit);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async getOne(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const siteId = String(req.params.id);

            const result = await sitesService.getSiteById(siteId, req.user!.id, req.user!.role, req.user!.organisationId);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const siteId = String(req.params.id);

            const result = await sitesService.updateSite(siteId, req.user!.id, req.user!.role, req.user!.organisationId, req.body as UpdateSiteInput);
            res.status(200).json({
                status: 'success',
                message: 'Site mis à jour avec succès',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const siteId = String(req.params.id);

            await sitesService.deleteSite(siteId, userId, req.user!.role, req.user!.organisationId);
            res.status(200).json({
                status: 'success',
                message: 'Site désactivé avec succès',
            });
        } catch (error) {
            next(error);
        }
    },
};
