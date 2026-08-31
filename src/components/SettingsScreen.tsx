import React, { useRef } from 'react';
import { useFinance } from '../context/FinanceContext';

export const SettingsScreen: React.FC = () => {
  const {
    setTab,
    processStatementUpload,
    setIsProfileModalOpen,
    resetToDemoData,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processStatementUpload(file);
    }
  };

  const handleDemoImport = () => {
    processStatementUpload(null, 'hdfc');
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-1 pb-32 gap-5">
      {/* Hidden file input for statement upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.pdf,.txt,.xlsx"
        className="hidden"
      />

      {/* Profile & Quick Action */}
      <section className="flex flex-col gap-3.5">
        <div
          id="btn-account-settings"
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-3.5 bg-[#1A1A1A] rounded-3xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-[#262626] hover:border-[#D4AF37]/40 hover:bg-[#222222] transition-all cursor-pointer active:scale-[0.99]"
        >
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px] material-symbols-fill">
              manage_accounts
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="font-display text-[18px] sm:text-[20px] font-bold text-[#FFFFFF] truncate">
              Account Settings
            </h2>
            <p className="font-body text-[13px] text-[#888888] truncate">
              Manage preferences &amp; security
            </p>
          </div>
          <span className="material-symbols-outlined text-[#888888] text-[20px]">
            chevron_right
          </span>
        </div>

        {/* Import Statement Primary Button */}
        <button
          id="btn-import-statement"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] py-3.5 px-6 rounded-full shadow-[0_8px_20px_rgba(212,175,55,0.25)] font-bold transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px] font-bold">upload_file</span>
          <span className="font-body text-[15px]">Import Statement (PDF / CSV)</span>
        </button>
      </section>

      {/* Data Management Section */}
      <section className="flex flex-col gap-1.5">
        <h3 className="font-body text-[11px] font-bold text-[#888888] px-2 pt-1 uppercase tracking-wider">
          Data &amp; Organization
        </h3>
        <div className="bg-[#1A1A1A] rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#262626] flex flex-col overflow-hidden">
          {/* Accounts */}
          <button
            id="settings-item-accounts"
            onClick={() => setTab('accounts')}
            className="flex items-center justify-between p-4 hover:bg-[#222222] active:bg-[#262626] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] material-symbols-fill">
                  account_balance
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">
                  Accounts
                </span>
                <span className="font-body text-[12px] text-[#888888]">
                  Banks, credit cards &amp; cash
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#888888] group-active:translate-x-1 transition-transform">
              chevron_right
            </span>
          </button>

          <div className="h-[1px] w-full bg-[#262626] ml-16" />

          {/* Categories */}
          <button
            id="settings-item-categories"
            onClick={() => setTab('categories')}
            className="flex items-center justify-between p-4 hover:bg-[#222222] active:bg-[#262626] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#10B981]/15 text-[#34D399] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] material-symbols-fill">
                  category
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">
                  Categories
                </span>
                <span className="font-body text-[12px] text-[#888888]">
                  Manage expense &amp; income tags
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#888888] group-active:translate-x-1 transition-transform">
              chevron_right
            </span>
          </button>

          <div className="h-[1px] w-full bg-[#262626] ml-16" />

          {/* Budgets */}
          <button
            id="settings-item-budgets"
            onClick={() => setTab('budgets')}
            className="flex items-center justify-between p-4 hover:bg-[#222222] active:bg-[#262626] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/15 text-[#A78BFA] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] material-symbols-fill">
                  pie_chart
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">
                  Monthly Budgets
                </span>
                <span className="font-body text-[12px] text-[#888888]">
                  Limits &amp; spending targets
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#888888] group-active:translate-x-1 transition-transform">
              chevron_right
            </span>
          </button>

          <div className="h-[1px] w-full bg-[#262626] ml-16" />

          {/* Automation Rules */}
          <button
            id="settings-item-rules"
            onClick={() => setTab('rules')}
            className="flex items-center justify-between p-4 hover:bg-[#222222] active:bg-[#262626] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FB7185]/15 text-[#FB7185] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">
                  Automation Rules
                </span>
                <span className="font-body text-[12px] text-[#888888]">
                  Auto-categorize transactions
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#888888] group-active:translate-x-1 transition-transform">
              chevron_right
            </span>
          </button>

          <div className="h-[1px] w-full bg-[#262626] ml-16" />

          {/* People & Merchants */}
          <button
            id="settings-item-merchants"
            onClick={() => setTab('activity')}
            className="flex items-center justify-between p-4 hover:bg-[#222222] active:bg-[#262626] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#333333] text-[#A0A0A0] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] material-symbols-fill">
                  storefront
                </span>
              </div>
              <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">
                People &amp; Merchants
              </span>
            </div>
            <span className="material-symbols-outlined text-[#888888] group-active:translate-x-1 transition-transform">
              chevron_right
            </span>
          </button>
        </div>
      </section>

      {/* App System Section */}
      <section className="flex flex-col gap-1.5">
        <h3 className="font-body text-[11px] font-bold text-[#888888] px-2 pt-1 uppercase tracking-wider">
          System
        </h3>
        <div className="bg-[#1A1A1A] rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#262626] flex flex-col overflow-hidden">
          {/* Reports */}
          <button
            id="settings-item-reports"
            onClick={() => setTab('reports')}
            className="flex items-center justify-between p-4 hover:bg-[#222222] active:bg-[#262626] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] material-symbols-fill">
                  insights
                </span>
              </div>
              <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">
                Reports
              </span>
            </div>
            <span className="material-symbols-outlined text-[#888888] group-active:translate-x-1 transition-transform">
              chevron_right
            </span>
          </button>

          <div className="h-[1px] w-full bg-[#262626] ml-16" />

          {/* Backup & Restore */}
          <button
            id="settings-item-backup"
            onClick={() => {
              const data = {
                exportedAt: new Date().toISOString(),
                version: '1.0',
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `moneyflow_backup_${Date.now()}.json`;
              a.click();
            }}
            className="flex items-center justify-between p-4 hover:bg-[#222222] active:bg-[#262626] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#333333] text-[#A0A0A0] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
              </div>
              <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">
                Backup &amp; Restore
              </span>
            </div>
            <span className="material-symbols-outlined text-[#888888] group-active:translate-x-1 transition-transform">
              chevron_right
            </span>
          </button>

          <div className="h-[1px] w-full bg-[#262626] ml-16" />

          {/* Security */}
          <button
            id="settings-item-security"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center justify-between p-4 hover:bg-[#222222] active:bg-[#262626] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] material-symbols-fill">
                  fingerprint
                </span>
              </div>
              <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">
                Security (PIN/Biometric)
              </span>
            </div>
            <span className="material-symbols-outlined text-[#888888] group-active:translate-x-1 transition-transform">
              chevron_right
            </span>
          </button>

          <div className="h-[1px] w-full bg-[#262626] ml-16" />

          {/* App Settings */}
          <button
            id="settings-item-appsettings"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center justify-between p-4 hover:bg-[#222222] active:bg-[#262626] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#333333] text-[#A0A0A0] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] material-symbols-fill">
                  settings
                </span>
              </div>
              <span className="font-body text-[15px] font-semibold text-[#E0E0E0]">
                App Settings
              </span>
            </div>
            <span className="material-symbols-outlined text-[#888888] group-active:translate-x-1 transition-transform">
              chevron_right
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};
