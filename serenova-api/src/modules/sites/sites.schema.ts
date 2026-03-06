import { z } from 'zod';

const TypeSiteEnum = z.enum([
    'RESIDENTIEL',
    'COMMERCIAL',
    'MIXTE',
    'VILLA',
    'ETUDIANT',
    'IMMEUBLE_RAPPORT'
]);

const StatutSiteEnum = z.enum([
    'ACTIF',
    'INACTIF',
    'EN_TRAVAUX'
]);

// Schéma de création d'un site
export const createSiteSchema = z.object({
    body: z.object({
        nom: z.string().min(2, 'Le nom du site doit contenir au moins 2 caractères'),
        type: TypeSiteEnum,
        adresse: z.string().min(5, 'L\'adresse est requise'),
        ville: z.string().min(2, 'La ville est requise'),
        codePostal: z.string().min(4, 'Le code postal est requis'),
        pays: z.string().min(2, 'Le pays est requis').default('France'),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        nbEspaces: z.number().int().min(1, 'Il faut au moins 1 espace'),
        anneeConstruction: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
        surface: z.number().min(1).optional(),
        nbEtages: z.number().int().min(0).optional(),
        ascenseur: z.boolean().default(false),
        parking: z.boolean().default(false),
        statut: StatutSiteEnum.default('ACTIF'),
        description: z.string().optional(),
        gestionnaire: z.string().optional(), // Nom du gestionnaire sur place s'il y en a un
        assuranceCompagnie: z.string().optional(),
        assuranceRef: z.string().optional(),
        assuranceExpiration: z.string().datetime().optional(), // ISO 8601
        equipements: z.array(z.string()).default([]),
        photos: z.array(z.string().url()).default([]), // URLs
    }),
});

// Schéma de mise à jour d'un site (tous les champs sont optionnels)
export const updateSiteSchema = z.object({
    body: createSiteSchema.shape.body.partial(),
    params: z.object({
        id: z.string().cuid('L\'identifiant du site est invalide'),
    }),
});

// Schéma pour récupérer ou supprimer un site spécifique
export const siteIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('L\'identifiant du site est invalide'),
    }),
});

// Types TypeScript générés depuis Zod
export type CreateSiteInput = z.infer<typeof createSiteSchema>['body'];
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>['body'];
