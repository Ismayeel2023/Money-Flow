import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { AutoBackupService } from '../services/autoBackupService';

export const AppSettingsModal: React.FC = () => {
  const {
    isAppSettingsModalOpen,
    setIsAppSettingsModalOpen,
    resetToDemoData,
    currencySymbol,
    monthCycleStartDay,
    setMonthCycleStartDay,
    budgetCycleLabel,
    dailyExpenseRemindersEnabled,
    setDailyExpenseRemindersEnabled,
    exportToJson,
    setTab,
  } = useFinance();

  const [selectedCurrency, setSelectedCurrency] = useState(currencySymbol || '₹');
  const [confettiEnabled, setConfettiEnabled] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notification, setNotification] = useState('');

  if (!isAppSettingsModalOpen) return null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2500);
  };

  const handleExportBackup = async () => {
    try {
      const jsonContent = exportToJson();
      const dateStr = new Date().toISOString().split('T')[0];
      const result = await AutoBackupService.shareOrDownloadBackup(
        jsonContent,
        `MoneyFlow_FullBackup_${dateStr}.json`
      );
      showNotification(result.message);
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

  const presets = [1, 5, 10, 15, 20, 25];

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

        {/* 2. Budget Month Start Date (Supports Any Day 1-31) */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#34D399] text-[20px]">
                calendar_month
              </span>
              <div>
                <p className="font-bold text-[#FFFFFF] text-[14px]">Monthly Cycle Start</p>
                <p className="text-[11px] text-[#888888]">Align with salary or payment day</p>
              </div>
            </div>
            <span className="text-[14px] font-bold text-[#34D399] bg-[#34D399]/15 px-2.5 py-0.5 rounded-full border border-[#34D399]/30">
              Day {monthCycleStartDay}
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-6 gap-1 pt-0.5">
            {presets.map((day) => (
              <button
                key={day}
                onClick={() => {
                  setMonthCycleStartDay(day);
                  showNotification(`Monthly cycle set to start on day ${day}`);
                }}
                className={`py-1 text-[11px] font-bold rounded-lg border transition-all ${
                  monthCycleStartDay === day
                    ? 'bg-[#34D399] text-[#0F0F0F] border-[#34D399]'
                    : 'bg-[#181818] text-[#888888] border-[#2C2C2C] hover:text-[#FFFFFF]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Slider for Any Day 1–31 */}
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-[#888888]">
              <span>Day 1</span>
              <span>Day 15</span>
              <span>Day 31</span>
            </div>
            <input
              type="range"
              min="1"
              max="31"
              value={monthCycleStartDay}
              onChange={(e) => setMonthCycleStartDay(parseInt(e.target.value, 10))}
              className="w-full accent-[#34D399] cursor-pointer"
            />
          </div>

          {/* Active Cycle Date Range Display */}
          <div className="p-2 bg-[#161616] border border-[#2C2C2C] rounded-xl text-center text-[12px] text-[#A0A0A0]">
            Current Cycle: <strong className="text-[#FFFFFF]">{budgetCycleLabel}</strong>
          </div>
        </div>

        {/* 3. Daily Expense Reminders */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#38BDF8] text-[20px]">
              alarm
            </span>
            <div>
              <p className="font-bold text-[#FFFFFF] text-[14px]">Daily Reminders</p>
              <p className="text-[11px] text-[#888888]">Morning (9 AM) &amp; Evening (8 PM) pings</p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !dailyExpenseRemindersEnabled;
              setDailyExpenseRemindersEnabled(next);
              showNotification(next ? 'Daily reminders enabled' : 'Daily reminders disabled');
            }}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              dailyExpenseRemindersEnabled ? 'bg-[#38BDF8]' : 'bg-[#383838]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#0F0F0F] transition-transform ${
                dailyExpenseRemindersEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 4. Confetti Animation */}
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

        {/* 5. Haptic Feedback */}
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

        {/* 6. Backup & Data Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="w-full bg-[#262626] hover:bg-[#303030] text-[#E0E0E0] border border-[#333333] font-body font-bold text-[13px] py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export JSON Backup
          </button>

          <button
            type="button"
            onClick={() => {
              setIsAppSettingsModalOpen(false);
              setTab('export-backup');
            }}
            className="w-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-body font-bold text-[13px] py-2.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
            Open Export &amp; Backup Screen
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
