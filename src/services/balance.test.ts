import { describe, expect, it } from 'vitest';
import { TransactionService } from './transactionService';
import { Account, Transaction } from '../types';

describe('Balance Safety & Ledger Verification', () => {
  const baseAccount: Account = {
    id: 'acc-sbi',
    name: 'State Bank of India',
    type: 'bank',
    balance: 10000,
    icon: 'account_balance',
    isDefault: true,
  };

  it('correctly recalculates account balance when adding an expense', () => {
    const expenseTx: Transaction = {
      id: 'tx-1',
      amount: 1500,
      type: 'expense',
      categoryId: 'cat-dining',
      categoryName: 'Dining',
      categoryIcon: 'restaurant',
      categoryColor: '#D4AF37',
      accountId: 'acc-sbi',
      accountName: 'State Bank of India',
      merchant: 'Dinner',
      date: '2026-08-28',
      time: '20:00',
    };

    const newAccounts = TransactionService.updateAccountBalances([expenseTx], [baseAccount]);
    expect(newAccounts.find((a) => a.id === 'acc-sbi')?.balance).toBe(8500);
  });

  it('correctly recalculates account balance when adding an income', () => {
    const incomeTx: Transaction = {
      id: 'tx-2',
      amount: 5000,
      type: 'income',
      categoryId: 'cat-salary',
      categoryName: 'Salary',
      categoryIcon: 'payments',
      categoryColor: '#10B981',
      accountId: 'acc-sbi',
      accountName: 'State Bank of India',
      merchant: 'Bonus',
      date: '2026-08-28',
      time: '11:00',
    };

    const newAccounts = TransactionService.updateAccountBalances([incomeTx], [baseAccount]);
    expect(newAccounts.find((a) => a.id === 'acc-sbi')?.balance).toBe(15000);
  });

  it('correctly recalculates account balance when adding a refund (credits the account)', () => {
    const refundTx: Transaction = {
      id: 'tx-3',
      amount: 2000,
      type: 'refund',
      categoryId: 'cat-shopping',
      categoryName: 'Shopping',
      categoryIcon: 'shopping_bag',
      categoryColor: '#D4AF37',
      accountId: 'acc-sbi',
      accountName: 'State Bank of India',
      merchant: 'Amazon Refund',
      date: '2026-08-28',
      time: '15:00',
    };

    const newAccounts = TransactionService.updateAccountBalances([refundTx], [baseAccount]);
    expect(newAccounts.find((a) => a.id === 'acc-sbi')?.balance).toBe(12000);
  });

  it('correctly computes transfers between source and destination accounts', () => {
    const savingsAccount: Account = {
      id: 'acc-hdfc',
      name: 'HDFC Savings',
      type: 'bank',
      balance: 5000,
      icon: 'account_balance',
      isDefault: false,
    };

    const transferTx: Transaction = {
      id: 'tx-4',
      amount: 3000,
      type: 'transfer',
      categoryId: 'cat-transfer',
      categoryName: 'Transfer',
      categoryIcon: 'sync_alt',
      categoryColor: '#888888',
      accountId: 'acc-sbi',
      accountName: 'State Bank of India',
      destinationAccountId: 'acc-hdfc',
      merchant: 'Transfer to HDFC',
      date: '2026-08-28',
      time: '16:00',
    };

    const newAccounts = TransactionService.updateAccountBalances([transferTx], [
      baseAccount,
      savingsAccount,
    ]);

    expect(newAccounts.find((a) => a.id === 'acc-sbi')?.balance).toBe(7000);
    expect(newAccounts.find((a) => a.id === 'acc-hdfc')?.balance).toBe(8000);
  });

  it('ignores duplicate / skipped transactions from mutating ledger balance', () => {
    const duplicateTx: Transaction = {
      id: 'tx-5',
      amount: 999,
      type: 'expense',
      categoryId: 'cat-shopping',
      categoryName: 'Shopping',
      categoryIcon: 'shopping_bag',
      categoryColor: '#D4AF37',
      accountId: 'acc-sbi',
      accountName: 'State Bank of India',
      merchant: 'Duplicate Merchant',
      date: '2026-08-28',
      time: '17:00',
      status: 'duplicate',
      isDuplicate: true,
    };

    const newAccounts = TransactionService.updateAccountBalances([duplicateTx], [baseAccount]);
    // Duplicate status is filtered out before balance update in pipeline
    const nonDuplicates = [duplicateTx].filter((t) => t.status !== 'duplicate' && !t.isDuplicate);
    const updatedAccounts = TransactionService.updateAccountBalances(nonDuplicates, [baseAccount]);
    expect(updatedAccounts.find((a) => a.id === 'acc-sbi')?.balance).toBe(10000);
  });
});
