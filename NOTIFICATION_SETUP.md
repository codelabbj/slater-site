# Firebase Notification Setup Guide

This guide explains how to receive Firebase Cloud Messaging (FCM) notifications in your Next.js app **without deploying to Firebase Hosting**.

## 📋 Prerequisites

- Firebase project created
- Firebase configuration values from the Firebase Console
- Web app configured in Firebase Console

## 🚀 Quick Start

### 1. Environment Variables (Already Done ✅)

Your `.env.local` file is configured with:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDj4CbDhlN_dxQ1exeCtPTgSZZfN8IAddM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=Slater-57c48.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=Slater-57c48
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=Slater-57c48.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=665076337085
NEXT_PUBLIC_FIREBASE_APP_ID=1:665076337085:web:850ace1ccae6ff90292ad4
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-SWVTK18YGF
```

### 2. Service Worker (Already Configured ✅)

The `public/firebase-messaging-sw.js` file contains your Firebase configuration for receiving background messages.

### 3. Add VAPID Key (Required)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **Slater-57c48**
3. Go to **Project Settings** → **Cloud Messaging** tab
4. Under **Web configuration**, click **Generate key pair**
5. Copy the generated key
6. Update `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_generated_vapid_key_here
   ```

## 🎯 How It Works

### Complete Flow

```
User Opens App → Request Permission → Get FCM Token → Send Token to Backend
                                                              ↓
                                                    Backend Stores Token
                                                              ↓
                                                    Admin Sends via Firebase API
                                                              ↓
                                                    Firebase Delivers to Browser
                                                              ↓
                                          Service Worker Receives Message
                                                              ↓
                                          Notification Shown to User
```

### Key Components

#### 1. **Service Worker** (`public/firebase-messaging-sw.js`)
- Runs in the background even when the app is closed
- Handles background push messages
- Displays browser notifications

#### 2. **FCM Service** (`lib/firebase.ts`)
- Manages FCM token lifecycle
- Requests notification permissions
- Registers service worker
- Handles foreground messages

#### 3. **Notification Manager** (`components/NotificationManager.tsx`)
- User-friendly UI for managing notifications
- Shows permission status
- Displays FCM token
- Handles enable/disable

## 📱 Testing Notifications

### Option 1: Using Firebase Console

1. Go to Firebase Console → **Cloud Messaging**
2. Click **Send your first message**
3. Enter title and message
4. Click **Send test message**
5. Enter your FCM token (shown in NotificationManager component)

### Option 2: Using API

```bash
curl -X POST http://localhost:3000/api/fcm/send \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your_fcm_token_here",
    "title": "Test Notification",
    "body": "This is a test message",
    "data": {
      "url": "https://your-app.com/test"
    }
  }'
```

### Option 3: Using Your Backend API

If you have a backend API, send notifications using Firebase Admin SDK:

```javascript
// Backend API endpoint
import { getMessaging } from 'firebase-admin/messaging';

const message = {
  notification: {
    title: 'New Transaction',
    body: 'Your transaction was successful'
  },
  token: fcm_token, // User's FCM token
  webpush: {
    fcmOptions: {
      link: 'https://your-app.com/transaction/123'
    }
  }
};

const response = await getMessaging().send(message);
```

## 🔧 Integrating with Your App

### Basic Usage

```tsx
import { fcmService } from '@/lib/firebase';
import { useEffect } from 'react';

export default function MyComponent() {
  useEffect(() => {
    const initNotifications = async () => {
      // Register service worker
      await fcmService.registerServiceWorker();
      
      // Initialize FCM and get token
      await fcmService.initialize();
      
      const token = fcmService.getToken();
      console.log('FCM Token:', token);
      
      // Send token to your backend
      if (token) {
        await fetch('/api/fcm/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, platform: 'web' })
        });
      }
      
      // Listen for foreground messages
      fcmService.setupForegroundListener((payload) => {
        console.log('Message received:', payload);
        // Show toast notification or handle data
      });
    };

    initNotifications();
  }, []);
  
  return <div>Your component</div>;
}
```

### Using the Notification Manager Component

```tsx
import { NotificationManager } from '@/components/NotificationManager';

export default function SettingsPage() {
  const handleTokenChange = (token: string | null) => {
    // Send token to your backend
    if (token) {
      fetch('https://your-api.com/devices/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: token,
          type: 'web'
        })
      });
    }
  };

  return (
    <div>
      <NotificationManager onTokenChange={handleTokenChange} />
    </div>
  );
}
```

## 🎨 Features

✅ **Background Notifications** - Works even when the app is closed  
✅ **Foreground Messages** - Custom handling when the app is open  
✅ **Service Worker** - Automatically registered and managed  
✅ **Permission Handling** - User-friendly permission request flow  
✅ **Token Management** - Automatic token refresh and storage  
✅ **Cross-Platform** - Same backend can send to web and mobile  
✅ **Rich Notifications** - Support for images, actions, and deep links

## 🐛 Troubleshooting

### Notifications Not Working?

1. **Check Browser Support**
   - Notifications work in: Chrome, Firefox, Safari, Edge
   - HTTPS required (or localhost for development)

2. **Check Permission**
   - Browser must allow notifications
   - Check in NotificationManager component

3. **Check Service Worker**
   - Open DevTools → Application → Service Workers
   - Ensure `firebase-messaging-sw.js` is registered

4. **Check VAPID Key**
   - Must be set in `.env.local`
   - Must match Firebase Console

5. **Check Console**
   - Look for errors in browser console
   - Check service worker logs

### Common Issues

**Issue**: "Messaging: We are unable to register the default service worker"
- **Solution**: Ensure `firebase-messaging-sw.js` exists in `public/` directory

**Issue**: "Notification permission denied"
- **Solution**: User needs to enable notifications in browser settings

**Issue**: "No token available"
- **Solution**: Check VAPID key and Firebase configuration

## 📚 API Reference

### FCM Service Methods

```typescript
// Initialize notifications
await fcmService.initialize()

// Get current token
const token = fcmService.getToken()

// Refresh token
const newToken = await fcmService.refreshToken()

// Request permission
const permission = await fcmService.requestNotificationPermission()

// Setup foreground listener
fcmService.setupForegroundListener((payload) => {
  // Handle message
})

// Register service worker
const registration = await fcmService.registerServiceWorker()

// Unsubscribe
await fcmService.unsubscribe()
```

## 🚢 Deployment

This notification system works with **any hosting platform**:

- ✅ Vercel
- ✅ Netlify
- ✅ AWS Amplify
- ✅ Your own server
- ✅ Firebase Hosting (optional)

You don't need to deploy to Firebase Hosting to use Firebase Cloud Messaging!

## 📞 Support

For issues or questions:
1. Check the Firebase Console for delivery logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test with Firebase Console's test message feature

---

**Note**: This is a pure notification system. You can deploy your app anywhere and still receive Firebase notifications!


