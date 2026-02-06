import { fcmService } from './firebase';
import { deviceApi } from './api-client';

/**
 * Initialize FCM and get token
 * @returns FCM token or null if permission denied/error
 */
export async function initializeFCM(userId?: string): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    console.log('[FCM] Starting initialization...');

    // Check current permission state first
    const currentPermission = Notification.permission;
    console.log('[FCM] Current permission:', currentPermission);

    if (currentPermission === 'denied') {
      console.warn('[FCM] Notification permission is already denied');
      return null;
    }

    // Register service worker first
    console.log('[FCM] Registering service worker...');
    await fcmService.registerServiceWorker();
    console.log('[FCM] Service worker registered');

    // Request notification permission (this will show the browser prompt)
    console.log('[FCM] Requesting notification permission...');
    const permission = await fcmService.requestNotificationPermission();
    console.log('[FCM] Permission result:', permission);

    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission not granted:', permission);
      return null;
    }

    // Get FCM token
    console.log('[FCM] Getting FCM token...');
    const token = await fcmService.refreshToken();

    if (token) {
      console.log('[FCM] Token generated successfully:', token.substring(0, 20) + '...');
      // Store token in localStorage for persistence
      localStorage.setItem('fcm_token', token);

      // Send token to backend if userId provided
      if (userId) {
        await sendTokenToBackend(token, userId);
      }
    } else {
      console.warn('[FCM] No token generated');
    }

    return token;
  } catch (error) {
    console.error('[FCM] Error initializing FCM:', error);
    return null;
  }
}

/**
 * Send FCM token to backend
 * @param token FCM token (registration_id)
 * @param userId User ID (required)
 * @returns Promise<boolean> Success status
 */
export async function sendTokenToBackend(
  token: string,
  userId?: string
): Promise<boolean> {
  if (!userId) {
    console.warn('[FCM] User ID is required to send token to backend');
    return false;
  }

  try {
    // Send to the devices endpoint with the required payload format via deviceApi
    await deviceApi.register(token, userId);

    console.log('[FCM] Token sent to backend successfully');
    return true;
  } catch (error: any) {
    console.error('[FCM] Error sending token to backend:', error);
    // Don't show toast error for FCM token registration failures
    return false;
  }
}

/**
 * Complete FCM setup flow
 * 1. Request permission
 * 2. Get token
 * 3. Send to backend
 * @param userId Optional user ID
 * @returns Promise<string | null> FCM token or null
 */
export async function setupNotifications(userId?: string): Promise<string | null> {
  try {
    // Step 1: Initialize FCM and get token (userId is passed through to backend)
    const token = await initializeFCM(userId);

    if (!token) {
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return null;
  }
}

/**
 * Setup foreground message listener
 */
export function setupForegroundListener(
  onMessage: (payload: any) => void
): void {
  fcmService.setupForegroundListener((payload) => {
    console.log('Foreground message received:', payload);
    onMessage(payload);
  });
}

