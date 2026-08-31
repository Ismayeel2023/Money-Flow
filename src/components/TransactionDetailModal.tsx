import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { RuleEngineService } from '../services/ruleEngine';

export const TransactionDetailModal: React.FC = () => {
  const {
    activeTransactionForDetail,
    setActiveTransactionForDetail,
    deleteTransaction,
    updateTransaction,
    categories,
    formatCurrency,
  } = useFinance();

  const [isEditing, setIsEditing] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [rememberDecision, setRememberDecision] = useState(true);
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!activeTransactionForDetail) return null;

  const tx = activeTransactionForDetail;
  const isIncome = tx.type === 'income';
  const isRefund = tx.type === 'refund';
  const isDuplicate = tx.status === 'duplicate' || tx.isDuplicate;
  const isPossibleDuplicate = tx.possibleDuplicate;
  const isReview = tx.status === 'review';

  const handleStartEdit = () => {
    setMerchant(tx.merchant);
    setCategoryId(tx.categoryId);
    setNotes(tx.notes || '');
    setRememberDecision(true);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const cat = categories.find((c) => c.id === categoryId);
    const targetCat = cat || {
      id: tx.categoryId,
      name: tx.categoryName,
      icon: tx.categoryIcon,
      color: tx.categoryColor,
      type: tx.type === 'income' ? 'income' : 'expense',
    };

    const targetMerchant = merchant.trim() || tx.merchant;

    // If remember decision is checked and category or merchant changed, persist automation rule
    if (rememberDecision && targetCat) {
      try {
        RuleEngineService.rememberDecision(
          {
            party: targetMerchant,
            merchant: targetMerchant,
            partyType: tx.partyType || 'merchant',
            type: tx.type,
          },
          targetCat
        );
      } catch (err) {
        console.warn('Failed to save automation rule:', err);
      }
    }

    updateTransaction(tx.id, {
      merchant: targetMerchant,
      categoryId: targetCat.id,
      categoryName: targetCat.name,
      categoryIcon: targetCat.icon,
      categoryColor: targetCat.color,
      notes: notes.trim(),
      status: 'ready', // Marked as resolved
    });

    setActiveTransactionForDetail(null);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteTransaction(tx.id);
    setActiveTransactionForDetail(null);
  };

  const handleCopyUpi = () => {
    if (tx.upiReference) {
      navigator.clipboard.writeText(tx.upiReference);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#262626] relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            setActiveTransactionForDetail(null);
            setIsEditing(false);
          }}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Header with Amount */}
        <div className="flex flex-col items-center text-center gap-1.5 pt-2">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-1 border ${
              isIncome || isRefund
                ? 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30'
                : 'bg-[#FB7185]/20 text-[#FB7185] border-[#FB7185]/30'
            }`}
          >
            <span className="material-symbols-outlined text-[28px]">
              {tx.categoryIcon || (isIncome ? 'payments' : 'receipt')}
            </span>
          </div>

          <h3 className="font-display font-bold text-[28px] text-[#FFFFFF]">
            {isIncome || isRefund ? '+ ' : '- '}
            {formatCurrency(tx.amount)}
          </h3>

          <div className="flex items-center gap-2 flex-wrap justify-center mt-0.5">
            <span
              className={`font-body text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize border ${
                isIncome || isRefund
                  ? 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30'
                  : 'bg-[#FB7185]/20 text-[#FB7185] border-[#FB7185]/30'
              }`}
            >
              {tx.type}
            </span>

            {/* Duplicate status badge */}
            {isDuplicate && (
              <span className="font-body text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/40 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">warning</span>
                <span>Duplicate</span>
              </span>
            )}

            {isPossibleDuplicate && !isDuplicate && (
              <span className="font-body text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">info</span>
                <span>Possible Duplicate</span>
              </span>
            )}

            {isReview && !isDuplicate && !isPossibleDuplicate && (
              <span className="font-body text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">search</span>
                <span>Needs Review</span>
              </span>
            )}

            {tx.refundLinkId && (
              <span className="font-body text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">link</span>
                <span>Refund Linked</span>
              </span>
            )}
          </div>

          {tx.matchReason && (
            <p className="font-body text-[11px] text-[#A0A0A0] bg-[#242424] px-3 py-1 rounded-lg border border-[#333333] mt-1">
              {tx.matchReason}
            </p>
          )}
        </div>

        {/* Details or Edit Form */}
        {isEditing ? (
          <div className="flex flex-col gap-3 my-1">
            <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-1 border border-[#383838]">
              <label className="font-body text-[10px] font-bold text-[#888888] uppercase">
                Merchant / Party
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="bg-transparent font-body text-[14px] font-semibold text-[#FFFFFF] outline-none"
              />
            </div>

            <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-1 border border-[#383838] relative">
              <label className="font-body text-[10px] font-bold text-[#888888] uppercase">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="bg-transparent font-body text-[14px] font-semibold text-[#FFFFFF] outline-none appearance-none pr-6 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#1A1A1A] text-[#E0E0E0]">
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[#888888] text-[18px] pointer-events-none absolute right-3 bottom-3">
                arrow_drop_down
              </span>
            </div>

            <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-1 border border-[#383838]">
              <label className="font-body text-[10px] font-bold text-[#888888] uppercase">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add optional notes"
                className="bg-transparent font-body text-[13px] text-[#FFFFFF] placeholder-[#666666] outline-none"
              />
            </div>

            {/* Remember this decision toggle */}
            <label className="flex items-center gap-2.5 bg-[#222222] p-3 rounded-2xl border border-[#333333] cursor-pointer hover:border-[#D4AF37]/50 transition-colors">
              <input
                type="checkbox"
                checked={rememberDecision}
                onChange={(e) => setRememberDecision(e.target.checked)}
                className="w-4 h-4 rounded text-[#D4AF37] focus:ring-0 accent-[#D4AF37] cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-body text-[12px] font-bold text-[#FFFFFF]">
                  Remember This Decision
                </span>
                <span className="font-body text-[10px] text-[#888888]">
                  Auto-categorize future transactions from "{merchant || tx.merchant}"
                </span>
              </div>
            </label>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-[#262626] hover:bg-[#333333] text-[#E0E0E0] border border-[#383838] py-3 rounded-full font-body text-[14px] font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] py-3 rounded-full font-body text-[14px] font-bold shadow-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 bg-[#262626] rounded-2xl p-4 border border-[#383838] text-[14px]">
            <div className="flex justify-between py-1 border-b border-[#383838]">
              <span className="text-[#888888] font-medium">Merchant / Party</span>
              <span className="font-bold text-[#FFFFFF] text-right">{tx.merchant}</span>
            </div>

            {tx.partyType && tx.partyType !== 'unknown' && (
              <div className="flex justify-between py-1 border-b border-[#383838]">
                <span className="text-[#888888] font-medium">Party Type</span>
                <span className="font-bold text-[#FFFFFF] capitalize">{tx.partyType}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-[#383838]">
              <span className="text-[#888888] font-medium">Category</span>
              <span className="font-bold text-[#FFFFFF]">{tx.categoryName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#383838]">
              <span className="text-[#888888] font-medium">Account</span>
              <span className="font-bold text-[#FFFFFF]">{tx.accountName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#383838]">
              <span className="text-[#888888] font-medium">Date &amp; Time</span>
              <span className="font-bold text-[#FFFFFF]">
                {tx.date} {tx.time ? `• ${tx.time}` : ''}
              </span>
            </div>

            {tx.upiReference && (
              <div className="flex justify-between items-center py-1 border-b border-[#383838]">
                <span className="text-[#888888] font-medium">UPI Reference</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[12px] font-bold text-[#D4AF37]">
                    {tx.upiReference}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="text-[#888888] hover:text-[#FFFFFF] transition-colors p-1"
                    title="Copy UPI Reference"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedUpi ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {tx.rawDescription && (
              <div className="flex flex-col py-1 border-b border-[#383838]">
                <span className="text-[#888888] font-medium text-[12px]">Statement Record</span>
                <span className="font-mono text-[#A0A0A0] text-[11px] mt-0.5 break-all">
                  {tx.rawDescription}
                </span>
              </div>
            )}

            {tx.notes && (
              <div className="flex flex-col py-1">
                <span className="text-[#888888] font-medium">Notes</span>
                <span className="font-medium text-[#FFFFFF] text-[13px] mt-0.5">
                  {tx.notes}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        {!isEditing && (
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={handleStartEdit}
              className="flex-1 bg-[#262626] hover:bg-[#333333] text-[#E0E0E0] border border-[#383838] font-body text-[14px] font-bold py-3 rounded-full flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 bg-[#241A1A] hover:bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 font-body text-[14px] font-bold py-3 rounded-full flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
