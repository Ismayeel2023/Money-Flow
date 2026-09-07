import { describe, expect, it } from 'vitest';
import { CsvParser } from './csvParser';
import { Category } from '../types';

describe('CsvParser - Robust Character & Unicode Pipeline', () => {
  const sampleCategories: Category[] = [
    { id: 'cat-dining', name: 'Food & Dining', icon: 'restaurant', color: '#D4AF37', type: 'expense' },
    { id: 'cat-salary', name: 'Salary', icon: 'payments', color: '#10B981', type: 'income' },
    { id: 'cat-shopping', name: 'Shopping', icon: 'shopping_bag', color: '#FB7185', type: 'expense' },
  ];

  it('strips UTF-8 BOM and preserves Unicode characters, ₹ symbol, and long descriptions', () => {
    // UTF-8 BOM is \uFEFF
    const csvWithBom = `\uFEFFDate,Narration,Debit,Credit,Balance
2026-08-25,"UPI PAYMENT - SWIGGY FOOD & DINING, BANGALORE",₹1,499.50,,₹45,230.00
2026-08-24,"SALARY CREDIT FROM TECH CORP PVT LTD - AUGUST 2026",,₹85,000.00,₹1,30,230.00
2026-08-23,"AMAZON REFUND - ORDER #402-9876543-1234567 REFUND PROCESSED",,₹799.00,₹45,230.00
`;

    const result = CsvParser.parseCsv(csvWithBom, sampleCategories);

    expect(result.totalParsed).toBe(3);

    // 1st row: Expense with comma inside quotes and ₹ symbol
    const swiggyTx = result.transactions[0];
    expect(swiggyTx.amount).toBe(1499.5);
    expect(swiggyTx.type).toBe('expense');
    expect(swiggyTx.rawDescription).toBe('UPI PAYMENT - SWIGGY FOOD & DINING, BANGALORE');
    expect(swiggyTx.rawDescription).toContain('SWIGGY FOOD & DINING');

    // 2nd row: Income with salary credit
    const salaryTx = result.transactions[1];
    expect(salaryTx.amount).toBe(85000);
    expect(salaryTx.type).toBe('income');
    expect(salaryTx.categoryId).toBe('cat-salary');
    expect(salaryTx.rawDescription).toBe('SALARY CREDIT FROM TECH CORP PVT LTD - AUGUST 2026');

    // 3rd row: Refund with long order description
    const refundTx = result.transactions[2];
    expect(refundTx.amount).toBe(799);
    expect(refundTx.type).toBe('refund');
    expect(refundTx.rawDescription).toBe('AMAZON REFUND - ORDER #402-9876543-1234567 REFUND PROCESSED');
  });

  it('handles multi-column and escaped quotes RFC-4180', () => {
    const csvData = `Txn Date,Description,Amount,Type
25/08/2026,"Coffee at ""Blue Tokai"" Roasters, Indiranagar",350.00,DR
26/08/2026,"Consulting fee for client project (International)",15000.00,CR
`;

    const result = CsvParser.parseCsv(csvData, sampleCategories);
    expect(result.totalParsed).toBe(2);

    expect(result.transactions[0].amount).toBe(350);
    expect(result.transactions[0].type).toBe('expense');
    expect(result.transactions[0].rawDescription).toBe('Coffee at "Blue Tokai" Roasters, Indiranagar');

    expect(result.transactions[1].amount).toBe(15000);
    expect(result.transactions[1].type).toBe('income');
  });
});
