import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bridge.appChapal',
  appName: 'international-bridge',
  webDir: 'dist/internationalBridge/browser',
  ios: {
    zoomEnabled: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
