import { Capacitor, registerPlugin } from '@capacitor/core';

export interface DeviceUnlockPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  authenticate(options?: { reason?: string }): Promise<{ success: boolean; error?: string }>;
}

const DeviceUnlock = registerPlugin<DeviceUnlockPlugin>('DeviceUnlock', {
  web: () => ({
    isAvailable: async () => ({ available: false }),
    authenticate: async () => ({ success: false, error: 'Not on a native device.' }),
  }),
});

export const isNativeAndroid = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export { DeviceUnlock };
