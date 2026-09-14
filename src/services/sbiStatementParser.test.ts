import { describe, expect, it } from 'vitest';
import { SbiStatementParser } from './sbiStatementParser';
import { TransactionService } from './transactionService';

describe('SbiStatementParser & TransactionService', () => {
  it('extracts party, upi reference, and refund status correctly for known merchants', () => {
    // 1. FLIPKART
    const flipkart = SbiStatementParser.extractPartyInfo(
      'TRANSFER-UPI/DR/423456789012/FLIPKART/PYM',
      false
    );
    expect(flipkart.party).toBe('FLIPKART');
    expect(flipkart.partyType).toBe('merchant');
    expect(flipkart.upiRef).toBe('423456789012');
    expect(flipkart.isRefund).toBe(false);

    // 2. Amazon Refund
    const amazonRefund = SbiStatementParser.extractPartyInfo(
      'TRANSFER-UPI/CR/423456789013/Amazon Refund/RET',
      true
    );
    expect(amazonRefund.party).toBe('Amazon Refund');
    expect(amazonRefund.partyType).toBe('merchant');
    expect(amazonRefund.upiRef).toBe('423456789013');
    expect(amazonRefund.isRefund).toBe(true);

    // 3. MS RAJES
    const msRajes = SbiStatementParser.extractPartyInfo(
      'TRANSFER-UPI/DR/423456789014/MS RAJES/UPI',
      false
    );
    expect(msRajes.party).toBe('MS RAJES');
    expect(msRajes.partyType).toBe('person');
    expect(msRajes.upiRef).toBe('423456789014');

    // 4. JB SWEETS
    const jbSweets = SbiStatementParser.extractPartyInfo(
      'TRANSFER-UPI/DR/423456789015/JB SWEETS/PYM',
      false
    );
    expect(jbSweets.party).toBe('JB SWEETS');
    expect(jbSweets.partyType).toBe('merchant');

    // 5. INDIRA J
    const indira = SbiStatementParser.extractPartyInfo(
      'TRANSFER-UPI/DR/423456789016/INDIRA J/UPI',
      false
    );
    expect(indira.party).toBe('INDIRA J');
    expect(indira.partyType).toBe('person');

    // 6. HABEEB F
    const habeeb = SbiStatementParser.extractPartyInfo(
      'TRANSFER-UPI/DR/423456789017/HABEEB F/UPI',
      false
    );
    expect(habeeb.party).toBe('HABEEB F');
    expect(habeeb.partyType).toBe('person');

    // 7. JIO
    const jio = SbiStatementParser.extractPartyInfo(
      'TRANSFER-UPI/DR/423456789018/JIO RECHARGE/PYM',
      false
    );
    expect(jio.party).toBe('JIO');
    expect(jio.partyType).toBe('merchant');

    // 8. Raw description with leading date and embedded amounts (from SBI PDF statement)
    const sbiRaw1 = SbiStatementParser.extractPartyInfo(
      '10/04/2026 UPI/DR/610046843309/MS - 110.00 - 4,145.87 RAJES/YESB/q756688306/Paid 0097694162092 AT 02227 KURUMBUR WDL TFR',
      false
    );
    expect(sbiRaw1.party).toBe('MS RAJES');
    expect(sbiRaw1.upiRef).toBe('610046843309');

    const sbiRaw2 = SbiStatementParser.extractPartyInfo(
      '11/04/2026 UPI/DR/110451822762/GRAND - 100.00 - 4,045.87 BA/SIBL/bhqr.29727/NO R 0097695162091 AT 02227 KURUMBUR Page no. 3 Balance WDL TFR',
      false
    );
    expect(sbiRaw2.party).toBe('GRAND BA');
    expect(sbiRaw2.upiRef).toBe('110451822762');
  });

  it('correctly handles duplicate detection via UPI and fingerprint', () => {
    const existing = [
      {
        id: 'tx-1',
        amount: 500,
        type: 'expense' as const,
        categoryId: 'cat-dining',
        categoryName: 'Dining',
        categoryIcon: 'restaurant',
        categoryColor: '#D4AF37',
        accountId: 'acc-sbi',
        accountName: 'SBI Savings',
        merchant: 'Starbucks',
        party: 'Starbucks',
        upiReference: '423456789099',
        date: '2026-08-25',
        time: '10:00',
      },
    ];

    const duplicateCandidate = {
      amount: 500,
      type: 'expense' as const,
      upiReference: '423456789099',
      date: '2026-08-25',
      merchant: 'Starbucks',
    };

    const check = TransactionService.detectDuplicate(duplicateCandidate, existing);
    expect(check.isDuplicate).toBe(true);
    expect(check.status).toBe('duplicate');
  });

  it('links refund to original expense transaction conservatively', () => {
    const existing = [
      {
        id: 'tx-debit-amazon',
        amount: 1499,
        type: 'expense' as const,
        categoryId: 'cat-shopping',
        categoryName: 'Shopping',
        categoryIcon: 'shopping_bag',
        categoryColor: '#D4AF37',
        accountId: 'acc-sbi',
        accountName: 'SBI Savings',
        merchant: 'Amazon',
        party: 'Amazon',
        upiReference: '998877665544',
        date: '2026-08-20',
        time: '14:00',
      },
    ];

    const refundCandidate = {
      amount: 1499,
      type: 'refund' as const,
      upiReference: '998877665544',
      party: 'Amazon',
    };

    const linkedId = TransactionService.linkRefund(refundCandidate, existing);
    expect(linkedId).toBe('tx-debit-amazon');
  });
});
