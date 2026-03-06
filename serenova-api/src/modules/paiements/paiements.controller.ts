import { Response, NextFunction } from 'express';
import { paiementsService } from './paiements.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { CreatePaiementInput, SmartPaymentInput } from './paiements.schema';

export const paiementsController = {
    async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await paiementsService.createPaiement(req.user!.id, req.user!.role, req.user!.organisationId, req.body as CreatePaiementInput);
            res.status(201).json({ status: 'success', message: 'Paiement enregistré avec succès', data: result });
        } catch (error) { next(error); }
    },

    async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const bailId = req.query.bailId as string | undefined;
            const mois = req.query.mois as string | undefined;
            const result = await paiementsService.getPaiements(req.user!.id, req.user!.role, req.user!.organisationId, bailId, mois, page, limit);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },

    async getOne(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await paiementsService.getPaiementById(String(req.params.id), req.user!.id, req.user!.role, req.user!.organisationId);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },

    async annuler(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await paiementsService.annulerPaiement(String(req.params.id), req.user!.id, req.user!.role, req.user!.organisationId);
            res.status(200).json({ status: 'success', message: 'Paiement annulé', data: result });
        } catch (error) { next(error); }
    },

    // Endpoint futur pour génération PDF de quittance
    async getQuittance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await paiementsService.getQuittanceData(String(req.params.id), req.user!.id, req.user!.role, req.user!.organisationId);
            // TODO: intégrer pdf.service.ts pour générer le PDF
            res.status(200).json({ status: 'success', message: 'Génération PDF à implémenter', data });
        } catch (error) { next(error); }
    },

    async getBalance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await paiementsService.getBailBalance(String(req.params.bailId), req.user!.id, req.user!.role, req.user!.organisationId);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },

    async smartPay(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await paiementsService.processSmartPayment(req.user!.id, req.user!.role, req.user!.organisationId, req.body as SmartPaymentInput);
            res.status(201).json({ status: 'success', message: 'Paiement intelligent traité', data: result });
        } catch (error) { next(error); }
    },

    async getStats(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const annee = req.query.annee ? parseInt(req.query.annee as string) : undefined;
            const result = await paiementsService.getTresorerieStats(req.user!.id, req.user!.role, req.user!.organisationId, annee);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    },
};
