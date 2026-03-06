import 'dotenv/config';
import * as admin from 'firebase-admin';

// -----------------------------------------------------------------------
// FIREBASE ADMIN SDK — SÉRÉNOVA
// Initialisation unique (singleton). Les credentials sont fournis via :
// 1. Variable GOOGLE_APPLICATION_CREDENTIALS (chemin vers service account JSON)
// 2. Ou variables individuelles FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
//    FIREBASE_PRIVATE_KEY dans le .env
// -----------------------------------------------------------------------

let firebaseApp: admin.app.App | null = null;

export const initFirebase = (): admin.app.App | null => {
    if (firebaseApp) return firebaseApp;

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.warn('⚠️  Firebase non configuré — notifications push désactivées (ajouter FIREBASE_* dans .env)');
        return null;
    }

    try {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Les clés privées dans .env ont les \n en littéral — on les remplace
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
        });
        console.log('🔥 Firebase Admin SDK initialisé pour le projet:', process.env.FIREBASE_PROJECT_ID);
        return firebaseApp;
    } catch (err: any) {
        console.error('❌ Erreur initialisation Firebase:', err.message);
        return null;
    }
};

export const getFirebase = () => firebaseApp;
export const getMessaging = () => firebaseApp ? admin.messaging(firebaseApp) : null;
