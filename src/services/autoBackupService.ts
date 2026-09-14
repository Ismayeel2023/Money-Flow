import { AutoBackupCadence, AutoBackupConfig, BackupSnapshot } from '../types';
import { BackupExport, isNativeBackupExport } from '../plugins/backupExport';
import { downloadFile } from '../utils/downloadHelper';

const SNAPSHOTS_KEY = 'moneyflow_auto_snapshots_v1';
const CONFIG_KEY = 'moneyflow_autobackup_config_v1';

const memoryStore: Record<string, string> = {};

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {}
    return memoryStore[key] || null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
    } catch {}
    memoryStore[key] = value;
  },
  removeItem: (key: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
    } catch {}
    delete memoryStore[key];
  },
  clear: (): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch {}
    for (const k in memoryStore) {
      delete memoryStore[k];
    }
  },
};

export const DEFAULT_AUTOBACKUP_CONFIG: AutoBackupConfig = {
  enabled: true,
  cadence: 'daily',
  maxSnapshots: 5,
  notifyIfOverdue: true,
  compactExport: false,
};

export class AutoBackupService {
  /**
   * Generates a deterministic fast checksum (FNV-1a 32-bit hash) for payload integrity verification
   */
  public static calculateChecksum(str: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  public static verifyChecksum(str: string, expectedChecksum: string): boolean {
    return this.calculateChecksum(str) === expectedChecksum;
  }

  public static getConfig(): AutoBackupConfig {
    try {
      const saved = safeStorage.getItem(CONFIG_KEY);
      if (saved) {
        return { ...DEFAULT_AUTOBACKUP_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_AUTOBACKUP_CONFIG };
  }

  public static saveConfig(updates: Partial<AutoBackupConfig>): AutoBackupConfig {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    try {
      safeStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  }

  public static getSnapshots(): BackupSnapshot[] {
    try {
      const saved = safeStorage.getItem(SNAPSHOTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Creates and persists a new backup snapshot in the rolling vault.
   * Auto-prunes older snapshots to respect maxSnapshots while protecting safety rollback snapshots.
   */
  public static createSnapshot(
    dataObj: any,
    trigger: BackupSnapshot['trigger'],
    customLabel?: string
  ): BackupSnapshot {
    const config = this.getConfig();
    const compact = config.compactExport;
    const jsonString = compact ? JSON.stringify(dataObj) : JSON.stringify(dataObj, null, 2);
    const checksum = this.calculateChecksum(jsonString);

    const txCount = Array.isArray(dataObj?.transactions) ? dataObj.transactions.length : 0;
    const accCount = Array.isArray(dataObj?.accounts) ? dataObj.accounts.length : 0;
    const sizeBytes = typeof TextEncoder !== 'undefined'
      ? new TextEncoder().encode(jsonString).length
      : jsonString.length;

    let defaultLabel = 'Manual Snapshot';
    if (trigger === 'daily') defaultLabel = 'Daily Auto-Snapshot';
    else if (trigger === 'weekly') defaultLabel = 'Weekly Auto-Snapshot';
    else if (trigger === 'pre_restore') defaultLabel = 'Safety Rollback Before Restore';
    else if (trigger === 'on_change') defaultLabel = 'Ledger Update Snapshot';

    const newSnapshot: BackupSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      trigger,
      label: customLabel || defaultLabel,
      txCount,
      accCount,
      sizeBytes,
      checksum,
      data: jsonString,
    };

    const existing = this.getSnapshots();
    // Insert newest first
    let updated = [newSnapshot, ...existing];

    // Prune if exceeds maxSnapshots
    const limit = Math.max(3, config.maxSnapshots || 5);
    if (updated.length > limit) {
      // Retain pre_restore snapshots if possible, prune oldest regular snapshots
      const preRestores = updated.filter((s) => s.trigger === 'pre_restore');
      const regular = updated.filter((s) => s.trigger !== 'pre_restore');

      while (updated.length > limit && regular.length > 2) {
        regular.pop();
        updated = [...updated.filter((s) => s.trigger === 'pre_restore'), ...regular].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }

      if (updated.length > limit) {
        updated = updated.slice(0, limit);
      }
    }

    try {
      safeStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
      // Update last auto backup date if automated
      if (trigger === 'daily' || trigger === 'weekly' || trigger === 'on_change') {
        this.saveConfig({ lastAutoBackupDate: newSnapshot.timestamp });
      }
    } catch (err) {
      // Quota exceeded: prune to 2 snapshots and retry
      try {
        updated = updated.slice(0, 2);
        safeStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
      } catch {
        // Storage completely full
      }
    }

    return newSnapshot;
  }

  public static deleteSnapshot(id: string): void {
    const existing = this.getSnapshots();
    const updated = existing.filter((s) => s.id !== id);
    try {
      safeStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  public static clearAllSnapshots(): void {
    try {
      safeStorage.removeItem(SNAPSHOTS_KEY);
    } catch {
      // ignore
    }
  }

  public static clearStorageForTesting(): void {
    safeStorage.clear();
  }

  /**
   * Checks if an automated backup is currently due based on schedule and last run timestamp
   */
  public static isAutoBackupDue(config: AutoBackupConfig): boolean {
    if (!config.enabled) return false;
    if (config.cadence === 'manual') return false;

    if (!config.lastAutoBackupDate) return true;

    const lastTime = new Date(config.lastAutoBackupDate).getTime();
    if (isNaN(lastTime)) return true;

    const now = Date.now();
    const diffHours = (now - lastTime) / (1000 * 60 * 60);

    if (config.cadence === 'daily') {
      return diffHours >= 20; // 20 hours leeway so daily backup triggers reliably on first daily open
    }
    if (config.cadence === 'weekly') {
      return diffHours >= 24 * 6; // ~6 days
    }
    return false;
  }

  /**
   * Checks schedule and takes automated snapshot if due
   */
  public static checkAndRunAutoBackup(getCurrentData: () => any): BackupSnapshot | null {
    const config = this.getConfig();
    if (this.isAutoBackupDue(config)) {
      const data = getCurrentData();
      if (data && (data.transactions?.length > 0 || data.accounts?.length > 0)) {
        return this.createSnapshot(data, config.cadence === 'weekly' ? 'weekly' : 'daily');
      }
    }
    return null;
  }

  /**
   * Formats file size in readable KB / MB
   */
  public static formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Returns human relative time (e.g., "Just now", "2 hours ago", "Yesterday")
   */
  public static getRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
    const diffDays = Math.floor(diffSec / 86400);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  /**
   * Computes days since last backup or export
   */
  public static getDaysSinceLastBackup(lastIsoDate?: string): number {
    if (!lastIsoDate) return 999;
    const diffMs = Date.now() - new Date(lastIsoDate).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * Native Mobile / PWA Share Sheet integration.
   * Directly opens Android / iOS share dialog (Google Drive, WhatsApp, Gmail, Files).
   * Falls back to standard browser download.
   */
  /**
   * Direct guaranteed download to device storage with Blob and Data URI fallbacks.
   */
  public static async downloadBackupFile(
    jsonString: string,
    filename: string = `MoneyFlow_Backup_${new Date().toISOString().split('T')[0]}.json`
  ): Promise<{ success: boolean; method: string; message: string }> {
    return downloadFile(jsonString, filename, 'application/json;charset=utf-8;');
  }

  /**
   * Native Mobile / PWA Share Sheet integration with automatic fallback to download.
   */
  public static async shareOrDownloadBackup(
    jsonString: string,
    filename: string = `MoneyFlow_Backup_${new Date().toISOString().split('T')[0]}.json`,
    mimeType: string = 'application/json;charset=utf-8;'
  ): Promise<{ success: boolean; method: 'native_share' | 'download' | 'clipboard'; message: string }> {
    if (isNativeBackupExport()) {
      try {
        const native = await BackupExport.shareFile({
          content: jsonString,
          filename,
          mimeType,
        });
        return {
          success: native.success,
          method: 'native_share',
          message: native.message,
        };
      } catch {
        // fall through
      }
    }

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        const file = new File([blob], filename, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Money Flow Data Backup',
            text: `Offline backup of Money Flow ledger (${new Date().toLocaleDateString()}). Save to Google Drive or send to yourself on WhatsApp.`,
            files: [file],
          });
          return {
            success: true,
            method: 'native_share',
            message: 'Backup shared to selected app (Google Drive / WhatsApp / Files)!',
          };
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return { success: false, method: 'native_share', message: 'Share cancelled.' };
        }
        // Fallback to regular download
      }
    }

    // Standard download fallback using robust download helper
    const result = await downloadFile(jsonString, filename, mimeType);
    return {
      success: result.success,
      method: 'download',
      message: result.message,
    };
  }
}
