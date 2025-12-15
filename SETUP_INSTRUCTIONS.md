# Firebase Cross-Platform Setup Instructions

Complete setup guide for Firebase integration with Next.js web app and mobile apps (React Native/Flutter).

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Git installed
- Android Studio (for Android development)
- Xcode (for iOS development)

## 1. Firebase Project Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "Slater-app")
4. Enable Google Analytics (optional)
5. Create project

### Configure Web App

1. In Firebase Console, click "Add app" → Web
2. Register app with nickname (e.g., "Slater-web")
3. Copy the Firebase configuration object
4. Note down the configuration values for environment variables

### Generate VAPID Key

1. Go to Project Settings → Cloud Messaging
2. Scroll to "Web configuration"
3. Click "Generate key pair" under "Web push certificates"
4. Copy the VAPID key

### Enable Required Services

1. **Authentication**: Enable Email/Password or your preferred method
2. **Firestore**: Create database in production mode
3. **Storage**: Enable Cloud Storage
4. **Cloud Messaging**: Already enabled by default

## 2. Web App Setup

### Install Dependencies

```bash
# Install Firebase dependencies
npm install firebase firebase-admin

# Install Firebase CLI tools
npm install -g firebase-tools
```

### Configure Environment Variables

1. Copy the environment template:
```bash
cp env.template .env.local
```

2. Update `.env.local` with your Firebase configuration:
```env
# Get these from Firebase Console > Project Settings > General > Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# VAPID Key for Web Push Notifications
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Server-side Configuration (for API routes)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
```

### Update Service Worker Configuration

1. Open `public/firebase-messaging-sw.js`
2. Replace the placeholder configuration with your actual Firebase config:
```javascript
const firebaseConfig = {
  apiKey: "your_actual_api_key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id",
  measurementId: "your_measurement_id"
};
```

### Initialize Firebase CLI

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select the following features:
# - Hosting: Configure files for Firebase Hosting
# - Firestore: Configure security rules and indexes files
# - Functions: Configure a Cloud Functions directory
# - Storage: Configure a security rules file for Cloud Storage

# When prompted:
# - Select your Firebase project
# - Use "out" as your public directory (for Next.js static export)
# - Configure as single-page app: Yes
# - Set up automatic builds: No (for now)
```

## 3. Mobile App Setup

### Android App Setup

1. **Add Android App to Firebase**:
   - Go to Firebase Console → Project Settings
   - Click "Add app" → Android
   - Enter package name (e.g., `com.Slater.app`)
   - Download `google-services.json`

2. **Configure Android App**:
   - Place `google-services.json` in `android/app/` directory
   - Update `android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   
   dependencies {
       implementation 'com.google.firebase:firebase-messaging:23.4.0'
   }
   ```

3. **Update Android Manifest**:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.WAKE_LOCK" />
   ```

### iOS App Setup

1. **Add iOS App to Firebase**:
   - Go to Firebase Console → Project Settings
   - Click "Add app" → iOS
   - Enter bundle ID (e.g., `com.Slater.app`)
   - Download `GoogleService-Info.plist`

2. **Configure iOS App**:
   - Add `GoogleService-Info.plist` to your iOS project in Xcode
   - Update `ios/Podfile`:
   ```ruby
   pod 'Firebase/Messaging'
   ```

3. **Update iOS Info.plist**:
   ```xml
   <key>UIBackgroundModes</key>
   <array>
       <string>fetch</string>
       <string>remote-notification</string>
   </array>
   ```

## 4. Deep Linking Setup

### Android App Links

1. **Get SHA256 Fingerprint**:
   ```bash
   # For debug keystore
   keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For release keystore
   keytool -list -v -keystore android/app/release.keystore -alias your-key-alias
   ```

2. **Update assetlinks.json**:
   - Open `public/.well-known/assetlinks.json`
   - Replace `YOUR_ANDROID_APP_SHA256_FINGERPRINT_HERE` with your actual fingerprint
   - Update package name if different

3. **Configure Android Manifest**:
   ```xml
   <activity
       android:name=".MainActivity"
       android:exported="true"
       android:launchMode="singleTop">
       <intent-filter android:autoVerify="true">
           <action android:name="android.intent.action.VIEW" />
           <category android:name="android.intent.category.DEFAULT" />
           <category android:name="android.intent.category.BROWSABLE" />
           <data android:scheme="https"
                 android:host="your-domain.com" />
       </intent-filter>
   </activity>
   ```

### iOS Universal Links

1. **Create apple-app-site-association**:
   - Create file at `https://your-domain.com/.well-known/apple-app-site-association`
   - Content:
   ```json
   {
       "applinks": {
           "apps": [],
           "details": [
               {
                   "appID": "TEAM_ID.com.Slater.app",
                   "paths": ["*"]
               }
           ]
       }
   }
   ```

2. **Update iOS Info.plist**:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
       <dict>
           <key>CFBundleURLName</key>
           <string>your-domain.com</string>
           <key>CFBundleURLSchemes</key>
           <array>
               <string>https</string>
           </array>
       </dict>
   </array>
   ```

## 5. Testing Setup

### Local Development

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Test Firebase connection**:
   - Open browser console
   - Check for Firebase initialization messages
   - Test notification permission request

3. **Test service worker**:
   - Open DevTools → Application → Service Workers
   - Verify `firebase-messaging-sw.js` is registered
   - Check for any errors

### Firebase Hosting

1. **Build and deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

2. **Test on production**:
   - Visit your Firebase Hosting URL
   - Test notification functionality
   - Verify deep linking works

## 6. Notification Testing

### Send Test Notifications

1. **Using Firebase Console**:
   - Go to Cloud Messaging
   - Click "Send your first message"
   - Enter title and body
   - Select target (token, topic, or app)
   - Send message

2. **Using API**:
   ```bash
   curl -X POST https://your-domain.com/api/fcm/send \
     -H "Content-Type: application/json" \
     -d '{
       "tokens": ["your_fcm_token"],
       "title": "Test Notification",
       "body": "This is a test message",
       "data": {
         "url": "https://your-domain.com/test"
       }
     }'
   ```

### Test Scenarios

1. **Web Notifications**:
   - Enable notifications in browser
   - Send notification from mobile app
   - Verify web notification appears
   - Test click behavior

2. **Mobile Notifications**:
   - Install mobile app
   - Send notification from web
   - Verify mobile notification appears
   - Test deep linking

3. **Cross-Platform Deep Linking**:
   - Send notification with URL from web
   - Click notification on mobile
   - Verify app opens and navigates correctly
   - Test reverse scenario

## 7. Production Deployment

### Environment Setup

1. **Production Firebase Project**:
   - Create separate Firebase project for production
   - Configure production environment variables
   - Set up production certificates for mobile apps

2. **Domain Configuration**:
   - Set up custom domain in Firebase Hosting
   - Update assetlinks.json with production domain
   - Configure SSL certificates

3. **Security Rules**:
   - Review and update Firestore security rules
   - Configure Cloud Storage security rules
   - Set up proper authentication

### Deployment Commands

```bash
# Build and deploy web app
npm run build
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions (if any)
firebase deploy --only functions

# Deploy everything
firebase deploy
```

### Monitoring and Analytics

1. **Firebase Analytics**:
   - Enable in Firebase Console
   - Set up custom events
   - Monitor user engagement

2. **Crashlytics**:
   - Enable for mobile apps
   - Monitor crash reports
   - Set up alerts

3. **Performance Monitoring**:
   - Enable for web and mobile
   - Monitor app performance
   - Track notification delivery rates

## 8. Troubleshooting

### Common Issues

1. **Service Worker Not Registering**:
   - Check file path: `/firebase-messaging-sw.js`
   - Verify Firebase configuration
   - Check browser console for errors

2. **Notifications Not Received**:
   - Verify VAPID key configuration
   - Check notification permission status
   - Test with Firebase Console first

3. **Deep Links Not Working**:
   - Verify SHA256 fingerprints
   - Check assetlinks.json format
   - Test with Android App Links Assistant

4. **Token Generation Issues**:
   - Check Firebase configuration
   - Verify service worker registration
   - Check browser compatibility

### Debug Commands

```bash
# Check Firebase project status
firebase projects:list

# Test Firebase functions locally
firebase functions:shell

# Check hosting configuration
firebase hosting:channel:list

# Verify app links
curl -s "https://your-domain.com/.well-known/assetlinks.json" | jq
```

### Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Firebase](https://rnfirebase.io/)
- [Flutter Firebase](https://firebase.flutter.dev/)

## 9. Security Best Practices

1. **Environment Variables**:
   - Never commit `.env.local` to version control
   - Use different projects for development/production
   - Rotate API keys regularly

2. **Token Management**:
   - Store FCM tokens securely on server
   - Implement token refresh logic
   - Handle token expiration gracefully

3. **Deep Link Validation**:
   - Validate URLs before processing
   - Implement URL whitelisting
   - Handle malicious links safely

4. **Notification Content**:
   - Sanitize notification content
   - Implement rate limiting
   - Monitor for abuse

## 10. Maintenance

### Regular Tasks

1. **Update Dependencies**:
   ```bash
   npm update
   npm audit fix
   ```

2. **Monitor Performance**:
   - Check Firebase Console metrics
   - Monitor notification delivery rates
   - Review error logs

3. **Security Updates**:
   - Update Firebase SDK versions
   - Review security rules
   - Monitor for vulnerabilities

### Backup and Recovery

1. **Firestore Data**:
   - Set up automated backups
   - Test restore procedures
   - Document recovery processes

2. **Configuration**:
   - Version control all config files
   - Document environment variables
   - Maintain deployment scripts

This completes the comprehensive Firebase cross-platform setup. Follow each section carefully and test thoroughly before deploying to production.
