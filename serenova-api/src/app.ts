import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import sitesRoutes from './modules/sites/sites.routes';
import espacesRoutes from './modules/espaces/espaces.routes';
import espacesSiteRoutes from './modules/espaces/espaces-site.routes';
import locatairesRoutes from './modules/locataires/locataires.routes';
import bauxRoutes from './modules/baux/baux.routes';
import paiementsRoutes from './modules/paiements/paiements.routes';
import alertesRoutes from './modules/alertes/alertes.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import usersRoutes from './modules/users/users.routes';
import organisationsRoutes from './modules/organisations/organisations.routes';
import staffRoutes from './modules/staff/staff.routes';
import plansRoutes from './modules/plans/plans.routes';
import announcementsRoutes from './modules/announcements/announcements.routes';
import auditRoutes from './modules/audit/audit.routes';
import saasConfigRoutes from './modules/saas-config/saas-config.routes';
import billingRoutes from './modules/billing/billing.routes';
import documentRoutes from './modules/document/document.routes';
import alertsRoutes from './modules/alerts/alerts.routes';
import searchRoutes from './modules/search/search.routes';
import { initFirebase } from './config/firebase';
import { initScheduler, stopScheduler } from './jobs/scheduler';

const app: Express = express();

// Middlewares de sécurité
app.use(helmet());
app.use(cors());
app.use(express.json());

// Authentification et Utilisateurs
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/organisations', organisationsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/admin/config/payments', saasConfigRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/alerts', alertsRoutes);

// Patrimoine immobilier
app.use('/api/sites', sitesRoutes);
app.use('/api/sites/:siteId/espaces', espacesSiteRoutes);
app.use('/api/espaces', espacesRoutes);

// Locataires
app.use('/api/locataires', locatairesRoutes);

// Baux (contrats de location)
app.use('/api/baux', bauxRoutes);

// Paiements & Alertes
app.use('/api/paiements', paiementsRoutes);
app.use('/api/alertes', alertesRoutes);

// Dashboard & Analytiques
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
    let dbStatus = 'connected';
    try {
        await (prisma as any).$queryRaw`SELECT 1`;
    } catch (e) {
        dbStatus = 'disconnected';
    }

    res.status(dbStatus === 'connected' ? 200 : 503).json({
        status: dbStatus === 'connected' ? 'success' : 'error',
        message: 'SÉRÉNOVA API Status',
        database: dbStatus,
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
        version: '1.1.0',
    });
});

// Gestion globale des erreurs
app.use(errorHandler);

// Démarrage du serveur
if (require.main === module) {
    const server = app.listen(env.PORT, () => {
        console.log(`🚀 SÉRÉNOVA API démarrée sur http://localhost:${env.PORT}`);
        console.log(`🌍 Environnement: ${env.NODE_ENV}`);
        console.log(`📋 Health: http://localhost:${env.PORT}/api/health`);

        // Initialiser Firebase (pour les notifications)
        initFirebase();

        // Démarrer le planificateur de jobs si Redis est configuré
        if (process.env.REDIS_HOST || process.env.REDIS_PORT) {
            initScheduler();
        } else {
            console.log('⚠️  Redis non configuré — jobs cron désactivés (ajouter REDIS_HOST dans .env)');
        }
    });

    // Arrêt propre
    const shutdown = async () => {
        console.log('\n🛑 Arrêt du serveur...');
        await stopScheduler();
        server.close(() => process.exit(0));
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

export default app;
