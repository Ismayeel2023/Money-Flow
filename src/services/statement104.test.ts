import { describe, expect, it } from 'vitest';
import { RawSbiRow, SbiStatementParser } from './sbiStatementParser';
import { StatementService } from './statementService';
import { Category } from '../types';

describe('SBI Statement 104-Transaction Dataset Verification', () => {
  const sampleCategories: Category[] = [
    {
      id: 'cat-dining',
      name: 'Dining',
      icon: 'restaurant',
      color: '#3525cd',
      type: 'expense',
    },
    {
      id: 'cat-shopping',
      name: 'Shopping',
      icon: 'shopping_bag',
      color: '#95002b',
      type: 'expense',
    },
    {
      id: 'cat-salary',
      name: 'Salary',
      icon: 'payments',
      color: '#006c49',
      type: 'income',
    },
  ];

  // Synthesize a dataset of exactly 104 rows:
  // - 99 debits
  // - 5 credits (including 2 refunds)
  // - 103 with valid 12-digit UPI references (1 without UPI, e.g. ATM/Interest)
  const rows104: RawSbiRow[] = [];

  // 1. Generate 99 Debits (all with UPI references)
  for (let i = 1; i <= 99; i++) {
    const upiRef = (400000000000 + i).toString();
    const merchant =
      i % 5 === 0
        ? 'FLIPKART'
        : i % 5 === 1
        ? 'STARBUCKS'
        : i % 5 === 2
        ? 'JB SWEETS'
        : i % 5 === 3
        ? 'MS RAJES'
        : 'INDIRA J';

    rows104.push({
      date: `2026-08-${(1 + (i % 25)).toString().padStart(2, '0')}`,
      description: `TRANSFER-UPI/DR/${upiRef}/${merchant}/PYM`,
      debit: 100 + i * 15,
    });
  }

  // 2. Add 2 Credits that are Refunds (with UPI references)
  rows104.push({
    date: '2026-08-26',
    description: 'TRANSFER-UPI/CR/400000000201/Amazon Refund/RET',
    credit: 899.0,
  });
  rows104.push({
    date: '2026-08-27',
    description: 'TRANSFER-UPI/CR/400000000202/Flipkart Refund/RET',
    credit: 1250.0,
  });

  // 3. Add 2 Regular Income Credits (with UPI references)
  rows104.push({
    date: '2026-08-28',
    description: 'TRANSFER-UPI/CR/400000000203/CONSULTING FEE/INCOME',
    credit: 25000.0,
  });
  rows104.push({
    date: '2026-08-29',
    description: 'TRANSFER-UPI/CR/400000000204/DIVIDEND PAYOUT/INCOME',
    credit: 3500.0,
  });

  // 4. Add 1 Non-UPI Credit (Salary via NEFT/INB, no UPI ref) -> total = 104 rows
  rows104.push({
    date: '2026-08-30',
    description: 'BY TRANSFER-INB/Salary August 2026',
    credit: 85000.0,
  });

  it('validates raw row dataset count is exactly 104', () => {
    expect(rows104.length).toBe(104);
  });

  it('correctly categorizes 99 debits, 5 credits, 2 refunds, and 103 UPI references', () => {
    const parsedTransactions = SbiStatementParser.parseRows(rows104);

    expect(parsedTransactions.length).toBe(104);

    const debits = parsedTransactions.filter((t) => t.type === 'expense');
    expect(debits.length).toBe(99);

    const credits = parsedTransactions.filter((t) => t.type === 'income' || t.type === 'refund');
    expect(credits.length).toBe(5);

    const refunds = parsedTransactions.filter((t) => t.type === 'refund');
    expect(refunds.length).toBe(2);

    const withUpiRef = parsedTransactions.filter(
      (t) => t.upiReference && t.upiReference.length >= 10
    );
    expect(withUpiRef.length).toBe(103);
  });

  it('correctly processes import summary with StatementService', async () => {
    const summary = await StatementService.processStatementFile(
      'SBI_Statement_August.pdf',
      undefined,
      rows104.map((r) => `${r.date} ${r.description} ${r.debit || r.credit} CR`).join('\n'),
      sampleCategories,
      []
    );

    expect(summary.totalFound).toBeGreaterThanOrEqual(100);
    expect(summary.transactions.length).toBeGreaterThanOrEqual(100);
  });
});
