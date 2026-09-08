import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';
import { CustomDropdown } from './CustomDropdown';

export const ImportReviewModal: React.FC = () => {
  const {
    importSummary,
    accounts,
    switchImportDestinationAccount,
    updateImportTransactionAccount,
    categories,
    formatCurrency,
    acceptImportTransaction,
    rejectImportTransaction,
    updateImportTransactionCategory,
    confirmAllImportTransactions,
    setTab,
  } = useFinance();

  const [showGlobalAccountModal, setShowGlobalAccountModal] = useState<boolean>(false);
  const [activeEditingTxId, setActiveEditingTxId] = useState<string | null>(null);

  // Derive active destination account
  const currentAssignedAccountId =
    importSummary.transactions[0]?.accountId || accounts[0]?.id;
  const currentAssignedAccount =
    accounts.find((a) => a.id === currentAssignedAccountId) || accounts[0];

  const handleConfirm = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#6cf8bb', '#006c49'],
      });
    } catch {
      // Confetti fallback
    }
    confirmAllImportTransactions();
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-4 sm:pt-5 pb-36 gap-4">
      {/* Header Info */}
      <div className="bg-[#1A1A1A] rounded-3xl p-5 border border-[#262626] shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-[18px] font-bold text-[#FFFFFF]">
            Review &amp; Categorize
          </h2>
          <span className="font-body text-[12px] font-bold text-[#D4AF37] bg-[#D4AF37]/15 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
            {importSummary.transactions.length} items
          </span>
        </div>
        <p className="font-body text-[13px] text-[#888888]">
          Select categories, resolve possible duplicates, or verify the destination account.
        </p>
      </div>

      {/* Global Destination Account Selector Banner */}
      <div className="bg-[#1A1A1A] border-2 border-[#D4AF37]/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${currentAssignedAccount?.color || '#D4AF37'}20`,
              color: currentAssignedAccount?.color || '#D4AF37',
            }}
          >
            <span className="material-symbols-outlined text-[20px]">
              {currentAssignedAccount?.icon || 'account_balance'}
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block">
              Destination Account
            </span>
            <h4 className="font-bold text-[14px] text-[#FFFFFF] truncate">
              {currentAssignedAccount?.name || 'Bank Account'}
            </h4>
            <span className="text-[11px] text-[#888888] block truncate">
              {currentAssignedAccount?.accountNumber
                ? `A/C •••• ${currentAssignedAccount.accountNumber.slice(-4)}`
                : formatCurrency(currentAssignedAccount?.balance || 0)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGlobalAccountModal(true)}
          className="px-3 py-1.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] text-[12px] font-bold shrink-0 flex items-center gap-1 transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
          <span>Switch All</span>
        </button>
      </div>

      {/* Global Account Switcher Modal */}
      {showGlobalAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-3xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div>
                <h3 className="font-display text-[18px] font-bold text-white">
                  Switch Target Account
                </h3>
                <p className="text-[12px] text-[#888888]">
                  Re-assign all {importSummary.transactions.length} transactions to:
                </p>
              </div>
              <button
                onClick={() => setShowGlobalAccountModal(false)}
                className="w-8 h-8 rounded-full bg-[#262626] text-[#888888] hover:text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {accounts.map((acc) => {
                const isSelected = acc.id === currentAssignedAccountId;
                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      switchImportDestinationAccount(acc.id);
                      setShowGlobalAccountModal(false);
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-sm'
                        : 'bg-[#141414] border-[#262626] hover:border-[#3A3A3A] text-[#B0B0B0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${acc.color || '#D4AF37'}20`,
                          color: acc.color || '#D4AF37',
                        }}
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {acc.icon || 'account_balance'}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-[14px] text-white block">
                          {acc.name}
                        </span>
                        <span className="text-[12px] text-[#888888]">
                          {acc.accountNumber ? `A/C •••• ${acc.accountNumber.slice(-4)} • ` : ''}
                          {formatCurrency(acc.balance)}
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="material-symbols-outlined text-[#D4AF37] text-[22px]">
                        check_circle
                      </span>
                    ) : (
                      <span className="text-[12px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
                        Assign All
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowGlobalAccountModal(false)}
              className="w-full py-3 rounded-full bg-[#262626] text-white font-bold text-[14px] hover:bg-[#333333] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Transaction Review Items */}
      <div className="flex flex-col gap-3.5">
        {importSummary.transactions.map((tx) => {
          const isDup = tx.status === 'duplicate' || tx.isDuplicate;
          const isReview = tx.status === 'review';
          const isSkipped = tx.status === 'skipped';
          const txAccount = accounts.find((a) => a.id === tx.accountId) || currentAssignedAccount;

          // Strictly filter categories based on transaction type
          // Expense -> expense or both; Income -> income or both
          const filteredCategories = categories.filter((c) => {
            if (tx.type === 'income') {
              return c.type === 'income' || c.type === 'both';
            }
            return c.type === 'expense' || c.type === 'both';
          });

          return (
            <div
              key={tx.id}
              className={`bg-[#1A1A1A] rounded-3xl p-4 sm:p-5 border transition-all ${
                isSkipped
                  ? 'opacity-40 border-[#262626]'
                  : isDup
                  ? 'border-[#FB7185]/50 shadow-[0_2px_12px_rgba(251,113,133,0.1)]'
                  : isReview
                  ? 'border-[#D4AF37]/50 shadow-[0_2px_12px_rgba(212,175,55,0.1)]'
                  : 'border-[#262626] shadow-sm'
              }`}
            >
              {/* Header inside card */}
              <div className="flex justify-between items-start mb-2.5">
                <div className="flex-1 pr-3 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        tx.type === 'income'
                          ? 'bg-[#10B981]/15 text-[#34D399]'
                          : tx.type === 'refund'
                          ? 'bg-[#38BDF8]/15 text-[#38BDF8]'
                          : 'bg-[#FB7185]/15 text-[#FB7185]'
                      }`}
                    >
                      {tx.type}
                    </span>
                    <h4 className="font-body text-[15px] font-bold text-[#FFFFFF] leading-snug break-words">
                      {tx.merchant}
                    </h4>
                  </div>

                  {/* Account Tag with Quick Switcher */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[12px] text-[#888888]">
                      {tx.date}
                    </span>
                    <span className="text-[12px] text-[#444444]">•</span>
                    <button
                      type="button"
                      onClick={() => setActiveEditingTxId(activeEditingTxId === tx.id ? null : tx.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 px-2 py-0.5 rounded-full border border-[#D4AF37]/30 transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px]">account_balance</span>
                      <span className="truncate max-w-[120px]">{txAccount.name}</span>
                      <span className="material-symbols-outlined text-[12px]">expand_more</span>
                    </button>
                  </div>

                  {/* Inline Account Switcher for this specific transaction */}
                  {activeEditingTxId === tx.id && (
                    <div className="mt-2 p-2.5 bg-[#121212] border border-[#333333] rounded-xl flex flex-col gap-1.5 animate-in fade-in">
                      <span className="text-[10px] font-bold uppercase text-[#888888]">
                        Assign this item to account:
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        {accounts.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => {
                              updateImportTransactionAccount(tx.id, acc.id);
                              setActiveEditingTxId(null);
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-bold text-left truncate flex items-center gap-1 ${
                              acc.id === txAccount.id
                                ? 'bg-[#D4AF37] text-black'
                                : 'bg-[#222222] text-[#B0B0B0] hover:text-white'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">account_balance</span>
                            <span className="truncate">{acc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preserved Full Raw Description */}
                  {tx.rawDescription && tx.rawDescription !== tx.merchant && (
                    <div className="mt-1.5 p-2 rounded-xl bg-[#141414] border border-[#262626] text-[11px] font-mono text-[#A0A0A0] break-words leading-relaxed select-text">
                      <span className="text-[#888888] font-bold mr-1">RAW:</span>
                      {tx.rawDescription}
                    </div>
                  )}
                </div>

                <span
                  className={`font-display text-[16px] sm:text-[18px] font-bold shrink-0 ${
                    tx.type === 'income' ? 'text-[#34D399]' : 'text-[#FFFFFF]'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </span>
              </div>

              {/* Duplicate/Review warning notice if applicable */}
              {isDup && (
                <div className="bg-[#241A1A] border border-[#FB7185]/30 p-2.5 rounded-xl flex items-start gap-2 mb-3">
                  <span className="material-symbols-outlined text-[18px] text-[#FB7185] shrink-0 mt-0.5">
                    warning
                  </span>
                  <p className="font-body text-[12px] text-[#FB7185]">
                    {tx.matchReason || 'Possible duplicate match with existing transaction.'}
                  </p>
                </div>
              )}

              {isReview && !isDup && (
                <div className="bg-[#222018] border border-[#D4AF37]/30 p-2.5 rounded-xl flex items-start gap-2 mb-3">
                  <span className="material-symbols-outlined text-[18px] text-[#D4AF37] shrink-0 mt-0.5">
                    info
                  </span>
                  <p className="font-body text-[12px] text-[#D4AF37]">
                    {tx.matchReason || 'Needs quick category confirmation.'}
                  </p>
                </div>
              )}

              {/* Category Picker & Actions */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 min-w-0">
                  <CustomDropdown
                    id={`import-cat-dropdown-${tx.id}`}
                    value={tx.categoryId}
                    onChange={(newCatId) =>
                      updateImportTransactionCategory(tx.id, newCatId)
                    }
                    disabled={isSkipped}
                    options={filteredCategories.map((c) => ({
                      id: c.id,
                      label: c.name,
                      icon: c.icon,
                      color: c.color,
                      sublabel: c.type === 'both' ? 'Flexible' : `${c.type}`,
                    }))}
                    placeholder="Select category"
                    className="w-full"
                  />
                </div>

                {isSkipped ? (
                  <button
                    type="button"
                    onClick={() => acceptImportTransaction(tx.id)}
                    className="bg-[#262626] hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#383838] px-3 py-2 rounded-xl text-[12px] font-bold transition-colors"
                  >
                    Include
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => acceptImportTransaction(tx.id)}
                      title="Confirm item"
                      className="w-9 h-9 bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#10B981]/30 text-[#34D399] rounded-xl flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectImportTransaction(tx.id)}
                      title="Skip item"
                      className="w-9 h-9 bg-[#262626] hover:bg-[#FB7185]/20 text-[#888888] hover:text-[#FB7185] border border-[#383838] rounded-xl flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[calc(16px+env(safe-area-inset-bottom))] bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/95 to-transparent pt-8">
        <div className="max-w-md mx-auto flex gap-3">
          <button
            type="button"
            onClick={() => setTab('import-statement')}
            className="flex-1 bg-[#262626] hover:bg-[#333333] text-[#E0E0E0] border border-[#383838] font-body text-[14px] font-bold rounded-full py-4 transition-all"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-display text-[15px] font-bold rounded-full py-4 shadow-[0_8px_24px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>Import to Ledger</span>
            <span className="material-symbols-outlined text-[20px] font-bold">task_alt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
