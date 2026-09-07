import { describe, it, expect } from 'vitest';
import { KotakStatementParser, KOTAK_SAMPLE_STATEMENT_TEXT } from './kotakStatementParser';
import { INITIAL_CATEGORIES } from '../data/mockData';

describe('KotakStatementParser', () => {
  it('detects Kotak Mahindra Bank statement format', () => {
    expect(KotakStatementParser.isKotakStatement(KOTAK_SAMPLE_STATEMENT_TEXT)).toBe(true);
    expect(KotakStatementParser.isKotakStatement('Some random SBI text without Kotak')).toBe(false);
  });

  it('extracts correct metadata from statement header', () => {
    const lines = KOTAK_SAMPLE_STATEMENT_TEXT.split('\n');
    const meta = KotakStatementParser.extractMetadata(lines);

    expect(meta.accountNumber).toBe('8056016402');
    expect(meta.ifsc).toBe('KKBK0008676');
    expect(meta.openingBalance).toBe(9825.1);
    expect(meta.closingBalance).toBe(2647.71);
    expect(meta.branch).toBe('Periyanaickenpalayam');
  });

  it('parses all 13 transactions accurately with exact amounts and UPI references', () => {
    const lines = KOTAK_SAMPLE_STATEMENT_TEXT.split('\n');
    const { transactions, meta } = KotakStatementParser.parseLines(
      lines,
      INITIAL_CATEGORIES,
      'acc-kotak-6402',
      'Kotak Savings (6402)'
    );

    expect(meta.accountNumber).toBe('8056016402');
    expect(transactions).toHaveLength(13);

    // Row 1: 4,500.00 DUMMY NAME
    expect(transactions[0].amount).toBe(4500);
    expect(transactions[0].merchant).toBe('DUMMY NAME');
    expect(transactions[0].date).toBe('2026-09-01');
    expect(transactions[0].upiReference).toBe('UPI-624481129377');

    // Row 2: 76.00 INDRA STORE
    expect(transactions[1].amount).toBe(76);
    expect(transactions[1].merchant).toBe('INDRA STORE');
    expect(transactions[1].upiReference).toBe('UPI-624417285320');

    // Row 3: 146.00 JB SWEETS
    expect(transactions[2].amount).toBe(146);
    expect(transactions[2].merchant).toBe('JB SWEETS');
    expect(transactions[2].categoryName).toBe('Food & Dining');

    // Row 8: 1,093.39 RATNAA SHREE A
    expect(transactions[7].amount).toBe(1093.39);
    expect(transactions[7].merchant).toBe('RATNAA SHREE A');
    expect(transactions[7].upiReference).toBe('UPI-624754763985');

    // Row 9: 50.00 Indian Railway
    expect(transactions[8].amount).toBe(50);
    expect(transactions[8].merchant).toBe('Indian Railway');
    expect(transactions[8].categoryName).toBe('Transport');

    // Row 10: 95.00 CENTRAL CAFE
    expect(transactions[9].amount).toBe(95);
    expect(transactions[9].merchant).toBe('CENTRAL CAFE');
    expect(transactions[9].categoryName).toBe('Food & Dining');

    // Row 12: 167.00 Flipkart Payme
    expect(transactions[11].amount).toBe(167);
    expect(transactions[11].merchant).toBe('Flipkart Payme');

    // Row 13: 435.00 STATE TRANSPOR
    expect(transactions[12].amount).toBe(435);
    expect(transactions[12].merchant).toBe('STATE TRANSPOR');
    expect(transactions[12].categoryName).toBe('Transport');
  });
});
