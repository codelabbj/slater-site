import { messaging } from './firebase';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { sendTokenToBackend } from './fcm-helper';

let isInitialized = false;
let registrationToken: string | null = null;

/**
 * Initialize Push Notifications for Web App
 * Adapted from Capacitor implementation to standard Web APIs
 */
export async function initializePushNotifications(): Promise<void> {
    console.log('🚀 [TEST LOG] initializePushNotifications() called at:', new Date().toISOString());

    // Ne pas initialiser plusieurs fois
    if (isInitialized) {
        console.log('⚠️ [TEST LOG] Push notifications already initialized, skipping...');
        return;
    }

    console.log('🔍 [TEST LOG] Checking platform compatibility...');

    // Vérifier si on est sur un navigateur supporté
    const isBrowser = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

    if (!isBrowser) {
        console.log('❌ [TEST LOG] Push notifications not available on this platform (SSR or unsupported browser) - exiting');
        return;
    }

    // Vérifier si messaging est initialisé (peut être null si config manquante)
    if (!messaging) {
        console.log('❌ [TEST LOG] Firebase messaging not initialized - exiting');
        return;
    }

    const platform = 'web';
    console.log(`✅ [TEST LOG] Initializing push notifications on ${platform} platform`);
    console.log(`ℹ️ [TEST LOG] Platform: ${platform}, Agent: ${navigator.userAgent}`);

    try {
        // Vérifier d'abord l'état actuel des permissions
        console.log('🔐 [TEST LOG] Checking current push notification permissions...');
        let permStatus = Notification.permission;
        console.log('🔐 [TEST LOG] Current permission status:', permStatus);

        // Si la permission n'a pas encore été demandée (default), la demander
        if (permStatus === 'default') {
            console.log('📋 [TEST LOG] Requesting push notification permissions...');
            permStatus = await Notification.requestPermission();
            console.log('📋 [TEST LOG] Permission request result:', permStatus);
        } else if (permStatus === 'denied') {
            // Si la permission a été refusée, ne pas continuer
            console.warn('🚫 [TEST LOG] Push notification permission denied by user. User can enable it in browser settings.');
            return;
        } else if (permStatus === 'granted') {
            console.log('✅ [TEST LOG] Push notification permission already granted');
        }

        // Vérifier si la permission a été accordée avant de continuer
        if (permStatus !== 'granted') {
            console.warn('🚫 [TEST LOG] Push notification permission not granted:', permStatus);
            return;
        }

        console.log('✅ [TEST LOG] Push notification permission granted, setting up listeners...');

        // Simulation de création de canal pour la cohérence avec le code original
        // Sur le web, les "channels" n'existent pas comme sur Android, mais on garde le log
        console.log('✅ [TEST LOG] High priority notification channel "slater_foreground" logically ready');

        // IMPORTANT: Ajouter les listeners AVANT de récupérer le token
        console.log('👂 [TEST LOG] Adding push notification event listeners...');

        // Écouter les notifications reçues (quand l'app est au premier plan)
        onMessage(messaging, (payload: MessagePayload) => {
            console.log('📨 [TEST LOG] Push notification received while app in foreground:', {
                title: payload.notification?.title,
                body: payload.notification?.body,
                data: payload.data,
                timestamp: new Date().toISOString(),
            });

            // Afficher une notification locale quand l'app est en foreground
            // Sur le web, on utilise l'API Notification standard
            if (document.visibilityState === 'visible') {
                try {
                    const title = payload.notification?.title || 'Notification';
                    const options: NotificationOptions = {
                        body: payload.notification?.body || '',
                        icon: payload.notification?.icon || '/icon-192x192.png', // Fallback icon path
                        data: payload.data,
                        tag: 'slater_foreground', // Tag acts somewhat like a channel ID for grouping
                        requireInteraction: false
                    };

                    // Créer la notification native du navigateur
                    const notification = new Notification(title, options);

                    notification.onclick = (event) => {
                        console.log('👆 [TEST LOG] Foreground notification clicked:', event);
                        window.focus();
                        notification.close();
                        // Ici vous pouvez naviguer vers une page spécifique
                    };

                    console.log('✅ [TEST LOG] Local notification displayed for foreground push notification');
                } catch (error) {
                    console.error('❌ [TEST LOG] Error displaying local notification:', error);
                }
            }
        });

        console.log('👂 [TEST LOG] All listeners added, now registering for push notifications...');

        // Enregistrer pour recevoir les notifications (Récupérer le token FCM)
        console.log('📝 [TEST LOG] Getting FCM Token...');

        // VAPID key doit être fournie pour le web
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

        if (!vapidKey) {
            console.warn('⚠️ [TEST LOG] VAPID key is missing in environment variables');
        }

        const token = await getToken(messaging, { vapidKey });

        if (token) {
            console.log('🔔 [TEST LOG] Push registration success! Token received:', {
                token_preview: token.substring(0, 30) + '...',
                full_token_length: token.length,
                timestamp: new Date().toISOString(),
            });
            registrationToken = token;

            console.log(`📱 [TEST LOG] Platform detected: ${platform}, preparing to send token to backend...`);
            console.log(`📱 [TEST LOG] Device registration process starting for ${platform} platform`);

            // Enregistrer le device sur le backend
            // On utilise l'ID utilisateur s'il est disponible (à gérer par l'appelant ou un contexte)
            // Pour l'instant on passe undefined pour userId, à moins qu'on puisse le récupérer autrement
            await registerDeviceOnBackend(token, platform);
        } else {
            console.warn('⚠️ [TEST LOG] No registration token available. Request permission to generate one.');
        }

        isInitialized = true;
        console.log('✅ [TEST LOG] Push notifications registration process completed!');

    } catch (error) {
        console.error('❌ [TEST LOG] Error initializing push notifications:', error);
        // Log registration error structure similar to original code
        console.error('❌ [TEST LOG] Push notification registration error:', {
            error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            timestamp: new Date().toISOString(),
            platform: platform,
        });
    }
}

/**
 * Register device on backend
 * Wrapper around existing api utility
 */
async function registerDeviceOnBackend(token: string, type: string) {
    // Note: userId is required by sendTokenToBackend but we might not have it here directly

    // Essayer de récupérer l'ID utilisateur du stockage local (user_data)
    let userId = '';
    try {
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // On s'adapte à la structure de l'objet User du projet (id ou pk)
            userId = parsedUser.id || parsedUser.pk || parsedUser.uid || parsedUser.user_id;
            console.log(`🔍 [TEST LOG] Found user ID in localStorage: ${userId}`);
        }
    } catch (e) {
        console.warn('⚠️ [TEST LOG] Could not retrieve user ID for device registration');
    }

    if (userId) {
        console.log(`📤 [TEST LOG] Sending token to backend for user ${userId} using endpoint /mobcash/devices/...`);
        const success = await sendTokenToBackend(token, userId);
        if (success) {
            console.log('✅ [TEST LOG] Device registered on backend successfully');
        } else {
            console.error('❌ [TEST LOG] Failed to register device on backend');
        }
    } else {
        console.warn('⚠️ [TEST LOG] No user ID available. Token generated but not yet sent to backend /mobcash/devices/ (authentication required).');
        // Store token for later use when user logs in
        localStorage.setItem('fcm_token_pending', token);
    }
}
