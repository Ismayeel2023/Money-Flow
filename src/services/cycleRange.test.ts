import { describe, expect, it } from 'vitest';
import {
  getBudgetCycleRange,
  getPreviousBudgetCycleRange,
  isCycleStartDay,
  clampCycleDay,
} from './cycleRange';

describe('getBudgetCycleRange', () => {
  it('uses calendar month when start day is 1', () => {
    const range = getBudgetCycleRange(1, '2026-09-14');
    expect(range.startDate).toBe('2026-09-01');
    expect(range.endDate).toBe('2026-09-30');
  });

  it('spans previous month when today is before the cycle start day', () => {
    const range = getBudgetCycleRange(25, '2026-09-14');
    expect(range.startDate).toBe('2026-08-25');
    expect(range.endDate).toBe('2026-09-24');
  });

  it('starts a new cycle on the chosen day', () => {
    const range = getBudgetCycleRange(25, '2026-09-25');
    expect(range.startDate).toBe('2026-09-25');
    expect(range.endDate).toBe('2026-10-24');
    expect(isCycleStartDay(25, '2026-09-25')).toBe(true);
  });

  it('clamps day 31 in February', () => {
    expect(clampCycleDay(2026, 1, 31)).toBe(28);
    const range = getBudgetCycleRange(31, '2026-02-10');
    expect(range.startDate).toBe('2026-01-31');
    expect(range.endDate).toBe('2026-02-27');
  });

  it('computes the previous cycle from the current window', () => {
    const prev = getPreviousBudgetCycleRange(25, '2026-09-14');
    expect(prev.startDate).toBe('2026-07-25');
    expect(prev.endDate).toBe('2026-08-24');
  });
});
