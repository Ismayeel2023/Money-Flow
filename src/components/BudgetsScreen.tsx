import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Budget, Transaction } from '../types';

export const BudgetsScreen: React.FC = () => {
  const {
    budgets,
    transactions,
    totalBudgetAllocated,
    formatCurrency,
    setIsNewBudgetModalOpen,
    deleteBudget,
    updateBudget,
    setActiveTransactionForDetail,
    setTab,
  } = useFinance();

  // Current year-month key (e.g. "2026-09")
  const currentYM = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // Selected month for budget tracking (defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYM);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editLimitStr, setEditLimitStr] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  // Collect all months that have recorded transactions, plus the current month
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentYM);

    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        const ym = t.date.slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(ym)) {
          set.add(ym);
        }
      }
    });

    return Array.from(set).sort().reverse();
  }, [transactions, currentYM]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prevYM);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextYM = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextYM);
  };

  // Format month title (e.g. "September 2026")
  const formattedMonthTitle = useMemo(() => {
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  // Determine period status (current, past, future)
  const isCurrentMonth = selectedMonth === currentYM;
  const isPastMonth = selectedMonth < currentYM;
  const isFutureMonth = selectedMonth > currentYM;

  const daysInfo = useMemo(() => {
    if (isCurrentMonth) {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysLeft = Math.max(0, daysInMonth - now.getDate());
      return `${daysLeft} Days Left`;
    }
    if (isPastMonth) return 'Month Completed';
    return 'Upcoming Month';
  }, [isCurrentMonth, isPastMonth]);

  // Calculate spent amount for a specific category in the selected month
  const getCategorySpendData = (categoryId: string) => {
    const categoryTxs = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      if (t.categoryId !== categoryId) return false;
      const txYM = t.date ? t.date.slice(0, 7) : '';
      return txYM === selectedMonth;
    });

    const spent = categoryTxs.reduce((sum, t) => sum + t.amount, 0);
    return { spent, transactions: categoryTxs };
  };

  // Total budget spent across all categories in the selected month
  const totalSpentInMonth = useMemo(() => {
    return budgets.reduce((sum, b) => {
      const { spent } = getCategorySpendData(b.categoryId);
      return sum + spent;
    }, 0);
  }, [budgets, transactions, selectedMonth]);

  const remainingInMonth = Math.max(0, totalBudgetAllocated - totalSpentInMonth);
  const totalPercentage = Math.min(
    100,
    totalBudgetAllocated > 0 ? Math.round((totalSpentInMonth / totalBudgetAllocated) * 100) : 0
  );

  const handleStartEdit = (b: Budget) => {
    setEditingBudgetId(b.id);
    setEditLimitStr(b.allocated.toString());
  };

  const handleSaveLimit = (budgetId: string) => {
    const newLimit = parseFloat(editLimitStr);
    if (!isNaN(newLimit) && newLimit > 0) {
      updateBudget(budgetId, { allocated: newLimit });
    }
    setEditingBudgetId(null);
  };

  const handleDeleteBudget = (b: Budget) => {
    if (window.confirm(`Are you sure you want to remove the budget for ${b.categoryName}?`)) {
      deleteBudget(b.id);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-2 pb-32 gap-5">
      {/* Month Selector Bar */}
      <section className="bg-[#1A1A1A] rounded-2xl p-3 border border-[#262626] shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-9 h-9 rounded-xl bg-[#242424] hover:bg-[#303030] text-[#E0E0E0] border border-[#333333] flex items-center justify-center transition-colors cursor-pointer"
            title="Previous Month"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#D4AF37] text-[18px]">
                calendar_month
              </span>
              <h2 className="font-display text-[16px] sm:text-[17px] font-bold text-[#FFFFFF]">
                {formattedMonthTitle}
              </h2>
            </div>
            <span
              className={`font-body text-[10px] font-semibold tracking-wider uppercase ${
                isCurrentMonth
                  ? 'text-[#34D399]'
                  : isPastMonth
                  ? 'text-[#888888]'
                  : 'text-[#D4AF37]'
              }`}
            >
              {isCurrentMonth ? 'Active Month' : isPastMonth ? 'Historical' : 'Future'} • {daysInfo}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-9 h-9 rounded-xl bg-[#242424] hover:bg-[#303030] text-[#E0E0E0] border border-[#333333] flex items-center justify-center transition-colors cursor-pointer"
            title="Next Month"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>

        {/* Quick Month Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedMonth(currentYM)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
              isCurrentMonth
                ? 'bg-[#D4AF37] text-[#0F0F0F]'
                : 'bg-[#242424] hover:bg-[#2C2C2C] text-[#A0A0A0] border border-[#333333]'
            }`}
          >
            This Month
          </button>

          {availableMonths
            .filter((ym) => ym !== currentYM)
            .slice(0, 3)
            .map((ym) => {
              const [y, m] = ym.split('-').map(Number);
              const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', {
                month: 'short',
                year: '2-digit',
              });
              const isSelected = selectedMonth === ym;
              return (
                <button
                  key={ym}
                  type="button"
                  onClick={() => setSelectedMonth(ym)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#D4AF37] text-[#0F0F0F]'
                      : 'bg-[#242424] hover:bg-[#2C2C2C] text-[#A0A0A0] border border-[#333333]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
        </div>
      </section>

      {/* Top Card: Monthly Overview */}
      <section className="relative bg-[#1A1A1A] rounded-[32px] p-6 shadow-sm border border-[#262626] overflow-hidden isolate">
        {/* Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#10B981]/10 rounded-full blur-2xl -z-10 -translate-x-1/3 translate-y-1/3" />

        <div className="flex flex-col items-center text-center gap-1.5 mb-5">
          <span className="font-body text-[11px] font-bold text-[#888888] uppercase tracking-widest">
            {formattedMonthTitle} Budget
          </span>
          <h2 className="font-display text-[32px] sm:text-[36px] font-bold text-[#FFFFFF] flex items-baseline gap-1 flex-wrap justify-center">
            <span className="text-[#888888] text-[20px]">₹</span>
            {new Intl.NumberFormat('en-IN').format(totalSpentInMonth)}
            <span className="text-[#888888] text-[20px] font-medium">
              / ₹{new Intl.NumberFormat('en-IN').format(totalBudgetAllocated)}
            </span>
          </h2>
          <p className="font-body text-[14px] text-[#A0A0A0] mt-1">
            {totalSpentInMonth > totalBudgetAllocated ? (
              <span className="text-[#FB7185] font-semibold">
                Exceeded budget by {formatCurrency(totalSpentInMonth - totalBudgetAllocated)}
              </span>
            ) : (
              <>
                You have{' '}
                <span className="text-[#34D399] font-semibold">
                  {formatCurrency(remainingInMonth)}
                </span>{' '}
                remaining {isCurrentMonth ? 'this month' : `for ${formattedMonthTitle}`}.
              </>
            )}
          </p>
        </div>

        {/* Master Progress Bar */}
        <div className="w-full bg-[#262626] rounded-full h-4 relative overflow-hidden mb-2.5 shadow-inner">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${
              totalPercentage >= 100
                ? 'bg-gradient-to-r from-[#F43F5E] to-[#FB7185]'
                : totalPercentage >= 80
                ? 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]'
                : 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158]'
            }`}
            style={{
              width: `${totalPercentage}%`,
              boxShadow:
                totalPercentage >= 100
                  ? '0 0 12px rgba(244, 63, 94, 0.4)'
                  : '0 0 12px rgba(212, 175, 55, 0.4)',
            }}
          />
        </div>

        <div className="flex justify-between items-center font-body text-[12px] font-bold text-[#888888]">
          <span>{totalPercentage}% Used</span>
          <span>{daysInfo}</span>
        </div>
      </section>

      {/* Categories List */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-display text-[20px] font-bold text-[#E0E0E0]">
              Category Budgets
            </h3>
            <span className="font-body text-[11px] text-[#888888]">
              Expenses logged for {formattedMonthTitle}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTab('categories')}
            className="text-[13px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Categories</span>
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          {budgets.map((b) => {
            const { spent: categorySpent, transactions: categoryTxs } = getCategorySpendData(
              b.categoryId
            );

            const ratio = b.allocated > 0 ? categorySpent / b.allocated : 0;
            const percentage = Math.min(100, Math.round(ratio * 100));

            // Dynamic status tokens based on actual spend for this month
            let statusText = 'On Track';
            let statusColor = 'text-[#34D399]';
            let barColor = 'bg-[#10B981]';
            let iconBg = 'bg-[#10B981]/15 text-[#34D399]';

            if (ratio >= 1) {
              statusText = 'Exceeded';
              statusColor = 'text-[#FB7185]';
              barColor = 'bg-[#F43F5E]';
              iconBg = 'bg-[#F43F5E]/15 text-[#FB7185]';
            } else if (ratio >= 0.8) {
              statusText = 'Near Limit';
              statusColor = 'text-[#FB7185]';
              barColor = 'bg-[#F43F5E]';
              iconBg = 'bg-[#F43F5E]/15 text-[#FB7185]';
            } else if (ratio > 0) {
              statusText = 'On Track';
              statusColor = 'text-[#D4AF37]';
              barColor = 'bg-[#D4AF37]';
              iconBg = 'bg-[#D4AF37]/15 text-[#D4AF37]';
            } else {
              statusText = 'Unused';
              statusColor = 'text-[#888888]';
              barColor = 'bg-[#444444]';
              iconBg = 'bg-[#333333] text-[#A0A0A0]';
            }

            const isWarning = ratio >= 0.8;
            const isExpanded = expandedCategoryId === b.categoryId;

            return (
              <div
                key={b.id}
                className="group bg-[#1A1A1A] rounded-3xl p-4 sm:p-5 border border-[#262626] shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-[#D4AF37]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden"
              >
                {/* Warning subtle ambient red glow */}
                {isWarning && (
                  <div className="absolute right-0 top-0 w-32 h-32 bg-[#F43F5E]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                )}

                <div className="flex justify-between items-center mb-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
                      <span className="material-symbols-outlined text-[24px]">
                        {b.categoryIcon || 'category'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body text-[16px] font-bold text-[#E0E0E0]">
                        {b.categoryName}
                      </span>
                      <span className="font-body text-[11px] text-[#888888]">
                        {categoryTxs.length}{' '}
                        {categoryTxs.length === 1 ? 'transaction' : 'transactions'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col">
                    <span
                      className={`font-display text-[16px] sm:text-[18px] font-bold ${
                        isWarning ? 'text-[#FB7185]' : 'text-[#E0E0E0]'
                      }`}
                    >
                      {formatCurrency(categorySpent)}
                    </span>
                    <span className="font-body text-[12px] font-medium text-[#888888]">
                      of {formatCurrency(b.allocated)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#262626] rounded-full h-3 relative overflow-hidden z-10 mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(b)}
                      className="text-[#888888] hover:text-[#FFFFFF] p-1 rounded-lg hover:bg-[#262626] transition-colors text-[12px] flex items-center gap-1 font-body font-semibold cursor-pointer"
                      title="Adjust Budget Limit"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Edit Limit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBudget(b)}
                      className="text-[#888888] hover:text-[#FB7185] p-1 rounded-lg hover:bg-[#FB7185]/15 transition-colors text-[12px] flex items-center gap-1 font-body font-semibold cursor-pointer"
                      title="Delete Budget"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>

                    {categoryTxs.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCategoryId(isExpanded ? null : b.categoryId)
                        }
                        className="text-[#D4AF37] hover:underline p-1 rounded-lg hover:bg-[#D4AF37]/10 transition-colors text-[12px] flex items-center gap-0.5 font-body font-semibold cursor-pointer ml-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                        <span>{isExpanded ? 'Hide' : 'View'}</span>
                      </button>
                    )}
                  </div>

                  <span className={`font-body text-[12px] font-bold ${statusColor}`}>
                    {statusText}
                  </span>
                </div>

                {/* Inline Edit Form if active */}
                {editingBudgetId === b.id && (
                  <div className="mt-3 pt-3 border-t border-[#2A2A2A] flex items-center gap-2 relative z-10">
                    <span className="text-[#888888] text-[13px] font-bold">₹</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editLimitStr}
                      onChange={(e) => setEditLimitStr(e.target.value.replace(/[^0-9.]/g, ''))}
                      className="flex-1 bg-[#242424] text-[#FFFFFF] px-3 py-1.5 rounded-xl border border-[#3A3A3A] text-[14px] font-semibold outline-none focus:border-[#D4AF37]"
                      placeholder="New monthly limit"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveLimit(b.id)}
                      className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] text-[12px] font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBudgetId(null)}
                      className="bg-[#262626] text-[#888888] hover:text-white text-[12px] font-bold px-2.5 py-1.5 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Expanded Month Transactions Breakdown */}
                {isExpanded && categoryTxs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#262626] flex flex-col gap-2 relative z-10 animate-fadeIn">
                    <span className="font-body text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                      {formattedMonthTitle} Transactions
                    </span>
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {categoryTxs.map((tx: Transaction) => (
                        <div
                          key={tx.id}
                          onClick={() => setActiveTransactionForDetail(tx)}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] transition-colors cursor-pointer border border-[#2E2E2E]"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-body text-[13px] font-semibold text-[#FFFFFF] truncate">
                              {tx.merchant || 'Expense'}
                            </span>
                            <span className="font-body text-[10px] text-[#888888]">
                              {tx.date}
                            </span>
                          </div>
                          <span className="font-display text-[13px] font-bold text-[#FB7185] shrink-0">
                            - {formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Create New Budget Button */}
          <button
            id="btn-create-budget"
            type="button"
            onClick={() => setIsNewBudgetModalOpen(true)}
            className="w-full mt-2 py-4 rounded-3xl border-2 border-dashed border-[#383838] text-[#A0A0A0] font-body text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#222222] hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">add_circle</span>
            <span>Create New Budget</span>
          </button>
        </div>
      </section>
    </div>
  );
};
