import { z } from 'zod';

export const saasConfigSchema = z.object({
    stripePublicKey: z.string().optional().or(z.literal('')),
    stripeSecretKey: z.string().optional().or(z.literal('')),
    stripeWebhookSecret: z.string().optional().or(z.literal('')),
    momoApiKey: z.string().optional().or(z.literal('')),
    momoApiSecret: z.string().optional().or(z.literal('')),
    momoMerchantId: z.string().optional().or(z.literal('')),
    paypalClientId: z.string().optional().or(z.literal('')),
    paypalSecret: z.string().optional().or(z.literal(''))
});

export type SaaSConfigInput = z.infer<typeof saasConfigSchema>;
