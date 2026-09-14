import { describe, expect, it } from 'vitest';
import { BillDueService } from './billDueService';
import { BillDueItem } from '../types';

describe('BillDueService', () => {
  const baseBill: BillDueItem = {
    id: 'test-bill',
    title: 'Test Electricity',
    billerName: 'Power Grid',
    type: 'utility',
    amount: 1500,
    dueDay: 15,
    nextDueDate: '2026-09-15',
    recurrence: 'monthly',
    icon: 'bolt',
    color: '#F59E0B',
    reminderEnabled: true,
    reminderDaysBefore: 2,
    isPaid: false,
  };

  it('correctly detects overdue bills', () => {
    const status = BillDueService.getDueStatus(
      { ...baseBill, nextDueDate: '2026-09-10' },
      '2026-09-15'
    );
    expect(status.status).toBe('overdue');
    expect(status.daysDiff).toBe(5);
    expect(status.badgeLabel).toBe('Overdue 5 days');
  });

  it('correctly detects bill due today', () => {
    const status = BillDueService.getDueStatus(
      { ...baseBill, nextDueDate: '2026-09-15' },
      '2026-09-15'
    );
    expect(status.status).toBe('due_today');
    expect(status.daysDiff).toBe(0);
    expect(status.badgeLabel).toBe('Due Today');
  });

  it('correctly detects bill due soon (within 3 days)', () => {
    const status = BillDueService.getDueStatus(
      { ...baseBill, nextDueDate: '2026-09-17' },
      '2026-09-15'
    );
    expect(status.status).toBe('due_soon');
    expect(status.daysDiff).toBe(2);
    expect(status.badgeLabel).toBe('Due in 2 days');
  });

  it('correctly detects upcoming bill (> 3 days)', () => {
    const status = BillDueService.getDueStatus(
      { ...baseBill, nextDueDate: '2026-09-25' },
      '2026-09-15'
    );
    expect(status.status).toBe('upcoming');
    expect(status.daysDiff).toBe(10);
  });

  it('correctly marks paid status regardless of date', () => {
    const status = BillDueService.getDueStatus(
      { ...baseBill, nextDueDate: '2026-09-05', isPaid: true },
      '2026-09-15'
    );
    expect(status.status).toBe('paid');
    expect(status.badgeLabel).toBe('Paid');
  });

  it('advances monthly recurrence to next month', () => {
    const nextDate = BillDueService.calculateNextDueDate('2026-09-15', 'monthly', 15);
    expect(nextDate).toBe('2026-10-15');
  });

  it('advances quarterly recurrence', () => {
    const nextDate = BillDueService.calculateNextDueDate('2026-09-15', 'quarterly', 15);
    expect(nextDate).toBe('2026-12-15');
  });

  it('handles year wrapping properly for monthly recurrence in December', () => {
    const nextDate = BillDueService.calculateNextDueDate('2026-12-20', 'monthly', 20);
    expect(nextDate).toBe('2027-01-20');
  });

  it('generates non-empty demo bills', () => {
    const demoBills = BillDueService.getInitialDemoBills();
    expect(demoBills.length).toBeGreaterThanOrEqual(5);
    expect(demoBills.some((b) => b.type === 'credit_card')).toBe(true);
    expect(demoBills.some((b) => b.type === 'utility')).toBe(true);
  });
});
