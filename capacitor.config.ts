
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.templebooksutra.app',
  appName: 'Temple Book Sutra',
  webDir: 'dist',
  server: {
    url: 'https://f63702ad-4b5d-400b-a1a3-b15b83e5793c.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
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
      keystorePath: 'temple-book-sutra.keystore',
      keystoreAlias: 'templebooksutra',
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
