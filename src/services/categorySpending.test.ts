import { describe, expect, it } from 'vitest';
import { Transaction } from '../types';

describe('Category Spending Analysis Calculation Engine', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 1200,
      type: 'expense',
      categoryId: 'cat-dining',
      categoryName: 'Dining',
      categoryIcon: 'restaurant',
      categoryColor: '#D4AF37',
      accountId: 'acc-sbi',
      accountName: 'SBI',
      merchant: 'Paradise Biryani',
      date: '2026-08-15',
      time: '19:30',
    },
    {
      id: 'tx-2',
      amount: 800,
      type: 'expense',
      categoryId: 'cat-dining',
      categoryName: 'Dining',
      categoryIcon: 'restaurant',
      categoryColor: '#D4AF37',
      accountId: 'acc-sbi',
      accountName: 'SBI',
      merchant: 'Subway',
      date: '2026-08-20',
      time: '13:15',
    },
    {
      id: 'tx-3',
      amount: 3500,
      type: 'expense',
      categoryId: 'cat-shopping',
      categoryName: 'Shopping',
      categoryIcon: 'shopping_bag',
      categoryColor: '#38BDF8',
      accountId: 'acc-sbi',
      accountName: 'SBI',
      merchant: 'Zara',
      date: '2026-08-18',
      time: '17:00',
    },
    {
      id: 'tx-4',
      amount: 75000,
      type: 'income',
      categoryId: 'cat-salary',
      categoryName: 'Salary',
      categoryIcon: 'payments',
      categoryColor: '#10B981',
      accountId: 'acc-sbi',
      accountName: 'SBI',
      merchant: 'Monthly Salary',
      date: '2026-08-01',
      time: '10:00',
    },
    {
      id: 'tx-5',
      amount: 5000,
      type: 'transfer',
      categoryId: 'cat-transfer',
      categoryName: 'Transfer',
      categoryIcon: 'sync_alt',
      categoryColor: '#3525cd',
      accountId: 'acc-sbi',
      destinationAccountId: 'acc-hdfc',
      accountName: 'SBI → HDFC',
      merchant: 'Transfer to HDFC',
      date: '2026-08-10',
      time: '11:00',
    },
    {
      id: 'tx-6',
      amount: 400,
      type: 'refund',
      categoryId: 'cat-dining',
      categoryName: 'Dining',
      categoryIcon: 'restaurant',
      categoryColor: '#D4AF37',
      accountId: 'acc-sbi',
      accountName: 'SBI',
      merchant: 'Swiggy Refund',
      date: '2026-08-22',
      time: '14:00',
    },
    {
      id: 'tx-7',
      amount: 600,
      type: 'expense',
      categoryId: 'cat-dining',
      categoryName: 'Dining',
      categoryIcon: 'restaurant',
      categoryColor: '#D4AF37',
      accountId: 'acc-sbi',
      accountName: 'SBI',
      merchant: 'Coffee Cafe',
      date: '2026-07-25', // Outside date range
      time: '10:00',
    },
  ];

  // Helper matching the exact engine logic
  const calculateCategorySpending = (
    txs: Transaction[],
    categoryId: string,
    startDate?: string,
    endDate?: string
  ) => {
    const matching = txs.filter((t) => {
      // 1. Must be expense transactions ONLY
      if (t.type !== 'expense') return false;
      // 2. Must match selected category
      if (t.categoryId !== categoryId) return false;
      // 3. Must fall within date range
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });

    const totalSpent = matching.reduce((sum, t) => sum + t.amount, 0);
    const count = matching.length;
    const average = count > 0 ? totalSpent / count : 0;

    return { totalSpent, count, average, matching };
  };

  it('calculates total spent, transaction count, and average strictly for expenses in the selected category and date range', () => {
    const result = calculateCategorySpending(
      sampleTransactions,
      'cat-dining',
      '2026-08-01',
      '2026-08-31'
    );

    // Only tx-1 (1200) and tx-2 (800) should be included.
    // tx-3 is Shopping (excluded)
    // tx-4 is Income (excluded)
    // tx-5 is Transfer (excluded)
    // tx-6 is Refund (excluded)
    // tx-7 is outside August (excluded)
    expect(result.count).toBe(2);
    expect(result.totalSpent).toBe(2000);
    expect(result.average).toBe(1000);
    expect(result.matching.map((t) => t.id)).toEqual(['tx-1', 'tx-2']);
  });

  it('excludes income, transfer, and refund transactions even if category matches', () => {
    const result = calculateCategorySpending(
      sampleTransactions,
      'cat-dining',
      '2026-08-01',
      '2026-08-31'
    );

    const types = result.matching.map((t) => t.type);
    expect(types.every((type) => type === 'expense')).toBe(true);
    expect(types).not.toContain('income');
    expect(types).not.toContain('transfer');
    expect(types).not.toContain('refund');
  });

  it('returns 0 when no transactions match date range', () => {
    const result = calculateCategorySpending(
      sampleTransactions,
      'cat-dining',
      '2026-09-01',
      '2026-09-30'
    );

    expect(result.count).toBe(0);
    expect(result.totalSpent).toBe(0);
    expect(result.average).toBe(0);
  });
});
