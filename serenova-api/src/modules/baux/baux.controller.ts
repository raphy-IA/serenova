import { Response, NextFunction } from 'express';
import { bauxService } from './baux.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { CreateBailInput, UpdateBailInput, ResilierBailInput } from './baux.schema';

export const bauxController = {
    async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await bauxService.createBail(req.user!.id, req.user!.role, req.user!.organisationId, req.body as CreateBailInput);
            res.status(201).json({ status: 'success', message: 'Bail créé avec succès', data: result });
        } catch (error) { next(error); }
    },

    async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const statut = req.query.statut as string | undefined;
            const search = req.query.search as string | undefined;
            const result = await bauxService.getBaux(req.user!.id, req.user!.role, req.user!.organisationId, page, limit, statut, search);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },

    async getOne(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await bauxService.getBailById(String(req.params.id), req.user!.id, req.user!.role, req.user!.organisationId);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },

    async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await bauxService.updateBail(String(req.params.id), req.user!.id, req.user!.role, req.user!.organisationId, req.body as UpdateBailInput);
            res.status(200).json({ status: 'success', message: 'Bail mis à jour', data: result });
        } catch (error) { next(error); }
    },

    async resilier(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await bauxService.resilierBail(String(req.params.id), req.user!.id, req.user!.role, req.user!.organisationId, req.body as ResilierBailInput);
            res.status(200).json({ status: 'success', message: 'Bail résilié avec succès', data: result });
        } catch (error) { next(error); }
    },

    async annuler(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await bauxService.annulerBail(String(req.params.id), req.user!.id, req.user!.role, req.user!.organisationId);
            res.status(200).json({ status: 'success', message: 'Bail annulé avec succès', data: result });
        } catch (error) { next(error); }
    },

    async suspendre(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await bauxService.suspendreBail(String(req.params.id), req.user!.id, req.user!.role, req.user!.organisationId);
            res.status(200).json({ status: 'success', message: 'Bail suspendu avec succès', data: result });
        } catch (error) { next(error); }
    },

    async planifierEvolution(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await bauxService.planifierEvolution(String(req.params.id), req.user!.id, req.user!.role, req.user!.organisationId, req.body);
            res.status(200).json({ status: 'success', message: 'Évolution planifiée avec succès', data: result });
        } catch (error) { next(error); }
    },

    async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = String(req.params.id);
            await bauxService.deleteBail(id, req.user!.id, req.user!.role, req.user!.organisationId);
            res.status(200).json({ status: 'success', message: 'Bail supprimé avec succès' });
        } catch (error) { next(error); }
    },
};
