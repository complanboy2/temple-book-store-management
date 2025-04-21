
# Temple Book Stall Mobile App

This project has been configured to work as a mobile application using Capacitor for both Android and iOS.

## Prerequisites

- For iOS development:
  - Mac with macOS (required for iOS development)
  - Xcode installed
  - iOS device or simulator

- For Android development:
  - Android Studio installed
  - Android device or emulator

## Getting Started

1. Clone this repository to your local machine
2. Install dependencies:
   ```bash
   npm install
   ```

## Building and Running the App

### Preparing the app

1. Build the web app:
   ```bash
   npm run build
   ```

2. Sync the build with Capacitor:
   ```bash
   npx cap sync
   ```

### For Android

1. Open the Android project:
   ```bash
   npx cap open android
   ```
   This will open the project in Android Studio.

2. In Android Studio, click the "Run" button to build and run the app on an emulator or connected device.

### For iOS

1. Open the iOS project:
   ```bash
   npx cap open ios
   ```
   This will open the project in Xcode.

2. In Xcode, select a target device (simulator or connected device) and click the "Run" button.

## Development Workflow

During development, you can use the hot reload feature by running:

```bash
npm run dev
```

This will start a development server. The Capacitor configuration is set up to connect to this server for testing changes without rebuilding the native app.

## Troubleshooting

- If you encounter issues with plugins, try running:
  ```bash
  npx cap update
  ```

- To update the native dependencies:
  ```bash
  npx cap update ios  # For iOS
  npx cap update android  # For Android
  ```

- If you make changes to the Capacitor configuration, run:
  ```bash
  npx cap copy
  ```

## App Signing and Distribution

### Android

To generate a signed APK or AAB for Google Play Store:
1. In Android Studio, go to Build > Generate Signed Bundle/APK
2. Follow the instructions to create or use an existing keystore
3. Choose the appropriate build type (release)
4. Configure ProGuard (optional)
5. Finish the build process

### iOS

To prepare for App Store submission:
1. In Xcode, select Product > Archive
2. Once the archive is created, the Organizer window will appear
3. Select the archive and click "Distribute App"
4. Follow the instructions to prepare for App Store submission

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Development Guide](https://developer.apple.com/documentation/)
- [Android Development Guide](https://developer.android.com/guide)
