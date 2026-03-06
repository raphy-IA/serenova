import { impayesQueue } from './checkImpayes.job';
import { bauxExpirantsQueue } from './checkBauxExpirants.job';
import { espacesVacantsQueue } from './checkEspacesVacants.job';
import { applyEvolutionsQueue } from './applyEvolutions.job';
import { renewBauxQueue } from './renewBaux.job';

// -----------------------------------------------------------------------
// PLANIFICATEUR DE JOBS AUTOMATIQUES — SÉRÉNOVA
// Utilise Bull + cron expressions pour déclencher les jobs périodiques.
// Nécessite Redis en local ou en cloud.
// -----------------------------------------------------------------------

export const initScheduler = () => {
    console.log('🕐 Initialisation du planificateur de jobs...');

    // -----------------------------------------------
    // JOB 1: Vérification des impayés
    // Tous les jours à 9h00 (du lundi au dimanche)
    // -----------------------------------------------
    impayesQueue.add(
        {},
        {
            repeat: { cron: '0 9 * * *' }, // 09:00 chaque jour
            removeOnComplete: 50,
            removeOnFail: 20,
            jobId: 'impayes-daily',
        }
    );
    console.log('  ✅ Job impayes planifié: 09:00 quotidien');

    // -----------------------------------------------
    // JOB 2: Vérification des baux expirants
    // Tous les jours à 08h00
    // -----------------------------------------------
    bauxExpirantsQueue.add(
        {},
        {
            repeat: { cron: '0 8 * * *' }, // 08:00 chaque jour
            removeOnComplete: 50,
            removeOnFail: 20,
            jobId: 'baux-expirants-daily',
        }
    );
    console.log('  ✅ Job baux expirants planifié: 08:00 quotidien');

    // -----------------------------------------------
    // JOB 3: Espaces vacants
    // Chaque lundi à 07h00
    // -----------------------------------------------
    espacesVacantsQueue.add(
        {},
        {
            repeat: { cron: '0 7 * * 1' }, // 07:00 chaque lundi
            removeOnComplete: 20,
            removeOnFail: 10,
            jobId: 'espaces-vacants-weekly',
        }
    );
    console.log('  ✅ Job espaces vacants planifié: 07:00 hebdomadaire (lundi)');

    // -----------------------------------------------
    // JOB 4: Évolution des baux
    // Tous les jours à 06h00
    // -----------------------------------------------
    applyEvolutionsQueue.add(
        {},
        {
            repeat: { cron: '0 6 * * *' }, // 06:00 chaque jour
            removeOnComplete: 50,
            removeOnFail: 20,
            jobId: 'apply-evolutions-daily',
        }
    );
    console.log('  ✅ Job evolution baux planifié: 06:00 quotidien');

    // -----------------------------------------------
    // JOB 5: Renouvellement automatique des baux
    // Tous les jours à 05h00 (avant les évolutions)
    // -----------------------------------------------
    renewBauxQueue.add(
        {},
        {
            repeat: { cron: '0 5 * * *' }, // 05:00 chaque jour
            removeOnComplete: 50,
            removeOnFail: 20,
            jobId: 'renew-baux-daily',
        }
    );
    console.log('  ✅ Job renouvellement baux planifié: 05:00 quotidien');

    console.log('🚀 Planificateur démarré avec 5 jobs actifs');
};

// Arrêt propre de toutes les queues
export const stopScheduler = async () => {
    await Promise.all([
        impayesQueue.close(),
        bauxExpirantsQueue.close(),
        espacesVacantsQueue.close(),
        applyEvolutionsQueue.close(),
        renewBauxQueue.close(),
    ]);
    console.log('🛑 Planificateur arrêté proprement');
};
