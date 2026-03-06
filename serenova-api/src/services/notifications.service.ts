import { getMessaging } from '../config/firebase';
import { prisma } from '../config/database';
import type { Message, MulticastMessage } from 'firebase-admin/messaging';

// -----------------------------------------------------------------------
// SERVICE DE NOTIFICATIONS PUSH — SÉRÉNOVA
// Toutes les notifications passent par Firebase Cloud Messaging (FCM).
// Chaque type de notification correspond à un template standardisé.
// -----------------------------------------------------------------------

export type NotifType =
    | 'IMPAYE'
    | 'BAIL_EXPIRANT'
    | 'ESPACE_VACANT'
    | 'PAIEMENT_RECU'
    | 'NOUVEAU_BAIL'
    | 'BAIL_RESILIE'
    | 'BAIL_RENOUVELE';

interface NotifPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}

const NOTIF_TEMPLATES: Record<NotifType, (params: Record<string, string>) => NotifPayload> = {
    IMPAYE: (p) => ({
        title: '🚨 Loyer impayé',
        body: `${p.locataire} — ${p.montant} ${p.devise} attendus depuis le ${p.date}`,
        data: { type: 'IMPAYE', bailId: p.bailId, screen: 'BailDetail' },
    }),
    BAIL_EXPIRANT: (p) => ({
        title: '📅 Bail expirant bientôt',
        body: `${p.locataire} — bail expire dans ${p.jours} jours (${p.dateFin})`,
        data: { type: 'BAIL_EXPIRANT', bailId: p.bailId, screen: 'BailDetail' },
    }),
    ESPACE_VACANT: (p) => ({
        title: '🏠 Espace vacant',
        body: `${p.identifiant} (${p.site}) est libre depuis plus de ${p.jours} jours`,
        data: { type: 'ESPACE_VACANT', espaceId: p.espaceId, screen: 'EspaceDetail' },
    }),
    PAIEMENT_RECU: (p) => ({
        title: '✅ Paiement reçu',
        body: `${p.locataire} — ${p.montant} ${p.devise} reçu pour ${p.mois}`,
        data: { type: 'PAIEMENT_RECU', paiementId: p.paiementId, screen: 'Paiements' },
    }),
    NOUVEAU_BAIL: (p) => ({
        title: '📋 Nouveau bail créé',
        body: `${p.locataire} — ${p.espace} (${p.site}) depuis le ${p.dateEntree}`,
        data: { type: 'NOUVEAU_BAIL', bailId: p.bailId, screen: 'BailDetail' },
    }),
    BAIL_RESILIE: (p) => ({
        title: '🔴 Bail résilié',
        body: `${p.locataire} — ${p.espace} libéré le ${p.dateSortie}. Motif: ${p.motif}`,
        data: { type: 'BAIL_RESILIE', bailId: p.bailId, screen: 'Baux' },
    }),
    BAIL_RENOUVELE: (p) => ({
        title: '🔁 Bail renouvelé',
        body: `${p.locataire} — ${p.espace} (${p.site}) — Prochaine échéance: ${p.dateFin}`,
        data: { type: 'BAIL_RENOUVELE', bailId: p.bailId, screen: 'BailDetail' },
    }),
};

// -----------------------------------------------------------------------
// Envoyer une notification à un device spécifique via son FCM token
// -----------------------------------------------------------------------
export const sendToDevice = async (
    fcmToken: string,
    notifType: NotifType,
    params: Record<string, string>
): Promise<boolean> => {
    const messaging = getMessaging();
    if (!messaging) return false;

    const payload = NOTIF_TEMPLATES[notifType](params);

    const message: Message = {
        token: fcmToken,
        notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: payload.imageUrl,
        },
        data: payload.data ?? {},
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                channelId: 'serenova_notifications',
            },
        },
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                    badge: 1,
                },
            },
        },
    };

    try {
        const response = await messaging.send(message);
        console.log(`📲 Notification envoyée [${notifType}] — FCM ID: ${response}`);
        return true;
    } catch (err: any) {
        // Token invalide ou expiré → on le supprime de la BDD
        if (err.code === 'messaging/registration-token-not-registered' ||
            err.code === 'messaging/invalid-registration-token') {
            await prisma.user.updateMany({
                where: { fcmToken },
                data: { fcmToken: null, fcmTokenUpdatedAt: null }
            });
            console.warn(`⚠️  Token FCM invalide supprimé — ${fcmToken.substring(0, 20)}...`);
        } else {
            console.error(`❌ Erreur envoi notification [${notifType}]:`, err.message);
        }
        return false;
    }
};

// -----------------------------------------------------------------------
// Envoyer des notifications à plusieurs utilisateurs (multicast, max 500)
// -----------------------------------------------------------------------
export const sendToMultipleDevices = async (
    fcmTokens: string[],
    notifType: NotifType,
    params: Record<string, string>
): Promise<{ success: number; failure: number }> => {
    const messaging = getMessaging();
    if (!messaging || fcmTokens.length === 0) return { success: 0, failure: 0 };

    const payload = NOTIF_TEMPLATES[notifType](params);
    const chunks: string[][] = [];

    // FCM multicast limite à 500 tokens par batch
    for (let i = 0; i < fcmTokens.length; i += 500) {
        chunks.push(fcmTokens.slice(i, i + 500));
    }

    let totalSuccess = 0;
    let totalFailure = 0;

    for (const chunk of chunks) {
        const message: MulticastMessage = {
            tokens: chunk,
            notification: { title: payload.title, body: payload.body },
            data: payload.data ?? {},
            android: { priority: 'high' },
        };

        try {
            const response = await messaging.sendEachForMulticast(message);
            totalSuccess += response.successCount;
            totalFailure += response.failureCount;

            // Supprimer les tokens invalides
            const invalidTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && (
                    resp.error?.code === 'messaging/registration-token-not-registered' ||
                    resp.error?.code === 'messaging/invalid-registration-token'
                )) {
                    invalidTokens.push(chunk[idx]);
                }
            });

            if (invalidTokens.length > 0) {
                await prisma.user.updateMany({
                    where: { fcmToken: { in: invalidTokens } },
                    data: { fcmToken: null, fcmTokenUpdatedAt: null }
                });
            }
        } catch (err: any) {
            console.error('❌ Erreur multicast FCM:', err.message);
            totalFailure += chunk.length;
        }
    }

    console.log(`📲 Multicast [${notifType}]: ${totalSuccess} réussies, ${totalFailure} échecs`);
    return { success: totalSuccess, failure: totalFailure };
};

// -----------------------------------------------------------------------
// Envoyer la notification à l'utilisateur propriétaire d'un bail
// (lookup userId → fcmToken → sendToDevice)
// -----------------------------------------------------------------------
export const notifyBailOwner = async (
    bailId: string,
    notifType: NotifType,
    params: Record<string, string>
): Promise<boolean> => {
    const bail = await prisma.bail.findUnique({
        where: { id: bailId },
        include: {
            espace: {
                include: { site: { include: { user: { select: { fcmToken: true } } } } }
            }
        }
    });

    if (!bail?.espace?.site?.user?.fcmToken) return false;
    return sendToDevice(bail.espace.site.user.fcmToken, notifType, params);
};
