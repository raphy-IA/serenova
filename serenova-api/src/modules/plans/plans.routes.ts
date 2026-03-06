import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../../middleware/auth.middleware';
import { getPlans, getPlanById, createPlan, updatePlan, deletePlan } from './plans.controller';

const router = Router();

router.use(authMiddleware as any);

// Lecture publique (pour afficher les plans existants)
router.get('/', getPlans as any);
router.get('/:id', getPlanById as any);

// Modification réservée aux SuperAdmins
router.post('/', roleMiddleware(['SUPER_ADMIN']) as any, createPlan as any);
router.patch('/:id', roleMiddleware(['SUPER_ADMIN']) as any, updatePlan as any);
router.delete('/:id', roleMiddleware(['SUPER_ADMIN']) as any, deletePlan as any);

export default router;
