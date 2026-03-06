import { Router } from 'express';
import { documentController } from './document.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Routes protégées par l'authentification (Clients/Gestionnaires)
router.use(authMiddleware as any);

router.post('/generate-lease/:bailId', documentController.generateLease as any);
router.post('/generate-receipt/:paiementId', documentController.generateReceipt as any);

export default router;
