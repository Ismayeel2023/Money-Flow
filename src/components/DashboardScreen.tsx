import React from 'react';
import { useFinance } from '../context/FinanceContext';

export const DashboardScreen: React.FC = () => {
  const {
    totalBalance,
    totalIncome,
    totalExpenses,
    netFlow,
    topSpendings,
    transactions,
    formatCurrency,
    setTab,
    setActiveTransactionForDetail,
  } = useFinance();

  const recentTransactions = transactions.slice(0, 4);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-2 pb-28 gap-7">
      {/* Main Balance & High Level Stats */}
      <section className="flex flex-col gap-6 items-center text-center mt-2 relative">
        {/* Subtle gold glow behind balance */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#D4AF37]/15 blur-[50px] rounded-full z-0 pointer-events-none animate-glow" />

        <div className="flex flex-col items-center gap-1 relative z-10">
          <span className="font-body text-[12px] font-bold text-[#888888] uppercase tracking-widest">
            Total Balance
          </span>
          <h1 className="font-display text-[44px] sm:text-[48px] font-bold tracking-tight text-[#FFFFFF] leading-none my-1">
            {formatCurrency(totalBalance)}
          </h1>

          {/* Net Flow Chip */}
          <div
            className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold ${
              netFlow < 0
                ? 'bg-[#F43F5E]/15 text-[#FB7185] border border-[#F43F5E]/20'
                : 'bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {netFlow < 0 ? 'trending_down' : 'trending_up'}
            </span>
            <span>
              {formatCurrency(netFlow, { showSign: true })} Net Flow
            </span>
          </div>
        </div>

        {/* Income / Expense Split */}
        <div className="flex w-full gap-3 relative z-10">
          {/* Income Card */}
          <div
            id="card-income"
            onClick={() => setTab('activity')}
            className="flex-1 bg-[#1A1A1A] rounded-3xl p-4 sm:p-5 flex flex-col gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-[#262626] hover:border-[#D4AF37]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all active:scale-[0.98] cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-full bg-[#10B981]/15 flex items-center justify-center mb-1 text-[#34D399]">
              <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
            </div>
            <span className="font-body text-[12px] font-bold text-[#888888]">Income</span>
            <span className="font-display text-[22px] sm:text-[24px] font-bold text-[#E0E0E0]">
              {formatCurrency(totalIncome)}
            </span>
          </div>

          {/* Expenses Card */}
          <div
            id="card-expenses"
            onClick={() => setTab('activity')}
            className="flex-1 bg-[#1A1A1A] rounded-3xl p-4 sm:p-5 flex flex-col gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-[#262626] hover:border-[#F43F5E]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all active:scale-[0.98] cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-full bg-[#F43F5E]/15 flex items-center justify-center mb-1 text-[#FB7185]">
              <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
            </div>
            <span className="font-body text-[12px] font-bold text-[#888888]">Expenses</span>
            <span className="font-display text-[22px] sm:text-[24px] font-bold text-[#E0E0E0]">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>
      </section>

      {/* Spending by Category */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[20px] sm:text-[24px] font-bold text-[#E0E0E0]">
            Top Spending
          </h2>
          <button
            id="top-spending-view-all"
            onClick={() => setTab('budgets')}
            className="font-body text-[13px] font-bold text-[#D4AF37] hover:text-[#E5C158] transition-colors"
          >
            View All
          </button>
        </div>

        {topSpendings.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-5 text-center border border-[#262626] flex items-center justify-center">
            <span className="font-body text-[13px] text-[#888888]">
              No expenses recorded yet.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {topSpendings.slice(0, 2).map((item) => {
              const isDining = item.category.name.toLowerCase().includes('dining') || item.category.id.includes('dining');
              return (
                <div
                  key={item.category.id}
                  onClick={() => setTab('budgets')}
                  className="bg-[#1A1A1A] rounded-2xl p-4 flex flex-col gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#262626] hover:border-[#D4AF37]/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDining
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                          : 'bg-[#F43F5E]/15 text-[#FB7185]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {item.category.icon || (isDining ? 'restaurant' : 'shopping_bag')}
                      </span>
                    </div>
                    <span className="font-body text-[14px] font-semibold text-[#E0E0E0] truncate">
                      {item.category.name === 'Food & Dining' ? 'Dining' : item.category.name}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="font-display text-[20px] font-bold text-[#FFFFFF]">
                      {formatCurrency(item.amount)}
                    </span>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-[#262626] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDining ? 'bg-[#D4AF37]' : 'bg-[#F43F5E]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(25, item.percentage))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[20px] sm:text-[24px] font-bold text-[#E0E0E0]">
            Recent
          </h2>
          <button
            id="recent-see-all"
            onClick={() => setTab('activity')}
            className="font-body text-[13px] font-bold text-[#D4AF37] hover:text-[#E5C158] transition-colors"
          >
            See All
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="flex flex-col gap-2 bg-[#1A1A1A] rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-[#262626] text-center items-center">
            <div className="w-12 h-12 rounded-full bg-[#262626] flex items-center justify-center text-[#888888] mb-1">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">No Transactions Yet</span>
            <p className="font-body text-[13px] text-[#888888] max-w-xs mb-2">
              Add a transaction or import your bank statement to start tracking.
            </p>
            <button
              id="btn-dashboard-add-first-tx"
              onClick={() => setTab('add-transaction')}
              className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] px-4 py-2 rounded-full font-body text-[13px] font-bold transition-all active:scale-95"
            >
              Add Transaction
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 bg-[#1A1A1A] rounded-3xl p-2 sm:p-3 shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-[#262626]">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  onClick={() => setActiveTransactionForDetail(tx)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#222222] active:bg-[#262626] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-[#10B981]/15 text-[#34D399]'
                          : 'bg-[#262626] text-[#A0A0A0]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px]">
                        {tx.categoryIcon || (isIncome ? 'payments' : 'receipt')}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-body text-[16px] font-semibold text-[#E0E0E0] truncate">
                        {tx.merchant}
                      </span>
                      <span className="font-body text-[13px] text-[#888888] truncate">
                        {tx.displayDate || `${tx.date}, ${tx.time}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right pl-2 shrink-0">
                    <span
                      className={`font-display text-[16px] sm:text-[18px] font-bold ${
                        isIncome ? 'text-[#34D399]' : 'text-[#E0E0E0]'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
