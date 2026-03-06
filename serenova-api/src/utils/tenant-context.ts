import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
    organisationId?: string;
    userId: string;
    role: string;
}

export const tenantLocalStorage = new AsyncLocalStorage<TenantContext>();

export const getTenantContext = () => tenantLocalStorage.getStore();

export const runWithTenantContext = <T>(context: TenantContext, fn: () => T): T => {
    return tenantLocalStorage.run(context, fn);
};
