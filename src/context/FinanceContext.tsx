import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Account,
  AutomationRule,
  Budget,
  Category,
  ParsedSmsResult,
  SavingsGoal,
  ScreenTab,
  SecuritySettings,
  StatementImportSummary,
  Subscription,
  Transaction,
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_BUDGETS,
  INITIAL_CATEGORIES,
  INITIAL_IMPORT_BATCH,
  INITIAL_SAVINGS_GOALS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_TRANSACTIONS,
} from '../data/mockData';
import { dbService } from '../database/dbSetup';
import { MigrationService } from '../services/migrationService';
import { CategoryInput, CategoryService } from '../services/categoryService';
import { StatementService } from '../services/statementService';
import { ImportService } from '../services/importService';
import { TransactionService } from '../services/transactionService';
import { KOTAK_SAMPLE_STATEMENT_TEXT } from '../services/kotakStatementParser';
import { BiometricService, BiometricCapability, AuthResult } from '../services/biometricService';

interface FinanceContextType {
  tab: ScreenTab;
  setTab: (tab: ScreenTab) => void;
  goBack: () => boolean;
  canGoBack: boolean;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  currencySymbol: string;
  formatCurrency: (amount: number, options?: { showSign?: boolean; absolute?: boolean }) => string;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => boolean;
  transferMoney: (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => void;
  transferPreselectedFromAccount: string | null;
  setTransferPreselectedFromAccount: (accountId: string | null) => void;
  addCategory: (input: CategoryInput) => Category;
  updateCategory: (id: string, updates: Partial<CategoryInput>) => Category;
  deleteCategory: (id: string) => boolean;
  addBudget: (budget: Omit<Budget, 'id' | 'status'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  importSummary: StatementImportSummary;
  processStatementUpload: (file?: File | null, sampleType?: string) => Promise<void>;
  processKotakDemoStatement: () => Promise<void>;
  acceptImportTransaction: (id: string) => void;
  rejectImportTransaction: (id: string) => void;
  updateImportTransactionCategory: (id: string, categoryId: string) => void;
  confirmAllImportTransactions: () => Promise<void>;
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  markSubscriptionPaid: (id: string) => void;
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  depositToGoal: (goalId: string, amount: number, fromAccountId: string) => void;
  withdrawFromGoal: (goalId: string, amount: number, toAccountId: string) => void;
  addTransactionFromSms: (result: ParsedSmsResult) => void;
  exportToCsv: () => string;
  exportToJson: () => string;
  importFromJson: (jsonStr: string) => { success: boolean; message: string };
  activeTransactionForDetail: Transaction | null;
  setActiveTransactionForDetail: (tx: Transaction | null) => void;
  isAddAccountModalOpen: boolean;
  setIsAddAccountModalOpen: (open: boolean) => void;
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  isNewBudgetModalOpen: boolean;
  setIsNewBudgetModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isSecurityModalOpen: boolean;
  setIsSecurityModalOpen: (open: boolean) => void;
  isAppSettingsModalOpen: boolean;
  setIsAppSettingsModalOpen: (open: boolean) => void;
  resetToDemoData: () => void;
  // Security & Biometrics
  securitySettings: SecuritySettings;
  updateSecuritySettings: (newSettings: Partial<SecuritySettings>) => void;
  isAppLocked: boolean;
  unlockApp: (enteredPin?: string) => boolean;
  lockApp: () => void;
  authenticateWithBiometric: () => Promise<boolean>;
  verifyBiometricForAction: (actionLabel?: string) => Promise<boolean>;
  enrollBiometric: () => Promise<AuthResult>;
  removeBiometric: () => void;
  biometricCapability: BiometricCapability;
  // Activity Filtering
  activityFilterType: 'all' | 'income' | 'expense' | 'transfer' | 'refund';
  setActivityFilterType: (type: 'all' | 'income' | 'expense' | 'transfer' | 'refund') => void;
  activityFilterAccount: string;
  setActivityFilterAccount: (accountId: string) => void;
  showTransactionsByType: (type: 'income' | 'expense') => void;
  // Computed metrics
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  totalNetWorth: number;
  totalBudgetAllocated: number;
  totalBudgetSpent: number;
  topSpendings: { category: Category; amount: number; percentage: number }[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: 'moneyflow_app_txs_v3',
  ACCOUNTS: 'moneyflow_app_accs_v3',
  BUDGETS: 'moneyflow_app_buds_v3',
  CATEGORIES: 'moneyflow_app_cats_v3',
  IMPORT_BATCH: 'moneyflow_app_batch_v3',
};

const sanitizeLoadedTransactions = (): Transaction[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t: any) => t && t.id && t.amount > 0);
  } catch {
    return [];
  }
};

const sanitizeLoadedAccounts = (txs: Transaction[]): Account[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    let accs = INITIAL_ACCOUNTS;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        accs = parsed;
      }
    }

    // Default balances to 0 if no transactions exist
    if (txs.length === 0) {
      return accs.map((a) => ({
        ...a,
        balance: 0,
        outstanding: 0,
      }));
    }

    return accs;
  } catch {
    return INITIAL_ACCOUNTS;
  }
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tab, setTabState] = useState<ScreenTab>('dashboard');
  const [tabHistory, setTabHistory] = useState<ScreenTab[]>(['dashboard']);
  const [currencySymbol] = useState<string>('₹');

  // Modals state
  const [activeTransactionForDetail, setActiveTransactionForDetail] = useState<Transaction | null>(null);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isNewBudgetModalOpen, setIsNewBudgetModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAppSettingsModalOpen, setIsAppSettingsModalOpen] = useState(false);

  const setTab = (newTab: ScreenTab) => {
    setTabState((currentTab) => {
      if (currentTab !== newTab) {
        setTabHistory((prev) => {
          const rootTabs: ScreenTab[] = ['dashboard', 'activity', 'budgets', 'settings'];
          // If switching directly to a root bottom tab, start clean from that root tab
          if (rootTabs.includes(newTab)) {
            return [newTab];
          }
          // Avoid duplicate consecutive history entries
          if (prev[prev.length - 1] === newTab) {
            return prev;
          }
          return [...prev, newTab];
        });
      }
      return newTab;
    });
  };

  const goBack = (): boolean => {
    // 1. If any modal is open, close the modal first
    if (activeTransactionForDetail) {
      setActiveTransactionForDetail(null);
      return true;
    }
    if (isAddAccountModalOpen) {
      setIsAddAccountModalOpen(false);
      return true;
    }
    if (isTransferModalOpen) {
      setIsTransferModalOpen(false);
      return true;
    }
    if (isNewBudgetModalOpen) {
      setIsNewBudgetModalOpen(false);
      return true;
    }
    if (isProfileModalOpen) {
      setIsProfileModalOpen(false);
      return true;
    }
    if (isSecurityModalOpen) {
      setIsSecurityModalOpen(false);
      return true;
    }
    if (isAppSettingsModalOpen) {
      setIsAppSettingsModalOpen(false);
      return true;
    }

    // 2. Navigate back through tab history
    if (tabHistory.length > 1) {
      const nextHistory = [...tabHistory];
      nextHistory.pop(); // Remove current screen
      const previousTab = nextHistory[nextHistory.length - 1];
      setTabHistory(nextHistory);
      setTabState(previousTab);
      return true;
    }

    // 3. Fallback to Home Dashboard (NEVER force settings/more screen)
    if (tab !== 'dashboard') {
      setTabState('dashboard');
      setTabHistory(['dashboard']);
      return true;
    }

    return false;
  };

  const canGoBack = Boolean(
    activeTransactionForDetail ||
    isAddAccountModalOpen ||
    isTransferModalOpen ||
    isNewBudgetModalOpen ||
    isProfileModalOpen ||
    isSecurityModalOpen ||
    isAppSettingsModalOpen ||
    tabHistory.length > 1 ||
    tab !== 'dashboard'
  );

  // Security & Biometric States
  const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
    isLockEnabled: true,
    pin: '1234',
    biometricEnabled: true,
    autoLockTimeout: '1min',
    privacyScreen: true,
    highValueAuth: true,
    biometricMode: 'biometric_preferred',
    requireBiometricsForSecurityChanges: true,
  };

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    try {
      const saved = localStorage.getItem('moneyflow_security_settings');
      if (saved) {
        return { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SECURITY_SETTINGS;
  });

  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    try {
      const savedSettings = localStorage.getItem('moneyflow_security_settings');
      const parsed = savedSettings ? JSON.parse(savedSettings) : DEFAULT_SECURITY_SETTINGS;
      if (!parsed.isLockEnabled) return false;
      const isSessionUnlocked = sessionStorage.getItem('moneyflow_session_unlocked') === 'true';
      return !isSessionUnlocked;
    } catch {
      return false;
    }
  });

  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability>({
    isSupported: false,
    hasPlatformAuthenticator: false,
    authenticatorType: 'fingerprint',
    platformLabel: 'Biometrics',
    platformIcon: 'fingerprint',
    isEnrolled: false,
  });

  useEffect(() => {
    BiometricService.checkBiometricCapability().then(setBiometricCapability);
  }, []);

  const updateSecuritySettings = (newSettings: Partial<SecuritySettings>) => {
    setSecuritySettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('moneyflow_security_settings', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const unlockApp = (enteredPin?: string): boolean => {
    if (!enteredPin || enteredPin === securitySettings.pin) {
      setIsAppLocked(false);
      try {
        sessionStorage.setItem('moneyflow_session_unlocked', 'true');
      } catch {}
      return true;
    }
    return false;
  };

  const lockApp = () => {
    setIsAppLocked(true);
    try {
      sessionStorage.removeItem('moneyflow_session_unlocked');
    } catch {}
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    if (!securitySettings.biometricEnabled) {
      return false;
    }
    const result = await BiometricService.authenticateWithBiometrics('Money Flow User');
    if (result.success) {
      unlockApp();
      return true;
    }
    return false;
  };

  const verifyBiometricForAction = async (actionLabel: string = 'Security Verification'): Promise<boolean> => {
    const result = await BiometricService.authenticateWithBiometrics(actionLabel);
    return result.success;
  };

  const enrollBiometric = async (): Promise<AuthResult> => {
    const result = await BiometricService.registerBiometricCredential('Money Flow Vault Owner');
    if (result.success) {
      const cap = await BiometricService.checkBiometricCapability();
      setBiometricCapability(cap);
      updateSecuritySettings({ biometricEnabled: true });
    }
    return result;
  };

  const removeBiometric = () => {
    BiometricService.removeBiometricCredential();
    BiometricService.checkBiometricCapability().then(setBiometricCapability);
    updateSecuritySettings({ biometricEnabled: false });
  };

  // Auto-lock on app background/visibility change based on autoLockTimeout
  useEffect(() => {
    let backgroundTime = 0;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        backgroundTime = Date.now();
      } else if (document.visibilityState === 'visible') {
        if (securitySettings.isLockEnabled && backgroundTime > 0) {
          const elapsed = Date.now() - backgroundTime;
          let timeoutMs = 60000;
          if (securitySettings.autoLockTimeout === 'immediate') timeoutMs = 0;
          else if (securitySettings.autoLockTimeout === '1min') timeoutMs = 60000;
          else if (securitySettings.autoLockTimeout === '5min') timeoutMs = 300000;
          else if (securitySettings.autoLockTimeout === '15min') timeoutMs = 900000;
          else if (securitySettings.autoLockTimeout === 'never') timeoutMs = Infinity;

          if (elapsed >= timeoutMs) {
            lockApp();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [securitySettings]);

  // Activity filter state for cross-screen navigation
  const [activityFilterType, setActivityFilterType] = useState<'all' | 'income' | 'expense' | 'transfer' | 'refund'>('all');
  const [activityFilterAccount, setActivityFilterAccount] = useState<string>('all');
  const [transferPreselectedFromAccount, setTransferPreselectedFromAccount] = useState<string | null>(null);

  const showTransactionsByType = (type: 'income' | 'expense') => {
    setActivityFilterType(type);
    setTab('activity');
  };

  // Core Data initialized cleanly without mock values
  const [transactions, setTransactions] = useState<Transaction[]>(() => sanitizeLoadedTransactions());

  const [accounts, setAccounts] = useState<Account[]>(() => sanitizeLoadedAccounts(sanitizeLoadedTransactions()));

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      return CategoryService.getCategories();
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((b) => ({ ...b, spent: 0 }));
        }
      }
      return INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  const [importSummaryState, setImportSummaryState] = useState<StatementImportSummary>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IMPORT_BATCH);
      const batch: Transaction[] = saved ? JSON.parse(saved) : INITIAL_IMPORT_BATCH;
      return {
        totalFound: batch.length,
        autoCategorized: batch.filter((t) => t.status === 'ready').length,
        needsReview: batch.filter((t) => t.status === 'review').length,
        duplicates: batch.filter((t) => t.isDuplicate || t.status === 'duplicate').length,
        fileName: 'Bank_Statement.pdf',
        transactions: batch,
      };
    } catch {
      return {
        totalFound: 0,
        autoCategorized: 0,
        needsReview: 0,
        duplicates: 0,
        fileName: 'Bank_Statement.pdf',
        transactions: [],
      };
    }
  });

  // Safe database initialization on mount
  useEffect(() => {
    const init = async () => {
      try {
        await dbService.initializeDatabase();
        await MigrationService.runPendingMigrations();
      } catch (err) {
        console.warn('[FinanceContext] Database initialized with fallback:', err);
      }
    };
    init();
  }, []);

  // Save to persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    CategoryService.saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IMPORT_BATCH, JSON.stringify(importSummaryState.transactions));
  }, [importSummaryState]);

  // Recalculate budget spent dynamically for the current month when transactions change
  useEffect(() => {
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    setBudgets((prevBudgets) =>
      prevBudgets.map((b) => {
        const spent = transactions
          .filter((t) => {
            if (t.categoryId !== b.categoryId || t.type !== 'expense') return false;
            const txMonth = t.date ? t.date.slice(0, 7) : currentMonthKey;
            return txMonth === currentMonthKey;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const currentSpent = spent;
        const ratio = b.allocated > 0 ? currentSpent / b.allocated : 0;
        let status: Budget['status'] = 'healthy';
        if (ratio >= 1) status = 'exceeded';
        else if (ratio >= 0.8) status = 'near-limit';
        else if (ratio >= 0.3) status = 'on-track';

        return {
          ...b,
          spent: currentSpent,
          status,
        };
      })
    );
  }, [transactions]);

  // Currency Formatter
  const formatCurrency = (
    amount: number,
    options?: { showSign?: boolean; absolute?: boolean }
  ) => {
    const val = options?.absolute ? Math.abs(amount) : amount;
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: Number.isInteger(val) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(val));

    if (options?.showSign) {
      const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
      return `${sign}${currencySymbol}${formatted}`;
    }

    const sign = amount < 0 && !options?.absolute ? '-' : '';
    return `${sign}${currencySymbol}${formatted}`;
  };

  // Metrics
  const { totalBalance, totalIncome, totalExpenses, netFlow, totalNetWorth } = useMemo(() => {
    const bankAndCashBalance = accounts
      .filter((a) => a.type === 'bank' || a.type === 'cash')
      .reduce((sum, a) => sum + a.balance, 0);

    const creditOutstanding = accounts
      .filter((a) => a.type === 'credit')
      .reduce((sum, a) => sum + (a.outstanding ?? Math.abs(a.balance)), 0);

    const netWorth = bankAndCashBalance - creditOutstanding;

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const flow = income - expense;

    const sbiAccount = accounts.find((a) => a.id === 'acc-sbi');
    const primaryBal = sbiAccount ? sbiAccount.balance : bankAndCashBalance;

    return {
      totalBalance: primaryBal,
      totalIncome: income,
      totalExpenses: expense,
      netFlow: flow,
      totalNetWorth: netWorth,
    };
  }, [accounts, transactions]);

  // Top spending calculation
  const topSpendings = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
      });

    const maxAmount = Math.max(...Object.values(categoryTotals), 1);

    return Object.entries(categoryTotals)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId) || {
          id: catId,
          name: 'General',
          icon: 'receipt',
          color: '#D4AF37',
          bgColor: '',
          type: 'expense' as const,
        };
        return {
          category: cat,
          amount,
          percentage: Math.min(100, Math.round((amount / maxAmount) * 100)),
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  const totalBudgetAllocated = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.allocated, 0);
  }, [budgets]);

  const totalBudgetSpent = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.spent, 0);
  }, [budgets]);

  // Transaction Actions
  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'ready',
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update account balance
    setAccounts((prevAccounts) =>
      TransactionService.updateAccountBalances([newTx], prevAccounts)
    );

    return newTx;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  // Category Actions
  const addCategory = (input: CategoryInput): Category => {
    const created = CategoryService.createCategory(input);
    setCategories((prev) => [...prev, created]);
    return created;
  };

  const updateCategory = (id: string, updates: Partial<CategoryInput>): Category => {
    const updated = CategoryService.updateCategory(id, updates);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCategory = (id: string): boolean => {
    const success = CategoryService.deleteCategory(id);
    if (success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    return success;
  };

  // Account Actions
  const addAccount = (accountData: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...accountData,
      id: `acc-${Date.now()}`,
    };
    setAccounts((prev) => [...prev, newAccount]);
    return newAccount;
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  };

  const deleteAccount = (id: string): boolean => {
    if (accounts.length <= 1) {
      return false;
    }
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    return true;
  };

  const transferMoney = (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    notes?: string
  ) => {
    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);
    if (!fromAcc || !toAcc) return;

    const tx: Omit<Transaction, 'id'> = {
      amount,
      type: 'transfer',
      categoryId: 'cat-transfer',
      categoryName: 'Transfer',
      categoryIcon: 'sync_alt',
      categoryColor: '#3525cd',
      accountId: fromAccountId,
      destinationAccountId: toAccountId,
      accountName: `${fromAcc.name} → ${toAcc.name}`,
      merchant: `Transfer to ${toAcc.name}`,
      date: new Date().toISOString().split('T')[0],
      displayDate: 'Today',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      notes: notes || `Transferred from ${fromAcc.name} to ${toAcc.name}`,
      tags: ['transfer'],
      status: 'ready',
    };

    addTransaction(tx);
  };

  // Budget Actions
  const addBudget = (budgetData: Omit<Budget, 'id' | 'status'>) => {
    const ratio = budgetData.spent / (budgetData.allocated || 1);
    let status: Budget['status'] = 'healthy';
    if (ratio >= 1) status = 'exceeded';
    else if (ratio >= 0.8) status = 'near-limit';
    else if (ratio >= 0.3) status = 'on-track';

    const newBudget: Budget = {
      ...budgetData,
      id: `b-${Date.now()}`,
      status,
    };
    setBudgets((prev) => [...prev, newBudget]);
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const merged = { ...b, ...updates };
          const ratio = merged.spent / (merged.allocated || 1);
          let status: Budget['status'] = 'healthy';
          if (ratio >= 1) status = 'exceeded';
          else if (ratio >= 0.8) status = 'near-limit';
          else if (ratio >= 0.3) status = 'on-track';
          return { ...merged, status };
        }
        return b;
      })
    );
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  // Statement Processing
  const importSummary = importSummaryState;

  const processStatementUpload = async (file?: File | null, sampleType?: string) => {
    let summary: StatementImportSummary;
    if (file) {
      const buffer = await file.arrayBuffer();
      summary = await StatementService.processStatementFile(
        file.name,
        buffer,
        undefined,
        categories,
        transactions,
        accounts[0]?.id || 'acc-sbi',
        accounts[0]?.name || 'SBI Savings'
      );
    } else if (sampleType === 'kotak') {
      summary = await StatementService.processStatementFile(
        'Kotak_Account_Statement_Sep2026.pdf',
        undefined,
        KOTAK_SAMPLE_STATEMENT_TEXT,
        categories,
        transactions,
        'acc-kotak-6402',
        'Kotak Savings (6402)'
      );
    } else {
      // Demo / fallback statement processing (SBI)
      summary = await StatementService.processStatementFile(
        'SBI_Account_Statement.pdf',
        undefined,
        undefined,
        categories,
        transactions,
        accounts[0]?.id || 'acc-sbi',
        accounts[0]?.name || 'SBI Savings'
      );
    }

    // Auto-create Kotak account if statement is from Kotak Mahindra Bank
    if (summary.detectedBank === 'Kotak Mahindra Bank') {
      setAccounts((prev) => {
        const exists = prev.some(
          (a) => a.id === 'acc-kotak-6402' || a.accountNumber === '6402' || a.name.toLowerCase().includes('kotak')
        );
        if (!exists) {
          return [
            ...prev,
            {
              id: 'acc-kotak-6402',
              name: 'Kotak Savings',
              type: 'bank',
              accountNumber: summary.accountNumber || '6402',
              balance: summary.closingBalance ?? 2647.71,
              icon: 'account_balance',
              color: '#ED1C24',
            },
          ];
        }
        return prev;
      });
    }

    setImportSummaryState(summary);
    setTab('import-statement');
  };

  const processKotakDemoStatement = async () => {
    await processStatementUpload(null, 'kotak');
  };

  // Subscriptions & Recurring Expenses State
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    try {
      const saved = localStorage.getItem('moneyflow_subscriptions_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SUBSCRIPTIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('moneyflow_subscriptions_v1', JSON.stringify(subscriptions));
    } catch {}
  }, [subscriptions]);

  const addSubscription = (sub: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = {
      ...sub,
      id: `sub-${Date.now()}`,
    };
    setSubscriptions((prev) => [newSub, ...prev]);
  };

  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  const markSubscriptionPaid = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return;

    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().slice(0, 5);
    addTransaction({
      amount: sub.amount,
      type: 'expense',
      categoryId: sub.categoryId,
      categoryName: sub.categoryName,
      categoryIcon: sub.categoryIcon,
      categoryColor: sub.categoryColor,
      accountId: sub.accountId,
      accountName: sub.accountName,
      merchant: sub.name,
      party: sub.name,
      partyType: 'merchant',
      date: dateStr,
      time: timeStr,
      notes: `Subscription renewal (${sub.billingCycle})`,
    });

    const curr = new Date(sub.nextDueDate);
    if (sub.billingCycle === 'monthly') {
      curr.setMonth(curr.getMonth() + 1);
    } else if (sub.billingCycle === 'yearly') {
      curr.setFullYear(curr.getFullYear() + 1);
    } else if (sub.billingCycle === 'weekly') {
      curr.setDate(curr.getDate() + 7);
    }
    const nextDateStr = curr.toISOString().split('T')[0];
    updateSubscription(id, { nextDueDate: nextDateStr });
  };

  // Savings Goals & Sinking Funds State
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem('moneyflow_savings_goals_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SAVINGS_GOALS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('moneyflow_savings_goals_v1', JSON.stringify(savingsGoals));
    } catch {}
  }, [savingsGoals]);

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      currentAmount: 0,
      isCompleted: false,
    };
    setSavingsGoals((prev) => [newGoal, ...prev]);
  };

  const updateSavingsGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setSavingsGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteSavingsGoal = (id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const depositToGoal = (goalId: string, amount: number, fromAccountId: string) => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    const acc = accounts.find((a) => a.id === fromAccountId);
    if (!goal || !acc || amount <= 0) return;

    updateAccount(fromAccountId, { balance: acc.balance - amount });

    const newCurrent = goal.currentAmount + amount;
    const isCompleted = newCurrent >= goal.targetAmount;
    updateSavingsGoal(goalId, { currentAmount: newCurrent, isCompleted });

    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().slice(0, 5);
    addTransaction({
      amount,
      type: 'expense',
      categoryId: 'cat-investment',
      categoryName: 'Savings Goal',
      categoryIcon: goal.icon || 'savings',
      categoryColor: goal.color || '#10B981',
      accountId: fromAccountId,
      accountName: acc.name,
      merchant: `Saved for: ${goal.name}`,
      party: goal.name,
      partyType: 'unknown',
      date: dateStr,
      time: timeStr,
      notes: `Deposit to savings goal: ${goal.name}`,
    });
  };

  const withdrawFromGoal = (goalId: string, amount: number, toAccountId: string) => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    const acc = accounts.find((a) => a.id === toAccountId);
    if (!goal || !acc || amount <= 0) return;

    const actualWithdraw = Math.min(amount, goal.currentAmount);
    updateAccount(toAccountId, { balance: acc.balance + actualWithdraw });

    const newCurrent = Math.max(0, goal.currentAmount - actualWithdraw);
    updateSavingsGoal(goalId, { currentAmount: newCurrent, isCompleted: newCurrent >= goal.targetAmount });

    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().slice(0, 5);
    addTransaction({
      amount: actualWithdraw,
      type: 'income',
      categoryId: 'cat-investment',
      categoryName: 'Savings Goal',
      categoryIcon: goal.icon || 'savings',
      categoryColor: goal.color || '#10B981',
      accountId: toAccountId,
      accountName: acc.name,
      merchant: `Withdrawal from: ${goal.name}`,
      party: goal.name,
      partyType: 'unknown',
      date: dateStr,
      time: timeStr,
      notes: `Withdrawal from savings goal: ${goal.name}`,
    });
  };

  // SMS / Clipboard Transaction Addition
  const addTransactionFromSms = (result: ParsedSmsResult) => {
    const acc = accounts.find((a) => a.id === result.matchedAccountId) || accounts[0];
    const cat = categories.find((c) => c.id === result.suggestedCategoryId) || categories[0];

    addTransaction({
      amount: result.amount,
      type: result.type,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      accountId: acc.id,
      accountName: acc.name,
      merchant: result.merchant,
      party: result.merchant,
      partyType: 'merchant',
      upiReference: result.upiReference,
      date: result.date,
      time: result.time,
      notes: `Imported via SMS auto-detection (${result.bankName || 'UPI'})`,
      rawDescription: result.rawText,
    });
  };

  // Export & Backup
  const exportToCsv = (): string => {
    const headers = ['ID', 'Date', 'Time', 'Type', 'Amount (INR)', 'Category', 'Account', 'Merchant / Party', 'UPI Ref', 'Notes'];
    const rows = transactions.map((t) => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.time}"`,
      `"${t.type}"`,
      t.amount.toFixed(2),
      `"${t.categoryName}"`,
      `"${t.accountName}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${t.upiReference || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const exportToJson = (): string => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      transactions,
      accounts,
      categories,
      budgets,
      subscriptions,
      savingsGoals,
    };
    return JSON.stringify(backupData, null, 2);
  };

  const importFromJson = (jsonStr: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data) return { success: false, message: 'Invalid JSON file.' };

      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
      if (Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
      }
      if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
      if (Array.isArray(data.budgets)) {
        setBudgets(data.budgets);
      }
      if (Array.isArray(data.subscriptions)) {
        setSubscriptions(data.subscriptions);
      }
      if (Array.isArray(data.savingsGoals)) {
        setSavingsGoals(data.savingsGoals);
      }

      return { success: true, message: 'Backup restored successfully!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to parse JSON backup.' };
    }
  };

  const acceptImportTransaction = (id: string) => {
    setImportSummaryState((prev) => {
      const updatedTxs = prev.transactions.map((t) =>
        t.id === id ? { ...t, status: 'ready' as const, isDuplicate: false } : t
      );
      return {
        ...prev,
        transactions: updatedTxs,
      };
    });
  };

  const rejectImportTransaction = (id: string) => {
    setImportSummaryState((prev) => {
      const updatedTxs = prev.transactions.map((t) =>
        t.id === id ? { ...t, status: 'skipped' as const } : t
      );
      return {
        ...prev,
        transactions: updatedTxs,
      };
    });
  };

  const updateImportTransactionCategory = (id: string, categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;

    setImportSummaryState((prev) => {
      const updatedTxs = prev.transactions.map((t) =>
        t.id === id
          ? {
              ...t,
              categoryId: cat.id,
              categoryName: cat.name,
              categoryIcon: cat.icon,
              categoryColor: cat.color,
              status: 'ready' as const,
            }
          : t
      );
      return {
        ...prev,
        transactions: updatedTxs,
      };
    });
  };

  const confirmAllImportTransactions = async () => {
    const result = await ImportService.commitImport({
      transactions: importSummaryState.transactions,
      existingLedger: transactions,
      existingAccounts: accounts,
      categories,
      budgets,
      rememberDecisions: true,
    });

    setTransactions(result.updatedLedger);
    setAccounts(result.updatedAccounts);
    setBudgets(result.updatedBudgets);

    setImportSummaryState((prev) => ({
      ...prev,
      transactions: [],
      totalFound: 0,
      autoCategorized: 0,
      needsReview: 0,
      duplicates: 0,
    }));

    setTab('activity');
  };

  const resetToDemoData = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
      localStorage.removeItem(STORAGE_KEYS.BUDGETS);
      localStorage.removeItem(STORAGE_KEYS.IMPORT_BATCH);
      localStorage.removeItem('moneyflow_subscriptions_v1');
      localStorage.removeItem('moneyflow_savings_goals_v1');
      localStorage.removeItem('moneyflow_app_txs_v2');
      localStorage.removeItem('moneyflow_app_accs_v2');
      localStorage.removeItem('moneyflow_app_buds_v2');
      localStorage.removeItem('moneyflow_app_cats_v2');
      localStorage.removeItem('moneyflow_app_batch_v2');
      localStorage.removeItem('moneyflow_transactions_v1');
      localStorage.removeItem('moneyflow_accounts_v1');
      localStorage.removeItem('moneyflow_transactions');
      localStorage.removeItem('moneyflow_accounts');
      localStorage.removeItem('moneyflow_budgets');
    } catch {
      // ignore
    }
    setTransactions([]);
    setAccounts(INITIAL_ACCOUNTS);
    setCategories(INITIAL_CATEGORIES);
    setBudgets(INITIAL_BUDGETS);
    setSubscriptions([]);
    setSavingsGoals([]);
    setImportSummaryState({
      totalFound: 0,
      autoCategorized: 0,
      needsReview: 0,
      duplicates: 0,
      fileName: 'Bank_Statement.pdf',
      transactions: [],
    });
    setActivityFilterType('all');
    setTab('dashboard');
  };

  return (
    <FinanceContext.Provider
      value={{
        tab,
        setTab,
        goBack,
        canGoBack,
        transactions,
        accounts,
        categories,
        budgets,
        currencySymbol,
        formatCurrency,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        transferMoney,
        transferPreselectedFromAccount,
        setTransferPreselectedFromAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        addBudget,
        updateBudget,
        deleteBudget,
        importSummary,
        processStatementUpload,
        processKotakDemoStatement,
        acceptImportTransaction,
        rejectImportTransaction,
        updateImportTransactionCategory,
        confirmAllImportTransactions,
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        markSubscriptionPaid,
        savingsGoals,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        depositToGoal,
        withdrawFromGoal,
        addTransactionFromSms,
        exportToCsv,
        exportToJson,
        importFromJson,
        activeTransactionForDetail,
        setActiveTransactionForDetail,
        isAddAccountModalOpen,
        setIsAddAccountModalOpen,
        isTransferModalOpen,
        setIsTransferModalOpen,
        isNewBudgetModalOpen,
        setIsNewBudgetModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isSecurityModalOpen,
        setIsSecurityModalOpen,
        isAppSettingsModalOpen,
        setIsAppSettingsModalOpen,
        resetToDemoData,
        securitySettings,
        updateSecuritySettings,
        isAppLocked,
        unlockApp,
        lockApp,
        authenticateWithBiometric,
        verifyBiometricForAction,
        enrollBiometric,
        removeBiometric,
        biometricCapability,
        activityFilterType,
        setActivityFilterType,
        activityFilterAccount,
        setActivityFilterAccount,
        showTransactionsByType,
        totalBalance,
        totalIncome,
        totalExpenses,
        netFlow,
        totalNetWorth,
        totalBudgetAllocated,
        totalBudgetSpent,
        topSpendings,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
