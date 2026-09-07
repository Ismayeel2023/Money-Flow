import React, { useState, useEffect } from 'react';
import { Account } from '../types';
import { useFinance } from '../context/FinanceContext';

interface AdjustBalanceModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newBalance: number) => void;
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  account,
  isOpen,
  onClose,
  onSave,
}) => {
  const { formatCurrency } = useFinance();
  const [balanceStr, setBalanceStr] = useState('');

  useEffect(() => {
    if (account) {
      setBalanceStr(account.balance ? Math.abs(account.balance).toString() : '0');
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(balanceStr);
    const finalBalance = isNaN(val) ? 0 : account.type === 'credit' ? -Math.abs(val) : Math.abs(val);
    onSave(account.id, finalBalance);
    onClose();
  };

  const handleQuickAdd = (addition: number) => {
    const current = parseFloat(balanceStr) || 0;
    setBalanceStr((current + addition).toString());
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#262626] relative flex flex-col gap-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-[18px] text-[#FFFFFF]">Update Balance</h3>
            <p className="font-body text-[12px] text-[#888888]">{account.name}</p>
          </div>
        </div>

        {/* Current Balance info */}
        <div className="bg-[#121212] rounded-2xl p-3 border border-[#262626] flex items-center justify-between text-[13px]">
          <span className="text-[#888888] font-body">Current Balance:</span>
          <span className="text-[#FFFFFF] font-bold font-display">{formatCurrency(account.balance)}</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-[#262626] rounded-2xl p-4 flex flex-col gap-1 border border-[#383838]">
            <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
              {account.type === 'credit' ? 'Outstanding Amount (₹)' : 'New Available Balance (₹)'}
            </label>
            <div className="flex items-center">
              <span className="font-display text-[26px] font-bold text-[#D4AF37] mr-1">₹</span>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={balanceStr}
                onChange={(e) => setBalanceStr(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className="w-full bg-transparent font-display text-[26px] font-bold text-[#FFFFFF] placeholder-[#555555] outline-none"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-col gap-1.5">
            <span className="font-body text-[10px] font-bold uppercase tracking-wider text-[#888888] px-1">
              Quick Presets
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setBalanceStr('0')}
                className="py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#AAAAAA] hover:text-white font-body text-[11px] font-bold border border-[#333333] transition-colors"
              >
                ₹0
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(1000)}
                className="py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#34D399] font-body text-[11px] font-bold border border-[#333333] transition-colors"
              >
                +1K
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(5000)}
                className="py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#34D399] font-body text-[11px] font-bold border border-[#333333] transition-colors"
              >
                +5K
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(10000)}
                className="py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#34D399] font-body text-[11px] font-bold border border-[#333333] transition-colors"
              >
                +10K
              </button>
            </div>
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#262626] hover:bg-[#333333] text-[#E0E0E0] font-body text-[14px] font-bold py-3.5 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-display text-[14px] font-bold py-3.5 rounded-full shadow-[0_4px_16px_rgba(212,175,55,0.3)] transition-all active:scale-95"
            >
              Save Balance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
