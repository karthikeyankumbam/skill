# Android Deployment Guide for SkillLink

## Current Status
✅ **Backend**: Ready (Node.js + MongoDB)  
✅ **Frontend**: React Web App (Responsive)  
🔄 **Android**: Needs Capacitor setup (instructions below)

## Prerequisites

1. **Node.js** (v16+)
2. **Java JDK** (11 or higher)
3. **Android Studio** (latest version)
4. **Android SDK** (API level 33+)
5. **Gradle** (comes with Android Studio)

## Setup Steps

### 1. Install Capacitor Dependencies

```bash
cd frontend
npm install
```

### 2. Build the Web App

```bash
npm run build
```

This creates a `dist` folder with the production build.

### 3. Initialize Capacitor (First Time Only)

```bash
npx cap init
```

When prompted:
- App name: `SkillLink`
- App ID: `com.skilllink.app`
- Web dir: `dist`

### 4. Add Android Platform

```bash
npx cap add android
```

### 5. Sync Web Assets to Android

```bash
npm run build
npx cap sync
```

This copies your web build to the Android project.

### 6. Open in Android Studio

```bash
npx cap open android
```

Or use:
```bash
npm run android
```

## Android Studio Configuration

### 1. Configure Build Settings

1. Open `android/app/build.gradle`
2. Update `minSdkVersion` to 22 (Android 5.1+)
3. Update `targetSdkVersion` to 33
4. Set `compileSdkVersion` to 33

### 2. Configure Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 3. Configure Network Security

For development, add `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

Update `AndroidManifest.xml`:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### 4. Update API Base URL

In `frontend/src/utils/api.js`, update for production:

```javascript
const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'https://your-backend-url.com/api',
  // ...
})
```

Create `.env.production`:
```
VITE_API_URL=https://your-backend-url.com/api
```

## Building APK/AAB

### Debug APK (Testing)

1. In Android Studio: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release AAB (Play Store)

1. Generate a keystore:
```bash
keytool -genkey -v -keystore skilllink-release.keystore -alias skilllink -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `android/keystore.properties`:
```
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=skilllink
storeFile=../skilllink-release.keystore
```

3. Update `android/app/build.gradle`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

4. Build Release AAB:
   - `Build` → `Generate Signed Bundle / APK` → `Android App Bundle`
   - Location: `android/app/build/outputs/bundle/release/app-release.aab`

## Testing on Device

### Option 1: USB Debugging
1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect device via USB
4. In Android Studio: `Run` → `Run 'app'`

### Option 2: Emulator
1. Create AVD in Android Studio
2. Run the app on emulator

## Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] API base URL updated in production
- [ ] App icons generated (all sizes)
- [ ] Splash screen configured
- [ ] Permissions configured
- [ ] Network security configured
- [ ] Keystore created for release
- [ ] App tested on real device
- [ ] Version code and name updated
- [ ] Release AAB built
- [ ] Google Play Console account ready

## App Icons

Generate app icons using:
- [App Icon Generator](https://www.appicon.co/)
- [Icon Kitchen](https://icon.kitchen/)

Place icons in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- `android/app/src/main/res/mipmap-*/ic_launcher_round.png`

## Common Issues

### 1. Build Errors
- Clean project: `Build` → `Clean Project`
- Invalidate caches: `File` → `Invalidate Caches`

### 2. Network Issues
- Check network security config
- Verify API URL is accessible
- Check CORS settings on backend

### 3. Capacitor Sync Issues
- Delete `android` folder
- Run `npx cap add android` again
- Run `npx cap sync`

## Quick Commands

```bash
# Build and sync
npm run build && npx cap sync

# Open Android Studio
npx cap open android

# Full Android workflow
npm run android
```

## Next Steps

1. **Complete Setup**: Follow steps 1-6 above
2. **Test Locally**: Build and test on device/emulator
3. **Configure Production**: Update API URLs and build settings
4. **Generate Icons**: Create app icons
5. **Build Release**: Create signed AAB for Play Store
6. **Submit**: Upload to Google Play Console

## Support

For issues:
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/)

