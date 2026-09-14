import { Account, BillDueItem, BillRecurrence, BillType } from '../types';

export interface BillDueStatusInfo {
  status: 'overdue' | 'due_today' | 'due_soon' | 'upcoming' | 'paid';
  daysDiff: number; // positive = overdue days or upcoming days
  badgeLabel: string;
  badgeColor: string; // Tailwind class
  badgeBg: string; // Tailwind class
  badgeBorder: string; // Tailwind class
  urgencyRank: number; // For sorting: 1 = Overdue, 2 = Due Today, 3 = Due in 1-3d, 4 = Upcoming, 5 = Paid
}

export class BillDueService {
  /**
   * Calculate due status, countdown badge text, and color coding.
   */
  static getDueStatus(bill: BillDueItem, referenceDateStr?: string): BillDueStatusInfo {
    if (bill.isPaid) {
      return {
        status: 'paid',
        daysDiff: 0,
        badgeLabel: 'Paid',
        badgeColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/15',
        badgeBorder: 'border-emerald-500/30',
        urgencyRank: 5,
      };
    }

    const todayStr = referenceDateStr || new Date().toISOString().split('T')[0];
    const today = new Date(todayStr + 'T00:00:00');
    const dueDate = new Date(bill.nextDueDate + 'T00:00:00');

    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        status: 'overdue',
        daysDiff: overdueDays,
        badgeLabel: overdueDays === 1 ? 'Overdue 1 day' : `Overdue ${overdueDays} days`,
        badgeColor: 'text-rose-400',
        badgeBg: 'bg-rose-500/20',
        badgeBorder: 'border-rose-500/40',
        urgencyRank: 1,
      };
    }

    if (diffDays === 0) {
      return {
        status: 'due_today',
        daysDiff: 0,
        badgeLabel: 'Due Today',
        badgeColor: 'text-amber-300',
        badgeBg: 'bg-amber-500/25',
        badgeBorder: 'border-amber-500/50',
        urgencyRank: 2,
      };
    }

    if (diffDays <= 3) {
      return {
        status: 'due_soon',
        daysDiff: diffDays,
        badgeLabel: diffDays === 1 ? 'Due Tomorrow' : `Due in ${diffDays} days`,
        badgeColor: 'text-amber-400',
        badgeBg: 'bg-amber-500/15',
        badgeBorder: 'border-amber-500/30',
        urgencyRank: 3,
      };
    }

    return {
      status: 'upcoming',
      daysDiff: diffDays,
      badgeLabel: `Due in ${diffDays} days`,
      badgeColor: 'text-sky-400',
      badgeBg: 'bg-sky-500/15',
      badgeBorder: 'border-sky-500/30',
      urgencyRank: 4,
    };
  }

  /**
   * Advance the next due date based on recurrence frequency.
   */
  static calculateNextDueDate(currentDueDateStr: string, recurrence: BillRecurrence, dueDay: number): string {
    const current = new Date(currentDueDateStr + 'T00:00:00');
    let year = current.getFullYear();
    let month = current.getMonth(); // 0-indexed

    switch (recurrence) {
      case 'monthly':
        month += 1;
        break;
      case 'bi_monthly':
        month += 2;
        break;
      case 'quarterly':
        month += 3;
        break;
      case 'yearly':
        year += 1;
        break;
      case 'one_time':
        return currentDueDateStr;
    }

    // Handle month overflow
    if (month > 11) {
      year += Math.floor(month / 12);
      month = month % 12;
    }

    // Clamp day to max days in target month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const clampedDay = Math.min(dueDay, daysInMonth);

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month + 1)}-${pad(clampedDay)}`;
  }

  /**
   * Helper to format a due date relative to today (e.g., "5th of every month", "Due 22 Sep 2026")
   */
  static formatDueDate(dateStr: string): string {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Get default icon and color presets by bill type.
   */
  static getPresetForType(type: BillType): {
    icon: string;
    color: string;
    defaultTitle: string;
    categoryName: string;
  } {
    switch (type) {
      case 'utility':
        return {
          icon: 'bolt',
          color: '#F59E0B',
          defaultTitle: 'Electricity Bill',
          categoryName: 'Bills & Utilities',
        };
      case 'credit_card':
        return {
          icon: 'credit_card',
          color: '#EC4899',
          defaultTitle: 'Credit Card Bill Due',
          categoryName: 'Bills & Utilities',
        };
      case 'loan_emi':
        return {
          icon: 'account_balance',
          color: '#3B82F6',
          defaultTitle: 'Loan EMI Payment',
          categoryName: 'Bills & Utilities',
        };
      case 'rent':
        return {
          icon: 'home',
          color: '#8B5CF6',
          defaultTitle: 'House Rent',
          categoryName: 'Bills & Utilities',
        };
      case 'broadband':
        return {
          icon: 'wifi',
          color: '#06B6D4',
          defaultTitle: 'Broadband / WiFi Bill',
          categoryName: 'Bills & Utilities',
        };
      case 'mobile':
        return {
          icon: 'smartphone',
          color: '#10B981',
          defaultTitle: 'Mobile Postpaid / Recharge',
          categoryName: 'Bills & Utilities',
        };
      case 'insurance':
        return {
          icon: 'health_and_safety',
          color: '#14B8A6',
          defaultTitle: 'Health / Life Insurance Premium',
          categoryName: 'Health & Medical',
        };
      case 'subscription':
        return {
          icon: 'subscriptions',
          color: '#A855F7',
          defaultTitle: 'Subscription Service',
          categoryName: 'Entertainment',
        };
      default:
        return {
          icon: 'receipt_long',
          color: '#D4AF37',
          defaultTitle: 'Recurring Bill',
          categoryName: 'Bills & Utilities',
        };
    }
  }

  /**
   * Generate realistic initial demo bills dynamically anchored to the current month & year.
   */
  static getInitialDemoBills(accounts?: Account[]): BillDueItem[] {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 1-12
    const pad = (n: number) => String(n).padStart(2, '0');

    const primaryAcc = accounts?.find((a) => a.isDefault) || accounts?.[0];
    const accId = primaryAcc?.id || 'acc-primary';
    const accName = primaryAcc?.name || 'Kotak 811 Savings';

    const buildDate = (day: number) => {
      const daysInTargetMonth = new Date(year, month, 0).getDate();
      const clamped = Math.min(day, daysInTargetMonth);
      return `${year}-${pad(month)}-${pad(clamped)}`;
    };

    return [
      {
        id: 'bill-rent',
        title: 'Apartment Rent',
        billerName: 'Landlord - Flat 402',
        type: 'rent',
        amount: 18500,
        dueDay: 5,
        nextDueDate: buildDate(5),
        recurrence: 'monthly',
        accountId: accId,
        accountName: accName,
        categoryId: 'cat-bills',
        categoryName: 'Bills & Utilities',
        icon: 'home',
        color: '#8B5CF6',
        reminderEnabled: true,
        reminderDaysBefore: 2,
        isPaid: true, // Already paid on the 5th for demonstration
        lastPaidDate: buildDate(5),
        notes: 'Monthly apartment rent via NEFT/UPI',
        autoDebit: false,
      },
      {
        id: 'bill-loan-emi',
        title: 'Two-Wheeler Loan EMI',
        billerName: 'HDFC Bank Auto Loans',
        type: 'loan_emi',
        amount: 4350,
        dueDay: 10,
        nextDueDate: buildDate(10),
        recurrence: 'monthly',
        accountId: accId,
        accountName: accName,
        categoryId: 'cat-bills',
        categoryName: 'Bills & Utilities',
        icon: 'account_balance',
        color: '#3B82F6',
        reminderEnabled: true,
        reminderDaysBefore: 3,
        isPaid: false,
        consumerNumber: 'LN-98421876',
        notes: 'EMI debit auto-mandate',
        autoDebit: true,
      },
      {
        id: 'bill-elec',
        title: 'BESCOM Electricity Bill',
        billerName: 'BESCOM Power Corp',
        type: 'utility',
        amount: 2450,
        dueDay: 12,
        nextDueDate: buildDate(12),
        recurrence: 'monthly',
        accountId: accId,
        accountName: accName,
        categoryId: 'cat-bills',
        categoryName: 'Bills & Utilities',
        icon: 'bolt',
        color: '#F59E0B',
        reminderEnabled: true,
        reminderDaysBefore: 2,
        isPaid: false,
        consumerNumber: 'CA-102938475',
        notes: 'Residential meter #402',
        autoDebit: false,
      },
      {
        id: 'bill-mobile',
        title: 'Jio Postpaid Family Plan',
        billerName: 'Reliance Jio Infocomm',
        type: 'mobile',
        amount: 799,
        dueDay: 15,
        nextDueDate: buildDate(15),
        recurrence: 'monthly',
        accountId: accId,
        accountName: accName,
        categoryId: 'cat-bills',
        categoryName: 'Bills & Utilities',
        icon: 'smartphone',
        color: '#10B981',
        reminderEnabled: true,
        reminderDaysBefore: 1,
        isPaid: false,
        consumerNumber: '9845012345',
        notes: 'Primary 2-line family plan with 75GB data',
        autoDebit: false,
      },
      {
        id: 'bill-broadband',
        title: 'Airtel Xstream Fiber',
        billerName: 'Airtel Broadband Ltd',
        type: 'broadband',
        amount: 1179,
        dueDay: 18,
        nextDueDate: buildDate(18),
        recurrence: 'monthly',
        accountId: accId,
        accountName: accName,
        categoryId: 'cat-bills',
        categoryName: 'Bills & Utilities',
        icon: 'wifi',
        color: '#06B6D4',
        reminderEnabled: true,
        reminderDaysBefore: 2,
        isPaid: false,
        consumerNumber: 'DSL-080-4928172',
        notes: '200 Mbps unlimited fiber connection',
        autoDebit: false,
      },
      {
        id: 'bill-cc-kotak',
        title: 'Kotak RuPay League Card',
        billerName: 'Kotak Mahindra Bank Credit Cards',
        type: 'credit_card',
        amount: 14820,
        dueDay: 22,
        nextDueDate: buildDate(22),
        recurrence: 'monthly',
        accountId: accId,
        accountName: accName,
        categoryId: 'cat-bills',
        categoryName: 'Bills & Utilities',
        icon: 'credit_card',
        color: '#EC4899',
        reminderEnabled: true,
        reminderDaysBefore: 3,
        isPaid: false,
        consumerNumber: 'Card ending in 6402',
        notes: 'Total statement balance due for cycle',
        autoDebit: false,
      },
      {
        id: 'bill-insurance',
        title: 'Star Comprehensive Health',
        billerName: 'Star Health & Allied Insurance',
        type: 'insurance',
        amount: 1450,
        dueDay: 28,
        nextDueDate: buildDate(28),
        recurrence: 'monthly',
        accountId: accId,
        accountName: accName,
        categoryId: 'cat-health',
        categoryName: 'Health & Medical',
        icon: 'health_and_safety',
        color: '#14B8A6',
        reminderEnabled: true,
        reminderDaysBefore: 3,
        isPaid: false,
        consumerNumber: 'POL-SH-7729104',
        notes: 'Monthly policy premium payment',
        autoDebit: true,
      },
    ];
  }

  /**
   * Send or simulate a local notification for an upcoming or overdue bill.
   */
  static async requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }

  static triggerLocalNotification(bill: BillDueItem, statusInfo: BillDueStatusInfo): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission !== 'granted') {
      return false;
    }

    try {
      new Notification(`Money Flow: ${bill.title}`, {
        body: `${statusInfo.badgeLabel} • ₹${bill.amount.toLocaleString('en-IN')} due to ${bill.billerName}.`,
        icon: '/logo.png',
        tag: `bill-${bill.id}`,
      });
      return true;
    } catch {
      return false;
    }
  }
}
