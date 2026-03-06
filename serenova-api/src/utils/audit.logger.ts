import { prisma } from '../config/database';

export interface AuditLogOptions {
    userId?: string;
    organisationId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    metadata?: any;
}

export class AuditLogger {
    static async log(options: AuditLogOptions) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: options.userId,
                    organisationId: options.organisationId,
                    action: options.action,
                    entityType: options.entityType,
                    entityId: options.entityId,
                    oldValue: options.oldValue,
                    newValue: options.newValue,
                    metadata: options.metadata || {},
                },
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // We don't throw here to avoid breaking the main operation if logging fails
        }
    }
}
