import { Account, Budget, Category, Transaction } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-dining',
    name: 'Food & Dining',
    icon: 'restaurant',
    color: '#3525cd',
    bgColor: 'bg-secondary-container/20 text-on-secondary-container',
    type: 'expense',
    isSystem: true,
  },
  {
    id: 'cat-shopping',
    name: 'Shopping',
    icon: 'shopping_bag',
    color: '#95002b',
    bgColor: 'bg-error-container/40 text-error',
    type: 'expense',
    isSystem: true,
  },
  {
    id: 'cat-transport',
    name: 'Transport',
    icon: 'directions_car',
    color: '#3525cd',
    bgColor: 'bg-primary-container/10 text-primary',
    type: 'expense',
    isSystem: true,
  },
  {
    id: 'cat-grocery',
    name: 'Grocery',
    icon: 'shopping_cart',
    color: '#006c49',
    bgColor: 'bg-[#E8F5E9] text-[#2E7D32]',
    type: 'expense',
    isSystem: true,
  },
  {
    id: 'cat-coffee',
    name: 'Coffee',
    icon: 'local_cafe',
    color: '#bf0f3c',
    bgColor: 'bg-tertiary-container/10 text-tertiary',
    type: 'expense',
    isSystem: true,
  },
  {
    id: 'cat-entertainment',
    name: 'Entertainment',
    icon: 'movie',
    color: '#4f46e5',
    bgColor: 'bg-indigo-50 text-indigo-700',
    type: 'expense',
    isSystem: true,
  },
  {
    id: 'cat-salary',
    name: 'Salary',
    icon: 'payments',
    color: '#006c49',
    bgColor: 'bg-secondary-container text-on-secondary-container',
    type: 'income',
    isSystem: true,
  },
  {
    id: 'cat-transfer',
    name: 'Transfer',
    icon: 'sync_alt',
    color: '#3525cd',
    bgColor: 'bg-primary-container/20 text-primary',
    type: 'both',
    isSystem: true,
  },
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-sbi',
    name: 'SBI Savings',
    type: 'bank',
    accountNumber: '4589',
    balance: 0,
    icon: 'account_balance',
    color: '#3525cd',
  },
  {
    id: 'acc-cash',
    name: 'Wallet Cash',
    type: 'cash',
    balance: 0,
    icon: 'payments',
    color: '#2E7D32',
  },
];

export const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'b-dining',
    categoryId: 'cat-dining',
    categoryName: 'Food & Dining',
    categoryIcon: 'restaurant',
    categoryColor: '#006c49',
    allocated: 5000,
    spent: 0,
    period: 'monthly',
    status: 'healthy',
  },
  {
    id: 'b-shopping',
    categoryId: 'cat-shopping',
    categoryName: 'Shopping',
    categoryIcon: 'shopping_bag',
    categoryColor: '#ba1a1a',
    allocated: 5000,
    spent: 0,
    period: 'monthly',
    status: 'healthy',
  },
  {
    id: 'b-transport',
    categoryId: 'cat-transport',
    categoryName: 'Transport',
    categoryIcon: 'directions_car',
    categoryColor: '#3525cd',
    allocated: 3000,
    spent: 0,
    period: 'monthly',
    status: 'healthy',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_IMPORT_BATCH: Transaction[] = [];

