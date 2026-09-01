import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.leadybag.store',
  appName: 'leadybag',
  webDir: 'public',
  server: {
    url: 'https://leady-bag-store.vercel.app',
    cleartext: true
  }
};

export default config;