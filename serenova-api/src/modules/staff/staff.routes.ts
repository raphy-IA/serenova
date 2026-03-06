import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../../middleware/auth.middleware';
import { getStaff, createStaff, deleteStaff } from './staff.controller';

const router = Router();

// Seuls les SuperAdmin peuvent gérer les membres du staff plateforme
router.use(authMiddleware as any);
router.use(roleMiddleware(['SUPER_ADMIN']) as any);

router.get('/', getStaff as any);
router.post('/', createStaff as any);
router.delete('/:id', deleteStaff as any);

export default router;
