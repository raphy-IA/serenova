import { z } from 'zod';

const TypePaiementEnum = z.enum(['LOYER', 'CAUTION', 'AVANCE', 'FRAIS_ENTREE', 'PENALITE', 'AUTRE']);
const ModePaiementEnum = z.enum(['ESPECES', 'VIREMENT', 'CHEQUE', 'MOBILE_MONEY', 'AUTRE']);

export const createPaiementSchema = z.object({
    body: z.object({
        bailId: z.string().cuid(),
        typePaiement: TypePaiementEnum,
        moisConcerne: z.string().datetime().optional(), // ex: "2026-03-01T00:00:00Z"
        montant: z.number().min(0.01, 'Le montant doit être positif'),
        datePaiement: z.string().datetime(),
        modePaiement: ModePaiementEnum,
        reference: z.string().optional(),
        notes: z.string().optional(),
    }),
});

export const paiementFilterSchema = z.object({
    query: z.object({
        bailId: z.string().cuid().optional(),
        mois: z.string().optional(), // YYYY-MM format
        page: z.string().optional(),
        limit: z.string().optional(),
    }),
});

export const paiementIdSchema = z.object({
    params: z.object({ id: z.string().cuid() }),
});

export const smartPaymentSchema = z.object({
    body: z.object({
        bailId: z.string().cuid(),
        montant: z.number().min(0.01, 'Le montant doit être positif'),
        datePaiement: z.string().datetime(),
        modePaiement: ModePaiementEnum,
        reference: z.string().optional(),
        notes: z.string().optional(),
    }),
});

export type CreatePaiementInput = z.infer<typeof createPaiementSchema>['body'];
export type SmartPaymentInput = z.infer<typeof smartPaymentSchema>['body'];
