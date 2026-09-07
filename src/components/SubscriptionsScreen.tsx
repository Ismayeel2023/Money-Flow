import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Subscription } from '../types';
import { CustomDropdown } from './CustomDropdown';

export const SubscriptionsScreen: React.FC = () => {
  const {
    subscriptions,
    addSubscription,
    deleteSubscription,
    markSubscriptionPaid,
    formatCurrency,
    accounts,
    categories,
  } = useFinance();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterCycle, setFilterCycle] = useState<'all' | 'monthly' | 'yearly'>('all');

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Compute monthly total
  const monthlyTotal = subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => {
      if (s.billingCycle === 'monthly') return sum + s.amount;
      if (s.billingCycle === 'yearly') return sum + s.amount / 12;
      if (s.billingCycle === 'weekly') return sum + s.amount * 4.33;
      return sum;
    }, 0);

  // Filtered subscriptions
  const filteredSubs = subscriptions.filter((s) => {
    if (filterCycle === 'all') return true;
    return s.billingCycle === filterCycle;
  });

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!name.trim() || isNaN(numAmount) || numAmount <= 0) return;

    const acc = accounts.find((a) => a.id === accountId) || accounts[0];
    const cat = categories.find((c) => c.id === categoryId) || categories[0];

    addSubscription({
      name: name.trim(),
      amount: numAmount,
      billingCycle,
      accountId: acc.id,
      accountName: acc.name,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      nextDueDate: nextDueDate || new Date().toISOString().split('T')[0],
      isActive: true,
    });

    // Reset & close
    setName('');
    setAmount('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto px-4 pt-4 sm:pt-5 pb-32 gap-5">
      {/* Header & Monthly Cost Banner */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <span className="material-symbols-outlined text-[26px]">autorenew</span>
              </div>
              <div>
                <h1 className="font-display text-[22px] font-bold text-[#FFFFFF]">
                  Recurring & Subscriptions
                </h1>
                <p className="font-body text-[13px] text-[#888888]">
                  Track Netflix, Spotify, SIPs, utilities & renewal dates
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] rounded-full px-4 py-2 text-[13px] font-bold shadow-md flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-[#121212] border border-[#262626] rounded-2xl p-4">
              <span className="font-body text-[11px] font-bold tracking-wider text-[#888888] uppercase block">
                Monthly Commitment
              </span>
              <span className="font-display text-[24px] font-bold text-[#D4AF37]">
                {formatCurrency(monthlyTotal)}
                <span className="text-[12px] text-[#888888] font-normal"> /mo</span>
              </span>
            </div>
            <div className="bg-[#121212] border border-[#262626] rounded-2xl p-4">
              <span className="font-body text-[11px] font-bold tracking-wider text-[#888888] uppercase block">
                Active Services
              </span>
              <span className="font-display text-[24px] font-bold text-[#FFFFFF]">
                {subscriptions.filter((s) => s.isActive).length}
                <span className="text-[12px] text-[#888888] font-normal"> active</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#262626] pb-2">
        {(['all', 'monthly', 'yearly'] as const).map((cycle) => (
          <button
            key={cycle}
            onClick={() => setFilterCycle(cycle)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors capitalize ${
              filterCycle === cycle
                ? 'bg-[#D4AF37] text-[#0F0F0F] font-bold'
                : 'bg-[#1A1A1A] text-[#888888] hover:text-[#FFFFFF]'
            }`}
          >
            {cycle}
          </button>
        ))}
      </div>

      {/* Subscriptions List */}
      <div className="flex flex-col gap-3">
        {filteredSubs.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-dashed border-[#2B2B2B] rounded-2xl p-8 text-center text-[#777777]">
            <span className="material-symbols-outlined text-[32px] mb-2 block">autorenew</span>
            <span>No recurring expenses recorded. Click "Add" above to add one.</span>
          </div>
        ) : (
          filteredSubs.map((sub) => {
            const dueDate = new Date(sub.nextDueDate);
            const today = new Date();
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={sub.id}
                className="bg-[#1A1A1A] border border-[#262626] hover:border-[#383838] rounded-2xl p-4 flex flex-col gap-3 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[#FFFFFF] shadow-sm"
                      style={{ backgroundColor: sub.categoryColor || '#4f46e5' }}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {sub.categoryIcon || 'movie'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-[16px] font-bold text-[#FFFFFF]">
                        {sub.name}
                      </h3>
                      <span className="text-[12px] text-[#888888]">
                        {sub.accountName || 'Bank Account'} • {sub.billingCycle}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display text-[18px] font-bold text-[#FFFFFF]">
                      {formatCurrency(sub.amount)}
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        diffDays <= 3
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-[#262626] text-[#A0A0A0]'
                      }`}
                    >
                      {diffDays > 0 ? `Renews in ${diffDays}d` : 'Due today'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#262626] pt-2.5">
                  <span className="text-[12px] text-[#888888]">
                    Next renewal: <span className="text-[#CCCCCC]">{sub.nextDueDate}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => markSubscriptionPaid(sub.id)}
                      title="Record payment and advance next due date"
                      className="px-3 py-1 rounded-full bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 text-[12px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">done_all</span>
                      <span>Mark Paid</span>
                    </button>

                    <button
                      onClick={() => deleteSubscription(sub.id)}
                      title="Remove subscription"
                      className="p-1.5 rounded-full text-[#888888] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Subscription Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h2 className="font-display text-[18px] font-bold text-[#FFFFFF]">
                New Subscription / Recurring Cost
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#888888] hover:text-[#FFFFFF]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[12px] font-semibold text-[#888888] block mb-1">
                  Service / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Gym, SIP, Broadband"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl p-3 text-[14px] text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#888888] block mb-1">
                    Amount (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="649.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl p-3 text-[14px] text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <CustomDropdown
                    label="Cycle"
                    options={[
                      { id: 'monthly', label: 'Monthly', icon: 'calendar_month', sublabel: 'Every month', color: '#3B82F6' },
                      { id: 'yearly', label: 'Yearly', icon: 'event_repeat', sublabel: 'Every year', color: '#10B981' },
                      { id: 'weekly', label: 'Weekly', icon: 'date_range', sublabel: 'Every week', color: '#F59E0B' },
                    ]}
                    value={billingCycle}
                    onChange={(val) => setBillingCycle(val as any)}
                    searchable={false}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CustomDropdown
                    label="Billed From Account"
                    options={accounts.map((a) => ({
                      id: a.id,
                      label: a.name,
                      icon: a.type === 'credit' ? 'credit_card' : 'account_balance',
                      sublabel: a.accountNumber ? `••••${a.accountNumber}` : a.type.toUpperCase(),
                      color: a.color || '#D4AF37',
                    }))}
                    value={accountId}
                    onChange={(val) => setAccountId(val)}
                    searchable={accounts.length > 4}
                  />
                </div>

                <div>
                  <CustomDropdown
                    label="Category"
                    options={categories.map((c) => ({
                      id: c.id,
                      label: c.name,
                      icon: c.icon,
                      sublabel: c.type.toUpperCase(),
                      color: c.color || '#D4AF37',
                    }))}
                    value={categoryId}
                    onChange={(val) => setCategoryId(val)}
                    searchable={true}
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#888888] block mb-1">
                  Next Renewal Date
                </label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl p-3 text-[14px] text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-3 rounded-full bg-[#262626] hover:bg-[#333333] text-[#FFFFFF] text-[14px] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] text-[14px] font-bold shadow-md transition-all"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
