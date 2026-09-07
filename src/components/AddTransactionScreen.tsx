import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import { AddCategoryModal } from './AddCategoryModal';

export const AddTransactionScreen: React.FC = () => {
  const { categories, accounts, transactions, addTransaction, setTab, formatCurrency } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('cat-dining');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || 'acc-sbi');
  const [destinationAccountId, setDestinationAccountId] = useState<string>(
    accounts.length > 1 ? accounts[1].id : accounts[0]?.id || ''
  );
  const [merchant, setMerchant] = useState<string>('');
  const [upiReference, setUpiReference] = useState<string>('');
  const [refundLinkId, setRefundLinkId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [notes, setNotes] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showCustomQuickAdd, setShowCustomQuickAdd] = useState(false);
  const [customQuickName, setCustomQuickName] = useState('');
  const [pickerOpen, setPickerOpen] = useState<'category' | 'account' | 'destAccount' | 'refundLink' | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  // Segment types list
  const segmentTypes: { label: string; value: TransactionType }[] = [
    { label: 'EXPENSE', value: 'expense' },
    { label: 'INCOME', value: 'income' },
    { label: 'TRANSFER', value: 'transfer' },
    { label: 'REFUND', value: 'refund' },
  ];

  // Filter categories strictly by type
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.id !== 'cat-transfer' && (c.type === 'expense' || c.type === 'both')),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.id !== 'cat-transfer' && c.type === 'income'),
    [categories]
  );

  // When type changes, ensure valid category is selected
  useEffect(() => {
    if (type === 'expense') {
      const valid = expenseCategories.find((c) => c.id === categoryId);
      if (!valid && expenseCategories.length > 0) {
        setCategoryId(expenseCategories[0].id);
      }
    } else if (type === 'income') {
      const valid = incomeCategories.find((c) => c.id === categoryId);
      if (!valid && incomeCategories.length > 0) {
        setCategoryId(incomeCategories[0].id);
      }
    } else if (type === 'refund') {
      const valid = expenseCategories.find((c) => c.id === categoryId);
      if (!valid && expenseCategories.length > 0) {
        setCategoryId(expenseCategories[0].id);
      }
    }
  }, [type, expenseCategories, incomeCategories]);

  // Ensure destination account differs from source account for transfers
  useEffect(() => {
    if (type === 'transfer' && accountId === destinationAccountId) {
      const alternate = accounts.find((a) => a.id !== accountId);
      if (alternate) {
        setDestinationAccountId(alternate.id);
      }
    }
  }, [accountId, type]);

  // Recent expense transactions for refund linking
  const recentExpenses = transactions
    .filter((t) => t.type === 'expense')
    .slice(0, 15);

  const handleLinkExpenseChange = (linkedId: string) => {
    setRefundLinkId(linkedId);
    if (!linkedId) return;

    const original = transactions.find((t) => t.id === linkedId);
    if (original) {
      setMerchant(original.merchant || original.party || 'Refund');
      setCategoryId(original.categoryId);
      if (!amountStr) {
        setAmountStr(original.amount.toString());
      }
      if (original.upiReference) {
        setUpiReference(original.upiReference);
      }
    }
  };

  const selectedCategory =
    categories.find((c) => c.id === categoryId) || categories[0];
  const selectedAccount =
    accounts.find((a) => a.id === accountId) || accounts[0];
  const selectedDestAccount =
    accounts.find((a) => a.id === destinationAccountId) || accounts[1] || accounts[0];

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
      const input = document.getElementById('amount-input');
      input?.focus();
      return;
    }

    if (type === 'transfer') {
      if (accountId === destinationAccountId) {
        alert('Please choose different From and To accounts for the transfer.');
        return;
      }

      addTransaction({
        amount: parsedAmount,
        type: 'transfer',
        categoryId: 'cat-transfer',
        categoryName: 'Transfer',
        categoryIcon: 'sync_alt',
        categoryColor: '#3525cd',
        accountId,
        destinationAccountId,
        accountName: `${selectedAccount?.name} → ${selectedDestAccount?.name}`,
        merchant: `Transfer to ${selectedDestAccount?.name}`,
        date,
        displayDate: 'Today',
        time,
        notes: notes.trim() || `Transferred from ${selectedAccount?.name} to ${selectedDestAccount?.name}`,
        tags: ['transfer'],
        status: 'ready',
      });
    } else if (type === 'refund') {
      addTransaction({
        amount: parsedAmount,
        type: 'refund',
        categoryId: selectedCategory?.id || 'cat-shopping',
        categoryName: selectedCategory?.name || 'Refund',
        categoryIcon: selectedCategory?.icon || 'replay',
        categoryColor: selectedCategory?.color || '#38BDF8',
        accountId: selectedAccount?.id || 'acc-sbi',
        accountName: selectedAccount?.name || 'Main Account',
        merchant: merchant.trim() || 'Refund Merchant',
        party: merchant.trim() || 'Refund Merchant',
        upiReference: upiReference.trim() || undefined,
        refundLinkId: refundLinkId ? refundLinkId : null,
        date,
        displayDate: 'Today',
        time,
        notes: notes.trim(),
        tags: ['refund'],
        status: 'ready',
      });
    } else {
      // Expense or Income
      const defaultParty = type === 'income' ? 'Income Deposit' : 'Expense Payment';
      addTransaction({
        amount: parsedAmount,
        type,
        categoryId: selectedCategory?.id || (type === 'income' ? 'cat-salary' : 'cat-dining'),
        categoryName: selectedCategory?.name || 'General',
        categoryIcon: selectedCategory?.icon || 'receipt',
        categoryColor: selectedCategory?.color || '#D4AF37',
        accountId: selectedAccount?.id || 'acc-sbi',
        accountName: selectedAccount?.name || 'Main Account',
        merchant: merchant.trim() || selectedCategory?.name || defaultParty,
        party: merchant.trim() || selectedCategory?.name || defaultParty,
        date,
        displayDate: 'Today',
        time,
        notes: notes.trim(),
        tags: notes.includes('#')
          ? notes
              .split(' ')
              .filter((w) => w.startsWith('#'))
              .map((t) => t.replace('#', ''))
          : [selectedCategory?.name?.toLowerCase() || (type === 'income' ? 'income' : 'expense')],
        status: 'ready',
      });
    }

    setIsSaved(true);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.85 },
        colors: type === 'income' ? ['#10B981', '#34D399', '#6cf8bb'] : ['#D4AF37', '#E5C158', '#38BDF8'],
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setTab('activity');
    }, 600);
  };

  const currentSegmentIndex = segmentTypes.findIndex((s) => s.value === type);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-4 sm:pt-5 pb-36 gap-6">
      {/* Amount Input Section */}
      <div className="flex flex-col items-center justify-center pt-3 pb-2 gap-2">
        <div className="text-[#888888] font-body font-bold tracking-widest text-[11px] uppercase">
          {type === 'transfer'
            ? 'TRANSFER AMOUNT'
            : type === 'refund'
            ? 'REFUND AMOUNT'
            : type === 'income'
            ? 'INCOME AMOUNT'
            : 'EXPENSE AMOUNT'}
        </div>
        <div className="flex items-center justify-center relative w-full group">
          <span
            className={`font-display text-[32px] sm:text-[36px] font-bold mr-1 ${
              type === 'income' ? 'text-[#34D399]' : type === 'refund' ? 'text-[#38BDF8]' : 'text-[#D4AF37]'
            }`}
          >
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
              if (val.split('.').length <= 2) {
                setAmountStr(val);
              }
            }}
            className="w-full max-w-[260px] bg-transparent text-[#FFFFFF] font-display font-bold text-[44px] sm:text-[48px] text-center focus:outline-none placeholder:text-[#383838] transition-all caret-[#D4AF37]"
          />
        </div>
        {/* Animated indicator bar */}
        <div className="h-[2px] w-1/3 bg-[#262626] rounded-full mt-1 relative overflow-hidden">
          <div
            id="amount-indicator"
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
              type === 'income' ? 'bg-[#34D399]' : type === 'refund' ? 'bg-[#38BDF8]' : 'bg-[#D4AF37]'
            }`}
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
                type === seg.value
                  ? seg.value === 'income'
                    ? 'text-[#34D399]'
                    : seg.value === 'refund'
                    ? 'text-[#38BDF8]'
                    : 'text-[#D4AF37]'
                  : 'text-[#888888] hover:text-[#E0E0E0]'
              }`}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Add Chips (EXPENSE ONLY) */}
      {type === 'expense' && (
        <div>
          <div className="text-[#888888] font-body font-bold text-[11px] tracking-wider mb-2.5 flex items-center justify-between">
            <span>QUICK EXPENSE</span>
            <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">bolt</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickAdd('Starbucks Coffee', 'cat-coffee', 250)}
              className="bg-[#1A1A1A] hover:bg-[#262626] active:scale-95 px-3.5 py-2 rounded-full flex items-center gap-2 transition-all border border-[#2A2A2A] hover:border-[#D4AF37]/30"
            >
              <span className="material-symbols-outlined text-[#FB7185] text-[18px]">local_cafe</span>
              <span className="font-body text-[#E0E0E0] text-[13px] font-medium">Coffee ₹250</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAdd('Nature Basket Supermarket', 'cat-grocery', 1200)}
              className="bg-[#1A1A1A] hover:bg-[#262626] active:scale-95 px-3.5 py-2 rounded-full flex items-center gap-2 transition-all border border-[#2A2A2A] hover:border-[#D4AF37]/30"
            >
              <span className="material-symbols-outlined text-[#34D399] text-[18px]">shopping_cart</span>
              <span className="font-body text-[#E0E0E0] text-[13px] font-medium">Grocery ₹1,200</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAdd('Uber Metro Transit', 'cat-transport', 350)}
              className="bg-[#1A1A1A] hover:bg-[#262626] active:scale-95 px-3.5 py-2 rounded-full flex items-center gap-2 transition-all border border-[#2A2A2A] hover:border-[#D4AF37]/30"
            >
              <span className="material-symbols-outlined text-[#D4AF37] text-[18px]">directions_subway</span>
              <span className="font-body text-[#E0E0E0] text-[13px] font-medium">Transit ₹350</span>
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
                placeholder="e.g. Movie Tickets"
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
      )}

      {/* Quick Add Chips (INCOME ONLY) */}
      {type === 'income' && (
        <div>
          <div className="text-[#888888] font-body font-bold text-[11px] tracking-wider mb-2.5 flex items-center justify-between">
            <span>QUICK INCOME</span>
            <span className="material-symbols-outlined text-[16px] text-[#34D399]">trending_up</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickAdd('Monthly Salary Deposit', 'cat-salary', 85000)}
              className="bg-[#1A1A1A] hover:bg-[#262626] active:scale-95 px-3.5 py-2 rounded-full flex items-center gap-2 transition-all border border-[#2A2A2A] hover:border-[#34D399]/30"
            >
              <span className="material-symbols-outlined text-[#34D399] text-[18px]">payments</span>
              <span className="font-body text-[#E0E0E0] text-[13px] font-medium">Salary ₹85k</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAdd('Freelance Project Fee', 'cat-freelance', 15000)}
              className="bg-[#1A1A1A] hover:bg-[#262626] active:scale-95 px-3.5 py-2 rounded-full flex items-center gap-2 transition-all border border-[#2A2A2A] hover:border-[#34D399]/30"
            >
              <span className="material-symbols-outlined text-[#38BDF8] text-[18px]">work</span>
              <span className="font-body text-[#E0E0E0] text-[13px] font-medium">Freelance ₹15k</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAdd('Dividend Payout', 'cat-investments', 2500)}
              className="bg-[#1A1A1A] hover:bg-[#262626] active:scale-95 px-3.5 py-2 rounded-full flex items-center gap-2 transition-all border border-[#2A2A2A] hover:border-[#34D399]/30"
            >
              <span className="material-symbols-outlined text-[#F59E0B] text-[18px]">show_chart</span>
              <span className="font-body text-[#E0E0E0] text-[13px] font-medium">Dividend ₹2.5k</span>
            </button>
          </div>
        </div>
      )}

      {/* Form Fields: Completely Context-Aware */}
      <div className="flex flex-col gap-3.5">
        {/* ======================= CASE 1: EXPENSE ======================= */}
        {type === 'expense' && (
          <>
            {/* Category & Account Row */}
            <div className="flex gap-3">
              {/* Expense Category */}
              <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-3 flex flex-col gap-1 relative overflow-hidden group hover:bg-[#222222] transition-all border border-[#262626] shadow-sm">
                <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
                  EXPENSE CATEGORY
                </label>
                <button
                  type="button"
                  id="btn-expense-category"
                  onClick={() => setPickerOpen('category')}
                  className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer pt-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${selectedCategory?.color || '#D4AF37'}25`,
                        color: selectedCategory?.color || '#D4AF37',
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {selectedCategory?.icon || 'restaurant'}
                      </span>
                    </div>
                    <span className="font-body font-semibold text-[14px] text-[#E0E0E0] truncate">
                      {selectedCategory?.name || 'Category'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#888888] text-[20px] shrink-0">
                    expand_more
                  </span>
                </button>
              </div>

              {/* Account */}
              <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-3 flex flex-col gap-1 relative overflow-hidden group hover:bg-[#222222] transition-all border border-[#262626] shadow-sm">
                <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
                  PAID FROM
                </label>
                <button
                  type="button"
                  id="btn-expense-account"
                  onClick={() => setPickerOpen('account')}
                  className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer pt-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        {selectedAccount?.icon || 'account_balance_wallet'}
                      </span>
                    </div>
                    <span className="font-body font-semibold text-[14px] text-[#E0E0E0] truncate">
                      {selectedAccount?.name || 'Account'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#888888] text-[20px] shrink-0">
                    expand_more
                  </span>
                </button>
              </div>
            </div>

            {/* Merchant or Payee */}
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
                  placeholder="Who did you pay? (e.g. Swiggy, Uber, Store)"
                  className="bg-transparent font-body font-medium text-[15px] text-[#E0E0E0] focus:outline-none w-full mt-0.5 placeholder:text-[#666666]"
                />
              </div>
            </div>
          </>
        )}

        {/* ======================= CASE 2: INCOME ======================= */}
        {type === 'income' && (
          <>
            {/* Income Category & Deposit Account Row */}
            <div className="flex gap-3">
              {/* Income Category */}
              <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-3 flex flex-col gap-1 relative overflow-hidden group hover:bg-[#222222] transition-all border border-[#262626] shadow-sm">
                <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
                  INCOME CATEGORY
                </label>
                <button
                  type="button"
                  id="btn-income-category"
                  onClick={() => setPickerOpen('category')}
                  className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer pt-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${selectedCategory?.color || '#34D399'}25`,
                        color: selectedCategory?.color || '#34D399',
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {selectedCategory?.icon || 'payments'}
                      </span>
                    </div>
                    <span className="font-body font-semibold text-[14px] text-[#E0E0E0] truncate">
                      {selectedCategory?.name || 'Category'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#888888] text-[20px] shrink-0">
                    expand_more
                  </span>
                </button>
              </div>

              {/* Deposit Account */}
              <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-3 flex flex-col gap-1 relative overflow-hidden group hover:bg-[#222222] transition-all border border-[#262626] shadow-sm">
                <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
                  DEPOSIT TO
                </label>
                <button
                  type="button"
                  id="btn-income-account"
                  onClick={() => setPickerOpen('account')}
                  className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer pt-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#10B981]/15 text-[#34D399] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        {selectedAccount?.icon || 'account_balance_wallet'}
                      </span>
                    </div>
                    <span className="font-body font-semibold text-[14px] text-[#E0E0E0] truncate">
                      {selectedAccount?.name || 'Account'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#888888] text-[20px] shrink-0">
                    expand_more
                  </span>
                </button>
              </div>
            </div>

            {/* Source or Payer */}
            <div className="bg-[#1A1A1A] rounded-2xl p-3.5 flex items-center gap-3 focus-within:bg-[#222222] focus-within:ring-1 focus-within:ring-[#34D399]/50 transition-all border border-[#262626] shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#10B981]/15 text-[#34D399] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">domain</span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
                  SOURCE OR PAYER
                </label>
                <input
                  id="input-payer"
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Who paid you? (e.g. Employer, Client, Bank)"
                  className="bg-transparent font-body font-medium text-[15px] text-[#E0E0E0] focus:outline-none w-full mt-0.5 placeholder:text-[#666666]"
                />
              </div>
            </div>
          </>
        )}

        {/* ======================= CASE 3: TRANSFER ======================= */}
        {type === 'transfer' && (
          <>
            {/* Note: NO category selection and NO merchant selection for transfer */}
            <div className="flex flex-col gap-3">
              {/* From Account */}
              <div className="bg-[#1A1A1A] rounded-2xl p-3.5 flex items-center gap-3 border border-[#262626] shadow-sm hover:bg-[#222222] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#FB7185]/15 text-[#FB7185] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">arrow_upward</span>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
                    FROM ACCOUNT
                  </label>
                  <button
                    type="button"
                    id="btn-transfer-from"
                    onClick={() => setPickerOpen('account')}
                    className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer pt-0.5"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-body font-semibold text-[15px] text-[#E0E0E0] truncate">
                        {selectedAccount?.name}
                      </span>
                      <span className="font-body text-[11px] text-[#888888]">
                        Balance: {formatCurrency(selectedAccount?.balance ?? 0)}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[#888888] text-[20px] shrink-0">
                      expand_more
                    </span>
                  </button>
                </div>
              </div>

              {/* Transfer Arrow Indicator */}
              <div className="flex items-center justify-center -my-1">
                <div className="w-8 h-8 rounded-full bg-[#262626] border border-[#383838] flex items-center justify-center text-[#D4AF37] shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">swap_vert</span>
                </div>
              </div>

              {/* To Account */}
              <div className="bg-[#1A1A1A] rounded-2xl p-3.5 flex items-center gap-3 border border-[#262626] shadow-sm hover:bg-[#222222] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#34D399]/15 text-[#34D399] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">arrow_downward</span>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
                    TO ACCOUNT
                  </label>
                  <button
                    type="button"
                    id="btn-transfer-to"
                    onClick={() => setPickerOpen('destAccount')}
                    className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer pt-0.5"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-body font-semibold text-[15px] text-[#E0E0E0] truncate">
                        {selectedDestAccount?.name}
                      </span>
                      <span className="font-body text-[11px] text-[#888888]">
                        Balance: {formatCurrency(selectedDestAccount?.balance ?? 0)}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[#888888] text-[20px] shrink-0">
                      expand_more
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ======================= CASE 4: REFUND ======================= */}
        {type === 'refund' && (
          <>
            {/* Link Original Expense Transaction */}
            <div className="bg-[#1A1A1A] rounded-2xl p-3.5 flex flex-col gap-1.5 border border-[#262626] shadow-sm">
              <div className="flex items-center justify-between">
                <label className="font-body text-[10px] font-bold text-[#38BDF8] tracking-wider uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  LINK TO ORIGINAL EXPENSE (OPTIONAL)
                </label>
                {refundLinkId && (
                  <button
                    type="button"
                    onClick={() => setRefundLinkId('')}
                    className="text-[11px] text-[#888888] hover:text-[#FB7185] cursor-pointer"
                  >
                    Unlink
                  </button>
                )}
              </div>
              <button
                type="button"
                id="btn-refund-link"
                onClick={() => setPickerOpen('refundLink')}
                className="w-full bg-[#242424] p-2.5 rounded-xl flex items-center justify-between text-left border border-[#333333] hover:border-[#38BDF8]/50 transition-colors focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[#38BDF8] text-[18px] shrink-0">
                    {refundLinkId ? 'link' : 'link_off'}
                  </span>
                  <span className="font-body text-[13px] text-[#E0E0E0] truncate">
                    {refundLinkId
                      ? (() => {
                          const linked = recentExpenses.find((e) => e.id === refundLinkId);
                          return linked
                            ? `${linked.date} • ${linked.merchant} • ${formatCurrency(linked.amount)}`
                            : 'Linked Expense';
                        })()
                      : '-- None (Manual Refund) --'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[#888888] text-[18px] shrink-0">
                  expand_more
                </span>
              </button>
            </div>

            {/* Refund Source / Merchant & Account Row */}
            <div className="flex gap-3">
              {/* Account (Credit To) */}
              <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-3 flex flex-col gap-1 relative overflow-hidden group hover:bg-[#222222] transition-all border border-[#262626] shadow-sm">
                <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
                  CREDIT TO
                </label>
                <button
                  type="button"
                  id="btn-refund-account"
                  onClick={() => setPickerOpen('account')}
                  className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer pt-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        {selectedAccount?.icon || 'account_balance_wallet'}
                      </span>
                    </div>
                    <span className="font-body font-semibold text-[14px] text-[#E0E0E0] truncate">
                      {selectedAccount?.name || 'Account'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#888888] text-[20px] shrink-0">
                    expand_more
                  </span>
                </button>
              </div>

              {/* Category (Reimbursed Category) */}
              <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-3 flex flex-col gap-1 relative overflow-hidden group hover:bg-[#222222] transition-all border border-[#262626] shadow-sm">
                <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
                  REIMBURSED CATEGORY
                </label>
                <button
                  type="button"
                  id="btn-refund-category"
                  onClick={() => setPickerOpen('category')}
                  className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer pt-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${selectedCategory?.color || '#38BDF8'}25`,
                        color: selectedCategory?.color || '#38BDF8',
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {selectedCategory?.icon || 'replay'}
                      </span>
                    </div>
                    <span className="font-body font-semibold text-[14px] text-[#E0E0E0] truncate">
                      {selectedCategory?.name || 'Category'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#888888] text-[20px] shrink-0">
                    expand_more
                  </span>
                </button>
              </div>
            </div>

            {/* Merchant / Refunded By */}
            <div className="bg-[#1A1A1A] rounded-2xl p-3.5 flex items-center gap-3 focus-within:bg-[#222222] focus-within:ring-1 focus-within:ring-[#38BDF8]/50 transition-all border border-[#262626] shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">replay</span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
                  REFUNDED BY / MERCHANT
                </label>
                <input
                  id="input-refund-merchant"
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Merchant or service (e.g. Amazon, IRCTC, Swiggy)"
                  className="bg-transparent font-body font-medium text-[15px] text-[#E0E0E0] focus:outline-none w-full mt-0.5 placeholder:text-[#666666]"
                />
              </div>
            </div>

            {/* UPI / Reference (optional) */}
            <div className="bg-[#1A1A1A] rounded-2xl p-3.5 flex items-center gap-3 focus-within:bg-[#222222] focus-within:ring-1 focus-within:ring-[#38BDF8]/50 transition-all border border-[#262626] shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">tag</span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
                  UPI / BANK REFERENCE (OPTIONAL)
                </label>
                <input
                  id="input-upi-reference"
                  type="text"
                  value={upiReference}
                  onChange={(e) => setUpiReference(e.target.value)}
                  placeholder="e.g. 423456789014"
                  className="bg-transparent font-body font-medium text-[14px] text-[#E0E0E0] focus:outline-none w-full mt-0.5 placeholder:text-[#666666]"
                />
              </div>
            </div>
          </>
        )}

        {/* Date & Time Row (Shared across all types) */}
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

        {/* Notes & Details */}
        <div className="bg-[#1A1A1A] rounded-2xl p-3.5 flex flex-col gap-1.5 focus-within:bg-[#222222] focus-within:ring-1 focus-within:ring-[#D4AF37]/50 transition-all border border-[#262626] shadow-sm">
          <label className="font-body text-[10px] font-bold text-[#888888] tracking-wider uppercase">
            {type === 'transfer'
              ? 'TRANSFER NOTES'
              : type === 'refund'
              ? 'REFUND REASON & DETAILS'
              : 'NOTES & #TAGS'}
          </label>
          <textarea
            id="input-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              type === 'transfer'
                ? 'Reason for transfer...'
                : type === 'refund'
                ? 'Order ID, return reason, etc.'
                : 'Add details or #tags...'
            }
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
            className={`w-full text-[#0F0F0F] font-display text-[16px] font-bold rounded-full py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isSaved
                ? 'bg-[#10B981] text-white'
                : type === 'income'
                ? 'bg-[#34D399] hover:bg-[#10B981] shadow-[0_8px_24px_rgba(52,211,153,0.35)]'
                : type === 'refund'
                ? 'bg-[#38BDF8] hover:bg-[#0284C7] shadow-[0_8px_24px_rgba(56,189,248,0.35)]'
                : 'bg-[#D4AF37] hover:bg-[#E5C158] shadow-[0_8px_24px_rgba(212,175,55,0.35)]'
            }`}
          >
            <span>
              {isSaved
                ? 'Saved!'
                : type === 'transfer'
                ? 'Execute Transfer'
                : type === 'refund'
                ? 'Save Refund'
                : type === 'income'
                ? 'Save Income'
                : 'Save Expense'}
            </span>
            <span className="material-symbols-outlined text-[20px] font-bold">
              {isSaved ? 'task_alt' : 'check_circle'}
            </span>
          </button>
        </div>
      </div>

      {/* Custom Dark Theme Dropdown / Bottom Sheet Modal */}
      {pickerOpen && (
        <div
          id="modal-picker-backdrop"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPickerOpen(null)}
        >
          <div
            id="modal-picker-container"
            className="bg-[#181818] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#2C2C2C] shadow-2xl p-5 pb-8 sm:pb-6 flex flex-col gap-4 max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    type === 'income'
                      ? 'bg-[#10B981]/20 text-[#34D399]'
                      : type === 'refund'
                      ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                      : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {pickerOpen === 'category'
                      ? type === 'income'
                        ? 'payments'
                        : 'category'
                      : pickerOpen === 'refundLink'
                      ? 'link'
                      : 'account_balance_wallet'}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-[16px] text-[#FFFFFF]">
                    {pickerOpen === 'category'
                      ? type === 'income'
                        ? 'Select Income Category'
                        : type === 'refund'
                        ? 'Reimbursed Category'
                        : 'Select Expense Category'
                      : pickerOpen === 'account'
                      ? type === 'income'
                        ? 'Deposit To Account'
                        : type === 'transfer'
                        ? 'From Account'
                        : type === 'refund'
                        ? 'Credit To Account'
                        : 'Paid From Account'
                      : pickerOpen === 'destAccount'
                      ? 'Transfer To Account'
                      : 'Link Original Expense'}
                  </h3>
                  <p className="font-body text-[11px] text-[#888888]">
                    {pickerOpen === 'category'
                      ? type === 'income'
                        ? 'Showing income categories only'
                        : 'Choose a category for tracking'
                      : pickerOpen === 'account' || pickerOpen === 'destAccount'
                      ? 'Select account for this transaction'
                      : 'Choose an expense to reimburse'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-picker"
                onClick={() => setPickerOpen(null)}
                className="w-8 h-8 rounded-full bg-[#242424] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto pr-1 flex flex-col gap-2 max-h-[58vh]">
              {/* Category Picker */}
              {pickerOpen === 'category' && (
                <>
                  <button
                    type="button"
                    id="btn-quick-add-new-category"
                    onClick={() => {
                      setPickerOpen(null);
                      setIsAddCategoryOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] font-body font-bold text-[13px] transition-all cursor-pointer mb-1 shadow-sm active:scale-[0.99]"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>Create New Category</span>
                  </button>
                  {(type === 'income' ? incomeCategories : expenseCategories).map((c) => {
                    const isSelected = c.id === categoryId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        id={`picker-cat-${c.id}`}
                        onClick={() => {
                          setCategoryId(c.id);
                          setPickerOpen(null);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#282828] border border-[#D4AF37]/50 shadow-sm'
                            : 'hover:bg-[#222222] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${c.color || '#D4AF37'}25`,
                              color: c.color || '#D4AF37',
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
                          </div>
                          <div className="text-left">
                            <p
                              className={`font-body font-semibold text-[14px] ${
                                isSelected ? 'text-[#FFFFFF]' : 'text-[#E0E0E0]'
                              }`}
                            >
                              {c.name}
                            </p>
                            <p className="font-body text-[11px] text-[#777777] uppercase tracking-wider">
                              {c.type === 'both' ? 'Flexible' : `${c.type} category`}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <span
                            className={`material-symbols-outlined text-[22px] ${
                              type === 'income' ? 'text-[#34D399]' : 'text-[#D4AF37]'
                            }`}
                          >
                            check_circle
                          </span>
                        )}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Account Picker */}
              {pickerOpen === 'account' &&
                accounts.map((a) => {
                  const isSelected = a.id === accountId;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      id={`picker-acc-${a.id}`}
                      onClick={() => {
                        setAccountId(a.id);
                        setPickerOpen(null);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#282828] border border-[#D4AF37]/50 shadow-sm'
                          : 'hover:bg-[#222222] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#262626] text-[#D4AF37] border border-[#333333] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">
                            {a.icon || 'account_balance'}
                          </span>
                        </div>
                        <div className="text-left">
                          <p
                            className={`font-body font-semibold text-[14px] ${
                              isSelected ? 'text-[#FFFFFF]' : 'text-[#E0E0E0]'
                            }`}
                          >
                            {a.name}
                          </p>
                          <p className="font-body text-[11px] text-[#777777] uppercase tracking-wider">
                            {a.type} • {a.accountNumber ? `••${a.accountNumber.slice(-4)}` : 'Active'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-display font-bold text-[14px] text-[#E0E0E0]">
                          {formatCurrency(a.balance)}
                        </span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[#D4AF37] text-[22px]">
                            check_circle
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

              {/* Destination Account Picker (Transfer) */}
              {pickerOpen === 'destAccount' &&
                accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => {
                    const isSelected = a.id === destinationAccountId;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        id={`picker-dest-acc-${a.id}`}
                        onClick={() => {
                          setDestinationAccountId(a.id);
                          setPickerOpen(null);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#282828] border border-[#34D399]/50 shadow-sm'
                            : 'hover:bg-[#222222] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">
                              {a.icon || 'account_balance'}
                            </span>
                          </div>
                          <div className="text-left">
                            <p
                              className={`font-body font-semibold text-[14px] ${
                                isSelected ? 'text-[#FFFFFF]' : 'text-[#E0E0E0]'
                              }`}
                            >
                              {a.name}
                            </p>
                            <p className="font-body text-[11px] text-[#777777] uppercase tracking-wider">
                              {a.type} • {a.accountNumber ? `••${a.accountNumber.slice(-4)}` : 'Active'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-display font-bold text-[14px] text-[#E0E0E0]">
                            {formatCurrency(a.balance)}
                          </span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[#34D399] text-[22px]">
                              check_circle
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}

              {/* Refund Link Picker */}
              {pickerOpen === 'refundLink' && (
                <>
                  <button
                    type="button"
                    id="picker-refund-none"
                    onClick={() => {
                      setRefundLinkId('');
                      setPickerOpen(null);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                      refundLinkId === ''
                        ? 'bg-[#282828] border border-[#38BDF8]/50 shadow-sm'
                        : 'hover:bg-[#222222] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-full bg-[#333333] text-[#888888] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">block</span>
                      </div>
                      <div>
                        <p className="font-body font-semibold text-[14px] text-[#E0E0E0]">
                          -- None (Manual Refund) --
                        </p>
                        <p className="font-body text-[11px] text-[#777777]">
                          Record without linking to previous expense
                        </p>
                      </div>
                    </div>
                    {refundLinkId === '' && (
                      <span className="material-symbols-outlined text-[#38BDF8] text-[20px]">
                        check_circle
                      </span>
                    )}
                  </button>

                  {recentExpenses.length === 0 ? (
                    <div className="py-6 text-center text-[#777777] text-[13px]">
                      No previous expenses found to link
                    </div>
                  ) : (
                    recentExpenses.map((exp) => {
                      const isSelected = exp.id === refundLinkId;
                      return (
                        <button
                          key={exp.id}
                          type="button"
                          id={`picker-refund-exp-${exp.id}`}
                          onClick={() => {
                            handleLinkExpenseChange(exp.id);
                            setPickerOpen(null);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#282828] border border-[#38BDF8]/50 shadow-sm'
                              : 'hover:bg-[#222222] border border-transparent'
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-body font-semibold text-[14px] text-[#FFFFFF]">
                              {exp.merchant}
                            </p>
                            <p className="font-body text-[11px] text-[#888888]">{exp.date}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-[14px] text-[#FB7185]">
                              {formatCurrency(exp.amount)}
                            </span>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[#38BDF8] text-[20px]">
                                check_circle
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Quick Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
      />
    </div>
  );
};
