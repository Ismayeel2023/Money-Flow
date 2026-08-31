import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Budget } from '../types';

export const BudgetsScreen: React.FC = () => {
  const {
    budgets,
    totalBudgetAllocated,
    totalBudgetSpent,
    formatCurrency,
    setIsNewBudgetModalOpen,
    deleteBudget,
    updateBudget,
    setTab,
  } = useFinance();

  const [editingBudgetId, setEditingBudgetId] = React.useState<string | null>(null);
  const [editLimitStr, setEditLimitStr] = React.useState('');

  const remaining = Math.max(0, totalBudgetAllocated - totalBudgetSpent);
  const totalPercentage = Math.min(
    100,
    totalBudgetAllocated > 0 ? Math.round((totalBudgetSpent / totalBudgetAllocated) * 100) : 0
  );

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, daysInMonth - now.getDate());

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
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-2 pb-32 gap-6">
      {/* Top Card: Overview */}
      <section className="relative bg-[#1A1A1A] rounded-[36px] p-6 shadow-sm border border-[#262626] overflow-hidden isolate">
        {/* Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#10B981]/10 rounded-full blur-2xl -z-10 -translate-x-1/3 translate-y-1/3" />

        <div className="flex flex-col items-center text-center gap-1.5 mb-5">
          <span className="font-body text-[11px] font-bold text-[#888888] uppercase tracking-widest">
            Total Monthly Budget
          </span>
          <h2 className="font-display text-[32px] sm:text-[36px] font-bold text-[#FFFFFF] flex items-baseline gap-1 flex-wrap justify-center">
            <span className="text-[#888888] text-[20px]">₹</span>
            {new Intl.NumberFormat('en-IN').format(totalBudgetSpent)}
            <span className="text-[#888888] text-[20px] font-medium">
              / ₹{new Intl.NumberFormat('en-IN').format(totalBudgetAllocated)}
            </span>
          </h2>
          <p className="font-body text-[14px] text-[#A0A0A0] mt-1">
            You have <span className="text-[#34D399] font-semibold">{formatCurrency(remaining)}</span> remaining this month.
          </p>
        </div>

        {/* Master Progress Bar */}
        <div className="w-full bg-[#262626] rounded-full h-4 relative overflow-hidden mb-2.5 shadow-inner">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] rounded-full transition-all duration-700"
            style={{
              width: `${totalPercentage}%`,
              boxShadow: '0 0 12px rgba(212, 175, 55, 0.4)',
            }}
          />
        </div>

        <div className="flex justify-between items-center font-body text-[12px] font-bold text-[#888888]">
          <span>{totalPercentage}% Used</span>
          <span>{daysLeft} Days Left</span>
        </div>
      </section>

      {/* Categories List */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display text-[22px] font-bold text-[#E0E0E0]">
            Category Budgets
          </h3>
          <button
            onClick={() => setTab('categories')}
            className="text-[13px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Manage Categories</span>
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          {budgets.map((b) => {
            const ratio = b.allocated > 0 ? b.spent / b.allocated : 0;
            const percentage = Math.min(100, Math.round(ratio * 100));

            // Dynamic status tokens based on actual spend
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
                    <span className="font-body text-[16px] font-bold text-[#E0E0E0]">
                      {b.categoryName}
                    </span>
                  </div>

                  <div className="text-right flex flex-col">
                    <span
                      className={`font-display text-[16px] sm:text-[18px] font-bold ${
                        isWarning ? 'text-[#FB7185]' : 'text-[#E0E0E0]'
                      }`}
                    >
                      {formatCurrency(b.spent)}
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
                      className="text-[#888888] hover:text-[#FFFFFF] p-1 rounded-lg hover:bg-[#262626] transition-colors text-[12px] flex items-center gap-1 font-body font-semibold"
                      title="Adjust Budget Limit"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Edit Limit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBudget(b)}
                      className="text-[#888888] hover:text-[#FB7185] p-1 rounded-lg hover:bg-[#FB7185]/15 transition-colors text-[12px] flex items-center gap-1 font-body font-semibold"
                      title="Delete Budget"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
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
                      className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] text-[12px] font-bold px-3 py-1.5 rounded-xl"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBudgetId(null)}
                      className="bg-[#262626] text-[#888888] hover:text-white text-[12px] font-bold px-2.5 py-1.5 rounded-xl"
                    >
                      Cancel
                    </button>
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
            className="w-full mt-2 py-4 rounded-3xl border-2 border-dashed border-[#383838] text-[#A0A0A0] font-body text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#222222] hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[22px]">add_circle</span>
            <span>Create New Budget</span>
          </button>
        </div>
      </section>
    </div>
  );
};
