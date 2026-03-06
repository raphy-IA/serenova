import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z
            .string()
            .min(1, 'L\'email est requis')
            .trim()
            .email('L\'email est invalide'),
        password: z
            .string()
            .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
            .max(64, 'Le mot de passe ne doit pas dépasser 64 caractères')
            .regex(/^[a-zA-Z0-9!@#$%^&*]+$/, 'Le mot de passe contient des caractères non autorisés'),
        firstName: z
            .string()
            .min(2, 'Le prénom doit contenir au moins 2 caractères')
            .max(50, 'Le prénom ne doit pas dépasser 50 caractères'),
        lastName: z
            .string()
            .min(2, 'Le nom doit contenir au moins 2 caractères')
            .max(50, 'Le nom ne doit pas dépasser 50 caractères'),
        phone: z
            .string()
            .optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string()
            .min(1, 'L\'email est requis')
            .trim()
            .email('L\'email est invalide'),
        password: z
            .string()
            .min(1, 'Le mot de passe est requis'),
    }),
});

export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z
            .string()
            .min(1, 'Le refresh token est requis'),
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshInput = z.infer<typeof refreshSchema>['body'];
