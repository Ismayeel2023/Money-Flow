import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { SmsPermissionLevel } from '../types';

const PROMPT_KEY = 'moneyflow_notification_access_prompted';

export const AndroidSmsPermissionModal: React.FC = () => {
  const {
    showSmsPermissionModal,
    setShowSmsPermissionModal,
    smsPermissionLevel,
    setSmsPermissionLevel,
    requestPhoneSmsPermission,
    notificationAccessEnabled,
  } = useFinance();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!showSmsPermissionModal) return null;

  const markPrompted = () => {
    try {
      localStorage.setItem(PROMPT_KEY, '1');
    } catch {}
  };

  const handleSelectPermission = async (level: SmsPermissionLevel) => {
    setSmsPermissionLevel(level);
    markPrompted();

    if (level === 'denied') {
      setToastMessage('Notification access not granted. You can enable it later in Settings.');
      setTimeout(() => {
        setToastMessage(null);
        setShowSmsPermissionModal(false);
      }, 900);
      return;
    }

    await requestPhoneSmsPermission();
    setToastMessage('Turn on Money Flow in Notification access, then return to the app.');
    setTimeout(() => {
      setToastMessage(null);
      setShowSmsPermissionModal(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-[#1E1F22] border border-[#33353A] rounded-[28px] w-full max-w-sm p-6 flex flex-col shadow-2xl relative text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="perm-title"
      >
        <div className="flex flex-col items-center text-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-inner">
            <span className="material-symbols-outlined text-[28px]">notifications_active</span>
          </div>

          <div className="flex flex-col gap-1">
            <h2 id="perm-title" className="font-display text-[18px] font-bold text-[#E2E2E6] leading-snug">
              Allow <span className="text-[#D4AF37]">Money Flow</span> to read notifications?
            </h2>
            <p className="text-[13px] text-[#A0A0A5] leading-relaxed px-1">
              Android needs Notification access so Money Flow can auto-detect bank SMS and UPI alerts (Kotak, SBI, HDFC, ICICI, GPay, PhonePe).
            </p>
          </div>
        </div>

        {notificationAccessEnabled && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[12px] text-emerald-400 text-center font-medium">
            Notification access is already on
          </div>
        )}

        <div className="bg-[#141517] rounded-2xl p-3 mb-4 border border-[#2B2C30] flex flex-col gap-2 text-[12px] text-[#A0A0A5]">
          <div className="flex items-center gap-2 text-[#E2E2E6]">
            <span className="material-symbols-outlined text-[16px] text-[#34D399]">check_circle</span>
            <span>Reads bank debit/credit SMS and UPI alerts</span>
          </div>
          <div className="flex items-center gap-2 text-[#E2E2E6]">
            <span className="material-symbols-outlined text-[16px] text-[#34D399]">tune</span>
            <span>On the next screen, find Money Flow and switch it on</span>
          </div>
          <div className="flex items-start gap-2 text-[#E2E2E6]">
            <span className="material-symbols-outlined text-[16px] text-amber-400 shrink-0 mt-0.5">info</span>
            <span>
              <strong>If toggle is greyed out (Restricted setting):</strong> Open App Info &gt; tap 3 dots (⋮) top-right &gt; tap <strong>&quot;Allow restricted settings&quot;</strong>, then enable toggle.
            </span>
          </div>
          <div className="flex items-start gap-2 text-[#A0A0A5] pt-0.5">
            <span className="material-symbols-outlined text-[16px] text-[#34D399] shrink-0 mt-0.5">lock</span>
            <span>
              Android warns that this permission can read all notifications. That is standard OS copy — Money Flow filters only bank alerts 100% on-device.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleSelectPermission('always_allow')}
            className={`w-full py-3 px-4 rounded-2xl font-body text-[14px] font-bold flex items-center justify-between transition-all active:scale-[0.98] ${
              smsPermissionLevel === 'always_allow'
                ? 'bg-[#D4AF37] text-[#0F0F0F] shadow-[0_4px_16px_rgba(212,175,55,0.3)]'
                : 'bg-[#2A2B2F] hover:bg-[#34363B] text-white border border-[#D4AF37]/40'
            }`}
          >
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-1.5">
                <span>Allow notification access</span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                  Required
                </span>
              </div>
              <span className="text-[11px] font-normal text-[#A0A0A5]">
                Opens Android settings so SMS can be auto-detected
              </span>
            </div>
            {smsPermissionLevel === 'always_allow' && (
              <span className="material-symbols-outlined text-[20px]">check</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPermission('while_using')}
            className={`w-full py-3 px-4 rounded-2xl font-body text-[13px] font-semibold flex items-center justify-between transition-all active:scale-[0.98] ${
              smsPermissionLevel === 'while_using'
                ? 'bg-[#D4AF37] text-[#0F0F0F]'
                : 'bg-[#242528] hover:bg-[#2C2E32] text-[#D8D8DC]'
            }`}
          >
            <div className="flex flex-col items-start text-left">
              <span>Allow and open settings</span>
              <span className="text-[11px] font-normal text-[#888888]">
                Same system toggle — needed for bank SMS notifications
              </span>
            </div>
            {smsPermissionLevel === 'while_using' && (
              <span className="material-symbols-outlined text-[20px]">check</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPermission('denied')}
            className={`w-full py-2 px-4 rounded-2xl font-body text-[13px] font-medium text-[#777777] hover:text-[#AAAAAA] hover:bg-[#1C1D20] transition-all active:scale-[0.98] ${
              smsPermissionLevel === 'denied' ? 'text-rose-400 bg-rose-950/20' : ''
            }`}
          >
            <span>Don&apos;t allow</span>
          </button>
        </div>

        {toastMessage && (
          <div className="absolute inset-x-4 bottom-4 bg-[#2A2B2F] border border-[#3C3E44] text-[#D4AF37] p-3 rounded-2xl text-[12px] text-center font-medium shadow-xl animate-in fade-in slide-in-from-bottom-2">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};
