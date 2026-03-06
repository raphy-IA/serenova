import { z } from 'zod';

const CiviliteEnum = z.enum(['M', 'MME', 'SOCIETE']);

const garantSchema = z.object({
    nom: z.string().min(2),
    contact: z.string().min(5),
    pieceId: z.string().optional(),
    revenus: z.number().optional(),
}).optional();

export const createLocataireSchema = z.object({
    body: z.object({
        civilite: CiviliteEnum,
        nom: z.string().min(2, 'Le nom est requis'),
        prenom: z.string().optional(),
        raisonSociale: z.string().optional(),
        dateNaissance: z.string().datetime().optional(),
        nationalite: z.string().optional(),
        pieceIdentite: z.string().optional(), // Type de pièce: CIN, Passeport, etc.
        numIdentite: z.string().optional(),
        telephone: z.string().min(8, 'Le téléphone est requis'),
        telephoneSecondaire: z.string().optional(),
        email: z.string().trim().email().or(z.literal('')).optional(),
        employeur: z.string().optional(),
        revenus: z.number().min(0).optional(),
        garant: garantSchema,
        documents: z.array(z.string().url()).default([]),
    }),
});

export const updateLocataireSchema = z.object({
    body: createLocataireSchema.shape.body.partial(),
    params: z.object({
        id: z.string().cuid(),
    }),
});

export const locataireIdSchema = z.object({
    params: z.object({ id: z.string().cuid() }),
});

export type CreateLocataireInput = z.infer<typeof createLocataireSchema>['body'];
export type UpdateLocataireInput = z.infer<typeof updateLocataireSchema>['body'];
