import { Router } from 'express';
import { espacesController } from './espaces.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createEspaceSchema, updateEspaceSchema, espaceIdSchema, espaceBySiteSchema } from './espaces.schema';

const router = Router({ mergeParams: true }); // Pour récupérer :siteId du routeur parent

router.use(authMiddleware as any);

// Routes site-scoped
router.get('/', validateRequest(espaceBySiteSchema), espacesController.getAll as any);
router.post('/', validateRequest(createEspaceSchema), espacesController.create as any);

export default router;
