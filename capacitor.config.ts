
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bookstoremanagement.app',
  appName: 'Book Store Management',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#FFF8EE",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#F97316",
    },
    WebView: {
      allowFileAccess: true,
      allowFileAccessFromFileURLs: true,
      allowUniversalAccessFromFileURLs: true,
      clearCache: true, // Clear WebView cache on app start
      scrollEnabled: true,
      serverAssets: ["www"],
      androidScheme: "https"
    }
  },
  android: {
    buildOptions: {
      keystorePath: 'book-store-management.keystore',
      keystoreAlias: 'bookstoremanagement',
    },
    webContentsDebuggingEnabled: false, // Disable WebView debugging in production
    minSdkVersion: 22,
    initialNavigation: 'homepage',
    allowMixedContent: true, // Allow loading mixed content
    captureInput: true, // Better input handling
    useLegacyBridge: false // Use the modern bridge
  },
  ios: {
    contentInset: "always"
  }
};

export default config;
