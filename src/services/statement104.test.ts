import { describe, expect, it } from 'vitest';
import { RawSbiRow, SbiStatementParser } from './sbiStatementParser';
import { StatementService } from './statementService';
import { Category } from '../types';

describe('SBI Statement 104-Transaction Dataset Verification & Regression Suite', () => {
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

  // Synthesize the exact 104-transaction SBI statement baseline:
  // - 99 debits (expenses) with 12-digit UPI references
  // - 5 credits (2 refunds, 2 regular income with UPI, 1 salary credit via INB)
  // - Total: 104 transactions, 99 debits, 5 credits, 2 refunds, 103 valid UPI references
  const rows104: RawSbiRow[] = [];

  // 1. Generate 99 Debits (all with valid 12-digit UPI references)
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
      date: `25 Aug 2026`,
      description: `TRANSFER-UPI/DR/${upiRef}/${merchant}/PYM`,
      debit: 100 + i * 15,
      balance: 100000 - i * 100,
    });
  }

  // 2. Add 2 Credits that are Refunds (with UPI references)
  rows104.push({
    date: '26 Aug 2026',
    description: 'TRANSFER-UPI/CR/400000000201/Amazon Refund/RET',
    credit: 899.0,
    balance: 91000.0,
  });
  rows104.push({
    date: '27 Aug 2026',
    description: 'TRANSFER-UPI/CR/400000000202/Flipkart Refund/RET',
    credit: 1250.0,
    balance: 92250.0,
  });

  // 3. Add 2 Regular Income Credits (with UPI references)
  rows104.push({
    date: '28 Aug 2026',
    description: 'TRANSFER-UPI/CR/400000000203/CONSULTING FEE/INCOME',
    credit: 25000.0,
    balance: 117250.0,
  });
  rows104.push({
    date: '29 Aug 2026',
    description: 'TRANSFER-UPI/CR/400000000204/DIVIDEND PAYOUT/INCOME',
    credit: 3500.0,
    balance: 120750.0,
  });

  // 4. Add 1 Non-UPI Credit (Salary via INB/NEFT, no UPI ref) -> total = 104 rows
  rows104.push({
    date: '30 Aug 2026',
    description: 'BY TRANSFER-INB/Salary August 2026',
    credit: 85000.0,
    balance: 205750.0,
  });

  it('validates raw row dataset count is exactly 104', () => {
    expect(rows104.length).toBe(104);
  });

  it('verifies 104 total, 99 debits, 5 credits, 2 refunds, 103 valid UPI references', () => {
    const transactions = SbiStatementParser.parseRows(rows104);

    expect(transactions.length).toBe(104);

    const debits = transactions.filter((t) => t.type === 'expense');
    expect(debits.length).toBe(99);

    const credits = transactions.filter((t) => t.type === 'income' || t.type === 'refund');
    expect(credits.length).toBe(5);

    const refunds = transactions.filter((t) => t.type === 'refund');
    expect(refunds.length).toBe(2);

    const validUpiReferences = transactions.filter(
      (t) => t.upiReference && t.upiReference.length >= 10
    );
    expect(validUpiReferences.length).toBe(103);
  });

  it('verifies representative transactions for date, amount, rawDescription, party, partyType, and UPI reference', () => {
    const transactions = SbiStatementParser.parseRows(rows104);

    // 1. Check a standard Flipkart expense debit
    const flipkartTx = transactions.find((t) => t.rawDescription.includes('400000000005'));
    expect(flipkartTx).toBeDefined();
    expect(flipkartTx?.date).toBe('2026-08-25');
    expect(flipkartTx?.type).toBe('expense');
    expect(flipkartTx?.amount).toBe(175);
    expect(flipkartTx?.party).toBe('FLIPKART');
    expect(flipkartTx?.partyType).toBe('merchant');
    expect(flipkartTx?.upiReference).toBe('400000000005');
    expect(flipkartTx?.rawDescription).toBe('TRANSFER-UPI/DR/400000000005/FLIPKART/PYM');

    // 2. Check Amazon Refund credit
    const amazonRefundTx = transactions.find((t) => t.rawDescription.includes('400000000201'));
    expect(amazonRefundTx).toBeDefined();
    expect(amazonRefundTx?.date).toBe('2026-08-26');
    expect(amazonRefundTx?.type).toBe('refund');
    expect(amazonRefundTx?.amount).toBe(899);
    expect(amazonRefundTx?.party).toBe('Amazon Refund');
    expect(amazonRefundTx?.partyType).toBe('merchant');
    expect(amazonRefundTx?.upiReference).toBe('400000000201');

    // 3. Check person transfer (MS RAJES)
    const msRajesTx = transactions.find((t) => t.rawDescription.includes('400000000003'));
    expect(msRajesTx).toBeDefined();
    expect(msRajesTx?.party).toBe('MS RAJES');
    expect(msRajesTx?.partyType).toBe('person');
    expect(msRajesTx?.upiReference).toBe('400000000003');

    // 4. Check Non-UPI Salary Credit
    const salaryTx = transactions.find((t) => t.rawDescription.includes('Salary August 2026'));
    expect(salaryTx).toBeDefined();
    expect(salaryTx?.date).toBe('2026-08-30');
    expect(salaryTx?.type).toBe('income');
    expect(salaryTx?.amount).toBe(85000);
    expect(salaryTx?.upiReference).toBeUndefined();
  });

  it('correctly handles parenthesized parties and multi-line line stitching in StatementService', () => {
    const rawLines = [
      'State Bank of India - Statement of Account',
      'Txn Date Value Date Description Ref No./Cheque No. Debit Credit Balance',
      '25 Aug 2026 25 Aug 2026 TRANSFER-UPI/DR/423456789099/',
      '(FLIPKART INDIA PVT LTD)/PYM 1,499.00 45,230.50',
      '26 Aug 2026 26 Aug 2026 TRANSFER-UPI/CR/423456789100/Amazon Refund/RET 899.00 46,129.50',
      'Page 1 of 1',
    ];

    const parsedRows = StatementService.parseStatementText(rawLines);
    expect(parsedRows.length).toBe(2);

    // First row was stitched across 2 lines
    expect(parsedRows[0].date).toBe('25 Aug 2026');
    expect(parsedRows[0].debit).toBe(1499.0);
    expect(parsedRows[0].balance).toBe(45230.5);
    expect(parsedRows[0].description).toContain('FLIPKART INDIA PVT LTD');

    const txs = SbiStatementParser.parseRows(parsedRows);
    expect(txs[0].party).toBe('FLIPKART');
    expect(txs[0].partyType).toBe('merchant');
    expect(txs[0].upiReference).toBe('423456789099');

    // Second row is a credit refund
    expect(txs[1].type).toBe('refund');
    expect(txs[1].amount).toBe(899.0);
    expect(txs[1].party).toBe('Amazon Refund');
  });

  it('correctly parses statement file into import summary', async () => {
    const textStatement = rows104
      .map(
        (r) =>
          `${r.date} ${r.date} ${r.description} ${
            r.debit ? `${r.debit.toFixed(2)} ${r.balance?.toFixed(2)}` : `${r.credit?.toFixed(2)} ${r.balance?.toFixed(2)}`
          }`
      )
      .join('\n');

    const summary = await StatementService.processStatementFile(
      'AccountStatement_25082026_231819 (1).pdf',
      undefined,
      textStatement,
      sampleCategories,
      []
    );

    expect(summary.totalFound).toBe(104);
    expect(summary.transactions.length).toBe(104);
    expect(summary.autoCategorized).toBeGreaterThan(0);
  });
});

