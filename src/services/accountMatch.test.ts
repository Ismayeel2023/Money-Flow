import { describe, expect, it } from 'vitest';
import { StatementService } from './statementService';
import { Account } from '../types';

const accounts: Account[] = [
  {
    id: 'acc-sbi',
    name: 'SBI Savings',
    type: 'bank',
    accountNumber: '4589',
    balance: 1000,
    icon: 'account_balance',
  },
  {
    id: 'acc-kotak',
    name: 'Kotak Savings',
    type: 'bank',
    accountNumber: '6402',
    balance: 500,
    icon: 'account_balance',
  },
];

describe('StatementService account matching', () => {
  it('extracts account numbers from statement headers', () => {
    expect(StatementService.extractAccountNumberFromText('Account No. 8056016402')).toBe('8056016402');
    expect(StatementService.extractAccountNumberFromText('Account Number : XXXX4589')).toBe('4589');
  });

  it('matches last four digits across full and short account numbers', () => {
    expect(StatementService.accountNumbersMatch('8056016402', '6402')).toBe(true);
    expect(StatementService.accountNumbersMatch('4589', '0000001234589')).toBe(true);
    expect(StatementService.accountNumbersMatch('6402', '4589')).toBe(false);
  });

  it('prefers account-number match over the selected account', () => {
    const resolved = StatementService.resolveImportAccount(
      accounts,
      'acc-sbi',
      '8056016402',
      'Kotak Mahindra Bank'
    );
    expect(resolved.account.id).toBe('acc-kotak');
    expect(resolved.source).toBe('account-number');
  });

  it('falls back to the selected account when nothing matches', () => {
    const resolved = StatementService.resolveImportAccount(accounts, 'acc-sbi');
    expect(resolved.account.id).toBe('acc-sbi');
    expect(resolved.source).toBe('selected');
  });
});
