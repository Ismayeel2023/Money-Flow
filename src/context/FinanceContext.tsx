import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Account,
  AutomationRule,
  Budget,
  Category,
  ScreenTab,
  StatementImportSummary,
  Transaction,
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_BUDGETS,
  INITIAL_CATEGORIES,
  INITIAL_IMPORT_BATCH,
  INITIAL_TRANSACTIONS,
} from '../data/mockData';
import { dbService } from '../database/dbSetup';
import { MigrationService } from '../services/migrationService';
import { CategoryInput, CategoryService } from '../services/categoryService';
import { StatementService } from '../services/statementService';
import { ImportService } from '../services/importService';

interface FinanceContextType {
  tab: ScreenTab;
  setTab: (tab: ScreenTab) => void;
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
  transferMoney: (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => void;
  addCategory: (input: CategoryInput) => Category;
  updateCategory: (id: string, updates: Partial<CategoryInput>) => Category;
  deleteCategory: (id: string) => boolean;
  addBudget: (budget: Omit<Budget, 'id' | 'status'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  importSummary: StatementImportSummary;
  processStatementUpload: (file?: File | null, sampleType?: string) => Promise<void>;
  acceptImportTransaction: (id: string) => void;
  rejectImportTransaction: (id: string) => void;
  updateImportTransactionCategory: (id: string, categoryId: string) => void;
  confirmAllImportTransactions: () => Promise<void>;
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
  resetToDemoData: () => void;
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
  TRANSACTIONS: 'moneyflow_app_txs_v2',
  ACCOUNTS: 'moneyflow_app_accs_v2',
  BUDGETS: 'moneyflow_app_buds_v2',
  CATEGORIES: 'moneyflow_app_cats_v2',
  IMPORT_BATCH: 'moneyflow_app_batch_v2',
};

const LEGACY_MOCK_TX_IDS = new Set(['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6', 'tx-7']);

const sanitizeLoadedTransactions = (): Transaction[] => {
  try {
    // Check current key
    let saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    // If not found, check legacy keys to migrate only non-mock user transactions
    if (!saved) {
      saved = localStorage.getItem('moneyflow_transactions_v1') || localStorage.getItem('moneyflow_transactions');
    }
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    
    // Purge known mock dummy records
    const clean = parsed.filter((t: any) => t && t.id && !LEGACY_MOCK_TX_IDS.has(t.id));
    return clean;
  } catch {
    return [];
  }
};

const sanitizeLoadedAccounts = (txs: Transaction[]): Account[] => {
  try {
    let saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!saved) {
      saved = localStorage.getItem('moneyflow_accounts_v1') || localStorage.getItem('moneyflow_accounts');
    }
    
    let accs = INITIAL_ACCOUNTS;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        accs = parsed;
      }
    }

    // If there are no real transactions, ensure balances default to 0
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
  const [tab, setTab] = useState<ScreenTab>('dashboard');
  const [currencySymbol] = useState<string>('₹');

  // Modals state
  const [activeTransactionForDetail, setActiveTransactionForDetail] = useState<Transaction | null>(null);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isNewBudgetModalOpen, setIsNewBudgetModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

  // Recalculate budget spent dynamically when transactions change
  useEffect(() => {
    setBudgets((prevBudgets) =>
      prevBudgets.map((b) => {
        const spent = transactions
          .filter((t) => t.categoryId === b.categoryId && t.type === 'expense')
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
      prevAccounts.map((acc) => {
        if (acc.id === newTx.accountId) {
          let newBalance = acc.balance;
          let newOutstanding = acc.outstanding;
          let newLimit = acc.availableLimit;

          if (acc.type === 'credit') {
            if (newTx.type === 'expense') {
              newOutstanding = (acc.outstanding || 0) + newTx.amount;
              newBalance = -newOutstanding;
              if (acc.availableLimit !== undefined) {
                newLimit = Math.max(0, acc.availableLimit - newTx.amount);
              }
            } else if (newTx.type === 'income' || newTx.type === 'refund') {
              newOutstanding = Math.max(0, (acc.outstanding || 0) - newTx.amount);
              newBalance = -newOutstanding;
              if (acc.availableLimit !== undefined) {
                newLimit = acc.availableLimit + newTx.amount;
              }
            }
          } else {
            if (newTx.type === 'expense') {
              newBalance -= newTx.amount;
            } else if (newTx.type === 'income' || newTx.type === 'refund') {
              newBalance += newTx.amount;
            }
          }

          return {
            ...acc,
            balance: newBalance,
            outstanding: newOutstanding,
            availableLimit: newLimit,
          };
        }
        return acc;
      })
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

  const transferMoney = (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    notes?: string
  ) => {
    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);
    if (!fromAcc || !toAcc) return;

    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id === fromAccountId) return { ...a, balance: a.balance - amount };
        if (a.id === toAccountId) return { ...a, balance: a.balance + amount };
        return a;
      })
    );

    const tx: Omit<Transaction, 'id'> = {
      amount,
      type: 'transfer',
      categoryId: 'cat-transfer',
      categoryName: 'Transfer',
      categoryIcon: 'sync_alt',
      categoryColor: '#3525cd',
      accountId: fromAccountId,
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

  const processStatementUpload = async (file?: File | null) => {
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
    } else {
      // Demo / fallback statement processing
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

    setImportSummaryState(summary);
    setTab('import-statement');
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
    setImportSummaryState({
      totalFound: 0,
      autoCategorized: 0,
      needsReview: 0,
      duplicates: 0,
      fileName: 'Bank_Statement.pdf',
      transactions: [],
    });
    setTab('dashboard');
  };

  return (
    <FinanceContext.Provider
      value={{
        tab,
        setTab,
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
        transferMoney,
        addCategory,
        updateCategory,
        deleteCategory,
        addBudget,
        updateBudget,
        deleteBudget,
        importSummary,
        processStatementUpload,
        acceptImportTransaction,
        rejectImportTransaction,
        updateImportTransactionCategory,
        confirmAllImportTransactions,
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
        resetToDemoData,
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
