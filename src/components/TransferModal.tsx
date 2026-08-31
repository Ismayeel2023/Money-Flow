import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export const TransferModal: React.FC = () => {
  const { accounts, transferMoney, isTransferModalOpen, setIsTransferModalOpen } = useFinance();

  const [fromAccount, setFromAccount] = useState<string>(accounts[0]?.id || 'acc-sbi');
  const [toAccount, setToAccount] = useState<string>(accounts[1]?.id || 'acc-hdfc');
  const [amountStr, setAmountStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!isTransferModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!amount || isNaN(amount) || amount <= 0) return;
    if (fromAccount === toAccount) return;

    transferMoney(fromAccount, toAccount, amount, notes);
    setIsTransferModalOpen(false);
    setAmountStr('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#262626] relative flex flex-col gap-4">
        {/* Close button */}
        <button
          onClick={() => setIsTransferModalOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">swap_horiz</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-[18px] text-[#FFFFFF]">Move Money</h3>
            <p className="font-body text-[12px] text-[#888888]">Transfer between accounts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-1">
          {/* Amount */}
          <div className="bg-[#262626] rounded-2xl p-3.5 flex flex-col gap-1 border border-[#383838]">
            <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
              Amount (₹)
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ''))}
              required
              className="bg-transparent font-display text-[26px] font-bold text-[#FFFFFF] placeholder-[#555555] outline-none"
            />
          </div>

          {/* From Account */}
          <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-1 border border-[#383838] relative">
            <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
              From Account
            </label>
            <select
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              className="bg-transparent font-body text-[14px] font-semibold text-[#FFFFFF] outline-none appearance-none pr-6 cursor-pointer"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#1A1A1A] text-[#E0E0E0]">
                  {a.name} (₹{new Intl.NumberFormat('en-IN').format(a.balance)})
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[#888888] text-[18px] pointer-events-none absolute right-3 bottom-3">
              arrow_drop_down
            </span>
          </div>

          {/* To Account */}
          <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-1 border border-[#383838] relative">
            <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
              To Account
            </label>
            <select
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              className="bg-transparent font-body text-[14px] font-semibold text-[#FFFFFF] outline-none appearance-none pr-6 cursor-pointer"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === fromAccount} className="bg-[#1A1A1A] text-[#E0E0E0]">
                  {a.name} (₹{new Intl.NumberFormat('en-IN').format(a.balance)})
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[#888888] text-[18px] pointer-events-none absolute right-3 bottom-3">
              arrow_drop_down
            </span>
          </div>

          {/* Notes */}
          <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-1 border border-[#383838]">
            <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly Savings"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-transparent font-body text-[13px] text-[#FFFFFF] placeholder-[#555555] outline-none"
            />
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="flex-1 bg-[#262626] hover:bg-[#333333] text-[#E0E0E0] border border-[#383838] font-body text-[14px] font-bold py-3.5 rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-display text-[14px] font-bold py-3.5 rounded-full shadow-[0_4px_16px_rgba(212,175,55,0.3)]"
            >
              Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
