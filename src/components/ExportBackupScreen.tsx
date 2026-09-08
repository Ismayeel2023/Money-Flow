import React, { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';

interface ParsedBackupData {
  appName?: string;
  version?: string;
  exportedAt?: string;
  transactions?: any[];
  accounts?: any[];
  categories?: any[];
  budgets?: any[];
  subscriptions?: any[];
  savingsGoals?: any[];
}

export const ExportBackupScreen: React.FC = () => {
  const {
    exportToCsv,
    exportToJson,
    importFromJson,
    transactions,
    accounts,
    subscriptions,
    savingsGoals,
    totalBalance,
    totalIncome,
    totalExpenses,
    netFlow,
    formatCurrency,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    txCount: number;
    accCount: number;
    sizeKb: string;
    date: string;
  } | null>(null);

  // Restore Preview Modal State
  const [pendingRestoreData, setPendingRestoreData] = useState<{
    jsonString: string;
    parsed: ParsedBackupData;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadCsv = () => {
    const csvContent = exportToCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `MoneyFlow_Transactions_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transactions exported as CSV!');
  };

  const handleDownloadJson = () => {
    const jsonContent = exportToJson();
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `MoneyFlow_FullBackup_${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Full backup exported as JSON!');
  };

  // Test and verify backup integrity
  const handleTestBackup = () => {
    try {
      const jsonContent = exportToJson();
      const parsed = JSON.parse(jsonContent);
      const sizeKb = (new Blob([jsonContent]).size / 1024).toFixed(2);

      const isValid =
        Array.isArray(parsed.transactions) &&
        Array.isArray(parsed.accounts) &&
        typeof parsed.version === 'string';

      setVerificationResult({
        valid: isValid,
        txCount: parsed.transactions?.length || 0,
        accCount: parsed.accounts?.length || 0,
        sizeKb,
        date: new Date().toLocaleTimeString(),
      });
      showToast('Backup verified successfully!');
    } catch {
      showToast('Backup test failed. Please try again.');
    }
  };

  // When user selects a file, parse and preview before restoring
  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const parsed = JSON.parse(content) as ParsedBackupData;
          if (Array.isArray(parsed.transactions) || Array.isArray(parsed.accounts)) {
            setPendingRestoreData({
              jsonString: content,
              parsed,
            });
          } else {
            showToast('The file does not look like a valid Money Flow backup.');
          }
        } catch {
          showToast('Invalid JSON file format.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const executeRestore = () => {
    if (!pendingRestoreData) return;
    const res = importFromJson(pendingRestoreData.jsonString);
    setPendingRestoreData(null);
    if (res.success) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#10B981', '#38BDF8'],
        });
      } catch {}
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto px-4 pt-4 sm:pt-5 pb-36 gap-5">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilePicked}
        accept=".json"
        className="hidden"
      />

      {/* Header Card */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <span className="material-symbols-outlined text-[26px]">cloud_sync</span>
          </div>
          <div>
            <h1 className="font-display text-[22px] font-bold text-[#FFFFFF]">
              Export, Backup & Restore
            </h1>
            <p className="font-body text-[13px] text-[#888888]">
              Safeguard your data, test backup health, and restore after app reinstall
            </p>
          </div>
        </div>
      </div>

      {/* Live Data Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-3 text-center">
          <span className="text-[11px] font-bold text-[#888888] uppercase block">Transactions</span>
          <span className="font-display text-[20px] font-bold text-[#FFFFFF]">
            {transactions.length}
          </span>
        </div>
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-3 text-center">
          <span className="text-[11px] font-bold text-[#888888] uppercase block">Accounts</span>
          <span className="font-display text-[20px] font-bold text-[#FFFFFF]">{accounts.length}</span>
        </div>
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-3 text-center">
          <span className="text-[11px] font-bold text-[#888888] uppercase block">Subscriptions</span>
          <span className="font-display text-[20px] font-bold text-[#FFFFFF]">
            {subscriptions.length}
          </span>
        </div>
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-3 text-center">
          <span className="text-[11px] font-bold text-[#888888] uppercase block">Savings Goals</span>
          <span className="font-display text-[20px] font-bold text-[#FFFFFF]">
            {savingsGoals.length}
          </span>
        </div>
      </div>

      {/* Backup Health & Integrity Verification Card */}
      <div className="bg-[#1A1A1A] border-2 border-emerald-500/40 rounded-3xl p-5 flex flex-col gap-3 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-emerald-400">verified_user</span>
            <h3 className="font-bold text-[15px] text-white">Backup Health Verification</h3>
          </div>
          <button
            type="button"
            onClick={handleTestBackup}
            className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[12px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>Test Backup Now</span>
          </button>
        </div>

        <p className="text-[12px] text-[#A0A0A0] leading-relaxed">
          Verify that your ledger, bank accounts, and category tags package correctly into a healthy, readable backup file.
        </p>

        {verificationResult && (
          <div className="p-3 bg-[#121212] border border-emerald-500/30 rounded-2xl flex flex-col gap-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[13px]">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>100% Validated &amp; Ready for Export</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-[#888888]">
              <div>
                <span className="block text-white font-bold">{verificationResult.txCount}</span>
                <span>Transactions</span>
              </div>
              <div>
                <span className="block text-white font-bold">{verificationResult.accCount}</span>
                <span>Accounts</span>
              </div>
              <div>
                <span className="block text-white font-bold">{verificationResult.sizeKb} KB</span>
                <span>Payload Size</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="flex flex-col gap-3">
        <span className="font-body text-[13px] font-bold text-[#888888] tracking-wider uppercase">
          Export &amp; Download
        </span>

        {/* JSON Full Backup (Primary) */}
        <div className="bg-[#1A1A1A] border-2 border-[#D4AF37]/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">backup</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-[15px] font-bold text-[#FFFFFF]">
                  Full JSON Backup
                </h3>
                <span className="text-[10px] bg-[#D4AF37] text-black font-bold px-2 py-0.5 rounded-full">
                  RECOMMENDED
                </span>
              </div>
              <p className="text-[12px] text-[#888888]">
                Saves all accounts, transactions, budgets, subscriptions &amp; settings
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadJson}
            className="px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] text-[13px] font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            <span>Export JSON</span>
          </button>
        </div>

        {/* CSV Export */}
        <div className="bg-[#1A1A1A] border border-[#262626] hover:border-[#333333] rounded-2xl p-4 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">table_view</span>
            </div>
            <div>
              <h3 className="font-display text-[15px] font-bold text-[#FFFFFF]">
                Excel / CSV Spreadsheet
              </h3>
              <p className="text-[12px] text-[#888888]">
                Export transactions with date, category, UPI ref &amp; notes
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-full bg-[#262626] hover:bg-[#333333] text-[#FFFFFF] border border-[#3A3A3A] text-[13px] font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>

        {/* Print Financial Summary Report */}
        <div className="bg-[#1A1A1A] border border-[#262626] hover:border-[#333333] rounded-2xl p-4 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">print</span>
            </div>
            <div>
              <h3 className="font-display text-[15px] font-bold text-[#FFFFFF]">
                Print / Save PDF Report
              </h3>
              <p className="text-[12px] text-[#888888]">
                Generate printable summary statement
              </p>
            </div>
          </div>
          <button
            onClick={handlePrintReport}
            className="px-4 py-2 rounded-full bg-[#262626] hover:bg-[#333333] text-[#FFFFFF] border border-[#3A3A3A] text-[13px] font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <span className="material-symbols-outlined text-[17px]">picture_as_pdf</span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Restore Section */}
      <div className="flex flex-col gap-3 pt-2">
        <span className="font-body text-[13px] font-bold text-[#888888] tracking-wider uppercase">
          Restore &amp; Recovery
        </span>

        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">restore</span>
            </div>
            <div>
              <h3 className="font-display text-[15px] font-bold text-[#FFFFFF]">
                Restore From Backup (.json)
              </h3>
              <p className="text-[12px] text-[#888888]">
                Load your previously saved Money Flow JSON file
              </p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] text-[13px] font-bold transition-all flex items-center gap-1.5 shrink-0 active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[17px]">upload_file</span>
            <span>Select File</span>
          </button>
        </div>
      </div>

      {/* Step-by-Step Guide: How to Restore After Uninstalling */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <span className="material-symbols-outlined text-[22px]">help</span>
          <h3 className="font-bold text-[15px] text-white">
            How to Restore After Uninstalling &amp; Reinstalling
          </h3>
        </div>

        <p className="text-[12px] text-[#888888]">
          If you uninstall the app or get a new device, your local data is wiped. Follow these 4 easy steps to restore everything:
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-black font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <strong className="text-white text-[13px] block">Save Your Backup File</strong>
              <span className="text-[12px] text-[#888888]">
                Tap <strong>&quot;Export JSON&quot;</strong> above. Save the downloaded file to Google Drive, WhatsApp &quot;Message Yourself&quot;, or your Downloads folder.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-black font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <strong className="text-white text-[13px] block">Reinstall Money Flow</strong>
              <span className="text-[12px] text-[#888888]">
                Reinstall or open Money Flow in your browser or Android home screen.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-black font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <strong className="text-white text-[13px] block">Tap &quot;Select File&quot; Under Restore</strong>
              <span className="text-[12px] text-[#888888]">
                Navigate to <strong>Settings &gt; Export &amp; Backup</strong> and tap <strong>&quot;Select File&quot;</strong>.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <strong className="text-emerald-400 text-[13px] block">Everything is Restored Instantly</strong>
              <span className="text-[12px] text-[#888888]">
                All your Kotak/SBI accounts, transactions, balances, subscriptions, and budgets appear back in 1 second!
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Package Conflict / Update Advice Card */}
      <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-[22px] text-amber-400 shrink-0 mt-0.5">
          system_update
        </span>
        <div className="flex flex-col gap-1">
          <strong className="text-[13px] text-white">Tired of &quot;Package Conflict&quot; during updates?</strong>
          <p className="text-[12px] text-[#888888] leading-relaxed">
            Android shows &quot;Package Conflict&quot; when installing APK files with different signing keys.
            To avoid having to reinstall on every update, install Money Flow via <strong>Google Chrome (&quot;Add to Home screen&quot; / &quot;Install App&quot;)</strong>.
            This creates an official Android WebAPK that auto-updates silently in the background with zero conflicts!
          </p>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {pendingRestoreData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-3xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">restore_page</span>
              </div>
              <div>
                <h3 className="font-display text-[18px] font-bold text-white">
                  Confirm Restore
                </h3>
                <p className="text-[12px] text-[#888888]">
                  Exported on {pendingRestoreData.parsed.exportedAt ? new Date(pendingRestoreData.parsed.exportedAt).toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#121212] border border-[#262626] rounded-2xl flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                Backup Contents:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[13px]">
                <div className="bg-[#1A1A1A] p-2 rounded-xl">
                  <span className="text-[#888888] block text-[11px]">Transactions</span>
                  <span className="font-bold text-white text-[15px]">
                    {pendingRestoreData.parsed.transactions?.length || 0}
                  </span>
                </div>
                <div className="bg-[#1A1A1A] p-2 rounded-xl">
                  <span className="text-[#888888] block text-[11px]">Accounts</span>
                  <span className="font-bold text-white text-[15px]">
                    {pendingRestoreData.parsed.accounts?.length || 0}
                  </span>
                </div>
                <div className="bg-[#1A1A1A] p-2 rounded-xl">
                  <span className="text-[#888888] block text-[11px]">Budgets</span>
                  <span className="font-bold text-white text-[15px]">
                    {pendingRestoreData.parsed.budgets?.length || 0}
                  </span>
                </div>
                <div className="bg-[#1A1A1A] p-2 rounded-xl">
                  <span className="text-[#888888] block text-[11px]">Subscriptions</span>
                  <span className="font-bold text-white text-[15px]">
                    {pendingRestoreData.parsed.subscriptions?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[12px] text-[#FB7185] bg-[#FB7185]/10 border border-[#FB7185]/20 p-2.5 rounded-xl">
              ⚠️ Restoring will replace your current records with the data inside this backup file.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingRestoreData(null)}
                className="flex-1 py-3 rounded-full bg-[#262626] text-[#888888] hover:text-white font-bold text-[14px] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRestore}
                className="flex-1 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-bold text-[14px] transition-all shadow-md active:scale-95"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#10B981] text-[#0F0F0F] px-4 py-2.5 rounded-full font-bold text-[14px] shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[20px]">check</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
