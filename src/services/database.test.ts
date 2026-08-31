import { describe, expect, it, beforeEach } from 'vitest';
import { dbService } from '../database/dbSetup';
import { MigrationService } from '../services/migrationService';

describe('Database & Migration Verification', () => {
  beforeEach(() => {
    dbService.clear();
  });

  it('initializes database on a completely fresh install without throwing errors', async () => {
    const success = await dbService.initializeDatabase();
    expect(success).toBe(true);
    expect(dbService.getItem('db_status')).toBe('ready');
    expect(dbService.getItem('schema_version')).toBe('2');

    const categoriesRaw = dbService.getItem('categories');
    expect(categoriesRaw).not.toBeNull();
    const categories = JSON.parse(categoriesRaw!);
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it('handles multiple concurrent initializeDatabase calls safely (atomic singleton)', async () => {
    const [res1, res2, res3] = await Promise.all([
      dbService.initializeDatabase(),
      dbService.initializeDatabase(),
      dbService.initializeDatabase(),
    ]);

    expect(res1).toBe(true);
    expect(res2).toBe(true);
    expect(res3).toBe(true);
  });

  it('executes nested transactions seamlessly without "no current transaction" error', async () => {
    await dbService.initializeDatabase();

    const result = await dbService.withTransaction(async () => {
      dbService.setItem('test_k1', 'val1');

      // Nested transaction call
      const innerResult = await dbService.withTransaction(async () => {
        dbService.setItem('test_k2', 'val2');
        return 'inner_ok';
      });

      return `outer_${innerResult}`;
    });

    expect(result).toBe('outer_inner_ok');
    expect(dbService.getItem('test_k1')).toBe('val1');
    expect(dbService.getItem('test_k2')).toBe('val2');
  });

  it('runs pending migrations sequentially and updates schema version to latest', async () => {
    // Set older schema version
    dbService.setItem('schema_version', '1');
    dbService.removeItem('automation_rules');

    const newVersion = await MigrationService.runPendingMigrations();
    expect(newVersion).toBe(2);
    expect(MigrationService.getCurrentVersion()).toBe(2);

    const rules = dbService.getItem('automation_rules');
    expect(rules).not.toBeNull();
  });
});
