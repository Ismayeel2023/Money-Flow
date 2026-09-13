import React from 'react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';

export const DetectedSmsBanner: React.FC = () => {
  const {
    detectedIncomingSms,
    confirmDetectedSms,
    dismissDetectedSms,
    formatCurrency,
    setTab,
  } = useFinance();

  if (!detectedIncomingSms) return null;

  const handleAdd = () => {
    confirmDetectedSms();
    try {
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.2 },
        colors: ['#D4AF37', '#10B981', '#38BDF8'],
      });
    } catch {}
  };

  const handleReview = () => {
    setTab('sms-parser');
  };

  return (
    <div className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-5 sm:max-w-md z-[9999] animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#1C1D21] border-2 border-[#D4AF37] rounded-3xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.7)] flex flex-col gap-3 backdrop-blur-md">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
              <span className="material-symbols-outlined text-[16px]">sms</span>
            </div>
            <span className="text-[12px] font-bold tracking-wider uppercase text-[#D4AF37]">
              Bank SMS Detected
            </span>
          </div>

          <button
            type="button"
            onClick={dismissDetectedSms}
            className="w-7 h-7 rounded-full bg-[#26272D] text-[#888888] hover:text-white flex items-center justify-center transition-colors"
            title="Dismiss"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Transaction Content */}
        <div className="flex items-start justify-between gap-3 bg-[#131417] p-3 rounded-2xl border border-[#2B2D33]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-[#888888]">
              {detectedIncomingSms.bankName || 'Bank Alert'} • {detectedIncomingSms.type === 'expense' ? 'Debit' : 'Credit'}
            </span>
            <span className="text-[15px] font-bold text-white truncate max-w-[200px]">
              {detectedIncomingSms.merchant}
            </span>
            {detectedIncomingSms.accountNumber && (
              <span className="text-[11px] text-[#A0A0A5]">
                A/C ending **{detectedIncomingSms.accountNumber}
              </span>
            )}
          </div>

          <div className="text-right">
            <span
              className={`text-[17px] font-extrabold font-display ${
                detectedIncomingSms.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {detectedIncomingSms.type === 'expense' ? '-' : '+'}
              {formatCurrency(detectedIncomingSms.amount)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 py-2.5 px-4 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[17px]">add_circle</span>
            <span>Add to Ledger</span>
          </button>

          <button
            type="button"
            onClick={handleReview}
            className="py-2.5 px-3.5 rounded-full bg-[#26272D] hover:bg-[#303138] text-[#E0E0E0] font-semibold text-[12px] flex items-center justify-center gap-1 active:scale-95 transition-all"
          >
            <span>Review</span>
          </button>
        </div>
      </div>
    </div>
  );
};
