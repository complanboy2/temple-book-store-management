
# Book Store Management - Android Publication Guide

This document provides instructions for preparing and publishing the Book Store Management app to the Google Play Store.

## Prerequisites

1. Google Play Developer Account ($25 one-time fee)
2. App signing key (already configured in capacitor.config.ts)
3. Android Studio installed
4. Required app assets (icons, screenshots, etc.)

## Required Assets

Before submitting to the Play Store, prepare the following assets:

### App Icon

- High-resolution app icon (512x512px PNG)
- Adaptive icon components:
  - Foreground: Transparent PNG with the main icon
  - Background: Solid color or simple pattern

### Screenshots

- At least 2 phone screenshots
- Optional: tablet screenshots
- Screenshots should showcase main app features:
  - Dashboard with stats
  - Book management
  - Sales reports
  - Search functionality

### Feature Graphic

- 1024x500px promotional banner for the store listing

### Privacy Policy

The privacy policy is already available at the `/privacy-policy` route in the app. For the Play Store, you'll need a public URL to this policy.

## Build and Generate AAB

1. Build the web app:
   ```bash
   npm run build
   ```

2. Sync the build with Capacitor:
   ```bash
   npx cap sync android
   ```

3. Open Android Studio:
   ```bash
   npx cap open android
   ```

4. In Android Studio, select Build > Generate Signed Bundle/APK
5. Choose Android App Bundle (AAB)
6. Use the existing keystore from the project:
   - Path: `book-store-management.keystore`
   - Alias: `bookstoremanagement`
   - Enter the passwords when prompted
7. Choose a destination folder and complete the build

## Play Store Submission

1. Log into the [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Fill out the store listing:
   - Title: Book Store Management
   - Short description: Efficient book stall management app
   - Full description: [Add detailed app description]
   - Upload all prepared assets
4. Set up content rating (complete the rating questionnaire)
5. Set pricing and distribution (free or paid)
6. Upload the AAB file generated earlier
7. Submit for review

## Important Notes

- The initial review may take several days
- Testing with a closed track (internal testing) is recommended before full publication
- Make sure the app complies with Google's [Developer Program Policies](https://play.google.com/about/developer-content-policy/)
