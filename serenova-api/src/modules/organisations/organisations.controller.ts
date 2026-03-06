import { Response, NextFunction } from 'express';
import { organisationsService } from './organisations.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { createOrganisationSchema, updateOrganisationSchema } from './organisations.schema';

export const organisationsController = {
    async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            // Seul le super admin peut créer une organisation
            if (req.user!.role !== 'SUPER_ADMIN') {
                throw { statusCode: 403, message: 'Seul le Super Administrateur peut effectuer cette action.' };
            }
            const validatedData = createOrganisationSchema.parse(req.body);
            const result = await organisationsService.createOrganisation(validatedData);
            res.status(201).json({ status: 'success', message: 'Organisation créée avec succès', data: result });
        } catch (error) { next(error); }
    },

    async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (req.user!.role !== 'SUPER_ADMIN') {
                throw { statusCode: 403, message: 'Accès réservé au Super Administrateur.' };
            }
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const result = await organisationsService.getOrganisations(page, limit);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },

    async getOne(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (req.user!.role !== 'SUPER_ADMIN') {
                throw { statusCode: 403, message: 'Accès réservé au Super Administrateur.' };
            }
            const result = await organisationsService.getOrganisationById(String(req.params.id));
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },

    async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (req.user!.role !== 'SUPER_ADMIN') {
                throw { statusCode: 403, message: 'Accès réservé au Super Administrateur.' };
            }
            const validatedData = updateOrganisationSchema.parse(req.body);
            const result = await organisationsService.updateOrganisation(String(req.params.id), validatedData);
            res.status(200).json({ status: 'success', message: 'Organisation mise à jour', data: result });
        } catch (error) { next(error); }
    }
};
