import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';
import { SplitService } from '../services/splitService';
import { SplitParticipant } from '../types';

export const SplitBillModal: React.FC = () => {
  const {
    isSplitModalOpen,
    setIsSplitModalOpen,
    activeTransactionForSplit,
    setActiveTransactionForSplit,
    createSplit,
    formatCurrency,
  } = useFinance();

  const [title, setTitle] = useState('');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [participants, setParticipants] = useState<{ id: string; name: string; phone: string; amount: number }[]>([
    { id: 'p-1', name: 'Friend 1', phone: '', amount: 0 },
  ]);
  const [userShare, setUserShare] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Pre-fill from active transaction
  useEffect(() => {
    if (activeTransactionForSplit) {
      setTitle(activeTransactionForSplit.merchant || 'Expense Split');
      setTotalAmountStr(activeTransactionForSplit.amount.toString());
      setNotes(activeTransactionForSplit.notes || '');
      setParticipants([
        { id: 'p-1', name: 'Rahul', phone: '', amount: 0 },
        { id: 'p-2', name: 'Priya', phone: '', amount: 0 },
      ]);
    } else {
      setTitle('');
      setTotalAmountStr('');
      setNotes('');
      setParticipants([{ id: 'p-1', name: 'Friend 1', phone: '', amount: 0 }]);
    }
  }, [activeTransactionForSplit, isSplitModalOpen]);

  const totalAmount = parseFloat(totalAmountStr) || 0;

  // Auto-calculate shares whenever mode or participant count/names change
  useEffect(() => {
    if (splitMode === 'equal' && totalAmount > 0) {
      const names = participants.map((p) => p.name || 'Friend');
      const calculated = SplitService.calculateEqualShares(totalAmount, names);
      setUserShare(calculated.userShare);
      setParticipants((prev) =>
        prev.map((p, idx) => ({
          ...p,
          amount: calculated.participantShares[idx]?.amount || 0,
        }))
      );
    }
  }, [totalAmount, participants.length, splitMode]);

  if (!isSplitModalOpen) return null;

  const handleAddParticipant = () => {
    const newId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setParticipants((prev) => [
      ...prev,
      { id: newId, name: `Friend ${prev.length + 1}`, phone: '', amount: 0 },
    ]);
  };

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 1) return;
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateParticipant = (id: string, updates: Partial<{ name: string; phone: string; amount: number }>) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const totalFriendsShare = participants.reduce((sum, p) => sum + (p.amount || 0), 0);
  const calculatedUserShare = splitMode === 'equal' ? userShare : Math.max(0, totalAmount - totalFriendsShare);

  const handleSave = () => {
    if (!title.trim() || totalAmount <= 0) return;

    const finalParticipants: SplitParticipant[] = participants.map((p) => ({
      id: p.id,
      name: p.name.trim() || 'Friend',
      phone: p.phone.trim(),
      amount: p.amount,
      paid: false,
    }));

    createSplit({
      transactionId: activeTransactionForSplit?.id,
      title: title.trim(),
      totalAmount,
      userShare: calculatedUserShare,
      date: activeTransactionForSplit?.date || new Date().toISOString().split('T')[0],
      categoryName: activeTransactionForSplit?.categoryName || 'Food & Dining',
      categoryIcon: activeTransactionForSplit?.categoryIcon || 'call_split',
      notes: notes.trim(),
      participants: finalParticipants,
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#10B981', '#38BDF8'],
      });
    } catch {}

    setIsSplitModalOpen(false);
    setActiveTransactionForSplit(null);
  };

  const handleClose = () => {
    setIsSplitModalOpen(false);
    setActiveTransactionForSplit(null);
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#1C1D21] border border-[#33353A] rounded-[28px] w-full max-w-md p-5 sm:p-6 flex flex-col shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2B30]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <span className="material-symbols-outlined text-[22px]">call_split</span>
            </div>
            <div>
              <h2 className="font-display text-[18px] font-bold text-white">
                Split Bill with Friends
              </h2>
              <span className="text-[12px] text-[#A0A0A5]">
                {activeTransactionForSplit ? 'Linked to ledger transaction' : 'New standalone split'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#26272D] text-[#888888] hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-4 py-4">
          {/* Bill Title & Total Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">
                Bill / Event Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Swiggy Lunch, Goa Cab"
                className="bg-[#141518] border border-[#2B2D33] rounded-xl px-3 py-2.5 text-[14px] text-white placeholder-[#666666] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">
                Total Amount (INR)
              </label>
              <input
                type="number"
                step="any"
                value={totalAmountStr}
                onChange={(e) => setTotalAmountStr(e.target.value)}
                placeholder="0.00"
                className="bg-[#141518] border border-[#2B2D33] rounded-xl px-3 py-2.5 text-[14px] font-mono text-white placeholder-[#666666] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Split Mode Selector */}
          <div className="flex bg-[#141518] p-1 rounded-2xl border border-[#2B2D33]">
            <button
              type="button"
              onClick={() => setSplitMode('equal')}
              className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                splitMode === 'equal'
                  ? 'bg-[#D4AF37] text-[#0F0F0F] shadow-sm'
                  : 'text-[#A0A0A5] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">balance</span>
              <span>Split Equally</span>
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('custom')}
              className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                splitMode === 'custom'
                  ? 'bg-[#D4AF37] text-[#0F0F0F] shadow-sm'
                  : 'text-[#A0A0A5] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Custom Amounts</span>
            </button>
          </div>

          {/* Friends / Participants List */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#888888]">
                Friends ({participants.length})
              </span>
              <button
                type="button"
                onClick={handleAddParticipant}
                className="text-[12px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Add Friend</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {participants.map((p, idx) => (
                <div
                  key={p.id}
                  className="bg-[#141518] p-3 rounded-2xl border border-[#2B2D33] flex items-center gap-2"
                >
                  <div className="w-7 h-7 rounded-full bg-[#24262C] text-[#A0A0A5] flex items-center justify-center text-[11px] font-bold">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleUpdateParticipant(p.id, { name: e.target.value })}
                    placeholder="Friend's Name"
                    className="flex-1 bg-transparent text-[13px] text-white placeholder-[#666666] outline-none min-w-0"
                  />
                  <input
                    type="tel"
                    value={p.phone}
                    onChange={(e) => handleUpdateParticipant(p.id, { phone: e.target.value })}
                    placeholder="Phone (WhatsApp)"
                    className="w-28 sm:w-32 bg-[#1E2025] px-2 py-1 rounded-lg text-[11px] text-[#D0D0D5] placeholder-[#666666] outline-none"
                  />
                  <div className="flex items-center gap-1 bg-[#1E2025] px-2 py-1 rounded-lg border border-[#33353A]">
                    <span className="text-[12px] text-[#888888]">₹</span>
                    <input
                      type="number"
                      step="any"
                      disabled={splitMode === 'equal'}
                      value={p.amount || ''}
                      onChange={(e) =>
                        handleUpdateParticipant(p.id, { amount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                      className="w-16 bg-transparent text-[13px] font-mono text-white text-right outline-none disabled:opacity-80"
                    />
                  </div>
                  {participants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="text-[#666666] hover:text-rose-400 p-1 transition-colors"
                      title="Remove"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Summary Card */}
          <div className="bg-[#121316] border border-[#2A2B30] rounded-2xl p-4 flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between items-center text-[#A0A0A5]">
              <span>Total Bill</span>
              <span className="font-mono font-bold text-white">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-[#A0A0A5]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                Your Share (Logged in Expense)
              </span>
              <span className="font-mono font-bold text-[#D4AF37]">
                {formatCurrency(calculatedUserShare)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#A0A0A5] pt-1 border-t border-[#222328]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Friends Owe You (Pending IOUs)
              </span>
              <span className="font-mono font-extrabold text-emerald-400">
                {formatCurrency(totalFriendsShare)}
              </span>
            </div>
          </div>

          {/* Optional Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">
              Notes / Location
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via Kotak UPI at Central Cafe"
              className="bg-[#141518] border border-[#2B2D33] rounded-xl px-3 py-2 text-[13px] text-white placeholder-[#666666] outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#2A2B30]">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded-full bg-[#24252A] hover:bg-[#2E3037] text-[#A0A0A5] hover:text-white font-bold text-[14px] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || totalAmount <= 0}
            className="flex-2 py-3 px-6 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-bold text-[14px] shadow-[0_4px_16px_rgba(212,175,55,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            <span>Save &amp; Track Split</span>
          </button>
        </div>
      </div>
    </div>
  );
};
