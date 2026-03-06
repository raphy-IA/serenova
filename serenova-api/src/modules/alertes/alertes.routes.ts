import { Router, Response, NextFunction } from 'express';
import { alertesService } from './alertes.service';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { alerteIdSchema } from './alertes.schema';

const router = Router();
router.use(authMiddleware as any);

const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const statut = req.query.statut as string | undefined;
        const result = await alertesService.getAlertes(req.user!.id, req.user!.role, req.user!.organisationId, statut, page, limit);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
};

const resoudre = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const result = await alertesService.updateAlerteStatut(String(req.params.id), req.user!.id, req.user!.role, req.user!.organisationId, 'RESOLUE');
        res.status(200).json({ status: 'success', message: 'Alerte résolue', data: result });
    } catch (error) { next(error); }
};

const ignorer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const result = await alertesService.updateAlerteStatut(String(req.params.id), req.user!.id, req.user!.role, req.user!.organisationId, 'IGNOREE');
        res.status(200).json({ status: 'success', message: 'Alerte ignorée', data: result });
    } catch (error) { next(error); }
};

router.get('/', getAll as any);
router.put('/:id/resoudre', validateRequest(alerteIdSchema), resoudre as any);
router.put('/:id/ignorer', validateRequest(alerteIdSchema), ignorer as any);

export default router;
