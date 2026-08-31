import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';

export const AddTransactionScreen: React.FC = () => {
  const { categories, accounts, addTransaction, setTab } = useFinance();

  const [amountStr, setAmountStr] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string>('cat-dining');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || 'acc-sbi');
  const [merchant, setMerchant] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [notes, setNotes] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showCustomQuickAdd, setShowCustomQuickAdd] = useState(false);
  const [customQuickName, setCustomQuickName] = useState('');

  const selectedCategory =
    categories.find((c) => c.id === categoryId) || categories[0];
  const selectedAccount =
    accounts.find((a) => a.id === accountId) || accounts[0];

  const handleQuickAdd = (name: string, defaultCatId: string, defaultAmount?: number) => {
    setMerchant(name);
    setCategoryId(defaultCatId);
    if (defaultAmount) {
      setAmountStr(defaultAmount.toString());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      // Gentle vibration / alert feedback
      const input = document.getElementById('amount-input');
      input?.focus();
      return;
    }

    addTransaction({
      amount: parsedAmount,
      type,
      categoryId: selectedCategory?.id || 'cat-dining',
      categoryName: selectedCategory?.name || 'General',
      categoryIcon: selectedCategory?.icon || 'receipt',
      categoryColor: selectedCategory?.color || '#3525cd',
      accountId: selectedAccount?.id || 'acc-sbi',
      accountName: selectedAccount?.name || 'Main Account',
      merchant: merchant.trim() || (type === 'transfer' ? 'Transfer' : selectedCategory?.name || 'Payment'),
      date,
      displayDate: 'Today',
      time,
      notes: notes.trim(),
      tags: notes.includes('#')
        ? notes
            .split(' ')
            .filter((w) => w.startsWith('#'))
            .map((t) => t.replace('#', ''))
        : [selectedCategory?.name?.toLowerCase() || 'general'],
      status: 'ready',
    });

    setIsSaved(true);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#3525cd', '#6cf8bb', '#ffdad6', '#4f46e5'],
      });
    } catch {
      // Confetti fallback
    }

    setTimeout(() => {
      setTab('activity');
    }, 600);
  };

  // Segment types list
  const segmentTypes: { label: string; value: TransactionType }[] = [
    { label: 'EXPENSE', value: 'expense' },
    { label: 'INCOME', value: 'income' },
    { label: 'TRANSFER', value: 'transfer' },
    { label: 'REFUND', value: 'refund' },
  ];

  const currentSegmentIndex = segmentTypes.findIndex((s) => s.value === type);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-2 pb-32 gap-6">
      {/* Amount Input Section */}
      <div className="flex flex-col items-center justify-center pt-3 pb-2 gap-2">
        <div className="text-[#888888] font-body font-bold tracking-widest text-[11px] uppercase">
          ENTER AMOUNT
        </div>
        <div className="flex items-center justify-center relative w-full group">
          <span className="text-[#D4AF37] font-display text-[32px] sm:text-[36px] font-bold mr-1">
            ₹
          </span>
          <input
            id="amount-input"
            autoFocus
            inputMode="decimal"
            placeholder="0.00"
            type="text"
            value={amountStr}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '');
              // avoid multiple dots
              if (val.split('.').length <= 2) {
                setAmountStr(val);
              }
            }}
            className="w-full max-w-[260px] bg-transparent text-[#FFFFFF] font-display font-bold text-[44px] sm:text-[48px] text-center focus:outline-none placeholder:text-[#383838] transition-all caret-[#D4AF37]"
          />
        </div>
        {/* Animated indicator bar */}
        <div className="h-[2px] w-1/3 bg-[#262626] rounded-full mt-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full w-full bg-[#D4AF37]/20" />
          <div
            id="amount-indicator"
            className="absolute top-0 left-0 h-full bg-[#D4AF37] rounded-full transition-all duration-300"
            style={{
              width: amountStr.length > 0 ? `${Math.min(100, amountStr.length * 20)}%` : '50%',
            }}
          />
        </div>
      </div>

      {/* Segmented Control */}
      <div>
        <div className="bg-[#1A1A1A] p-1 rounded-full flex relative overflow-hidden shadow-inner border border-[#2A2A2A]">
          {/* Highlighter pill */}
          <div
            className="absolute top-1 bottom-1 w-[calc(25%-4px)] bg-[#262626] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-[#383838] transition-transform duration-300 ease-out z-0"
            style={{
              transform: `translateX(${currentSegmentIndex * 100}%)`,
              left: '4px',
            }}
          />
          {segmentTypes.map((seg) => (
            <button
              key={seg.value}
              type="button"
              onClick={() => setType(seg.value)}
              className={`flex-1 py-2.5 text-center relative z-10 font-body text-[11px] sm:text-[12px] font-bold tracking-wider transition-colors duration-200 ${
                type === seg.value ? 'text-[#D4AF37]' : 'text-[#888888] hover:text-[#E0E0E0]'
              }`}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Add Chips */}
      <div>
        <div className="text-[#888888] font-body font-bold text-[11px] tracking-wider mb-2.5 flex items-center justify-between">
          <span>QUICK ADD</span>
          <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">bolt</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickAdd('Starbucks Coffee', 'cat-coffee', 250)}
            className="bg-[#1A1A1A] hover:bg-[#262626] active:scale-95 px-3.5 py-2 rounded-full flex items-center gap-2 transition-all border border-[#2A2A2A] hover:border-[#D4AF37]/30"
          >
            <span className="material-symbols-outlined text-[#FB7185] text-[18px]">local_cafe</span>
            <span className="font-body text-[#E0E0E0] text-[13px] font-medium">Coffee</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickAdd('Nature Basket Supermarket', 'cat-grocery', 1200)}
            className="bg-[#1A1A1A] hover:bg-[#262626] active:scale-95 px-3.5 py-2 rounded-full flex items-center gap-2 transition-all border border-[#2A2A2A] hover:border-[#D4AF37]/30"
          >
            <span className="material-symbols-outlined text-[#34D399] text-[18px]">shopping_cart</span>
            <span className="font-body text-[#E0E0E0] text-[13px] font-medium">Grocery</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickAdd('Uber Metro Transit', 'cat-transport', 350)}
            className="bg-[#1A1A1A] hover:bg-[#262626] active:scale-95 px-3.5 py-2 rounded-full flex items-center gap-2 transition-all border border-[#2A2A2A] hover:border-[#D4AF37]/30"
          >
            <span className="material-symbols-outlined text-[#D4AF37] text-[18px]">directions_subway</span>
            <span className="font-body text-[#E0E0E0] text-[13px] font-medium">Transit</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCustomQuickAdd(!showCustomQuickAdd)}
            className="bg-[#1A1A1A] hover:bg-[#262626] active:scale-95 w-9 h-9 rounded-full flex items-center justify-center transition-all text-[#888888] hover:text-[#D4AF37] border border-[#2A2A2A]"
          >
            <span className="material-symbols-outlined text-[18px]">
              {showCustomQuickAdd ? 'close' : 'add'}
            </span>
          </button>
        </div>

        {showCustomQuickAdd && (
          <div className="mt-3 p-3 bg-[#1A1A1A] rounded-2xl border border-[#333333] flex items-center gap-2 shadow-lg">
            <input
              type="text"
              placeholder="e.g. Cinema Tickets"
              value={customQuickName}
              onChange={(e) => setCustomQuickName(e.target.value)}
              className="flex-1 text-[13px] outline-none font-body bg-transparent text-[#E0E0E0] placeholder-[#666666]"
            />
            <button
              type="button"
              onClick={() => {
                if (customQuickName.trim()) {
                  handleQuickAdd(customQuickName.trim(), 'cat-entertainment', 500);
                  setCustomQuickName('');
                  setShowCustomQuickAdd(false);
                }
              }}
              className="bg-[#D4AF37] text-[#0F0F0F] px-3 py-1 rounded-full text-[12px] font-bold"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-3.5">
        {/* Category & Account Row */}
        <div className="flex gap-3">
          {/* Category */}
          <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-3 flex flex-col gap-1 relative overflow-hidden group focus-within:bg-[#222222] focus-within:ring-1 focus-within:ring-[#D4AF37]/50 transition-all border border-[#262626] shadow-sm">
            <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
              CATEGORY
            </label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#10B981]/15 text-[#34D399] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  {selectedCategory?.icon || 'restaurant'}
                </span>
              </div>
              <select
                id="select-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="bg-transparent font-body font-medium text-[14px] text-[#E0E0E0] w-full appearance-none focus:outline-none cursor-pointer pr-4 [&>option]:bg-[#1A1A1A] [&>option]:text-[#E0E0E0]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[#888888] text-[20px] pointer-events-none absolute right-3">
                arrow_drop_down
              </span>
            </div>
          </div>

          {/* Account */}
          <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-3 flex flex-col gap-1 relative overflow-hidden group focus-within:bg-[#222222] focus-within:ring-1 focus-within:ring-[#D4AF37]/50 transition-all border border-[#262626] shadow-sm">
            <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
              ACCOUNT
            </label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  {selectedAccount?.icon || 'account_balance_wallet'}
                </span>
              </div>
              <select
                id="select-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="bg-transparent font-body font-medium text-[14px] text-[#E0E0E0] w-full appearance-none focus:outline-none cursor-pointer pr-4 [&>option]:bg-[#1A1A1A] [&>option]:text-[#E0E0E0]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[#888888] text-[20px] pointer-events-none absolute right-3">
                arrow_drop_down
              </span>
            </div>
          </div>
        </div>

        {/* Person / Merchant */}
        <div className="bg-[#1A1A1A] rounded-2xl p-3.5 flex items-center gap-3 focus-within:bg-[#222222] focus-within:ring-1 focus-within:ring-[#D4AF37]/50 transition-all border border-[#262626] shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#FB7185]/15 text-[#FB7185] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">storefront</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
              MERCHANT OR PAYEE
            </label>
            <input
              id="input-merchant"
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Who did you pay?"
              className="bg-transparent font-body font-medium text-[15px] text-[#E0E0E0] focus:outline-none w-full mt-0.5 placeholder:text-[#666666]"
            />
          </div>
        </div>

        {/* Date & Time Row */}
        <div className="flex gap-3">
          {/* Date */}
          <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-3 flex flex-col gap-1 relative overflow-hidden group focus-within:bg-[#222222] focus-within:ring-1 focus-within:ring-[#D4AF37]/50 transition-all border border-[#262626] shadow-sm">
            <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
              DATE
            </label>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#888888] text-[18px]">
                calendar_today
              </span>
              <input
                id="input-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent font-body font-medium text-[14px] text-[#E0E0E0] w-full appearance-none focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Time */}
          <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-3 flex flex-col gap-1 relative overflow-hidden group focus-within:bg-[#222222] focus-within:ring-1 focus-within:ring-[#D4AF37]/50 transition-all border border-[#262626] shadow-sm">
            <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
              TIME
            </label>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#888888] text-[18px]">
                schedule
              </span>
              <input
                id="input-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-transparent font-body font-medium text-[14px] text-[#E0E0E0] w-full appearance-none focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Notes & Tags */}
        <div className="bg-[#1A1A1A] rounded-2xl p-3.5 flex flex-col gap-1.5 focus-within:bg-[#222222] focus-within:ring-1 focus-within:ring-[#D4AF37]/50 transition-all border border-[#262626] shadow-sm">
          <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
            NOTES &amp; TAGS
          </label>
          <textarea
            id="input-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details or #tags..."
            className="bg-transparent font-body text-[14px] text-[#E0E0E0] focus:outline-none w-full resize-none placeholder:text-[#666666]"
          />
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[calc(16px+env(safe-area-inset-bottom))] bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/95 to-transparent pt-10">
        <div className="max-w-md mx-auto">
          <button
            id="btn-save-transaction"
            type="button"
            onClick={handleSave}
            className={`w-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-display text-[16px] font-bold rounded-full py-4 shadow-[0_8px_24px_rgba(212,175,55,0.35)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isSaved ? 'bg-[#10B981] text-white' : ''
            }`}
          >
            <span>{isSaved ? 'Saved!' : 'Save Transaction'}</span>
            <span className="material-symbols-outlined text-[20px] font-bold">
              {isSaved ? 'task_alt' : 'check_circle'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
