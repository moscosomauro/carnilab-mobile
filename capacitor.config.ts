import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.carnilab.app',
  appName: 'Carnilab',
  webDir: 'dist',

  // Configuracion del servidor
  server: {
    // Para desarrollo local, descomentar:
    // url: 'http://192.168.1.X:5173',
    // cleartext: true,
    androidScheme: 'https'
  },

  // Plugins
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#F5F1EB',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#6B8E23'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    Camera: {
      presentationStyle: 'fullscreen'
    }
  },

  // Android
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true // Desactivar en produccion
  },

  // iOS
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile'
  }
};

export default config;
