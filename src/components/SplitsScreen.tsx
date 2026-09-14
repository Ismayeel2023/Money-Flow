import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';
import { SplitService } from '../services/splitService';
import { BillSplit, SplitParticipant } from '../types';

export const SplitsScreen: React.FC = () => {
  const {
    splits,
    totalOwedToYou,
    settleParticipant,
    unsettleParticipant,
    deleteSplit,
    setIsSplitModalOpen,
    setActiveTransactionForSplit,
    accounts,
    formatCurrency,
    setTab,
  } = useFinance();

  const [activeFilter, setActiveFilter] = useState<'pending' | 'all' | 'settled'>('pending');
  const [selectedSplitForSettle, setSelectedSplitForSettle] = useState<{
    splitId: string;
    participant: SplitParticipant;
  } | null>(null);
  const [targetDepositAccountId, setTargetDepositAccountId] = useState<string>(accounts[0]?.id || '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter splits
  const filteredSplits = splits.filter((s) => {
    if (activeFilter === 'pending') return !s.isFullySettled;
    if (activeFilter === 'settled') return s.isFullySettled;
    return true;
  });

  const totalSettledAmount = splits.reduce((acc, split) => {
    return (
      acc +
      split.participants
        .filter((p) => p.paid)
        .reduce((sum, p) => sum + p.amount, 0)
    );
  }, 0);

  const activePendingCount = splits.filter((s) => !s.isFullySettled).length;

  const handleOpenNewSplit = () => {
    setActiveTransactionForSplit(null);
    setIsSplitModalOpen(true);
  };

  const handleConfirmSettle = () => {
    if (!selectedSplitForSettle) return;
    const { splitId, participant } = selectedSplitForSettle;
    settleParticipant(splitId, participant.id, targetDepositAccountId);

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#10B981', '#D4AF37'],
      });
    } catch {}

    setToastMessage(`Marked ₹${participant.amount.toLocaleString('en-IN')} from ${participant.name} as settled!`);
    setTimeout(() => setToastMessage(null), 3500);
    setSelectedSplitForSettle(null);
  };

  const handleSendWhatsApp = (split: BillSplit, participant: SplitParticipant) => {
    const userAcc = accounts.find((a) => a.type === 'bank') || accounts[0];
    const upiId = userAcc ? `${userAcc.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi` : undefined;
    const link = SplitService.getWhatsAppReminderLink(participant, split.title, upiId);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleCopyUpiLink = (split: BillSplit, participant: SplitParticipant) => {
    const text = `Hey ${participant.name}, please pay ₹${participant.amount} for "${split.title}" via UPI.`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setToastMessage(`Copied payment request message for ${participant.name}!`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 sm:px-5 pt-4 sm:pt-5 pb-36 gap-5">
      {/* Top Banner */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <span className="material-symbols-outlined text-[26px]">call_split</span>
          </div>
          <div>
            <h1 className="font-display text-[20px] font-bold text-[#FFFFFF]">
              Split &amp; Settle (IOU Tracker)
            </h1>
            <p className="font-body text-[13px] text-[#888888]">
              Track who owes you, split expenses &amp; WhatsApp reminders
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenNewSplit}
          className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] px-4 py-2 rounded-full font-bold text-[13px] flex items-center gap-1.5 shadow-[0_4px_14px_rgba(212,175,55,0.3)] transition-all active:scale-95 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden sm:inline">New Split</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Pending Receivables */}
        <div className="bg-[#1A1A1A] border border-[#2B2D33] rounded-2xl p-4 flex flex-col gap-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#888888] text-[11px] font-bold uppercase tracking-wider">
            <span>You Are Owed</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="font-display text-[22px] font-bold text-emerald-400">
            {formatCurrency(totalOwedToYou)}
          </span>
          <span className="text-[11px] text-[#888888]">
            Across {activePendingCount} pending {activePendingCount === 1 ? 'bill' : 'bills'}
          </span>
        </div>

        {/* Metric 2: Active Split Bills */}
        <div className="bg-[#1A1A1A] border border-[#2B2D33] rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[#888888] text-[11px] font-bold uppercase tracking-wider">
            Active Bills
          </span>
          <span className="font-display text-[22px] font-bold text-white">
            {activePendingCount}
          </span>
          <span className="text-[11px] text-[#888888]">
            {splits.length} total recorded
          </span>
        </div>

        {/* Metric 3: Total Settled */}
        <div className="bg-[#1A1A1A] border border-[#2B2D33] rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[#888888] text-[11px] font-bold uppercase tracking-wider">
            Settled (Collected)
          </span>
          <span className="font-display text-[22px] font-bold text-[#D4AF37]">
            {formatCurrency(totalSettledAmount)}
          </span>
          <span className="text-[11px] text-[#888888]">Repaid back into ledger</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-[#141518] p-1 rounded-2xl border border-[#262830]">
        <button
          type="button"
          onClick={() => setActiveFilter('pending')}
          className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeFilter === 'pending'
              ? 'bg-[#D4AF37] text-[#0F0F0F] shadow-sm'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          <span>Pending ({activePendingCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeFilter === 'all'
              ? 'bg-[#D4AF37] text-[#0F0F0F] shadow-sm'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          <span>All Bills ({splits.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('settled')}
          className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeFilter === 'settled'
              ? 'bg-[#D4AF37] text-[#0F0F0F] shadow-sm'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          <span>Settled</span>
        </button>
      </div>

      {/* Splits List */}
      <div className="flex flex-col gap-3.5">
        {filteredSplits.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-dashed border-[#2B2B2B] rounded-2xl p-8 text-center flex flex-col items-center gap-3 text-[#777777]">
            <span className="material-symbols-outlined text-[36px] text-[#D4AF37]/40">group_off</span>
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-bold text-white">No split bills found</span>
              <span className="text-[12px] text-[#888888]">
                {activeFilter === 'pending'
                  ? 'All your split expenses are fully settled! Great job.'
                  : 'Start splitting expenses like dinner, cabs, or groceries.'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenNewSplit}
              className="mt-2 px-5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-bold text-[13px] flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Split an Expense</span>
            </button>
          </div>
        ) : (
          filteredSplits.map((split) => {
            const pendingTotal = split.participants
              .filter((p) => !p.paid)
              .reduce((sum, p) => sum + p.amount, 0);
            const collectedTotal = split.participants
              .filter((p) => p.paid)
              .reduce((sum, p) => sum + p.amount, 0);
            const totalFriendsAmount = split.totalAmount - split.userShare;
            const progressPercent =
              totalFriendsAmount > 0 ? Math.round((collectedTotal / totalFriendsAmount) * 100) : 100;

            return (
              <div
                key={split.id}
                className="bg-[#1A1A1A] border border-[#2B2C30] hover:border-[#383A42] rounded-3xl p-5 flex flex-col gap-4 shadow-sm transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                      <span className="material-symbols-outlined text-[20px]">
                        {split.categoryIcon || 'call_split'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[15px] text-white leading-tight">
                          {split.title}
                        </h3>
                        {split.isFullySettled && (
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            SETTLED
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#888888]">{split.date}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end text-right">
                    <span className="text-[11px] text-[#888888]">Total Bill</span>
                    <span className="font-display font-bold text-[16px] text-white">
                      {formatCurrency(split.totalAmount)}
                    </span>
                    <span className="text-[11px] text-[#D4AF37]">
                      Your share: {formatCurrency(split.userShare)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] text-[#A0A0A5]">
                    <span>
                      Collected:{' '}
                      <strong className="text-white">{formatCurrency(collectedTotal)}</strong> of{' '}
                      {formatCurrency(totalFriendsAmount)}
                    </span>
                    <span className="font-bold text-[#D4AF37]">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#26272C] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4AF37] to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                    />
                  </div>
                </div>

                {/* Participants breakdown */}
                <div className="flex flex-col gap-2 pt-1 border-t border-[#26272C]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">
                    Friends ({split.participants.length})
                  </span>
                  <div className="flex flex-col gap-2">
                    {split.participants.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-wrap items-center justify-between bg-[#141518] px-3.5 py-2.5 rounded-2xl border border-[#262830] gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                              p.paid
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-[#2A2B30] text-[#D0D0D5]'
                            }`}
                          >
                            {p.paid ? (
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            ) : (
                              p.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-white">{p.name}</span>
                            <span className="text-[10px] text-[#888888]">
                              {p.paid ? (
                                <span className="text-emerald-400">Settled on {p.settledDate || 'recent'}</span>
                              ) : (
                                <span className="text-amber-400">Pending</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[13px] font-bold ${
                              p.paid ? 'text-[#888888] line-through' : 'text-emerald-400'
                            }`}
                          >
                            {formatCurrency(p.amount)}
                          </span>

                          {p.paid ? (
                            <button
                              type="button"
                              onClick={() => unsettleParticipant(split.id, p.id)}
                              className="text-[11px] text-[#888888] hover:text-white px-2 py-1 rounded bg-[#202126] hover:bg-[#2A2B30] transition-colors"
                              title="Mark as unpaid"
                            >
                              Undo
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {/* Settle Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedSplitForSettle({
                                    splitId: split.id,
                                    participant: p,
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0F0F0F] text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                              >
                                <span className="material-symbols-outlined text-[14px]">check</span>
                                <span>Paid</span>
                              </button>

                              {/* WhatsApp Reminder */}
                              <button
                                type="button"
                                onClick={() => handleSendWhatsApp(split, p)}
                                className="p-1 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] transition-colors"
                                title="Send WhatsApp Payment Reminder"
                              >
                                <span className="material-symbols-outlined text-[16px]">chat</span>
                              </button>

                              {/* Copy Request */}
                              <button
                                type="button"
                                onClick={() => handleCopyUpiLink(split, p)}
                                className="p-1 rounded-lg bg-[#25262C] hover:bg-[#303238] text-[#A0A0A5] hover:text-white transition-colors"
                                title="Copy Payment Request"
                              >
                                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Notes & Delete */}
                <div className="flex items-center justify-between text-[11px] text-[#888888] pt-1">
                  <span className="truncate max-w-[260px]">{split.notes || 'No extra notes'}</span>
                  <button
                    type="button"
                    onClick={() => deleteSplit(split.id)}
                    className="text-[#666666] hover:text-rose-400 transition-colors flex items-center gap-1"
                    title="Delete Split Bill"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Settle / Payment Receipt Modal */}
      {selectedSplitForSettle && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#1C1D21] border border-[#33353A] rounded-3xl w-full max-w-sm p-5 flex flex-col gap-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2B30]">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="material-symbols-outlined text-[20px]">payments</span>
                <span className="font-bold text-[15px]">Confirm Settlement</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSplitForSettle(null)}
                className="text-[#888888] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-[13px] text-[#C5C5CA] leading-snug">
              Mark <strong className="text-white">{selectedSplitForSettle.participant.name}</strong> as paid{' '}
              <strong className="text-emerald-400">
                {formatCurrency(selectedSplitForSettle.participant.amount)}
              </strong>
              ?
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">
                Deposit into Account (UPI / Bank)
              </label>
              <select
                value={targetDepositAccountId}
                onChange={(e) => setTargetDepositAccountId(e.target.value)}
                className="bg-[#141518] border border-[#2B2D33] rounded-xl px-3 py-2 text-[13px] text-white outline-none focus:border-[#D4AF37]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (₹{a.balance.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-[#888888] mt-0.5">
                Automatically logs an incoming credit transaction in your ledger.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSplitForSettle(null)}
                className="flex-1 py-2.5 rounded-full bg-[#24252A] hover:bg-[#2E3037] text-[#A0A0A5] hover:text-white font-bold text-[13px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSettle}
                className="flex-1 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#0F0F0F] font-bold text-[13px] shadow-md transition-all active:scale-95"
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#10B981] text-[#0F0F0F] px-4 py-2.5 rounded-full font-bold text-[13px] shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
