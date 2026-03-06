import { Router } from 'express';
import { auditController } from './audit.controller';
import { authMiddleware, roleMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Routes protégées (SUPER_ADMIN uniquement)
router.use(authMiddleware as any);
router.use(roleMiddleware(['SUPER_ADMIN']) as any);

router.get('/', auditController.getAuditLogs as any);

export default router;
