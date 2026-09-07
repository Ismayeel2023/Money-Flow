import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';

export const MerchantsScreen: React.FC = () => {
  const { transactions, formatCurrency, setActiveTransactionForDetail } = useFinance();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [sortBy, setSortBy] = useState<'spent' | 'count' | 'recent'>('spent');
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);

  // Group and aggregate transactions by merchant/party
  const merchantData = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        totalSpent: number;
        totalEarned: number;
        transactions: Transaction[];
        lastDate: string;
        categories: Set<string>;
        type: 'expense' | 'income' | 'both';
      }
    >();

    transactions.forEach((tx) => {
      const name = (tx.merchant || tx.party || 'Other').trim();
      if (!name) return;

      const existing = map.get(name) || {
        name,
        totalSpent: 0,
        totalEarned: 0,
        transactions: [],
        lastDate: tx.date,
        categories: new Set<string>(),
        type: tx.type === 'income' ? 'income' : 'expense',
      };

      if (tx.type === 'expense') {
        existing.totalSpent += tx.amount;
      } else if (tx.type === 'income') {
        existing.totalEarned += tx.amount;
      }

      if (tx.categoryName) {
        existing.categories.add(tx.categoryName);
      }

      existing.transactions.push(tx);

      if (new Date(tx.date) > new Date(existing.lastDate)) {
        existing.lastDate = tx.date;
      }

      if (existing.totalSpent > 0 && existing.totalEarned > 0) {
        existing.type = 'both';
      } else if (existing.totalSpent > 0) {
        existing.type = 'expense';
      } else {
        existing.type = 'income';
      }

      map.set(name, existing);
    });

    return Array.from(map.values());
  }, [transactions]);

  // Filter & search
  const filteredMerchants = useMemo(() => {
    return merchantData
      .filter((m) => {
        if (filterType === 'expense' && m.totalSpent === 0) return false;
        if (filterType === 'income' && m.totalEarned === 0) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            m.name.toLowerCase().includes(q) ||
            Array.from(m.categories).some((c: string) => c.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'spent') {
          return b.totalSpent - a.totalSpent;
        }
        if (sortBy === 'count') {
          return b.transactions.length - a.transactions.length;
        }
        // recent
        return new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime();
      });
  }, [merchantData, filterType, searchQuery, sortBy]);

  // Overall metrics
  const totalSpend = useMemo(() => {
    return merchantData.reduce((sum, m) => sum + m.totalSpent, 0);
  }, [merchantData]);

  const activeSelectedMerchant = useMemo(() => {
    if (!selectedMerchant) return null;
    return merchantData.find((m) => m.name === selectedMerchant) || null;
  }, [merchantData, selectedMerchant]);

  const getMerchantIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('swiggy') || lower.includes('zomato') || lower.includes('dine') || lower.includes('cafe') || lower.includes('coffee') || lower.includes('food')) {
      return 'restaurant';
    }
    if (lower.includes('uber') || lower.includes('ola') || lower.includes('petrol') || lower.includes('fuel') || lower.includes('metro')) {
      return 'directions_car';
    }
    if (lower.includes('amazon') || lower.includes('flipkart') || lower.includes('zara') || lower.includes('myntra') || lower.includes('shop')) {
      return 'shopping_bag';
    }
    if (lower.includes('salary') || lower.includes('corp') || lower.includes('employer') || lower.includes('company') || lower.includes('tech')) {
      return 'domain';
    }
    if (lower.includes('doctor') || lower.includes('pharma') || lower.includes('hospital') || lower.includes('apollo')) {
      return 'medical_services';
    }
    if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('movie') || lower.includes('cinema')) {
      return 'theaters';
    }
    return 'storefront';
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-4 sm:pt-5 pb-36 gap-5">
      {/* Top Metrics Banner */}
      <div className="bg-[#1A1A1A] rounded-3xl p-5 border border-[#262626] flex items-center justify-between shadow-sm">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
            Total Tracked Merchants
          </span>
          <span className="font-display font-bold text-[28px] text-[#FFFFFF]">
            {merchantData.length}
          </span>
          <span className="text-[11px] text-[#A0A0A0]">
            Across {transactions.length} transactions
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
            Total Outflow
          </span>
          <span className="font-display font-bold text-[22px] text-[#D4AF37]">
            {formatCurrency(totalSpend)}
          </span>
          <span className="text-[11px] text-[#34D399]">
            {merchantData.filter((m) => m.totalEarned > 0).length} Income Payers
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-[#1A1A1A] rounded-2xl px-3.5 py-2.5 flex items-center gap-3 border border-[#262626] shadow-sm focus-within:border-[#D4AF37]/50 transition-all">
        <span className="material-symbols-outlined text-[#888888] text-[20px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by merchant, store, or payer..."
          className="bg-transparent font-body text-[14px] text-[#E0E0E0] placeholder:text-[#666666] focus:outline-none w-full"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[#888888] hover:text-[#FFFFFF]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Sort Row */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-0.5">
        <div className="flex items-center gap-1.5">
          {(['all', 'expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-bold capitalize transition-all ${
                filterType === t
                  ? 'bg-[#D4AF37] text-[#0F0F0F]'
                  : 'bg-[#1A1A1A] text-[#888888] hover:text-[#FFFFFF] border border-[#262626]'
              }`}
            >
              {t === 'all' ? 'All' : t === 'expense' ? 'Merchants' : 'Payers'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[#666666] font-medium mr-1">Sort:</span>
          {(['spent', 'count', 'recent'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                sortBy === s
                  ? 'bg-[#2E2E2E] text-[#D4AF37] border border-[#D4AF37]/40'
                  : 'text-[#888888] hover:text-[#CCCCCC]'
              }`}
            >
              {s === 'spent' ? 'Spend' : s === 'count' ? 'Count' : 'Recent'}
            </button>
          ))}
        </div>
      </div>

      {/* Merchants List */}
      <div className="flex flex-col gap-2.5">
        {filteredMerchants.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-[#262626] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[#666666] text-[36px]">
              storefront
            </span>
            <p className="font-semibold text-[#A0A0A0] text-[14px]">No merchants found</p>
            <p className="text-[12px] text-[#666666]">
              Try changing the search query or filter
            </p>
          </div>
        ) : (
          filteredMerchants.map((merchant) => {
            const icon = getMerchantIcon(merchant.name);
            return (
              <div
                key={merchant.name}
                onClick={() => setSelectedMerchant(merchant.name)}
                className="bg-[#1A1A1A] hover:bg-[#222222] active:bg-[#262626] rounded-2xl p-3.5 border border-[#262626] flex items-center justify-between cursor-pointer transition-all shadow-sm group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#262626] border border-[#333333] text-[#D4AF37] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">
                      {icon}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-body font-semibold text-[15px] text-[#FFFFFF] truncate">
                      {merchant.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#888888] truncate">
                      <span>{merchant.transactions.length} txn{merchant.transactions.length > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{merchant.lastDate}</span>
                      {merchant.categories.size > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-[#A0A0A0] truncate">
                            {Array.from(merchant.categories)[0]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-3">
                  {merchant.totalSpent > 0 && (
                    <span className="font-display font-bold text-[14px] text-[#E0E0E0]">
                      {formatCurrency(merchant.totalSpent)}
                    </span>
                  )}
                  {merchant.totalEarned > 0 && (
                    <span className="font-display font-bold text-[13px] text-[#34D399]">
                      +{formatCurrency(merchant.totalEarned)}
                    </span>
                  )}
                  <span className="text-[10px] text-[#666666] flex items-center gap-0.5 group-hover:text-[#D4AF37] transition-colors">
                    Details
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Merchant Details Modal */}
      {activeSelectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#262626] relative flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">
                    {getMerchantIcon(activeSelectedMerchant.name)}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-[17px] text-[#FFFFFF]">
                    {activeSelectedMerchant.name}
                  </h3>
                  <p className="font-body text-[12px] text-[#888888]">
                    {activeSelectedMerchant.transactions.length} total transactions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMerchant(null)}
                className="w-8 h-8 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Total Spent / Earned */}
            <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#888888] uppercase block">
                  Total Volume
                </span>
                <span className="font-display font-bold text-[22px] text-[#D4AF37]">
                  {formatCurrency(
                    activeSelectedMerchant.totalSpent || activeSelectedMerchant.totalEarned
                  )}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 max-w-[140px] justify-end">
                {Array.from(activeSelectedMerchant.categories).map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 rounded-lg bg-[#303030] text-[#E0E0E0] text-[10px] font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Transaction History for this merchant */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                Transaction History
              </span>
              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                {activeSelectedMerchant.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => {
                      setSelectedMerchant(null);
                      setActiveTransactionForDetail(tx);
                    }}
                    className="p-2.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] border border-[#2C2C2C] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold text-[#E0E0E0]">
                        {tx.categoryName} • {tx.accountName}
                      </span>
                      <span className="text-[10px] text-[#888888]">{tx.date}</span>
                    </div>
                    <span
                      className={`font-display font-bold text-[13px] ${
                        tx.type === 'income' ? 'text-[#34D399]' : 'text-[#FFFFFF]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMerchant(null)}
              className="w-full bg-[#262626] hover:bg-[#303030] text-[#FFFFFF] font-body font-bold text-[13px] py-3 rounded-2xl transition-colors mt-1"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
