import { describe, it, expect } from 'vitest';
import { SmsParserService } from './smsParserService';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES } from '../data/mockData';

describe('SmsParserService', () => {
  it('parses Kotak Bank debit SMS correctly', () => {
    const text = 'Sent Rs. 95.00 from Kotak Bank AC 6402 to CENTRAL CAFE on 05-09-26. UPI Ref 624870659421.';
    const result = SmsParserService.parseSms(text, INITIAL_ACCOUNTS, INITIAL_CATEGORIES);

    expect(result).not.toBeNull();
    expect(result?.amount).toBe(95);
    expect(result?.type).toBe('expense');
    expect(result?.bankName).toBe('Kotak Mahindra Bank');
    expect(result?.accountNumber).toBe('6402');
    expect(result?.merchant).toBe('CENTRAL CAFE');
    expect(result?.upiReference).toBe('624870659421');
    expect(result?.date).toBe('2026-09-05');
  });

  it('parses SBI debit SMS with SWIGGY', () => {
    const text = 'Dear SBI User, your A/C ending 4589 debited by Rs 450.00 on 05-Sep-26 by UPI to SWIGGY. Ref: 624818937196.';
    const result = SmsParserService.parseSms(text, INITIAL_ACCOUNTS, INITIAL_CATEGORIES);

    expect(result).not.toBeNull();
    expect(result?.amount).toBe(450);
    expect(result?.type).toBe('expense');
    expect(result?.bankName).toBe('State Bank of India');
    expect(result?.accountNumber).toBe('4589');
    expect(result?.merchant).toBe('SWIGGY');
    expect(result?.suggestedCategoryId).toBe('cat-dining');
    expect(result?.upiReference).toBe('624818937196');
    expect(result?.date).toBe('2026-09-05');
  });

  it('parses HDFC debit SMS with Indian Railway', () => {
    const text = 'INR 1093.39 debited from HDFC Bank A/C **1234 on 04-Sep-26 to Indian Railway via UPI. Ref 624754763985.';
    const result = SmsParserService.parseSms(text, INITIAL_ACCOUNTS, INITIAL_CATEGORIES);

    expect(result).not.toBeNull();
    expect(result?.amount).toBe(1093.39);
    expect(result?.merchant).toBe('Indian Railway');
    expect(result?.suggestedCategoryId).toBe('cat-transport');
  });
});
