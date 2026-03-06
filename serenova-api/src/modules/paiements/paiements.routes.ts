import { Router } from 'express';
import { paiementsController } from './paiements.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createPaiementSchema, paiementIdSchema, smartPaymentSchema } from './paiements.schema';

const router = Router();
router.use(authMiddleware as any);

router.get('/', paiementsController.getAll as any);
router.get('/stats', paiementsController.getStats as any);
router.get('/bail/:bailId/balance', paiementsController.getBalance as any);
router.post('/', validateRequest(createPaiementSchema), paiementsController.create as any);
router.post('/smart-payment', validateRequest(smartPaymentSchema), paiementsController.smartPay as any);
router.get('/:id', validateRequest(paiementIdSchema), paiementsController.getOne as any);
router.get('/:id/quittance', validateRequest(paiementIdSchema), paiementsController.getQuittance as any);
router.delete('/:id', validateRequest(paiementIdSchema), paiementsController.annuler as any);

export default router;
