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
}

export type ScreenTab =
  | 'dashboard'
  | 'activity'
  | 'add-transaction'
  | 'budgets'
  | 'categories'
  | 'rules'
  | 'settings'
  | 'accounts'
  | 'import-statement'
  | 'import-review'
  | 'reports';

