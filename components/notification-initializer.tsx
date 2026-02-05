"use client";

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { initializePushNotifications } from '@/lib/push-notifications';
import { sendTokenToBackend } from '@/lib/fcm-helper';

/**
 * NotificationInitializer Component
 * Automatically initializes push notifications when the component mounts.
 * Also handles re-syncing the token if the user logs in after initialization.
 */
export function NotificationInitializer() {
    const { user } = useAuth();

    useEffect(() => {
        // Initialiser les notifications push au montage
        console.log('🔄 [TEST LOG] NotificationInitializer mounted, calling initializePushNotifications()');
        initializePushNotifications();
    }, []);

    useEffect(() => {
        // Si l'utilisateur est maintenant connecté et qu'on a un token en attente
        if (user) {
            const pendingToken = localStorage.getItem('fcm_token_pending');
            const registeredToken = localStorage.getItem('fcm_token');
            const tokenToSync = pendingToken || registeredToken;

            if (tokenToSync) {
                const userId = user.id || (user as any).pk || (user as any).uid;
                console.log(`📡 [TEST LOG] User authenticated (${userId}), checking if token needs sync...`);

                // On synchronise avec le backend
                if (userId) {
                    sendTokenToBackend(tokenToSync, userId).then(success => {
                        if (success) {
                            console.log('✅ [TEST LOG] Pending/Registered token synced with backend for authenticated user');
                            localStorage.removeItem('fcm_token_pending');
                        }
                    });
                }
            }
        }
    }, [user]);

    return null; // Ce composant ne fait pas de rendu UI
}
