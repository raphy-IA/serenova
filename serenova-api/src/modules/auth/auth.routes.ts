import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';

const router = Router();

// Routes publiques
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);

export default router;
