import { Router } from 'express';
import { saasConfigController } from './saas-config.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware as any);

router.get('/', saasConfigController.getConfig as any);
router.put('/', saasConfigController.updateConfig as any);

export default router;
