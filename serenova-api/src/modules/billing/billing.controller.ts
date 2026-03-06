import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth.middleware';
import Stripe from 'stripe';

export const billingController = {
    // Récupérer l'abonnement actuel du client connecté
    async getMySubscription(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const organisationId = req.user!.organisationId;
            if (!organisationId) {
                if (req.user!.role === 'SUPER_ADMIN') {
                    return res.status(200).json({ status: 'success', data: { isSuperAdmin: true } });
                }
                throw { statusCode: 403, message: 'Aucune organisation associée.' };
            }

            const subscription = await prisma.subscription.findUnique({
                where: { organisationId },
                include: { plan: true }
            });

            res.status(200).json({ status: 'success', data: subscription });
        } catch (error) { next(error); }
    },

    // Récupérer l'utilisation actuelle des ressources (sites, baux, users)
    async getUsage(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const organisationId = req.user!.organisationId;
            if (!organisationId) throw { statusCode: 403, message: 'Aucune organisation associée.' };

            const [sites, baux, users] = await Promise.all([
                prisma.site.count({ where: { organisationId } }),
                prisma.bail.count({ where: { organisationId } }),
                prisma.user.count({ where: { organisationId } })
            ]);

            res.status(200).json({
                status: 'success',
                data: { sites, baux, users }
            });
        } catch (error) { next(error); }
    },

    // Récupérer l'historique des factures SaaS du client
    async getMyInvoices(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const organisationId = req.user!.organisationId;
            if (!organisationId) {
                if (req.user!.role === 'SUPER_ADMIN') {
                    return res.status(200).json({ status: 'success', data: [] });
                }
                throw { statusCode: 403, message: 'Aucune organisation associée.' };
            }

            const invoices = await (prisma as any).saaSInvoice.findMany({
                where: { organisationId },
                orderBy: { createdAt: 'desc' }
            });

            res.status(200).json({ status: 'success', data: invoices });
        } catch (error) { next(error); }
    },

    // Générer une session de paiement (Stripe ou Mobile Money)
    async createCheckoutSession(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { paymentMethod } = req.body;
            const organisationId = req.user!.organisationId;
            if (!organisationId) throw { statusCode: 403, message: 'Aucune organisation associée.' };

            const subscription = await prisma.subscription.findUnique({
                where: { organisationId },
                include: { plan: true }
            });

            if (!subscription || !subscription.plan) {
                throw { statusCode: 400, message: 'Aucun plan actif trouvé.' };
            }

            const config = await (prisma as any).saasConfig.findFirst();
            if (!config) throw { statusCode: 500, message: 'Configuration de paiement introuvable.' };

            const amount = subscription.plan.prix;
            const billingPeriodStart = new Date();
            const billingPeriodEnd = new Date();
            if ((subscription.plan as any).periodicite === 'ANNUEL') {
                billingPeriodEnd.setFullYear(billingPeriodEnd.getFullYear() + 1);
            } else {
                billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);
            }

            // 1. Create Invoice
            const invoice = await (prisma as any).saaSInvoice.create({
                data: {
                    subscriptionId: subscription.id,
                    organisationId: organisationId,
                    amount: amount,
                    paymentMethod: paymentMethod,
                    dueDate: new Date(),
                    billingPeriodStart,
                    billingPeriodEnd
                }
            });

            // 2. Stripe Checkout
            if (paymentMethod === 'STRIPE') {
                if (!config.stripeSecretKey) throw { statusCode: 400, message: 'Stripe non configuré par l\'administrateur.' };

                const stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2022-11-15' as any });

                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [{
                        price_data: {
                            currency: 'xaf', // CFA Franc ou EUR
                            product_data: {
                                name: `Abonnement SÉRÉNOVA - ${subscription.plan.nom}`,
                            },
                            unit_amount: Number(amount) * 100, // Stripe attend le montant en centimes
                        },
                        quantity: 1,
                    }],
                    mode: 'payment',
                    success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mon-abonnement?success=true`,
                    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mon-abonnement?canceled=true`,
                    client_reference_id: invoice.id,
                });

                return res.status(200).json({ status: 'success', data: { url: session.url } });
            }

            // 3. Mobile Money Mock Checkout
            if (paymentMethod === 'MOBILE_MONEY') {
                // Dans la réalité, on appelle l'API de l'agrégateur (ex: Campay, Notch Pay, etc) et on récupère une URL
                // Ici, on simule une page de redirection pour la démo
                return res.status(200).json({
                    status: 'success',
                    data: {
                        url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/simulate-momo?invoiceId=${invoice.id}`
                    }
                });
            }

            throw { statusCode: 400, message: 'Moyen de paiement non supporté.' };

        } catch (error) { next(error); }
    },

    // Webhook Stripe
    async webhookStripe(req: Request, res: Response, next: NextFunction) {
        try {
            const config = await (prisma as any).saasConfig.findFirst();
            if (!config || !config.stripeWebhookSecret) {
                return res.status(400).send('Webhook Secret not configured.');
            }

            const stripe = new Stripe(config.stripeSecretKey!, { apiVersion: '2022-11-15' as any });
            const sig = req.headers['stripe-signature'] as string;

            let event;
            try {
                // Warning: In highly secure production, req.body must be the raw Buffer. 
                // For this SaaS integration, if express.json is used, this parsing might fail unless bypassed.
                event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
            } catch (err: any) {
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }

            if (event.type === 'checkout.session.completed') {
                const session = event.data.object as Stripe.Checkout.Session;
                const invoiceId = session.client_reference_id;

                if (invoiceId) {
                    await billingController.processSuccessfulPayment(invoiceId, session.id, 'STRIPE', event);
                }
            }

            res.json({ received: true });
        } catch (error) { next(error); }
    },

    // Webhook Mobile Money (Mock)
    async webhookMomo(req: Request, res: Response, next: NextFunction) {
        try {
            const { invoiceId, transactionId, status } = req.body;

            if (status === 'SUCCESSFUL' && invoiceId) {
                await billingController.processSuccessfulPayment(invoiceId, transactionId, 'MOBILE_MONEY', req.body);
            }

            res.json({ received: true });
        } catch (error) { next(error); }
    },

    // Service interne pour valider la facture et réactiver l'abonnement
    async processSuccessfulPayment(invoiceId: string, reference: string, method: 'STRIPE' | 'MOBILE_MONEY', payload: any) {
        const invoice = await (prisma as any).saaSInvoice.findUnique({
            where: { id: invoiceId },
            include: { subscription: true }
        });

        if (!invoice || invoice.status === 'PAID') return;

        // 1. Marquer la facture comme payée
        await (prisma as any).saaSInvoice.update({
            where: { id: invoiceId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                reference: reference
            }
        });

        // 2. Créer une transaction de log
        await (prisma as any).saaSTransaction.create({
            data: {
                invoiceId: invoice.id,
                amount: invoice.amount,
                paymentMethod: method,
                status: 'SUCCESS',
                reference: reference,
                providerPayload: payload
            }
        });

        // 3. Activer l'abonnement
        await prisma.subscription.update({
            where: { id: invoice.subscriptionId },
            data: {
                statut: 'ACTIF',
                currentPeriodEnd: invoice.billingPeriodEnd
            }
        });
    }
};
