import React from 'react';
import { useFinance } from '../context/FinanceContext';

export const ImportStatementScreen: React.FC = () => {
  const { importSummary, setTab, processStatementUpload } = useFinance();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processStatementUpload(file);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-1 pb-32 gap-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.pdf,.txt,.xlsx"
        className="hidden"
      />

      {/* Hero / Summary Card */}
      <div className="relative bg-[#1A1A1A] rounded-3xl overflow-hidden shadow-sm flex flex-col items-center justify-center py-8 px-6 text-center mt-1 border border-[#262626]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent opacity-60 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-2 w-full">
          <div className="w-20 h-20 rounded-full bg-[#D4AF37] text-[#0F0F0F] flex items-center justify-center mb-2 shadow-[0_4px_24px_rgba(212,175,55,0.3)]">
            <span className="material-symbols-outlined text-[40px] material-symbols-fill">
              {importSummary.totalFound > 0 ? 'cloud_done' : 'upload_file'}
            </span>
          </div>
          <h1 className="font-display text-[26px] sm:text-[28px] font-bold text-[#FFFFFF]">
            {importSummary.totalFound > 0 ? 'Statement Processed' : 'Import Statement'}
          </h1>
          <p className="font-body text-[14px] text-[#888888] max-w-[280px]">
            {importSummary.totalFound > 0
              ? `Found ${importSummary.totalFound} transactions from ${importSummary.fileName}.`
              : 'Upload your bank or UPI PDF / CSV statement to auto-import transactions.'}
          </p>
        </div>
      </div>

      {importSummary.totalFound === 0 ? (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] rounded-full py-4 font-body text-[16px] font-bold shadow-[0_8px_24px_rgba(212,175,55,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px] font-bold">file_upload</span>
            <span>Choose Statement File</span>
          </button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3.5 w-full">
            {/* Total Found */}
            <div className="bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-[#262626] flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#D4AF37]">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                <span className="font-body text-[11px] font-bold tracking-wider">Total Found</span>
              </div>
              <div className="font-display text-[32px] sm:text-[36px] font-bold text-[#FFFFFF]">
                {importSummary.totalFound}
              </div>
            </div>

            {/* Auto-Categorized */}
            <div className="bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-[#262626] flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#34D399]">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                <span className="font-body text-[11px] font-bold tracking-wider">Auto-Categorized</span>
              </div>
              <div className="font-display text-[32px] sm:text-[36px] font-bold text-[#FFFFFF]">
                {importSummary.autoCategorized}
              </div>
            </div>

            {/* Needs Review */}
            <div className="bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-[#262626] flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#FB7185]">
                <span className="material-symbols-outlined text-[20px]">rule</span>
                <span className="font-body text-[11px] font-bold tracking-wider">Needs Review</span>
              </div>
              <div className="font-display text-[32px] sm:text-[36px] font-bold text-[#FFFFFF]">
                {importSummary.needsReview}
              </div>
            </div>

            {/* Duplicates */}
            <div className="bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-[#262626] flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#888888]">
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                <span className="font-body text-[11px] font-bold tracking-wider">Duplicates</span>
              </div>
              <div className="font-display text-[32px] sm:text-[36px] font-bold text-[#FFFFFF]">
                {importSummary.duplicates}
              </div>
            </div>
          </div>

          {/* Alert / Notice if duplicates or review exist */}
          {importSummary.needsReview > 0 && (
            <div className="bg-[#241A1A] rounded-2xl p-4 flex gap-3 items-start shadow-sm border border-[#FB7185]/30">
              <span className="material-symbols-outlined text-[24px] text-[#FB7185] mt-0.5 shrink-0">
                warning
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-body text-[15px] font-bold text-[#FFFFFF]">
                  {importSummary.needsReview} Items Need Review
                </span>
                <span className="font-body text-[13px] text-[#888888] leading-relaxed">
                  We found transactions that require category verification or duplicate confirmation.
                </span>
              </div>
            </div>
          )}

          {/* Status Legend */}
          <div className="flex flex-col gap-2.5 pt-1">
            <h2 className="font-display text-[20px] font-bold text-[#E0E0E0] mb-1">
              Status Overview
            </h2>

            {/* New */}
            <div className="bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">New</span>
              </div>
              <span className="font-body text-[12px] font-bold text-[#34D399] tracking-wider">
                READY
              </span>
            </div>

            {/* Already Imported */}
            <div className="bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-[#262626] flex items-center justify-between opacity-75">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#888888]" />
                <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">
                  Already Imported
                </span>
              </div>
              <span className="font-body text-[12px] font-bold text-[#888888] tracking-wider">
                SKIPPED
              </span>
            </div>

            {/* Possible Duplicate */}
            <div className="bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#FB7185]" />
                <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">
                  Possible Duplicate
                </span>
              </div>
              <span className="font-body text-[12px] font-bold text-[#FB7185] tracking-wider">
                ACTION REQUIRED
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-3">
            <button
              id="btn-review-transactions"
              onClick={() => setTab('import-review')}
              className="w-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] rounded-full py-4 font-body text-[16px] font-bold shadow-[0_8px_24px_rgba(212,175,55,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Review Transactions ({importSummary.transactions.length})</span>
              <span className="material-symbols-outlined text-[20px] font-bold">arrow_forward</span>
            </button>

            <button
              id="btn-cancel-import"
              onClick={() => setTab('settings')}
              className="w-full bg-transparent text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-full py-4 font-body text-[15px] font-bold border border-[#D4AF37]/30 active:scale-[0.98] transition-all"
            >
              Cancel Import
            </button>
          </div>
        </>
      )}
    </div>
  );
};
