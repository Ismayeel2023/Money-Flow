import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface NotificationPostedEvent {
  packageName: string;
  title: string;
  text: string;
}

export interface NotificationAccessPlugin {
  isEnabled(): Promise<{ enabled: boolean }>;
  openSettings(): Promise<void>;
  addListener(
    eventName: 'notificationPosted',
    listenerFunc: (event: NotificationPostedEvent) => void
  ): Promise<PluginListenerHandle>;
}

const NotificationAccess = registerPlugin<NotificationAccessPlugin>('NotificationAccess', {
  web: () => ({
    isEnabled: async () => ({ enabled: false }),
    openSettings: async () => {},
    addListener: async () => ({
      remove: async () => {},
    }),
  }),
});

export const isNativeAndroid = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export { NotificationAccess };
