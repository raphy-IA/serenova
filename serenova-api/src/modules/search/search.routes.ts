import { Router } from 'express';
import { searchController } from './search.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware as any);
router.get('/', searchController.globalSearch as any);

export default router;
