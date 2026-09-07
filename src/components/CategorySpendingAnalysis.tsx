import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CustomDropdown } from './CustomDropdown';

export const CategorySpendingAnalysis: React.FC = () => {
  const { categories, transactions, formatCurrency, setActiveTransactionForDetail } = useFinance();

  // Filter strictly to expense categories
  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense' || c.type === 'both');
  }, [categories]);

  // State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    expenseCategories[0]?.id || 'cat-dining'
  );

  // Preset Date Ranges
  type DatePreset = 'this-month' | 'last-month' | 'last-30-days' | 'custom';
  const [preset, setPreset] = useState<DatePreset>('this-month');

  // Compute default dates
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const firstDayThisMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const lastDayThisMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
  const lastDayLastMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [customStartDate, setCustomStartDate] = useState<string>(firstDayThisMonth);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  const { effectiveStartDate, effectiveEndDate, dateRangeLabel } = useMemo(() => {
    if (preset === 'this-month') {
      return {
        effectiveStartDate: firstDayThisMonth,
        effectiveEndDate: lastDayThisMonth,
        dateRangeLabel: 'This Month',
      };
    }
    if (preset === 'last-month') {
      return {
        effectiveStartDate: firstDayLastMonth,
        effectiveEndDate: lastDayLastMonth,
        dateRangeLabel: 'Last Month',
      };
    }
    if (preset === 'last-30-days') {
      return {
        effectiveStartDate: thirtyDaysAgo,
        effectiveEndDate: todayStr,
        dateRangeLabel: 'Last 30 Days',
      };
    }
    return {
      effectiveStartDate: customStartDate,
      effectiveEndDate: customEndDate,
      dateRangeLabel: `${customStartDate} to ${customEndDate}`,
    };
  }, [preset, customStartDate, customEndDate, firstDayThisMonth, lastDayThisMonth, firstDayLastMonth, lastDayLastMonth, thirtyDaysAgo, todayStr]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || expenseCategories[0];

  // =========================================================================
  // STRICT CALCULATION:
  // ONLY Expense transactions
  // ONLY Selected category
  // ONLY Transactions whose date falls within the selected date range
  // NEVER includes Income, Transfers, Refunds, or other categories
  // =========================================================================
  const matchingTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. MUST be expense transactions ONLY
      if (t.type !== 'expense') return false;

      // 2. MUST match the selected category
      if (t.categoryId !== selectedCategoryId) return false;

      // 3. MUST fall within date range
      if (effectiveStartDate && t.date < effectiveStartDate) return false;
      if (effectiveEndDate && t.date > effectiveEndDate) return false;

      return true;
    });
  }, [transactions, selectedCategoryId, effectiveStartDate, effectiveEndDate]);

  const totalSpent = useMemo(() => {
    return matchingTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [matchingTransactions]);

  const transactionCount = matchingTransactions.length;
  const averageTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header Title & Concept Clarification */}
      <div className="bg-[#1A1A1A] rounded-3xl p-5 border border-[#262626] shadow-sm flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">query_stats</span>
          </div>
          <h2 className="font-display text-[18px] font-bold text-[#FFFFFF]">
            Category Spending Analysis
          </h2>
        </div>
        <p className="font-body text-[13px] text-[#888888] leading-relaxed">
          Calculate how much money you actually spent in a specific expense category during a selected date range.
        </p>
      </div>

      {/* Category Selection */}
      <div className="flex flex-col gap-2">
        <label className="font-body text-[11px] font-bold text-[#888888] tracking-wider uppercase">
          1. SELECT EXPENSE CATEGORY
        </label>
        <CustomDropdown
          id="analysis-category-select"
          value={selectedCategoryId}
          onChange={(newCatId) => setSelectedCategoryId(newCatId)}
          options={expenseCategories.map((c) => ({
            id: c.id,
            label: c.name,
            icon: c.icon,
            color: c.color,
            sublabel: 'Expense',
          }))}
          placeholder="Select expense category"
          className="w-full"
        />
      </div>

      {/* Date Range Selection */}
      <div className="flex flex-col gap-2">
        <label className="font-body text-[11px] font-bold text-[#888888] tracking-wider uppercase">
          2. SELECT DATE RANGE
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setPreset('this-month')}
            className={`py-2.5 px-3 rounded-xl font-body text-[12px] font-bold transition-all border ${
              preset === 'this-month'
                ? 'bg-[#D4AF37] text-[#0F0F0F] border-[#D4AF37] shadow-[0_2px_8px_rgba(212,175,55,0.25)]'
                : 'bg-[#1A1A1A] text-[#888888] hover:text-[#E0E0E0] border-[#2A2A2A]'
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => setPreset('last-month')}
            className={`py-2.5 px-3 rounded-xl font-body text-[12px] font-bold transition-all border ${
              preset === 'last-month'
                ? 'bg-[#D4AF37] text-[#0F0F0F] border-[#D4AF37] shadow-[0_2px_8px_rgba(212,175,55,0.25)]'
                : 'bg-[#1A1A1A] text-[#888888] hover:text-[#E0E0E0] border-[#2A2A2A]'
            }`}
          >
            Last Month
          </button>
          <button
            type="button"
            onClick={() => setPreset('last-30-days')}
            className={`py-2.5 px-3 rounded-xl font-body text-[12px] font-bold transition-all border ${
              preset === 'last-30-days'
                ? 'bg-[#D4AF37] text-[#0F0F0F] border-[#D4AF37] shadow-[0_2px_8px_rgba(212,175,55,0.25)]'
                : 'bg-[#1A1A1A] text-[#888888] hover:text-[#E0E0E0] border-[#2A2A2A]'
            }`}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => setPreset('custom')}
            className={`py-2.5 px-3 rounded-xl font-body text-[12px] font-bold transition-all border ${
              preset === 'custom'
                ? 'bg-[#D4AF37] text-[#0F0F0F] border-[#D4AF37] shadow-[0_2px_8px_rgba(212,175,55,0.25)]'
                : 'bg-[#1A1A1A] text-[#888888] hover:text-[#E0E0E0] border-[#2A2A2A]'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Custom Date Pickers */}
        {preset === 'custom' && (
          <div className="grid grid-cols-2 gap-2.5 mt-1">
            <div className="bg-[#1A1A1A] rounded-xl p-2.5 border border-[#2A2A2A] flex flex-col gap-1">
              <span className="text-[10px] text-[#888888] font-bold uppercase">From Date</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent text-[13px] text-[#E0E0E0] font-medium outline-none [color-scheme:dark]"
              />
            </div>
            <div className="bg-[#1A1A1A] rounded-xl p-2.5 border border-[#2A2A2A] flex flex-col gap-1">
              <span className="text-[10px] text-[#888888] font-bold uppercase">To Date</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent text-[13px] text-[#E0E0E0] font-medium outline-none [color-scheme:dark]"
              />
            </div>
          </div>
        )}
      </div>

      {/* RESULT METRICS DISPLAY */}
      <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(212,175,55,0.08)] flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Active Scope Badge */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedCategory?.color || '#D4AF37' }}
            />
            <span className="font-body text-[13px] font-bold text-[#FFFFFF]">
              {selectedCategory?.name || 'Category'}
            </span>
          </div>
          <span className="font-body text-[12px] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
            {dateRangeLabel}
          </span>
        </div>

        {/* Primary Metric: Total Spent */}
        <div className="flex flex-col gap-1">
          <span className="font-body text-[11px] font-bold text-[#888888] tracking-widest uppercase">
            TOTAL SPENT
          </span>
          <div className="font-display text-[36px] sm:text-[42px] font-bold text-[#FFFFFF] tracking-tight">
            {formatCurrency(totalSpent)}
          </div>
        </div>

        {/* Secondary Metrics: Transactions & Average Transaction */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-[#141414] rounded-2xl p-3.5 border border-[#262626] flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[#888888]">
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span className="font-body text-[10px] font-bold tracking-wider uppercase">
                TRANSACTIONS
              </span>
            </div>
            <div className="font-display text-[22px] font-bold text-[#E0E0E0]">
              {transactionCount}
            </div>
          </div>

          <div className="bg-[#141414] rounded-2xl p-3.5 border border-[#262626] flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[#888888]">
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              <span className="font-body text-[10px] font-bold tracking-wider uppercase">
                AVERAGE TRANSACTION
              </span>
            </div>
            <div className="font-display text-[22px] font-bold text-[#D4AF37]">
              {formatCurrency(averageTransaction)}
            </div>
          </div>
        </div>
      </div>

      {/* Matching Transactions Breakdown */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[16px] font-bold text-[#E0E0E0]">
            Matching Expense Items ({matchingTransactions.length})
          </h3>
          <span className="text-[12px] font-body text-[#888888]">
            Expenses only
          </span>
        </div>

        {matchingTransactions.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-6 text-center border border-[#262626] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[#666666] text-[32px]">
              savings
            </span>
            <p className="font-body text-[14px] text-[#888888]">
              No expenses recorded in {selectedCategory?.name} during {dateRangeLabel}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {matchingTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setActiveTransactionForDetail(tx)}
                className="bg-[#1A1A1A] hover:bg-[#222222] cursor-pointer rounded-2xl p-3.5 border border-[#262626] flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: `${selectedCategory?.color || '#D4AF37'}25`, color: selectedCategory?.color || '#D4AF37' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {selectedCategory?.icon || 'receipt'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-body text-[14px] font-semibold text-[#FFFFFF] truncate">
                      {tx.merchant}
                    </span>
                    <span className="font-body text-[12px] text-[#888888]">
                      {tx.date} • {tx.accountName}
                    </span>
                  </div>
                </div>
                <div className="font-display text-[15px] font-bold text-[#FFFFFF] shrink-0">
                  -{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
