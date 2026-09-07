import React, { useState, useEffect } from 'react';
import { Account } from '../types';

interface EditAccountModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Account>) => void;
}

const AVAILABLE_ICONS = [
  { icon: 'account_balance', label: 'Bank' },
  { icon: 'savings', label: 'Savings' },
  { icon: 'credit_card', label: 'Card' },
  { icon: 'account_balance_wallet', label: 'Wallet' },
  { icon: 'payments', label: 'Cash' },
  { icon: 'currency_rupee', label: 'Rupee' },
  { icon: 'account_circle', label: 'Personal' },
  { icon: 'shopping_bag', label: 'Shopping' },
];

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  account,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'cash' | 'credit'>('bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [icon, setIcon] = useState('account_balance');
  const [availableLimitStr, setAvailableLimitStr] = useState('');

  useEffect(() => {
    if (account) {
      setName(account.name || '');
      setType(account.type || 'bank');
      setAccountNumber(account.accountNumber || '');
      setIcon(account.icon || 'account_balance');
      setAvailableLimitStr(account.availableLimit ? account.availableLimit.toString() : '');
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updates: Partial<Account> = {
      name: name.trim(),
      type,
      accountNumber: accountNumber.trim() || undefined,
      icon,
    };

    if (type === 'credit') {
      const limit = parseFloat(availableLimitStr);
      if (!isNaN(limit) && limit >= 0) {
        updates.availableLimit = limit;
      }
    }

    onSave(account.id, updates);
    onClose();
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
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">edit</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-[18px] text-[#FFFFFF]">Edit Account</h3>
            <p className="font-body text-[12px] text-[#888888]">Modify account preferences</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-1">
          {/* Account Type Selector */}
          <div className="flex gap-2">
            {(['bank', 'credit', 'cash'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  if (t === 'bank' && icon === 'payments') setIcon('account_balance');
                  if (t === 'credit' && icon === 'account_balance') setIcon('credit_card');
                  if (t === 'cash' && icon === 'account_balance') setIcon('payments');
                }}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Bank Account"
              required
              className="bg-transparent font-body text-[14px] text-[#FFFFFF] placeholder-[#555555] outline-none"
            />
          </div>

          {/* Last 4 digits */}
          {type !== 'cash' && (
            <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-1 border border-[#383838]">
              <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                Last 4 Digits
              </label>
              <input
                type="text"
                maxLength={4}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="4589"
                className="bg-transparent font-body text-[14px] text-[#FFFFFF] placeholder-[#555555] outline-none"
              />
            </div>
          )}

          {/* Credit Limit for Cards */}
          {type === 'credit' && (
            <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-1 border border-[#383838]">
              <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                Credit Limit (₹)
              </label>
              <input
                type="text"
                placeholder="100000"
                value={availableLimitStr}
                onChange={(e) => setAvailableLimitStr(e.target.value.replace(/[^0-9.]/g, ''))}
                className="bg-transparent font-body text-[14px] text-[#FFFFFF] placeholder-[#555555] outline-none"
              />
            </div>
          )}

          {/* Icon Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider px-1">
              Select Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map((item) => (
                <button
                  key={item.icon}
                  type="button"
                  onClick={() => setIcon(item.icon)}
                  className={`h-11 rounded-xl flex items-center justify-center border transition-all ${
                    icon === item.icon
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] shadow-sm'
                      : 'bg-[#262626] border-[#333333] text-[#888888] hover:text-white'
                  }`}
                  title={item.label}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </button>
              ))}
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
