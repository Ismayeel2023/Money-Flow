export type TransactionType = 'expense' | 'income' | 'transfer' | 'refund';

export type BudgetStatus = 'healthy' | 'near-limit' | 'exceeded' | 'on-track';

export type PartyType = 'person' | 'merchant' | 'unknown';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  accountId: string;
  accountName: string;
  destinationAccountId?: string;
  merchant: string;
  party?: string;
  partyType?: PartyType;
  upiReference?: string;
  rawDescription?: string;
  normalizedDescription?: string;
  fingerprint?: string;
  refundLinkId?: string | null;
  possibleDuplicate?: boolean;
  date: string; // YYYY-MM-DD
  displayDate?: string;
  time: string; // HH:MM
  notes?: string;
  tags?: string[];
  status?: 'ready' | 'skipped' | 'review' | 'duplicate';
  isDuplicate?: boolean;
  matchReason?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit';
  accountNumber?: string;
  balance: number;
  availableLimit?: number;
  outstanding?: number;
  icon: string;
  color?: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor?: string;
  type: 'expense' | 'income' | 'both';
  isSystem?: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  allocated: number;
  spent: number;
  period: 'monthly';
  status: BudgetStatus;
}

export interface AutomationRule {
  id: string;
  name: string;
  priority: number; // Lower numeric value = higher priority (e.g. 10 for remembered decisions, 50 for system heuristics)
  partyPattern?: string;
  partyType?: PartyType | 'all';
  transactionType?: TransactionType | 'all';
  descriptionKeyword?: string;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  isActive: boolean;
  createdAt: string;
  matchCount?: number;
}

export interface StatementImportSummary {
  totalFound: number;
  autoCategorized: number;
  needsReview: number;
  duplicates: number;
  fileName: string;
  transactions: Transaction[];
  detectedBank?: string;
  accountNumber?: string;
  openingBalance?: number;
  closingBalance?: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  accountId: string;
  accountName: string;
  nextDueDate: string; // YYYY-MM-DD
  isActive: boolean;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // YYYY-MM-DD
  icon: string;
  color: string;
  accountId?: string;
  categoryName?: string;
  isCompleted?: boolean;
}

export interface ParsedSmsResult {
  amount: number;
  type: 'expense' | 'income';
  merchant: string;
  accountNumber?: string;
  bankName?: string;
  upiReference?: string;
  date: string;
  time: string;
  matchedAccountId?: string;
  suggestedCategoryId?: string;
  rawText: string;
}

export interface KotakStatementMeta {
  accountHolder?: string;
  accountNumber?: string;
  ifsc?: string;
  branch?: string;
  statementPeriod?: string;
  openingBalance?: number;
  closingBalance?: number;
}

export interface SecuritySettings {
  isLockEnabled: boolean;
  pin: string;
  biometricEnabled: boolean;
  autoLockTimeout: 'immediate' | '1min' | '5min' | '15min' | 'never';
  privacyScreen: boolean;
  highValueAuth: boolean;
  biometricMode?: 'biometric_preferred' | 'biometric_strict' | 'pin_first';
  requireBiometricsForSecurityChanges?: boolean;
}

export type ScreenTab =
  | 'dashboard'
  | 'activity'
  | 'add-transaction'
  | 'bills'
  | 'budgets'
  | 'categories'
  | 'rules'
  | 'settings'
  | 'accounts'
  | 'import-statement'
  | 'import-review'
  | 'reports'
  | 'category-spending'
  | 'merchants'
  | 'subscriptions'
  | 'goals'
  | 'sms-parser'
  | 'export-backup';

export type SmsPermissionLevel = 'always_allow' | 'while_using' | 'only_this_time' | 'denied' | 'unset';

export type BillType =
  | 'utility'
  | 'credit_card'
  | 'loan_emi'
  | 'rent'
  | 'broadband'
  | 'mobile'
  | 'insurance'
  | 'subscription'
  | 'other';

export type BillRecurrence = 'monthly' | 'bi_monthly' | 'quarterly' | 'yearly' | 'one_time';

export type BillReminderDays = 0 | 1 | 2 | 3 | 7;

export interface BillDueItem {
  id: string;
  title: string;
  billerName: string;
  type: BillType;
  amount: number;
  dueDay: number;
  nextDueDate: string;
  recurrence: BillRecurrence;
  accountId?: string;
  accountName?: string;
  categoryId?: string;
  categoryName?: string;
  icon: string;
  color: string;
  reminderEnabled: boolean;
  reminderDaysBefore: BillReminderDays;
  isPaid: boolean;
  lastPaidDate?: string;
  consumerNumber?: string;
  notes?: string;
  autoDebit?: boolean;
}

export type AutoBackupCadence = 'daily' | 'weekly' | 'manual';

export interface AutoBackupConfig {
  enabled: boolean;
  cadence: AutoBackupCadence;
  maxSnapshots: number;
  notifyIfOverdue: boolean;
  compactExport: boolean;
  lastAutoBackupDate?: string;
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  trigger: 'daily' | 'weekly' | 'manual' | 'pre_restore' | 'on_change';
  label: string;
  txCount: number;
  accCount: number;
  sizeBytes: number;
  checksum: string;
  data: string;
}

export interface SplitParticipant {
  id: string;
  name: string;
  phone?: string;
  upiId?: string;
  amount: number;
  paid: boolean;
  settledDate?: string;
  settledAccountId?: string;
}

export interface BillSplit {
  id: string;
  transactionId?: string;
  title: string;
  totalAmount: number;
  userShare: number;
  date: string;
  categoryName?: string;
  categoryIcon?: string;
  notes?: string;
  isFullySettled: boolean;
  participants: SplitParticipant[];
}


