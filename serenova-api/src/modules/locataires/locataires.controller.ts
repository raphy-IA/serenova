import { Response, NextFunction } from 'express';
import { locatairesService } from './locataires.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { CreateLocataireInput, UpdateLocataireInput } from './locataires.schema';

export const locatairesController = {
    async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await locatairesService.createLocataire(req.user!.id, req.user!.organisationId, req.body as CreateLocataireInput);
            res.status(201).json({ status: 'success', message: 'Locataire créé avec succès', data: result });
        } catch (error) { next(error); }
    },

    async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.search as string | undefined;
            const result = await locatairesService.getLocataires(req.user!.id, req.user!.role, req.user!.organisationId, page, limit, search);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },

    async getOne(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = String(req.params.id);
            const result = await locatairesService.getLocataireById(id, req.user!.id, req.user!.role, req.user!.organisationId);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },

    async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = String(req.params.id);
            const result = await locatairesService.updateLocataire(id, req.user!.id, req.user!.role, req.user!.organisationId, req.body as UpdateLocataireInput);
            res.status(200).json({ status: 'success', message: 'Locataire mis à jour', data: result });
        } catch (error) { next(error); }
    },

    async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = String(req.params.id);
            await locatairesService.deleteLocataire(id, req.user!.id, req.user!.role, req.user!.organisationId);
            res.status(200).json({ status: 'success', message: 'Locataire supprimé avec succès' });
        } catch (error) { next(error); }
    },
};
