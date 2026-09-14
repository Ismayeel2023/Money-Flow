import { describe, it, expect, beforeEach } from 'vitest';
import { AutoBackupService, DEFAULT_AUTOBACKUP_CONFIG } from './autoBackupService';

describe('AutoBackupService', () => {
  beforeEach(() => {
    AutoBackupService.clearStorageForTesting();
  });

  it('calculates deterministic checksum and verifies it', () => {
    const data = JSON.stringify({ hello: 'world', count: 42 });
    const checksum1 = AutoBackupService.calculateChecksum(data);
    const checksum2 = AutoBackupService.calculateChecksum(data);
    expect(checksum1).toBe(checksum2);
    expect(checksum1.length).toBe(8);

    expect(AutoBackupService.verifyChecksum(data, checksum1)).toBe(true);
    expect(AutoBackupService.verifyChecksum(data + 'corrupted', checksum1)).toBe(false);
  });

  it('manages config persistence with defaults', () => {
    const config = AutoBackupService.getConfig();
    expect(config.enabled).toBe(true);
    expect(config.cadence).toBe('daily');
    expect(config.maxSnapshots).toBe(5);

    AutoBackupService.saveConfig({ cadence: 'weekly', maxSnapshots: 10 });
    const updated = AutoBackupService.getConfig();
    expect(updated.cadence).toBe('weekly');
    expect(updated.maxSnapshots).toBe(10);
  });

  it('creates and retrieves snapshots with auto-label and metrics', () => {
    const sampleData = {
      appName: 'Money Flow',
      transactions: [{ id: '1', amount: 500 }, { id: '2', amount: 1200 }],
      accounts: [{ id: 'acc1', name: 'Kotak 811' }],
    };

    const snapshot = AutoBackupService.createSnapshot(sampleData, 'daily');
    expect(snapshot.id).toMatch(/^snap-/);
    expect(snapshot.trigger).toBe('daily');
    expect(snapshot.label).toBe('Daily Auto-Snapshot');
    expect(snapshot.txCount).toBe(2);
    expect(snapshot.accCount).toBe(1);
    expect(snapshot.sizeBytes).toBeGreaterThan(0);
    expect(snapshot.checksum).toBeDefined();

    const all = AutoBackupService.getSnapshots();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(snapshot.id);
  });

  it('prunes older snapshots when exceeding limit', () => {
    AutoBackupService.saveConfig({ maxSnapshots: 3 });
    const sample = { transactions: [], accounts: [] };

    for (let i = 1; i <= 5; i++) {
      AutoBackupService.createSnapshot(sample, 'manual', `Snapshot ${i}`);
    }

    const all = AutoBackupService.getSnapshots();
    expect(all.length).toBeLessThanOrEqual(3);
  });

  it('detects when auto-backup is due', () => {
    const config = AutoBackupService.getConfig();
    // No last backup date -> due immediately
    expect(AutoBackupService.isAutoBackupDue(config)).toBe(true);

    // Recent backup (1 hour ago) -> not due
    const recentIso = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    expect(AutoBackupService.isAutoBackupDue({ ...config, lastAutoBackupDate: recentIso })).toBe(false);

    // Old backup (25 hours ago) -> due for daily
    const oldIso = new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString();
    expect(AutoBackupService.isAutoBackupDue({ ...config, lastAutoBackupDate: oldIso })).toBe(true);
  });

  it('formats bytes correctly', () => {
    expect(AutoBackupService.formatBytes(500)).toBe('500 B');
    expect(AutoBackupService.formatBytes(2048)).toBe('2.0 KB');
    expect(AutoBackupService.formatBytes(1024 * 1024 * 2.5)).toBe('2.50 MB');
  });

  it('deletes and clears snapshots cleanly', () => {
    const s1 = AutoBackupService.createSnapshot({ a: 1 }, 'manual');
    const s2 = AutoBackupService.createSnapshot({ b: 2 }, 'manual');
    expect(AutoBackupService.getSnapshots().length).toBe(2);

    AutoBackupService.deleteSnapshot(s1.id);
    const remaining = AutoBackupService.getSnapshots();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(s2.id);

    AutoBackupService.clearAllSnapshots();
    expect(AutoBackupService.getSnapshots().length).toBe(0);
  });
});
