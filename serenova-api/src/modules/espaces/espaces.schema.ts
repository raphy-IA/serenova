import { z } from 'zod';

const TypeEspaceEnum = z.enum([
    'STUDIO', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6_PLUS',
    'BUREAU', 'LOCAL_COMMERCIAL', 'ENTREPOT', 'PARKING', 'VILLA', 'CHAMBRE'
]);
const TypeCuisineEnum = z.enum(['OUVERTE', 'FERMEE', 'KITCHENETTE', 'AUCUNE']);
const TypeMeubleEnum = z.enum(['NON_MEUBLE', 'MEUBLE', 'SEMI_MEUBLE']);
const EtatGeneralEnum = z.enum(['EXCELLENT', 'BON', 'MOYEN', 'A_RENOVER']);
const StatutEspaceEnum = z.enum(['LIBRE', 'OCCUPE', 'RESERVE', 'EN_TRAVAUX']);
const TypeChargesEnum = z.enum(['INCLUSES', 'PROVISION', 'REELLES']);
const PeriodiciteEnum = z.enum(['MENSUELLE', 'TRIMESTRIELLE', 'ANNUELLE']);
const TypePenaliteEnum = z.enum(['TAUX_FIXE', 'MONTANT_JOUR', 'AUCUNE']);

export const createEspaceSchema = z.object({
    body: z.object({
        identifiant: z.string().min(1, 'L\'identifiant est requis (ex: A-101)'),
        label: z.string().optional(),
        type: TypeEspaceEnum,
        etage: z.number().int().optional(),
        numeroPorce: z.string().optional(),
        surface: z.number().min(1).optional(),
        surfaceTotale: z.number().min(1).optional(),
        nbPieces: z.number().int().min(1).optional(),
        nbChambres: z.number().int().min(0).optional(),
        nbSallesBain: z.number().int().min(0).optional(),
        cuisine: TypeCuisineEnum.optional(),
        balcon: z.boolean().default(false),
        exposition: z.string().optional(),
        chauffage: z.string().optional(),
        meuble: TypeMeubleEnum.default('NON_MEUBLE'),
        etatGeneral: EtatGeneralEnum.default('BON'),
        statut: StatutEspaceEnum.default('LIBRE'),
        equipements: z.array(z.string()).default([]),
        photos: z.array(z.string().url()).default([]),
        // Configuration du loyer (optionnelle à la création)
        loyer: z.object({
            montantBase: z.number().min(0),
            charges: z.number().min(0).default(0),
            typeCharges: TypeChargesEnum.default('INCLUSES'),
            caution: z.number().min(0).optional(),
            cautionNombreMois: z.number().int().min(0).default(1),
            moisAvance: z.number().int().min(0).default(1),
            devise: z.string().default('FCFA'),
            periodicite: PeriodiciteEnum.default('MENSUELLE'),
            jourEcheance: z.number().int().min(1).max(31).default(5),
            indexation: z.boolean().default(false),
            indexIndice: z.string().optional(),
            indexPourcentage: z.number().optional(),
            delaiGrace: z.number().int().min(0).default(5),
            typePenalite: TypePenaliteEnum.default('AUCUNE'),
            penaliteTaux: z.number().optional(),
            penaliteMontant: z.number().optional(),
        }).optional(),
    }),
    params: z.object({
        siteId: z.string().cuid(),
    }),
});

export const updateEspaceSchema = z.object({
    body: createEspaceSchema.shape.body.partial(),
    params: z.object({
        id: z.string().cuid(),
    }),
});

export const espaceIdSchema = z.object({
    params: z.object({ id: z.string().cuid() }),
});

export const espaceBySiteSchema = z.object({
    params: z.object({ siteId: z.string().cuid() }),
});

export type CreateEspaceInput = z.infer<typeof createEspaceSchema>['body'];
export type UpdateEspaceInput = z.infer<typeof updateEspaceSchema>['body'];
