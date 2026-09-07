import React from 'react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';
import { CustomDropdown } from './CustomDropdown';

export const ImportReviewModal: React.FC = () => {
  const {
    importSummary,
    categories,
    formatCurrency,
    acceptImportTransaction,
    rejectImportTransaction,
    updateImportTransactionCategory,
    confirmAllImportTransactions,
    setTab,
  } = useFinance();

  const handleConfirm = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#3525cd', '#6cf8bb', '#006c49'],
      });
    } catch {
      // Confetti fallback
    }
    confirmAllImportTransactions();
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-4 sm:pt-5 pb-36 gap-5">
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
          Select categories, resolve possible duplicates, or skip items before adding to your ledger.
        </p>
      </div>

      {/* Transaction Review Items */}
      <div className="flex flex-col gap-3.5">
        {importSummary.transactions.map((tx) => {
          const isDup = tx.status === 'duplicate' || tx.isDuplicate;
          const isReview = tx.status === 'review';
          const isSkipped = tx.status === 'skipped';

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
                <div className="flex-1 pr-3">
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
                  <p className="font-body text-[12px] text-[#888888] mt-1">
                    {tx.date} • {tx.accountName}
                  </p>
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
