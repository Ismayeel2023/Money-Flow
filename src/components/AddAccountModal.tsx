import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export const AddAccountModal: React.FC = () => {
  const { isAddAccountModalOpen, setIsAddAccountModalOpen, addAccount } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'cash' | 'credit'>('bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [balanceStr, setBalanceStr] = useState('');
  const [limitStr, setLimitStr] = useState('');

  if (!isAddAccountModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(balanceStr) || 0;
    const availableLimit = parseFloat(limitStr) || 100000;

    addAccount({
      name: name.trim() || (type === 'bank' ? 'Savings Account' : type === 'credit' ? 'Credit Card' : 'Cash Wallet'),
      type,
      accountNumber: accountNumber.trim() || Math.floor(1000 + Math.random() * 9000).toString(),
      balance: type === 'credit' ? -Math.abs(balance) : Math.abs(balance),
      outstanding: type === 'credit' ? Math.abs(balance) : undefined,
      availableLimit: type === 'credit' ? availableLimit : undefined,
      icon: type === 'bank' ? 'account_balance' : type === 'credit' ? 'credit_card' : 'payments',
    });

    setIsAddAccountModalOpen(false);
    setName('');
    setBalanceStr('');
    setAccountNumber('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#262626] relative flex flex-col gap-4">
        <button
          onClick={() => setIsAddAccountModalOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">add_card</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-[18px] text-[#FFFFFF]">Add Account</h3>
            <p className="font-body text-[12px] text-[#888888]">Track bank, card, or cash</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-1">
          {/* Account Type Selector */}
          <div className="flex gap-2">
            {(['bank', 'credit', 'cash'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-xl font-body text-[12px] font-bold capitalize transition-all ${
                  type === t
                    ? 'bg-[#D4AF37] text-[#0F0F0F] shadow-sm font-bold'
                    : 'bg-[#262626] text-[#888888] hover:bg-[#333333]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Name */}
          <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-1 border border-[#383838]">
            <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
              Account / Bank Name
            </label>
            <input
              type="text"
              placeholder={type === 'bank' ? 'e.g. Axis Bank' : type === 'credit' ? 'e.g. ICICI Coral' : 'e.g. Daily Cash'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-transparent font-body text-[14px] text-[#FFFFFF] placeholder-[#555555] outline-none"
            />
          </div>

          {/* Last 4 digits */}
          {type !== 'cash' && (
            <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-1 border border-[#383838]">
              <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                Last 4 Digits (Optional)
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="4589"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                className="bg-transparent font-body text-[14px] text-[#FFFFFF] placeholder-[#555555] outline-none"
              />
            </div>
          )}

          {/* Balance / Outstanding */}
          <div className="bg-[#262626] rounded-2xl p-3.5 flex flex-col gap-1 border border-[#383838]">
            <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
              {type === 'credit' ? 'Outstanding Amount (₹)' : 'Starting Balance (₹)'}
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={balanceStr}
              onChange={(e) => setBalanceStr(e.target.value.replace(/[^0-9.]/g, ''))}
              required
              className="bg-transparent font-display text-[22px] font-bold text-[#FFFFFF] placeholder-[#555555] outline-none"
            />
          </div>

          {/* Credit Limit for Cards */}
          {type === 'credit' && (
            <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-1 border border-[#383838]">
              <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                Credit Limit (₹)
              </label>
              <input
                type="text"
                placeholder="100000"
                value={limitStr}
                onChange={(e) => setLimitStr(e.target.value.replace(/[^0-9.]/g, ''))}
                className="bg-transparent font-body text-[14px] text-[#FFFFFF] placeholder-[#555555] outline-none"
              />
            </div>
          )}

          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={() => setIsAddAccountModalOpen(false)}
              className="flex-1 bg-[#262626] hover:bg-[#333333] text-[#E0E0E0] border border-[#383838] font-body text-[14px] font-bold py-3.5 rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-display text-[14px] font-bold py-3.5 rounded-full shadow-[0_4px_16px_rgba(212,175,55,0.3)]"
            >
              Save Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
