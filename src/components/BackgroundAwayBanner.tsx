import React from 'react';
import { useFinance } from '../context/FinanceContext';

export const BackgroundAwayBanner: React.FC = () => {
  const { backgroundAwayNotice, dismissBackgroundAwayNotice, setTab, formatCurrency } = useFinance();

  if (!backgroundAwayNotice || backgroundAwayNotice.count === 0) return null;

  const handleView = () => {
    dismissBackgroundAwayNotice();
    setTab('dashboard');
  };

  const latest = backgroundAwayNotice.transactions[0];

  return (
    <div className="fixed top-3 inset-x-3 sm:inset-x-auto sm:left-5 sm:max-w-md z-[9997] animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#1C1D21] border-2 border-emerald-500/70 rounded-3xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.7)] flex flex-col gap-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">all_inclusive</span>
            </div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-400">
              Auto-Logged While App Was Closed
            </span>
          </div>

          <button
            type="button"
            onClick={dismissBackgroundAwayNotice}
            className="w-7 h-7 rounded-full bg-[#26272D] text-[#888888] hover:text-white flex items-center justify-center transition-colors"
            title="Dismiss"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <p className="text-[12px] text-[#C5C5CA] leading-snug">
          Permanent <strong className="text-white">&quot;Allow&quot;</strong> permission auto-captured{' '}
          <strong className="text-emerald-400">
            {backgroundAwayNotice.count} {backgroundAwayNotice.count === 1 ? 'transaction' : 'transactions'}
          </strong>{' '}
          from your bank SMS while Money Flow was not opened.
        </p>

        {latest && (
          <div className="flex items-center justify-between bg-[#131417] px-3 py-2 rounded-xl border border-[#2B2D33] text-[12px]">
            <div className="flex flex-col">
              <span className="font-bold text-white truncate max-w-[200px]">{latest.merchant}</span>
              <span className="text-[10px] text-[#888888]">{latest.bankName || 'Bank Alert'}</span>
            </div>
            <span className="font-extrabold text-emerald-400 font-display">
              {latest.type === 'expense' ? '-' : '+'}
              {formatCurrency(latest.amount)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleView}
            className="flex-1 py-2 px-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#0F0F0F] font-bold text-[12px] flex items-center justify-center gap-1 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>View in Ledger</span>
          </button>

          <button
            type="button"
            onClick={dismissBackgroundAwayNotice}
            className="py-2 px-3 rounded-full bg-[#26272D] text-[#A0A0A5] hover:text-white font-medium text-[12px] transition-all active:scale-95"
          >
            <span>Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
};
