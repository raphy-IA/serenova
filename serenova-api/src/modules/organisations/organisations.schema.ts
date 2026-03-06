import { z } from 'zod';

export const createOrganisationSchema = z.object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    type: z.enum(['SOCIETE', 'INDIVIDU']).default('SOCIETE'),
    email: z.string().email("Email invalide").optional().or(z.literal('')),
    telephone: z.string().optional().or(z.literal('')),
    ville: z.string().optional().or(z.literal('')),
    planId: z.string().optional().or(z.literal('')),
});

export const updateOrganisationSchema = createOrganisationSchema.partial();

export type CreateOrganisationInput = z.infer<typeof createOrganisationSchema>;
export type UpdateOrganisationInput = z.infer<typeof updateOrganisationSchema>;
