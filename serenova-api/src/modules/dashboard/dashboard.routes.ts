import { Router, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { authMiddleware, AuthRequest, roleMiddleware } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware as any);

const getKpisPlateforme = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const result = await dashboardService.getKpisPlateforme();
        res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
};


const getKpis = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const result = await dashboardService.getKpisGlobaux(req.user!.id, req.user!.role, req.user!.organisationId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
};

const getDashboardSite = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const result = await dashboardService.getDashboardSite(String(req.params.siteId), req.user!.id, req.user!.role, req.user!.organisationId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
};

const getEvolutionRevenus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const mois = parseInt(req.query.mois as string) || 12;
        const result = await dashboardService.getEvolutionRevenus(req.user!.id, req.user!.role, req.user!.organisationId, mois);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
};

router.get('/plateforme', roleMiddleware(['SUPER_ADMIN']) as any, getKpisPlateforme as any);
router.get('/kpis', getKpis as any);
router.get('/global', getKpis as any);
router.get('/site/:siteId', getDashboardSite as any);
router.get('/evolution', getEvolutionRevenus as any);

export default router;
