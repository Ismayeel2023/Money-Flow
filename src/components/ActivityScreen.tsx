import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';

export const ActivityScreen: React.FC = () => {
  const {
    transactions,
    categories,
    accounts,
    formatCurrency,
    setActiveTransactionForDetail,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');
  const [activeDropdown, setActiveDropdown] = useState<'time' | 'type' | 'category' | 'account' | null>(null);
  const [isListening, setIsListening] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMerchant = t.merchant.toLowerCase().includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);
        const matchesCat = t.categoryName.toLowerCase().includes(q);
        const matchesAcc = t.accountName.toLowerCase().includes(q);
        if (!matchesMerchant && !matchesNotes && !matchesCat && !matchesAcc) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'all' && t.type !== selectedType) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) {
        return false;
      }

      // Account filter
      if (selectedAccount !== 'all' && t.accountId !== selectedAccount) {
        return false;
      }

      // Time filter
      if (timeFilter !== 'all') {
        const txDate = new Date(t.date);
        const now = new Date();
        if (timeFilter === 'week') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (txDate < sevenDaysAgo) return false;
        } else if (timeFilter === 'month') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          if (txDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [transactions, searchQuery, selectedType, selectedCategory, selectedAccount, timeFilter]);

  // Group by date
  const groupedTransactions: Record<string, Transaction[]> = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    filteredTransactions.forEach((t) => {
      let key = t.displayDate || t.date;
      if (t.date === todayStr || (t.displayDate && t.displayDate.toLowerCase().startsWith('today'))) {
        const formatted = new Date(t.date || todayStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        key = `Today, ${formatted}`;
      } else if (t.date === yesterdayStr || (t.displayDate && t.displayDate.toLowerCase().startsWith('yesterday'))) {
        const formatted = new Date(t.date || yesterdayStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        key = `Yesterday, ${formatted}`;
      } else if (t.date) {
        try {
          key = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
          key = t.date;
        }
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  // Filter metrics
  const filterStats = useMemo(() => {
    let incomeSum = 0;
    let expenseSum = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') incomeSum += t.amount;
      else if (t.type === 'expense') expenseSum += t.amount;
    });
    return {
      count: filteredTransactions.length,
      incomeSum,
      expenseSum,
    };
  }, [filteredTransactions]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedAccount !== 'all' ||
    timeFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedAccount('all');
    setTimeFilter('all');
    setActiveDropdown(null);
  };

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        setIsListening(true);
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setSearchQuery(text);
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
      } catch {
        setIsListening(false);
      }
    } else {
      setIsListening(false);
    }
  };

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);
  const selectedAccountObj = accounts.find((a) => a.id === selectedAccount);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-3 pb-32 gap-4">
      {/* Search & Filter Header Section */}
      <div className="flex flex-col gap-3" ref={dropdownRef}>
        {/* Search Bar */}
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#888888] group-focus-within:text-[#D4AF37] transition-colors">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            id="activity-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by merchant, note, or amount..."
            className="w-full h-12 pl-10 pr-20 bg-[#1A1A1A] text-[#E0E0E0] font-body text-[14px] rounded-2xl outline-none transition-all focus:bg-[#222222] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 border border-[#2A2A2A] placeholder:text-[#666666]"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-7 h-7 rounded-full text-[#888888] hover:text-[#FFFFFF] hover:bg-[#2A2A2A] flex items-center justify-center transition-colors"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleVoiceSearch}
              title={isListening ? 'Listening...' : 'Voice Search'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-[#F43F5E] text-white animate-pulse'
                  : 'bg-[#262626] text-[#A0A0A0] hover:text-[#D4AF37] hover:bg-[#333333]'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {isListening ? 'mic' : 'mic'}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Chips Horizontal Scroll */}
        <div className="relative">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {/* Time Filter Pill */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'time' ? null : 'time')
                }
                className={`h-9 px-3.5 rounded-full font-body text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                  timeFilter !== 'all'
                    ? 'bg-[#D4AF37] text-[#0F0F0F] shadow-[0_2px_8px_rgba(212,175,55,0.3)]'
                    : 'bg-[#1A1A1A] hover:bg-[#262626] text-[#A0A0A0] hover:text-[#E0E0E0] border border-[#2A2A2A]'
                }`}
              >
                <span>
                  {timeFilter === 'all'
                    ? 'All Time'
                    : timeFilter === 'month'
                    ? 'This Month'
                    : 'This Week'}
                </span>
                <span className="material-symbols-outlined text-[15px]">
                  {activeDropdown === 'time' ? 'arrow_drop_up' : 'arrow_drop_down'}
                </span>
              </button>

              {activeDropdown === 'time' && (
                <div className="absolute top-11 left-0 z-40 w-40 bg-[#222222] border border-[#333333] rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 animate-fadeIn">
                  {[
                    { key: 'all', label: 'All Time' },
                    { key: 'month', label: 'This Month' },
                    { key: 'week', label: 'This Week' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setTimeFilter(item.key as any);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[12px] font-bold transition-colors ${
                        timeFilter === item.key
                          ? 'bg-[#D4AF37] text-[#0F0F0F]'
                          : 'text-[#E0E0E0] hover:bg-[#2E2E2E]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type Filter Pill */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'type' ? null : 'type')
                }
                className={`h-9 px-3.5 rounded-full font-body text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                  selectedType !== 'all'
                    ? 'bg-[#D4AF37] text-[#0F0F0F] shadow-[0_2px_8px_rgba(212,175,55,0.3)]'
                    : 'bg-[#1A1A1A] hover:bg-[#262626] text-[#A0A0A0] hover:text-[#E0E0E0] border border-[#2A2A2A]'
                }`}
              >
                <span>
                  {selectedType === 'all'
                    ? 'Type: All'
                    : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                </span>
                <span className="material-symbols-outlined text-[15px]">
                  {activeDropdown === 'type' ? 'arrow_drop_up' : 'arrow_drop_down'}
                </span>
              </button>

              {activeDropdown === 'type' && (
                <div className="absolute top-11 left-0 z-40 w-40 bg-[#222222] border border-[#333333] rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 animate-fadeIn">
                  {[
                    { key: 'all', label: 'All Types' },
                    { key: 'expense', label: 'Expenses' },
                    { key: 'income', label: 'Income' },
                    { key: 'transfer', label: 'Transfers' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setSelectedType(item.key);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[12px] font-bold transition-colors ${
                        selectedType === item.key
                          ? 'bg-[#D4AF37] text-[#0F0F0F]'
                          : 'text-[#E0E0E0] hover:bg-[#2E2E2E]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category Filter Pill */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'category' ? null : 'category')
                }
                className={`h-9 px-3.5 rounded-full font-body text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                  selectedCategory !== 'all'
                    ? 'bg-[#D4AF37] text-[#0F0F0F] shadow-[0_2px_8px_rgba(212,175,55,0.3)]'
                    : 'bg-[#1A1A1A] hover:bg-[#262626] text-[#A0A0A0] hover:text-[#E0E0E0] border border-[#2A2A2A]'
                }`}
              >
                <span className="truncate max-w-[110px]">
                  {selectedCategory === 'all'
                    ? 'Category: All'
                    : selectedCategoryObj?.name || 'Category'}
                </span>
                <span className="material-symbols-outlined text-[15px]">
                  {activeDropdown === 'category' ? 'arrow_drop_up' : 'arrow_drop_down'}
                </span>
              </button>

              {activeDropdown === 'category' && (
                <div className="absolute top-11 left-0 z-40 w-52 max-h-60 overflow-y-auto bg-[#222222] border border-[#333333] rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 animate-fadeIn">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-[12px] font-bold transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-[#D4AF37] text-[#0F0F0F]'
                        : 'text-[#E0E0E0] hover:bg-[#2E2E2E]'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCategory(c.id);
                        setActiveDropdown(null);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold transition-colors text-left ${
                        selectedCategory === c.id
                          ? 'bg-[#D4AF37] text-[#0F0F0F]'
                          : 'text-[#E0E0E0] hover:bg-[#2E2E2E]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {c.icon || 'category'}
                      </span>
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account Filter Pill */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'account' ? null : 'account')
                }
                className={`h-9 px-3.5 rounded-full font-body text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                  selectedAccount !== 'all'
                    ? 'bg-[#D4AF37] text-[#0F0F0F] shadow-[0_2px_8px_rgba(212,175,55,0.3)]'
                    : 'bg-[#1A1A1A] hover:bg-[#262626] text-[#A0A0A0] hover:text-[#E0E0E0] border border-[#2A2A2A]'
                }`}
              >
                <span className="truncate max-w-[110px]">
                  {selectedAccount === 'all'
                    ? 'Account: All'
                    : selectedAccountObj?.name || 'Account'}
                </span>
                <span className="material-symbols-outlined text-[15px]">
                  {activeDropdown === 'account' ? 'arrow_drop_up' : 'arrow_drop_down'}
                </span>
              </button>

              {activeDropdown === 'account' && (
                <div className="absolute top-11 right-0 z-40 w-52 bg-[#222222] border border-[#333333] rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 animate-fadeIn">
                  <button
                    onClick={() => {
                      setSelectedAccount('all');
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-[12px] font-bold transition-colors ${
                      selectedAccount === 'all'
                        ? 'bg-[#D4AF37] text-[#0F0F0F]'
                        : 'text-[#E0E0E0] hover:bg-[#2E2E2E]'
                    }`}
                  >
                    All Accounts
                  </button>
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSelectedAccount(a.id);
                        setActiveDropdown(null);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold transition-colors text-left ${
                        selectedAccount === a.id
                          ? 'bg-[#D4AF37] text-[#0F0F0F]'
                          : 'text-[#E0E0E0] hover:bg-[#2E2E2E]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {a.type === 'bank'
                          ? 'account_balance'
                          : a.type === 'credit'
                          ? 'credit_card'
                          : 'payments'}
                      </span>
                      <span className="truncate">{a.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-3 shrink-0 rounded-full bg-[#FB7185]/15 hover:bg-[#FB7185]/25 text-[#FB7185] border border-[#FB7185]/30 font-body text-[11px] font-bold flex items-center gap-1 transition-colors"
                title="Reset all filters"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between px-1 text-[12px] text-[#888888] font-body">
          <span>
            {filterStats.count} transaction{filterStats.count !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3">
            {filterStats.expenseSum > 0 && (
              <span className="text-[#FB7185] font-semibold">
                - {formatCurrency(filterStats.expenseSum)}
              </span>
            )}
            {filterStats.incomeSum > 0 && (
              <span className="text-[#34D399] font-semibold">
                + {formatCurrency(filterStats.incomeSum)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-5 pt-1">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="text-center py-12 text-[#888888] bg-[#1A1A1A] rounded-3xl p-8 border border-[#262626] flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#262626] flex items-center justify-center text-[#888888]">
              <span className="material-symbols-outlined text-[28px]">search_off</span>
            </div>
            <p className="font-display text-[16px] font-bold text-[#E0E0E0]">
              No transactions found
            </p>
            <p className="font-body text-[13px] text-[#888888] max-w-xs">
              {hasActiveFilters
                ? 'Try adjusting or clearing your search filters to find transactions.'
                : 'No transactions recorded yet.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-body text-[13px] font-bold px-4 py-2 rounded-full shadow-md active:scale-95 transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([dateGroup, items]) => {
            const dayExpense = items
              .filter((i) => i.type === 'expense')
              .reduce((sum, i) => sum + i.amount, 0);

            return (
              <div key={dateGroup} className="flex flex-col gap-2.5">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="font-body font-bold text-[12px] text-[#888888] uppercase tracking-wider">
                    {dateGroup}
                  </span>
                  {dayExpense > 0 && (
                    <span className="font-body text-[11px] font-semibold text-[#888888]">
                      Spent: {formatCurrency(dayExpense)}
                    </span>
                  )}
                </div>

                {/* Transactions in Date Group */}
                <div className="flex flex-col gap-2.5">
                  {items.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    const isExpense = tx.type === 'expense';

                    return (
                      <div
                        key={tx.id}
                        onClick={() => setActiveTransactionForDetail(tx)}
                        className="bg-[#1A1A1A] hover:bg-[#202020] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)] border border-[#262626] hover:border-[#D4AF37]/30 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3"
                      >
                        {/* Left: Icon & Merchant info */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                            style={{
                              backgroundColor: `${tx.categoryColor || (isIncome ? '#10B981' : isTransfer ? '#D4AF37' : '#FB7185')}20`,
                              color: tx.categoryColor || (isIncome ? '#34D399' : isTransfer ? '#D4AF37' : '#FB7185'),
                            }}
                          >
                            <span className="material-symbols-outlined text-[22px]">
                              {tx.categoryIcon || (isIncome ? 'work' : isTransfer ? 'sync_alt' : 'coffee')}
                            </span>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="font-body font-bold text-[15px] text-[#FFFFFF] truncate">
                              {tx.merchant}
                            </span>
                            <div className="flex items-center gap-1.5 text-[12px] text-[#888888] truncate mt-0.5">
                              <span className="truncate">{tx.categoryName}</span>
                              <span>•</span>
                              <span className="truncate">{tx.accountName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Type badge */}
                        <div className="flex flex-col items-end shrink-0">
                          <span
                            className={`font-display text-[17px] font-bold tracking-tight ${
                              isIncome
                                ? 'text-[#34D399]'
                                : isTransfer
                                ? 'text-[#D4AF37]'
                                : 'text-[#FFFFFF]'
                            }`}
                          >
                            {isIncome ? '+ ' : isExpense ? '- ' : ''}
                            {formatCurrency(tx.amount)}
                          </span>

                          <span
                            className={`mt-1 font-body text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isExpense
                                ? 'bg-[#F43F5E]/15 text-[#FB7185]'
                                : isIncome
                                ? 'bg-[#10B981]/15 text-[#34D399]'
                                : 'bg-[#D4AF37]/15 text-[#D4AF37]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[11px]">
                              {isExpense
                                ? 'arrow_downward'
                                : isIncome
                                ? 'arrow_upward'
                                : 'swap_horiz'}
                            </span>
                            {tx.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Caught up banner */}
        {Object.keys(groupedTransactions).length > 0 && (
          <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-[#888888]">
            <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-[#34D399]">
              <span className="material-symbols-outlined text-[18px]">check</span>
            </div>
            <p className="font-body text-[13px] text-[#888888]">
              Showing all {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
