/**
 * Migration Service
 * Manages database schema migrations idempotently and without transaction errors.
 */

import { dbService } from '../database/dbSetup';

export interface MigrationStep {
  version: number;
  description: string;
  up: () => Promise<void> | void;
}

export class MigrationService {
  private static migrations: MigrationStep[] = [
    {
      version: 1,
      description: 'Initial schema creation with base tables',
      up: async () => {
        // Base collections already initialized
      },
    },
    {
      version: 2,
      description: 'Add partyType, refundLinkId, possibleDuplicate, and automation rules',
      up: async () => {
        const rules = dbService.getItem('automation_rules');
        if (!rules) {
          dbService.setItem('automation_rules', JSON.stringify([]));
        }
      },
    },
  ];

  public static async runPendingMigrations(): Promise<number> {
    return await dbService.withTransaction(async () => {
      const versionStr = dbService.getItem('schema_version') || '0';
      let currentVersion = parseInt(versionStr, 10);

      for (const m of this.migrations) {
        if (m.version > currentVersion) {
          try {
            await m.up();
            currentVersion = m.version;
            dbService.setItem('schema_version', currentVersion.toString());
          } catch (err) {
            console.error(`[Migration] Failed on migration v${m.version}:`, err);
            throw err;
          }
        }
      }

      return currentVersion;
    });
  }

  public static getCurrentVersion(): number {
    const versionStr = dbService.getItem('schema_version') || '0';
    return parseInt(versionStr, 10);
  }
}
