import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getTenantContext } from '../utils/tenant-context';

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const context = getTenantContext();

                // On n'applique le filtre que si on a un organisationId dans le contexte
                // et qu'on n'est pas SUPER_ADMIN (ou si on veut forcer l'isolation même pour lui)
                // Note: On exclut les modèles qui ne sont pas liés à une organisation (ex: Organisation elle-même, Plan, etc.)
                const modelsWithOrg = [
                    'User', 'Site', 'Locataire', 'Bail', 'Paiement',
                    'Alerte', 'Subscription', 'AuditLog', 'DocumentTemplate',
                    'SaaSInvoice'
                ];

                if (context?.organisationId && modelsWithOrg.includes(model)) {
                    // S'assurer que args existe
                    args = args || {};

                    if (['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                        (args as any).where = { ...(args as any).where, organisationId: context.organisationId };
                    }

                    if (['update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation)) {
                        (args as any).where = { ...(args as any).where, organisationId: context.organisationId };
                    }

                    if (operation === 'create' || operation === 'createMany') {
                        if (Array.isArray(args.data)) {
                            args.data = args.data.map((item: any) => ({ ...item, organisationId: context.organisationId }));
                        } else {
                            args.data = { ...args.data, organisationId: context.organisationId };
                        }
                    }
                }

                return query(args);
            },
        },
    },
});
