import { Router } from 'express';
import { organisationsController } from './organisations.controller';
import { updateOrganisationSubscription, getAllSubscriptions } from './subscription.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware as any);

router.get('/abonnements/all', getAllSubscriptions as any);

router.get('/', organisationsController.getAll as any);
router.post('/', organisationsController.create as any);
router.get('/:id', organisationsController.getOne as any);
router.put('/:id', organisationsController.update as any);

// Gestion de l'abonnement
router.put('/:id/subscription', updateOrganisationSubscription as any);

export default router;
