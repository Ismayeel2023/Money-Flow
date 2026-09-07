import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export const AppSettingsModal: React.FC = () => {
  const {
    isAppSettingsModalOpen,
    setIsAppSettingsModalOpen,
    resetToDemoData,
    currencySymbol,
  } = useFinance();

  const [selectedCurrency, setSelectedCurrency] = useState(currencySymbol || '₹');
  const [startOfMonth, setStartOfMonth] = useState('1');
  const [confettiEnabled, setConfettiEnabled] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notification, setNotification] = useState('');

  if (!isAppSettingsModalOpen) return null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2500);
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        app: 'MoneyFlow Expense Tracker',
        exportedAt: new Date().toISOString(),
        version: '1.2.0',
        accounts: JSON.parse(localStorage.getItem('moneyflow_accounts') || '[]'),
        transactions: JSON.parse(localStorage.getItem('moneyflow_transactions') || '[]'),
        budgets: JSON.parse(localStorage.getItem('moneyflow_budgets') || '[]'),
        categories: JSON.parse(localStorage.getItem('moneyflow_categories') || '[]'),
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moneyflow_backup_${Date.now()}.json`;
      a.click();
      showNotification('Backup exported successfully');
    } catch {
      showNotification('Export failed');
    }
  };

  const handleResetData = () => {
    resetToDemoData();
    setConfirmReset(false);
    showNotification('Data reset to default state');
  };

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#262626] relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] material-symbols-fill">
                settings
              </span>
            </div>
            <div>
              <h3 className="font-display font-bold text-[17px] text-[#FFFFFF]">
                App Settings
              </h3>
              <p className="font-body text-[12px] text-[#888888]">
                Display &amp; system preferences
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAppSettingsModalOpen(false);
              setConfirmReset(false);
            }}
            className="w-8 h-8 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {notification && (
          <div className="bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 text-[12px] font-bold py-2 px-3 rounded-xl text-center">
            {notification}
          </div>
        )}

        {/* 1. Currency Preference */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#D4AF37] text-[20px]">
              payments
            </span>
            <div>
              <p className="font-bold text-[#FFFFFF] text-[14px]">Primary Currency</p>
              <p className="text-[11px] text-[#888888]">Applied to all accounts &amp; analytics</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => {
                  setSelectedCurrency(curr.symbol);
                  showNotification(`Currency changed to ${curr.code} (${curr.symbol})`);
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  selectedCurrency === curr.symbol
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-[#181818] border-[#2C2C2C] text-[#A0A0A0] hover:text-[#FFFFFF]'
                }`}
              >
                <span className="text-[14px] font-bold">{curr.symbol}</span>
                <span className="text-[10px] opacity-75">{curr.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Budget Month Start Date */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#34D399] text-[20px]">
              calendar_month
            </span>
            <div>
              <p className="font-bold text-[#FFFFFF] text-[14px]">Monthly Cycle Start</p>
              <p className="text-[11px] text-[#888888]">Align with salary or payment day</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { val: '1', label: '1st' },
              { val: '5', label: '5th' },
              { val: '15', label: '15th' },
              { val: '25', label: '25th' },
            ].map((d) => (
              <button
                key={d.val}
                onClick={() => {
                  setStartOfMonth(d.val);
                  showNotification(`Budget cycle starts on the ${d.label}`);
                }}
                className={`py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                  startOfMonth === d.val
                    ? 'bg-[#34D399] text-[#0F0F0F] border-[#34D399]'
                    : 'bg-[#181818] text-[#888888] border-[#2C2C2C] hover:text-[#FFFFFF]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Confetti Animation */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#F43F5E] text-[20px]">
              celebration
            </span>
            <div>
              <p className="font-bold text-[#FFFFFF] text-[14px]">Success Confetti</p>
              <p className="text-[11px] text-[#888888]">Celebrate saved transactions</p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !confettiEnabled;
              setConfettiEnabled(next);
              showNotification(next ? 'Confetti enabled' : 'Confetti disabled');
            }}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              confettiEnabled ? 'bg-[#D4AF37]' : 'bg-[#383838]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#0F0F0F] transition-transform ${
                confettiEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 4. Haptic Feedback */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#A78BFA] text-[20px]">
              vibration
            </span>
            <div>
              <p className="font-bold text-[#FFFFFF] text-[14px]">Haptic Feedback</p>
              <p className="text-[11px] text-[#888888]">Tactile response on button taps</p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !hapticFeedback;
              setHapticFeedback(next);
              showNotification(next ? 'Haptics enabled' : 'Haptics disabled');
            }}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              hapticFeedback ? 'bg-[#D4AF37]' : 'bg-[#383838]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#0F0F0F] transition-transform ${
                hapticFeedback ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 5. Backup & Data Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="w-full bg-[#262626] hover:bg-[#303030] text-[#E0E0E0] border border-[#333333] font-body font-bold text-[13px] py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export JSON Backup
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full text-[#FB7185] hover:bg-[#FB7185]/10 font-body font-semibold text-[12px] py-2.5 rounded-2xl transition-colors"
            >
              Reset Ledger to Demo Data
            </button>
          ) : (
            <div className="bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-2xl p-3 flex flex-col gap-2 text-center">
              <p className="text-[12px] text-[#FB7185] font-bold">
                Are you sure you want to reset all data?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="flex-1 bg-[#FB7185] text-[#0F0F0F] font-bold text-[12px] py-2 rounded-xl"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 bg-[#262626] text-[#A0A0A0] font-bold text-[12px] py-2 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAppSettingsModalOpen(false);
            setConfirmReset(false);
          }}
          className="w-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-body font-bold text-[14px] py-3 rounded-2xl transition-colors"
        >
          Save &amp; Close
        </button>
      </div>
    </div>
  );
};
