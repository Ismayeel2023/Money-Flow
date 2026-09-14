import { Capacitor, registerPlugin } from '@capacitor/core';

export interface BackupExportPlugin {
  shareFile(options: {
    content: string;
    filename: string;
    mimeType?: string;
  }): Promise<{ success: boolean; message: string }>;
}

const BackupExport = registerPlugin<BackupExportPlugin>('BackupExport', {
  web: () => ({
    shareFile: async () => ({
      success: false,
      message: 'Native share is only available on Android.',
    }),
  }),
});

export { BackupExport };
export const isNativeBackupExport = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
