import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        organisationId?: string;
    };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Accès non autorisé. Token manquant.',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string; type: string };

        if (decoded.type !== 'access') {
            return res.status(401).json({
                status: 'error',
                message: 'Accès non autorisé. Type de token invalide.',
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            select: { id: true, role: true, email: true, organisationId: true }, // Sélectionner l'essentiel
        });

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Utilisateur introuvable ou supprimé.',
            });
        }

        req.user = {
            id: user.id,
            role: user.role,
            organisationId: user.organisationId || undefined,
        };

        // Mode Impersonnification (Shadowing) pour le Super Admin
        const impersonatedOrgId = req.headers['x-organisation-id'];
        if (impersonatedOrgId && user.role === 'SUPER_ADMIN') {
            req.user.organisationId = String(impersonatedOrgId);
        }

        // Injecter le contexte de tenant pour le Prisma Extension
        const { runWithTenantContext } = require('../utils/tenant-context');
        runWithTenantContext({
            organisationId: req.user.organisationId,
            userId: req.user.id,
            role: req.user.role
        }, () => {
            next();
        });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                status: 'error',
                message: 'Token expiré. Veuillez le rafraîchir.',
                code: 'TOKEN_EXPIRED',
            });
        }

        return res.status(401).json({
            status: 'error',
            message: 'Token invalide.',
        });
    }
};

// Middleware optionnel pour la vérification du rôle (ex: SUPER_ADMIN)
export const roleMiddleware = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Non authentifié' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'Accès interdit. Privilèges insuffisants.',
            });
        }

        next();
    };
};
