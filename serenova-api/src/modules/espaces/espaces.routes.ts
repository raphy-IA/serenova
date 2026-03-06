import { Router } from 'express';
import { espacesController } from './espaces.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { updateEspaceSchema, espaceIdSchema } from './espaces.schema';

const router = Router();

router.use(authMiddleware as any);

// Routes standalone (par ID espace)
router.get('/', espacesController.getAllGlobal as any);
router.get('/:id', validateRequest(espaceIdSchema), espacesController.getOne as any);
router.put('/:id', validateRequest(updateEspaceSchema), espacesController.update as any);
router.put('/:id/loyer', espacesController.updateLoyer as any);
router.delete('/:id', validateRequest(espaceIdSchema), espacesController.delete as any);

export default router;
