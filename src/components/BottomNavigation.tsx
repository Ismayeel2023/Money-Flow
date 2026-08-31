import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { ScreenTab } from '../types';

export const BottomNavigation: React.FC = () => {
  const { tab, setTab } = useFinance();

  const isHomeActive = tab === 'dashboard';
  const isActivityActive = tab === 'activity';
  const isBudgetsActive = tab === 'budgets';
  const isMoreActive =
    tab === 'settings' ||
    tab === 'accounts' ||
    tab === 'import-statement' ||
    tab === 'import-review' ||
    tab === 'reports';

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 pb-safe px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="bg-[#1A1A1A]/95 backdrop-blur-xl rounded-[28px] mb-3 flex items-center justify-around h-20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-[#2A2A2A] px-2">
          {/* Home */}
          <button
            id="nav-home"
            onClick={() => setTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 w-16 py-2 rounded-2xl transition-all ${
              isHomeActive
                ? 'text-[#D4AF37] font-bold'
                : 'text-[#888888] hover:text-[#D4AF37] font-medium'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[24px] ${
                isHomeActive ? 'material-symbols-fill' : ''
              }`}
            >
              home
            </span>
            <span className="font-body text-[11px] tracking-tight">Home</span>
          </button>

          {/* Activity */}
          <button
            id="nav-activity"
            onClick={() => setTab('activity')}
            className={`flex flex-col items-center justify-center gap-1 w-16 py-2 rounded-2xl transition-all ${
              isActivityActive
                ? 'text-[#D4AF37] font-bold'
                : 'text-[#888888] hover:text-[#D4AF37] font-medium'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[24px] ${
                isActivityActive ? 'material-symbols-fill' : ''
              }`}
            >
              account_balance_wallet
            </span>
            <span className="font-body text-[11px] tracking-tight">Activity</span>
          </button>

          {/* Add Transaction FAB */}
          <button
            id="nav-add-transaction"
            onClick={() => setTab('add-transaction')}
            aria-label="Add transaction"
            className="w-14 h-14 bg-[#D4AF37] text-[#0F0F0F] rounded-full flex items-center justify-center -mt-9 shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition-all hover:scale-105 active:scale-95 hover:bg-[#E5C158]"
          >
            <span className="material-symbols-outlined text-[32px] font-bold">add</span>
          </button>

          {/* Budgets */}
          <button
            id="nav-budgets"
            onClick={() => setTab('budgets')}
            className={`flex flex-col items-center justify-center gap-1 w-16 py-2 rounded-2xl transition-all ${
              isBudgetsActive
                ? 'text-[#D4AF37] font-bold'
                : 'text-[#888888] hover:text-[#D4AF37] font-medium'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[24px] ${
                isBudgetsActive ? 'material-symbols-fill' : ''
              }`}
            >
              pie_chart
            </span>
            <span className="font-body text-[11px] tracking-tight">Budgets</span>
          </button>

          {/* More / Settings */}
          <button
            id="nav-more"
            onClick={() => setTab('settings')}
            className={`flex flex-col items-center justify-center gap-1 w-16 py-2 rounded-2xl transition-all ${
              isMoreActive
                ? 'text-[#D4AF37] font-bold'
                : 'text-[#888888] hover:text-[#D4AF37] font-medium'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[24px] ${
                isMoreActive ? 'material-symbols-fill' : ''
              }`}
            >
              grid_view
            </span>
            <span className="font-body text-[11px] tracking-tight">More</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
