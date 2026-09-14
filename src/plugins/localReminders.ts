import { Capacitor, registerPlugin } from '@capacitor/core';

export interface LocalRemindersPlugin {
  requestPermission(): Promise<{ granted: boolean }>;
  scheduleExpenseReminders(options: { enabled: boolean }): Promise<{ scheduled: boolean }>;
  setHasExpenseToday(options: { logged: boolean; date: string }): Promise<void>;
  showNow(options: { title: string; body: string; id?: number }): Promise<{ shown: boolean }>;
  consumePendingOpenTab(): Promise<{ tab?: string }>;
}

const LocalReminders = registerPlugin<LocalRemindersPlugin>('LocalReminders', {
  web: () => ({
    requestPermission: async () => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return { granted: false };
      }
      const perm = await Notification.requestPermission();
      return { granted: perm === 'granted' };
    },
    scheduleExpenseReminders: async () => ({ scheduled: false }),
    setHasExpenseToday: async () => {},
    showNow: async (options) => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return { shown: false };
      }
      if (Notification.permission !== 'granted') {
        return { shown: false };
      }
      try {
        new Notification(options.title, { body: options.body, tag: `mf-${options.id || 'now'}` });
        return { shown: true };
      } catch {
        return { shown: false };
      }
    },
    consumePendingOpenTab: async () => ({}),
  }),
});

export { LocalReminders };
