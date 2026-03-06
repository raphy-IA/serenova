import { Router } from 'express';
import { alertsController } from './alerts.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Toutes les routes sont protégées
router.use(authMiddleware as any);

router.get('/', alertsController.getMyAlerts as any);
router.patch('/:id/status', alertsController.updateAlertStatus as any);

// Debug route pour SuperAdmin
router.post('/trigger-scan', alertsController.triggerScan as any);

export default router;
