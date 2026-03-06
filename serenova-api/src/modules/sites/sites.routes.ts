import { Router } from 'express';
import { sitesController } from './sites.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createSiteSchema, updateSiteSchema, siteIdSchema } from './sites.schema';
import { planGuard } from '../../middleware/plan.guard';

const router = Router();

// Toutes les routes "sites" nécessitent d'être authentifié
router.use(authMiddleware as any);

router.post('/', planGuard('sites') as any, validateRequest(createSiteSchema), sitesController.create as any);
router.get('/', sitesController.getAll as any);
router.get('/:id', validateRequest(siteIdSchema), sitesController.getOne as any);
router.put('/:id', validateRequest(updateSiteSchema), sitesController.update as any);
router.delete('/:id', validateRequest(siteIdSchema), sitesController.delete as any);

export default router;
