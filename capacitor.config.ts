import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.couturevip.app',
  appName: 'Couture VIP',
  webDir: 'build',          // ← ton dossier CRA compilé
 
  server: {
    cleartext: true         // ← autorise HTTP non sécurisé (utile pour Railway/local)
    // ⚠️ Ne mets PAS "url" ici, sinon Capacitor ignore ton frontend et ouvre ton backend
  }
};

export default config;
