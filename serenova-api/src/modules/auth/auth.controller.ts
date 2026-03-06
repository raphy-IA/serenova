import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { RegisterInput, LoginInput, RefreshInput } from './auth.schema';

export const authController = {
    async register(req: Request<{}, {}, RegisterInput>, res: Response, next: NextFunction) {
        try {
            const result = await authService.register(req.body);
            res.status(201).json({
                status: 'success',
                message: 'Inscription réussie',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async login(req: Request<{}, {}, LoginInput>, res: Response, next: NextFunction) {
        try {
            const result = await authService.login(req.body);
            res.status(200).json({
                status: 'success',
                message: 'Connexion réussie',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async refresh(req: Request<{}, {}, RefreshInput>, res: Response, next: NextFunction) {
        try {
            const result = await authService.refresh(req.body.refreshToken);
            res.status(200).json({
                status: 'success',
                message: 'Token rafraîchi avec succès',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    logout(req: Request, res: Response, next: NextFunction) {
        // La déconnexion est souvent gérée côté client (effacer le JWT).
        // Si nous avions Redis pour une blacklist, on l'ajouterait ici.
        res.status(200).json({
            status: 'success',
            message: 'Déconnexion réussie. Veuillez supprimer les tokens côté client.',
        });
    },
};
