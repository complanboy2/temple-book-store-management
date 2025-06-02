
# Book Store Manager

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f63702ad-4b5d-400b-a1a3-b15b83e5793c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can! To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Building for Android

### Prerequisites

Before building for Android, ensure you have the following installed:

1. **Node.js and npm** - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
2. **Android Studio** - [Download from official site](https://developer.android.com/studio)
3. **Java Development Kit (JDK) 17** - Required for Android development
4. **Capacitor CLI** - Will be installed as part of the project dependencies

### Step 1: Initial Setup

1. Clone the repository and install dependencies:
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
```

2. Build the web app:
```sh
npm run build
```

3. Add Android platform:
```sh
npx cap add android
```

4. Copy web assets to native project:
```sh
npx cap copy android
```

### Step 2: Configure Android Settings

1. Open `android/app/build.gradle` and update the following:
   - `applicationId` - Change to your unique package name (e.g., `com.yourcompany.bookstoremanager`)
   - `versionCode` - Increment for each release (e.g., 1, 2, 3...)
   - `versionName` - Version string (e.g., "1.0.0")

2. Update `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Book Store Manager</string>
<string name="title_activity_main">Book Store Manager</string>
```

### Step 3: Update App Icons and Metadata

1. **App Icons**: Replace the default icons in `android/app/src/main/res/mipmap-*/` directories with your custom icons:
   - `ic_launcher.png` (various sizes: 48x48, 72x72, 96x96, 144x144, 192x192)
   - Use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html) to generate proper icons

2. **App Permissions**: Update `android/app/src/main/AndroidManifest.xml` if you need additional permissions:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<!-- Add other permissions as needed -->
```

### Step 4: Build the App

1. **Development Build** (for testing):
```sh
npx cap run android
```
This will open Android Studio and you can run the app on an emulator or connected device.

2. **Production Build**:
```sh
npx cap build android
```
Or build directly in Android Studio:
   - Open Android Studio
   - Open the `android` folder from your project
   - Build > Generate Signed Bundle/APK
   - Choose "Android App Bundle" for Play Store or "APK" for direct distribution

### Step 5: Signing the App for Release

1. **Generate a Keystore** (first time only):
```sh
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

2. **Configure Gradle for Signing**:
   - Create `android/keystore.properties`:
```properties
storeFile=../my-release-key.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=my-key-alias
keyPassword=YOUR_KEY_PASSWORD
```

   - Update `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. **Build Signed Release**:
```sh
cd android
./gradlew assembleRelease
```
The APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`

### Step 6: Publishing to Google Play Store

1. **Create Google Play Console Account**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Pay the one-time $25 registration fee
   - Verify your identity

2. **Prepare Store Listing**:
   - App name: "Book Store Manager"
   - Short description (80 characters max)
   - Full description (4000 characters max)
   - Screenshots (at least 2 phone screenshots, optional tablet/TV screenshots)
   - High-res icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Privacy policy URL (required for apps that handle personal data)

3. **App Content and Ratings**:
   - Complete the content rating questionnaire
   - Select target audience and content
   - Add data safety information

4. **Upload App Bundle**:
   - In Play Console, go to your app > Production > Create new release
   - Upload the signed Android App Bundle (.aab file)
   - Complete release notes
   - Review and rollout

5. **Required Information**:
   - App category: Business or Productivity
   - Content rating: Appropriate based on your content questionnaire
   - Target SDK version: 34 (Android 14) or latest
   - Privacy policy: Required if collecting user data
   - Data safety form: Detail what data you collect and how it's used

### Step 7: App Updates

For subsequent updates:

1. Increment version numbers in `android/app/build.gradle`
2. Build the web app: `npm run build`
3. Sync changes: `npx cap sync android`
4. Build and sign the release
5. Upload to Play Console as a new release

### Troubleshooting

**Common Issues:**

1. **Gradle Build Failures**:
   - Ensure Android SDK is properly installed
   - Check that ANDROID_HOME environment variable is set
   - Update Android SDK tools and platform tools

2. **Capacitor Sync Issues**:
   - Run `npx cap doctor` to check configuration
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

3. **App Signing Problems**:
   - Verify keystore file path and passwords
   - Ensure keystore properties file is properly configured

4. **Play Store Rejection**:
   - Review Google Play Developer Policy
   - Ensure all required metadata is complete
   - Test app thoroughly on different devices

### Testing Before Release

1. **Local Testing**:
   - Test on Android emulator
   - Test on physical Android devices
   - Verify all features work offline (if applicable)

2. **Internal Testing**:
   - Use Play Console's internal testing track
   - Distribute to a small group of testers
   - Gather feedback and fix issues

3. **Pre-Launch Report**:
   - Google Play automatically tests your app
   - Review the pre-launch report for crashes or issues
   - Fix any identified problems before public release

This comprehensive guide covers the entire process from development to publishing your Book Store Manager app on the Google Play Store.
