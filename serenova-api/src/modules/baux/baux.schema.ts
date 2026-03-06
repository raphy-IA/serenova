import { z } from 'zod';

const StatutBailEnum = z.enum(['ACTIF', 'EXPIRE', 'RESILIE', 'ANNULE', 'SUSPENDU']);

export const createBailSchema = z.object({
    body: z.object({
        espaceId: z.string().cuid('L\'identifiant de l\'espace est invalide'),
        locataireId: z.string().cuid('L\'identifiant du locataire est invalide'),
        dateEntree: z.string().min(1, 'La date d\'entrée est requise'),
        dateFin: z.string().optional(),
        dureesMois: z.coerce.number().int().min(1).optional(),
        renouvellementAuto: z.boolean().default(true),
        preivisMois: z.coerce.number().int().min(1).default(1),
        loyerMensuel: z.coerce.number().min(0).optional(),
        montantCaution: z.coerce.number().min(0).optional(),
        cautionNombreMois: z.coerce.number().int().min(0).optional(),
        nbMoisAvance: z.coerce.number().int().min(0).default(1),
        statut: StatutBailEnum.default('ACTIF'),
    }),
});

export const resilierBailSchema = z.object({
    body: z.object({
        dateSortie: z.string().datetime(),
        motifSortie: z.string().min(5, 'Le motif de résiliation est requis'),
    }),
    params: z.object({
        id: z.string().cuid(),
    }),
});

export const updateBailSchema = z.object({
    body: createBailSchema.shape.body.partial(),
    params: z.object({
        id: z.string().cuid(),
    }),
});

export const bailIdSchema = z.object({
    params: z.object({ id: z.string().cuid() }),
});

export const planifierEvolutionSchema = z.object({
    body: z.object({
        nouveauLoyerMensuel: z.coerce.number().min(0, 'Le montant doit être positif'),
        dateEffet: z.string().min(1, 'La date d\'effet est requise'),
    }),
    params: z.object({
        id: z.string().cuid(),
    }),
});

export type CreateBailInput = z.infer<typeof createBailSchema>['body'];
export type UpdateBailInput = z.infer<typeof updateBailSchema>['body'];
export type ResilierBailInput = z.infer<typeof resilierBailSchema>['body'];
export type PlanifierEvolutionInput = z.infer<typeof planifierEvolutionSchema>['body'];
