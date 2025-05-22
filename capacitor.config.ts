
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
      clearCache: false,
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
    webContentsDebuggingEnabled: true, // Enable for development debugging
    minSdkVersion: 22,
    initialNavigation: 'homepage',
    allowMixedContent: true,
    captureInput: true,
    useLegacyBridge: false,
    overrideUserAgent: null,
    backgroundColor: "#FFF8EE"
  },
  ios: {
    contentInset: "always"
  }
};

export default config;
