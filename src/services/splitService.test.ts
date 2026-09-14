import { describe, it, expect } from 'vitest';
import { SplitService } from './splitService';

describe('SplitService', () => {
  it('correctly calculates equal shares and sums up to the total without loss of paise', () => {
    const total = 1000;
    const names = ['Rahul', 'Priya'];
    const result = SplitService.calculateEqualShares(total, names);

    expect(result.participantShares.length).toBe(2);
    const sum = result.userShare + result.participantShares[0].amount + result.participantShares[1].amount;
    expect(sum).toBeCloseTo(total, 2);
  });

  it('handles division with remainders like ₹100 divided 3 ways', () => {
    const total = 100;
    const names = ['Amit', 'Vikram'];
    const result = SplitService.calculateEqualShares(total, names);

    const sum = result.userShare + result.participantShares[0].amount + result.participantShares[1].amount;
    expect(sum).toBe(100);
  });

  it('generates a valid WhatsApp reminder URL', () => {
    const participant = {
      id: 'p-1',
      name: 'Rahul',
      phone: '9876543210',
      amount: 450,
      paid: false,
    };
    const link = SplitService.getWhatsAppReminderLink(participant, 'Swiggy Dinner', 'user@okhdfcbank');
    expect(link).toContain('https://wa.me/919876543210?text=');
    expect(link).toContain('Rahul');
    expect(link).toContain('450');
    expect(link).toContain('Swiggy');
  });

  it('generates a valid UPI intent link', () => {
    const link = SplitService.getUpiPayLink('user@okhdfcbank', 'Mohamed', 500, 'Dinner Split');
    expect(link).toContain('upi://pay?');
    expect(link).toContain('pa=user%40okhdfcbank');
    expect(link).toContain('am=500.00');
  });
});
