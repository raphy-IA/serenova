import { Router } from 'express';
import { locatairesController } from './locataires.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createLocataireSchema, updateLocataireSchema, locataireIdSchema } from './locataires.schema';

const router = Router();

router.use(authMiddleware as any);

router.get('/', locatairesController.getAll as any);
router.post('/', validateRequest(createLocataireSchema), locatairesController.create as any);
router.get('/:id', validateRequest(locataireIdSchema), locatairesController.getOne as any);
router.put('/:id', validateRequest(updateLocataireSchema), locatairesController.update as any);
router.delete('/:id', validateRequest(locataireIdSchema), locatairesController.delete as any);

export default router;
