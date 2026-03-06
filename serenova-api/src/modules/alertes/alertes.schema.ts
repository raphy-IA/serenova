import { z } from 'zod';

export const alerteIdSchema = z.object({
    params: z.object({ id: z.string().cuid() }),
});

export const updateAlerteSchema = z.object({
    body: z.object({
        statut: z.enum(['RESOLUE', 'IGNOREE']),
    }),
    params: z.object({ id: z.string().cuid() }),
});
