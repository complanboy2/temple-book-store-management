
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f63702ad4b5d400ba1a3b15b83e5793c',
  appName: 'temple-book-sutra',
  webDir: 'dist',
  server: {
    url: 'https://f63702ad-4b5d-400b-a1a3-b15b83e5793c.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  // Enable live reload for development
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#FFF8EE",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#F97316",
    }
  }
};

export default config;
