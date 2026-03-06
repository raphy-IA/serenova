import { z } from 'zod';
import { TypeAnnouncement } from '@prisma/client';

export const createAnnouncementSchema = z.object({
    body: z.object({
        titre: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
        message: z.string().min(5, "Le message doit faire au moins 5 caractères"),
        type: z.nativeEnum(TypeAnnouncement),
        actif: z.boolean().optional().default(true)
    })
});

export const updateAnnouncementSchema = z.object({
    body: z.object({
        titre: z.string().min(3, "Le titre doit faire au moins 3 caractères").optional(),
        message: z.string().min(5, "Le message doit faire au moins 5 caractères").optional(),
        type: z.nativeEnum(TypeAnnouncement).optional(),
        actif: z.boolean().optional()
    })
});
