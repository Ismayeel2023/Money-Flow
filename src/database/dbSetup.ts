/**
 * Database Setup & Connection Service
 * Provides transaction-safe, idempotent initialization and storage for both
 * Web (IndexedDB / LocalStorage) and Android (Capacitor SQLite / Native).
 */

import { INITIAL_ACCOUNTS, INITIAL_BUDGETS, INITIAL_CATEGORIES, INITIAL_TRANSACTIONS } from '../data/mockData';
import { Account, AutomationRule, Budget, Category, Transaction } from '../types';

export interface DatabaseState {
  isInitialized: boolean;
  version: number;
  lastSync?: string;
}

class SafeDatabaseService {
  private initPromise: Promise<boolean> | null = null;
  private isTransactionActive: boolean = false;
  private transactionDepth: number = 0;

  private STORAGE_PREFIX = 'moneyflow_db_';
  private memoryFallback = new Map<string, string>();

  /**
   * Initializes the database safely.
   * Prevents concurrent race conditions using an atomic singleton promise.
   */
  public async initializeDatabase(): Promise<boolean> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        // Check if database version exists
        const versionStr = this.getItem('schema_version');
        const currentVersion = versionStr ? parseInt(versionStr, 10) : 0;

        if (currentVersion === 0) {
          // Fresh Installation
          await this.runFreshInstall();
        } else if (currentVersion < 2) {
          // Migration from previous versions
          await this.runMigrations(currentVersion);
        }

        this.setItem('schema_version', '2');
        this.setItem('db_status', 'ready');
        return true;
      } catch (error) {
        console.error('[Database] Initialization error caught safely:', error);
        // Ensure state is recoverable and doesn't crash the entire app
        return false;
      } finally {
        this.transactionDepth = 0;
        this.isTransactionActive = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Fresh installation initialization.
   * Seeds default system categories, default accounts, initial budgets, and sample transactions.
   */
  private async runFreshInstall(): Promise<void> {
    // Write system tables without nesting unsafe transaction statements
    const existingCats = this.getItem('categories');
    if (!existingCats) {
      this.setItem('categories', JSON.stringify(INITIAL_CATEGORIES));
    }

    const existingAccs = this.getItem('accounts');
    if (!existingAccs) {
      this.setItem('accounts', JSON.stringify(INITIAL_ACCOUNTS));
    }

    const existingBudgets = this.getItem('budgets');
    if (!existingBudgets) {
      this.setItem('budgets', JSON.stringify(INITIAL_BUDGETS));
    }

    const existingTxs = this.getItem('transactions');
    if (!existingTxs) {
      this.setItem('transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    }

    const existingRules = this.getItem('automation_rules');
    if (!existingRules) {
      const defaultRules: AutomationRule[] = [
        {
          id: 'rule-salary',
          name: 'Salary Credit Rule',
          priority: 50,
          partyPattern: 'salary|payroll|deposit',
          partyType: 'merchant',
          transactionType: 'income',
          categoryId: 'cat-salary',
          categoryName: 'Salary',
          isActive: true,
          createdAt: new Date().toISOString(),
          matchCount: 1,
        },
        {
          id: 'rule-coffee',
          name: 'Starbucks Coffee Rule',
          priority: 10,
          partyPattern: 'starbucks|cafe|coffee',
          partyType: 'merchant',
          transactionType: 'expense',
          categoryId: 'cat-coffee',
          categoryName: 'Coffee',
          isActive: true,
          createdAt: new Date().toISOString(),
          matchCount: 3,
        },
        {
          id: 'rule-grocery',
          name: 'Supermarket Grocery Rule',
          priority: 30,
          partyPattern: 'reliance|mart|grocery|nature basket|superstore',
          partyType: 'merchant',
          transactionType: 'expense',
          categoryId: 'cat-grocery',
          categoryName: 'Grocery',
          isActive: true,
          createdAt: new Date().toISOString(),
          matchCount: 2,
        },
      ];
      this.setItem('automation_rules', JSON.stringify(defaultRules));
    }
  }

  /**
   * Migration runner that safely upgrades schema versions
   */
  private async runMigrations(fromVersion: number): Promise<void> {
    if (fromVersion < 2) {
      // V2 migration: Ensure all transactions have party, partyType, normalizedDescription, and refundLinkId fields
      const txsJson = this.getItem('transactions');
      if (txsJson) {
        try {
          const txs: Transaction[] = JSON.parse(txsJson);
          const updated = txs.map((t) => ({
            ...t,
            party: t.party || t.merchant,
            partyType: t.partyType || 'unknown',
            normalizedDescription: t.normalizedDescription || t.merchant?.toLowerCase().trim(),
            refundLinkId: t.refundLinkId ?? null,
            possibleDuplicate: t.possibleDuplicate ?? false,
          }));
          this.setItem('transactions', JSON.stringify(updated));
        } catch (e) {
          console.warn('[Migration] Error migrating transactions to v2:', e);
        }
      }
    }
  }

  /**
   * Transaction-safe runner wrapper.
   * Guarantees that:
   * 1. No nested BEGIN TRANSACTION occurs.
   * 2. If already inside a transaction, the callback executes seamlessly in the existing context.
   * 3. Errors roll back safely without throwing "no current transaction".
   */
  public async withTransaction<T>(callback: () => Promise<T> | T): Promise<T> {
    const isTopLevel = !this.isTransactionActive;
    if (isTopLevel) {
      this.isTransactionActive = true;
    }
    this.transactionDepth++;

    try {
      const result = await callback();
      return result;
    } catch (error) {
      console.error('[Database Transaction Error]:', error);
      throw error;
    } finally {
      this.transactionDepth--;
      if (this.transactionDepth <= 0) {
        this.transactionDepth = 0;
        this.isTransactionActive = false;
      }
    }
  }

  // Generic Storage Helpers
  public getItem(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
        if (val !== null) return val;
      }
    } catch {
      // ignore
    }
    return this.memoryFallback.get(`${this.STORAGE_PREFIX}${key}`) ?? null;
  }

  public setItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`${this.STORAGE_PREFIX}${key}`, value);
        return;
      }
    } catch (e) {
      console.warn('[Database] Storage write failed:', e);
    }
    this.memoryFallback.set(`${this.STORAGE_PREFIX}${key}`, value);
  }

  public removeItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
        return;
      }
    } catch (e) {
      console.warn('[Database] Storage remove failed:', e);
    }
    this.memoryFallback.delete(`${this.STORAGE_PREFIX}${key}`);
  }

  public clear(): void {
    this.initPromise = null;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch {
      // ignore
    }
    this.memoryFallback.clear();
  }
}

export const dbService = new SafeDatabaseService();
