import { Router } from 'express';
import { billingController } from './billing.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Routes publiques (Webhooks)
router.post('/webhook/stripe', billingController.webhookStripe as any);
router.post('/webhook/momo', billingController.webhookMomo as any);

// Routes sécurisées (Clients)
router.use(authMiddleware as any);

router.get('/subscription', billingController.getMySubscription as any);
router.get('/usage', billingController.getUsage as any);
router.get('/invoices', billingController.getMyInvoices as any);
router.post('/checkout', billingController.createCheckoutSession as any);

export default router;
