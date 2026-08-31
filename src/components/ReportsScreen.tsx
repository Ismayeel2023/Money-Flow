import React from 'react';
import { useFinance } from '../context/FinanceContext';

export const ReportsScreen: React.FC = () => {
  const {
    totalIncome,
    totalExpenses,
    netFlow,
    topSpendings,
    formatCurrency,
    setTab,
  } = useFinance();

  const totalSpent = topSpendings.reduce((sum, item) => sum + item.amount, 0) || 1;

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-1 pb-32 gap-6">
      {/* Monthly Summary Card */}
      <section className="bg-[#1A1A1A] rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-[#262626]">
        <h3 className="font-display text-[20px] font-bold text-[#FFFFFF] mb-4">
          Financial Breakdown
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#10B981]/15 rounded-2xl p-4 flex flex-col gap-1 border border-[#10B981]/30">
            <span className="font-body text-[11px] font-bold text-[#34D399] uppercase">
              Total Inflow
            </span>
            <span className="font-display text-[20px] font-bold text-[#34D399]">
              {formatCurrency(totalIncome)}
            </span>
          </div>

          <div className="bg-[#FB7185]/15 rounded-2xl p-4 flex flex-col gap-1 border border-[#FB7185]/30">
            <span className="font-body text-[11px] font-bold text-[#FB7185] uppercase">
              Total Outflow
            </span>
            <span className="font-display text-[20px] font-bold text-[#FB7185]">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>

        {/* Net Flow summary */}
        <div className="bg-[#262626] rounded-2xl p-4 flex items-center justify-between border border-[#333333]">
          <div>
            <span className="font-body text-[11px] font-bold text-[#888888] uppercase">
              Net Savings Rate
            </span>
            <p className="font-display text-[18px] font-bold text-[#FFFFFF]">
              {totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0}%
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full font-body text-[12px] font-bold ${
              netFlow < 0 ? 'bg-[#FB7185]/20 text-[#FB7185]' : 'bg-[#10B981]/20 text-[#34D399]'
            }`}
          >
            {formatCurrency(netFlow, { showSign: true })}
          </div>
        </div>
      </section>

      {/* Category Breakdown */}
      <section className="bg-[#1A1A1A] rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-[#262626] flex flex-col gap-4">
        <h3 className="font-display text-[18px] font-bold text-[#FFFFFF]">
          Spending by Category
        </h3>

        <div className="flex flex-col gap-3.5">
          {topSpendings.map((item) => {
            const share = Math.round((item.amount / totalSpent) * 100);
            return (
              <div key={item.category.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[14px]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
                      {item.category.icon || 'receipt'}
                    </span>
                    <span className="font-bold text-[#E0E0E0]">{item.category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#FFFFFF]">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="text-[#888888] font-medium text-[12px]">
                      ({share}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-[#262626] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D4AF37] rounded-full"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={() => setTab('settings')}
        className="w-full bg-[#262626] hover:bg-[#333333] text-[#E0E0E0] border border-[#383838] font-body text-[14px] font-bold py-4 rounded-full transition-colors"
      >
        Back to Settings
      </button>
    </div>
  );
};
