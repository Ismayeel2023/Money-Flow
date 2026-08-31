/**
 * Import Service
 * Handles final import commit to the ledger and persists changes safely.
 */

import { dbService } from '../database/dbSetup';
import { Account, AutomationRule, Budget, Category, Transaction } from '../types';
import { RuleEngineService } from './ruleEngine';
import { TransactionService } from './transactionService';

export interface CommitImportOptions {
  transactions: Transaction[];
  existingLedger: Transaction[];
  existingAccounts: Account[];
  categories: Category[];
  budgets: Budget[];
  rememberDecisions?: boolean;
}

export interface CommitImportResult {
  addedTransactions: Transaction[];
  updatedLedger: Transaction[];
  updatedAccounts: Account[];
  updatedBudgets: Budget[];
  newRulesCreated: AutomationRule[];
}

export class ImportService {
  /**
   * Commits reviewed transactions to the ledger safely.
   */
  public static async commitImport(
    options: CommitImportOptions
  ): Promise<CommitImportResult> {
    return await dbService.withTransaction(async () => {
      const {
        transactions,
        existingLedger,
        existingAccounts,
        categories,
        budgets,
        rememberDecisions = true,
      } = options;

      // Filter only accepted / non-skipped transactions
      const acceptedTransactions = transactions.filter((t) => t.status !== 'skipped');

      const newRules: AutomationRule[] = [];
      let currentAccounts = [...existingAccounts];

      for (const tx of acceptedTransactions) {
        // Update account balances
        currentAccounts = TransactionService.applyTransactionToAccounts(tx, currentAccounts);

        // Remember decision if configured
        if (rememberDecisions && tx.party) {
          const matchedCategory = categories.find((c) => c.id === tx.categoryId);
          if (matchedCategory) {
            const rule = RuleEngineService.rememberDecision(tx, matchedCategory);
            newRules.push(rule);
          }
        }
      }

      // Prepend newly imported transactions to ledger
      const updatedLedger = [...acceptedTransactions, ...existingLedger];

      // Recalculate budgets spent amounts
      const updatedBudgets = budgets.map((b) => {
        const spentForCategory = updatedLedger
          .filter((t) => t.categoryId === b.categoryId && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        let status: 'healthy' | 'near-limit' | 'exceeded' | 'on-track' = 'healthy';
        if (spentForCategory > b.allocated) {
          status = 'exceeded';
        } else if (spentForCategory > b.allocated * 0.8) {
          status = 'near-limit';
        }

        return {
          ...b,
          spent: spentForCategory,
          status,
        };
      });

      // Save to persistent storage
      dbService.setItem('transactions', JSON.stringify(updatedLedger));
      dbService.setItem('accounts', JSON.stringify(currentAccounts));
      dbService.setItem('budgets', JSON.stringify(updatedBudgets));

      return {
        addedTransactions: acceptedTransactions,
        updatedLedger,
        updatedAccounts: currentAccounts,
        updatedBudgets,
        newRulesCreated: newRules,
      };
    });
  }
}
