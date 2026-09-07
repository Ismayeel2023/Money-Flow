import React, { useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';

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

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importFromJson(content);
        showToast(res.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto px-4 pt-4 sm:pt-5 pb-32 gap-5">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRestoreFile}
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
              Export, Backup & Reports
            </h1>
            <p className="font-body text-[13px] text-[#888888]">
              Download your ledger to Excel, create full JSON backups, or print reports
            </p>
          </div>
        </div>
      </div>

      {/* Data Stats Summary */}
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

      {/* Export Options */}
      <div className="flex flex-col gap-3">
        <span className="font-body text-[13px] font-bold text-[#888888] tracking-wider uppercase">
          Export & Download
        </span>

        {/* CSV Export */}
        <div className="bg-[#1A1A1A] border border-[#262626] hover:border-[#333333] rounded-2xl p-4 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">table_view</span>
            </div>
            <div>
              <h3 className="font-display text-[15px] font-bold text-[#FFFFFF]">
                Excel / CSV Spreadsheet
              </h3>
              <p className="text-[12px] text-[#888888]">
                Export all transactions with date, category, UPI ref & notes
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] text-[13px] font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>

        {/* JSON Full Backup */}
        <div className="bg-[#1A1A1A] border border-[#262626] hover:border-[#333333] rounded-2xl p-4 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">backup</span>
            </div>
            <div>
              <h3 className="font-display text-[15px] font-bold text-[#FFFFFF]">
                Full JSON Backup
              </h3>
              <p className="text-[12px] text-[#888888]">
                Complete backup including accounts, budgets, goals & subscriptions
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadJson}
            className="px-4 py-2 rounded-full bg-[#262626] hover:bg-[#333333] text-[#FFFFFF] border border-[#3A3A3A] text-[13px] font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            <span>Export JSON</span>
          </button>
        </div>

        {/* Print Financial Summary Report */}
        <div className="bg-[#1A1A1A] border border-[#262626] hover:border-[#333333] rounded-2xl p-4 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">print</span>
            </div>
            <div>
              <h3 className="font-display text-[15px] font-bold text-[#FFFFFF]">
                Print / Save PDF Report
              </h3>
              <p className="text-[12px] text-[#888888]">
                Generate a clean printable statement of your financial summary
              </p>
            </div>
          </div>
          <button
            onClick={handlePrintReport}
            className="px-4 py-2 rounded-full bg-[#262626] hover:bg-[#333333] text-[#FFFFFF] border border-[#3A3A3A] text-[13px] font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px]">picture_as_pdf</span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Restore Section */}
      <div className="flex flex-col gap-3 pt-2">
        <span className="font-body text-[13px] font-bold text-[#888888] tracking-wider uppercase">
          Restore & Migration
        </span>

        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">restore</span>
            </div>
            <div>
              <h3 className="font-display text-[15px] font-bold text-[#FFFFFF]">
                Restore From Backup (.json)
              </h3>
              <p className="text-[12px] text-[#888888]">
                Select a previously saved MoneyFlow JSON backup to restore all records
              </p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-full bg-[#262626] hover:bg-[#333333] text-[#D4AF37] border border-[#D4AF37]/30 text-[13px] font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px]">upload_file</span>
            <span>Select File</span>
          </button>
        </div>
      </div>

      {/* Printable Report Preview (styled for print media) */}
      <div className="print-section bg-[#121212] border border-[#262626] rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div>
            <h2 className="font-display text-[18px] font-bold text-[#FFFFFF]">
              Financial Summary Statement
            </h2>
            <span className="text-[12px] text-[#888888]">
              As on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#888888] block uppercase font-bold">Net Worth</span>
            <span className="font-display text-[18px] font-bold text-[#D4AF37]">
              {formatCurrency(totalBalance)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-[#1A1A1A] p-2.5 rounded-xl border border-[#262626]">
            <span className="text-[11px] text-[#888888] block">Total Income</span>
            <span className="text-[15px] font-bold text-[#10B981]">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="bg-[#1A1A1A] p-2.5 rounded-xl border border-[#262626]">
            <span className="text-[11px] text-[#888888] block">Total Expenses</span>
            <span className="text-[15px] font-bold text-[#FB7185]">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="bg-[#1A1A1A] p-2.5 rounded-xl border border-[#262626]">
            <span className="text-[11px] text-[#888888] block">Net Savings</span>
            <span className="text-[15px] font-bold text-[#FFFFFF]">{formatCurrency(netFlow)}</span>
          </div>
        </div>
      </div>

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
