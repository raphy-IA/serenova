import { Router } from 'express';
import { bauxController } from './baux.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createBailSchema, updateBailSchema, resilierBailSchema, bailIdSchema, planifierEvolutionSchema } from './baux.schema';
import { planGuard } from '../../middleware/plan.guard';

const router = Router();
router.use(authMiddleware as any);

router.get('/', bauxController.getAll as any);
router.post('/', planGuard('baux') as any, validateRequest(createBailSchema), bauxController.create as any);
router.get('/:id', validateRequest(bailIdSchema), bauxController.getOne as any);
router.put('/:id', validateRequest(updateBailSchema), bauxController.update as any);
router.delete('/:id', validateRequest(bailIdSchema), bauxController.delete as any);
router.post('/:id/resilier', validateRequest(resilierBailSchema), bauxController.resilier as any);
router.post('/:id/annuler', validateRequest(bailIdSchema), bauxController.annuler as any);
router.post('/:id/suspendre', validateRequest(bailIdSchema), bauxController.suspendre as any);
router.post('/:id/evolution', validateRequest(planifierEvolutionSchema), bauxController.planifierEvolution as any);

export default router;
