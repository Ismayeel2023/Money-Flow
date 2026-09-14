export interface BudgetCycleRange {
  startDate: string;
  endDate: string;
  startDay: number;
}

const pad = (n: number): string => String(n).padStart(2, '0');

export const toIsoDate = (year: number, monthIndex: number, day: number): string =>
  `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

export const clampCycleDay = (year: number, monthIndex: number, startDay: number): number => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(Math.max(1, Math.round(startDay) || 1), 31);
  return Math.min(day, daysInMonth);
};

const addDaysIso = (isoDate: string, days: number): string => {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Budget / reporting window for a salary-style month that can start on any day 1–31.
 * Example: startDay 25, today 14 Sep 2026 → 2026-08-25 .. 2026-09-24
 */
export const getBudgetCycleRange = (
  startDay: number,
  referenceDate: Date | string = new Date()
): BudgetCycleRange => {
  const ref =
    typeof referenceDate === 'string' ? new Date(referenceDate + 'T00:00:00') : new Date(referenceDate);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const todayDay = ref.getDate();
  const requested = Math.min(Math.max(1, Math.round(startDay) || 1), 31);

  const thisMonthStartDay = clampCycleDay(year, month, requested);
  const cycleStartsThisMonth = todayDay >= thisMonthStartDay;

  let startYear = year;
  let startMonth = month;
  if (!cycleStartsThisMonth) {
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }

  const startClamped = clampCycleDay(startYear, startMonth, requested);
  const startDate = toIsoDate(startYear, startMonth, startClamped);

  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 11) {
    endMonth = 0;
    endYear += 1;
  }
  const nextStart = clampCycleDay(endYear, endMonth, requested);
  const nextStartIso = toIsoDate(endYear, endMonth, nextStart);
  const endDate = addDaysIso(nextStartIso, -1);

  return { startDate, endDate, startDay: requested };
};

export const getPreviousBudgetCycleRange = (
  startDay: number,
  referenceDate: Date | string = new Date()
): BudgetCycleRange => {
  const current = getBudgetCycleRange(startDay, referenceDate);
  const dayBefore = addDaysIso(current.startDate, -1);
  return getBudgetCycleRange(startDay, dayBefore);
};

export const isDateInRange = (isoDate: string, startDate: string, endDate: string): boolean =>
  isoDate >= startDate && isoDate <= endDate;

export const formatCycleRangeLabel = (range: BudgetCycleRange): string => {
  const fmt = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };
  return `${fmt(range.startDate)} – ${fmt(range.endDate)}`;
};

export const isCycleStartDay = (startDay: number, referenceDate: Date | string = new Date()): boolean => {
  const range = getBudgetCycleRange(startDay, referenceDate);
  const iso =
    typeof referenceDate === 'string'
      ? referenceDate.slice(0, 10)
      : toIsoDate(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  return iso === range.startDate;
};
