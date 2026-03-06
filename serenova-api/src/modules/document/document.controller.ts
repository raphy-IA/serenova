import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import { documentService } from './document.service';

export const documentController = {
    async generateLease(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { bailId } = req.params;
            const organisationId = req.user!.organisationId;

            // Secure fetch of the lease
            const bail = await prisma.bail.findFirst({
                where: { id: bailId, organisationId: organisationId as string },
                include: {
                    locataire: true,
                    espace: { include: { site: true } }
                }
            });

            if (!bail) throw { statusCode: 404, message: 'Bail introuvable.' };

            const pdfBuffer = await documentService.generatePdfFromTemplate('CONTRAT_BAIL', {
                titre: 'Contrat de Bail',
                dateGeneration: new Date().toLocaleDateString('fr-FR'),
                isBail: true,
                locataire: bail.locataire,
                espace: bail.espace,
                site: bail.espace.site,
                // Format dates explicitly before sending to Handlebars
                bail: {
                    ...bail,
                    dateEntree: new Date(bail.dateEntree).toLocaleDateString('fr-FR'),
                }
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="Contrat_Bail_${bail.id}.pdf"`);
            res.send(pdfBuffer);
        } catch (error) {
            next(error);
        }
    },

    async generateReceipt(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { paiementId } = req.params;
            const organisationId = req.user!.organisationId;

            const paiement = await prisma.paiement.findFirst({
                where: { id: paiementId, organisationId: organisationId as string },
                include: {
                    bail: {
                        include: {
                            locataire: true,
                            espace: { include: { site: true } }
                        }
                    }
                }
            });

            if (!paiement) throw { statusCode: 404, message: 'Paiement introuvable.' };

            const pdfBuffer = await documentService.generatePdfFromTemplate('QUITTANCE_LOYER', {
                titre: 'Quittance de Loyer',
                dateGeneration: new Date().toLocaleDateString('fr-FR'),
                isPaiement: true,
                paiement: {
                    ...paiement,
                    datePaiement: new Date(paiement.datePaiement).toLocaleDateString('fr-FR'),
                },
                bail: paiement.bail,
                locataire: paiement.bail.locataire,
                espace: paiement.bail.espace,
                site: paiement.bail.espace.site
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="Quittance_${paiement.id}.pdf"`);
            res.send(pdfBuffer);
        } catch (error) {
            next(error);
        }
    }
};
