import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';

// -----------------------------------------------------------------------
// MODULE USERS — Endpoints pour la gestion du profil utilisateur
// Inclut l'enregistrement du token FCM pour les notifications push
// -----------------------------------------------------------------------
const router = Router();
router.use(authMiddleware as any);

// Schéma Zod pour la mise à jour du token FCM
const fcmTokenSchema = z.object({
    body: z.object({
        fcmToken: z.string().min(100, 'Le token FCM est invalide').nullable(),
    }),
});

// GET /api/users/me — Profil de l'utilisateur connecté
const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true, email: true, firstName: true, lastName: true,
                phone: true, role: true, fcmTokenUpdatedAt: true,
                createdAt: true, _count: { select: { sites: true } }
            }
        });
        if (!user) throw { statusCode: 404, message: 'Utilisateur introuvable.' };
        res.status(200).json({ status: 'success', data: user });
    } catch (error) { next(error); }
};

// PATCH /api/users/me — Mettre à jour le profil
const updateMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const schema = z.object({
            body: z.object({
                firstName: z.string().min(2).optional(),
                lastName: z.string().min(2).optional(),
                phone: z.string().min(8).optional().or(z.literal('')),
            })
        });
        const parsed = schema.safeParse(req);
        if (!parsed.success) throw { statusCode: 400, message: 'Données invalides', details: parsed.error.issues };

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: parsed.data.body,
            select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true }
        });
        res.status(200).json({ status: 'success', data: user });
    } catch (error) { next(error); }
};

// PATCH /api/users/me/password — Changer le mot de passe
const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const schema = z.object({
            body: z.object({
                currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
                newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
            })
        });
        const parsed = schema.safeParse(req);
        if (!parsed.success) throw { statusCode: 400, message: 'Données invalides', details: parsed.error.issues };

        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        if (!user) throw { statusCode: 404, message: 'Utilisateur introuvable.' };

        const isValid = await bcrypt.compare(parsed.data.body.currentPassword, user.passwordHash);
        if (!isValid) throw { statusCode: 401, message: 'Mot de passe actuel incorrect.' };

        const newHash = await bcrypt.hash(parsed.data.body.newPassword, 12);
        await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

        res.status(200).json({ status: 'success', message: 'Mot de passe modifié avec succès.' });
    } catch (error) { next(error); }
};

// PATCH /api/users/me/fcm-token — Enregistrer le token FCM du device mobile
const updateFcmToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const parsed = fcmTokenSchema.safeParse(req);
        if (!parsed.success) throw { statusCode: 400, message: 'Token FCM invalide', details: parsed.error.issues };
        const { fcmToken } = parsed.data.body;
        await prisma.user.update({
            where: { id: req.user!.id },
            data: { fcmToken, fcmTokenUpdatedAt: fcmToken ? new Date() : null },
        });
        res.status(200).json({
            status: 'success',
            message: fcmToken ? 'Token FCM enregistré — notifications push activées' : 'Token FCM supprimé — notifications désactivées',
        });
    } catch (error) { next(error); }
};

// DELETE /api/users/me/fcm-token — Désenregistrer les notifications
const deleteFcmToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await prisma.user.update({
            where: { id: req.user!.id },
            data: { fcmToken: null, fcmTokenUpdatedAt: null }
        });
        res.status(200).json({ status: 'success', message: 'Notifications push désactivées' });
    } catch (error) { next(error); }
};

import { getUsers, createUser, deleteUser } from './users.controller';
import { roleMiddleware } from '../../middleware/auth.middleware';
import { planGuard } from '../../middleware/plan.guard';

router.get('/me', getMe as any);
router.patch('/me', updateMe as any);
router.patch('/me/password', changePassword as any);
router.patch('/me/fcm-token', updateFcmToken as any);
router.delete('/me/fcm-token', deleteFcmToken as any);

// Routes d'administration
router.get('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN']) as any, getUsers as any);
router.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN']) as any, planGuard('users') as any, createUser as any);
router.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']) as any, deleteUser as any);

export default router;

