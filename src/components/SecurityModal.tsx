import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export const SecurityModal: React.FC = () => {
  const {
    isSecurityModalOpen,
    setIsSecurityModalOpen,
    securitySettings,
    updateSecuritySettings,
    lockApp,
    authenticateWithBiometric,
    biometricCapability,
  } = useFinance();

  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isTestingBiometrics, setIsTestingBiometrics] = useState(false);

  if (!isSecurityModalOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleSavePin = () => {
    if (newPin.length !== 4) {
      showFeedback('PIN must be exactly 4 digits');
      return;
    }
    updateSecuritySettings({ pin: newPin });
    setNewPin('');
    setIsChangingPin(false);
    showFeedback('App PIN updated successfully');
  };

  const handleTestBiometrics = async () => {
    setIsTestingBiometrics(true);
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        showFeedback('Biometric authentication succeeded!');
      } else {
        showFeedback('Biometric prompt closed or canceled.');
      }
    } catch (e: any) {
      showFeedback(e?.message || 'Biometric test failed.');
    } finally {
      setIsTestingBiometrics(false);
    }
  };

  const handleLockNow = () => {
    setIsSecurityModalOpen(false);
    lockApp();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#262626] relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] material-symbols-fill">
                fingerprint
              </span>
            </div>
            <div>
              <h3 className="font-display font-bold text-[17px] text-[#FFFFFF]">
                Biometrics &amp; Security
              </h3>
              <p className="font-body text-[12px] text-[#888888]">
                Vault protection &amp; app lock
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsSecurityModalOpen(false);
              setIsChangingPin(false);
            }}
            className="w-8 h-8 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {feedbackMsg && (
          <div className="bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 text-[12px] font-bold py-2 px-3 rounded-xl text-center animate-fadeIn">
            {feedbackMsg}
          </div>
        )}

        {/* Quick Lock Action Card */}
        <div className="bg-gradient-to-br from-[#242424] to-[#1C1C1C] rounded-2xl p-4 border border-[#333333] flex flex-col gap-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#D4AF37] text-[20px]">
                lock_clock
              </span>
              <span className="text-[13px] font-bold text-[#FFFFFF]">Instant Vault Lock</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#34D399] text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>
                {biometricCapability.hasPlatformAuthenticator ? 'Device Biometrics' : 'PIN / Biometrics'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#999999]">
            Lock Money Flow immediately to require fingerprint, face unlock, or PIN.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-lock-now"
              type="button"
              onClick={handleLockNow}
              className="w-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md"
            >
              <span className="material-symbols-outlined text-[16px] font-bold">lock</span>
              <span>Lock App Now</span>
            </button>
            <button
              id="btn-test-biometrics"
              type="button"
              onClick={handleTestBiometrics}
              disabled={isTestingBiometrics}
              className="w-full bg-[#2A2A2A] hover:bg-[#353535] text-[#E0E0E0] border border-[#3D3D3D] py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-[#34D399]">
                fingerprint
              </span>
              <span>{isTestingBiometrics ? 'Scanning...' : 'Test Sensor'}</span>
            </button>
          </div>
        </div>

        {/* 1. Biometric Unlock Toggle */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#34D399] text-[22px]">
              fingerprint
            </span>
            <div>
              <p className="font-bold text-[#FFFFFF] text-[14px]">Biometric Unlock</p>
              <p className="text-[11px] text-[#888888]">
                Android Fingerprint, Face ID / Touch ID
              </p>
            </div>
          </div>
          <button
            id="toggle-biometrics"
            onClick={() => {
              const next = !securitySettings.biometricEnabled;
              updateSecuritySettings({ biometricEnabled: next });
              showFeedback(next ? 'Biometric unlock enabled' : 'Biometric unlock disabled');
            }}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              securitySettings.biometricEnabled ? 'bg-[#34D399]' : 'bg-[#383838]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#0F0F0F] transition-transform ${
                securitySettings.biometricEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 2. App Lock PIN */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#D4AF37] text-[20px]">
                pin
              </span>
              <div>
                <p className="font-bold text-[#FFFFFF] text-[14px]">App PIN Lock</p>
                <p className="text-[11px] text-[#888888]">Fallback 4-digit code</p>
              </div>
            </div>
            <button
              id="toggle-pin-lock"
              onClick={() => {
                const next = !securitySettings.isLockEnabled;
                updateSecuritySettings({ isLockEnabled: next });
                showFeedback(next ? 'App lock enabled' : 'App lock disabled');
              }}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                securitySettings.isLockEnabled ? 'bg-[#D4AF37]' : 'bg-[#383838]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#0F0F0F] transition-transform ${
                  securitySettings.isLockEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {securitySettings.isLockEnabled && !isChangingPin && (
            <div className="pt-2 border-t border-[#2C2C2C] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                ))}
                <span className="font-mono text-[11px] text-[#888888] ml-2">Current PIN Set</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(true);
                  setNewPin('');
                }}
                className="text-[12px] font-bold text-[#D4AF37] hover:underline"
              >
                Change PIN
              </button>
            </div>
          )}

          {securitySettings.isLockEnabled && isChangingPin && (
            <div className="pt-2 border-t border-[#2C2C2C] flex flex-col gap-2">
              <label className="text-[11px] font-bold text-[#A0A0A0] uppercase">
                Enter New 4-Digit PIN
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="••••"
                  className="bg-[#181818] border border-[#3A3A3A] rounded-xl px-3 py-1.5 text-[#FFFFFF] text-center font-mono text-[16px] tracking-widest w-28 focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={handleSavePin}
                  className="bg-[#D4AF37] text-[#0F0F0F] px-3 py-1.5 rounded-xl font-bold text-[12px] hover:bg-[#E5C158] transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="text-[#888888] hover:text-[#FFFFFF] px-2 py-1.5 text-[12px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Auto-Lock Timeout */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#38BDF8] text-[20px]">
              timer
            </span>
            <div>
              <p className="font-bold text-[#FFFFFF] text-[14px]">Auto-Lock Inactivity</p>
              <p className="text-[11px] text-[#888888]">Lock when app is backgrounded</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { key: 'immediate' as const, label: 'Instant' },
              { key: '1min' as const, label: '1 min' },
              { key: '5min' as const, label: '5 min' },
              { key: 'never' as const, label: 'Never' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  updateSecuritySettings({ autoLockTimeout: opt.key });
                  showFeedback(`Auto-lock set to ${opt.label}`);
                }}
                className={`py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                  securitySettings.autoLockTimeout === opt.key
                    ? 'bg-[#D4AF37] text-[#0F0F0F] border-[#D4AF37]'
                    : 'bg-[#181818] text-[#888888] border-[#2C2C2C] hover:text-[#FFFFFF]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Privacy & Masking */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#A78BFA] text-[20px]">
              visibility_off
            </span>
            <div>
              <p className="font-bold text-[#FFFFFF] text-[14px]">App Switcher Privacy</p>
              <p className="text-[11px] text-[#888888]">Hide balances in app preview</p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !securitySettings.privacyScreen;
              updateSecuritySettings({ privacyScreen: next });
              showFeedback(next ? 'Privacy screen enabled' : 'Privacy screen disabled');
            }}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              securitySettings.privacyScreen ? 'bg-[#D4AF37]' : 'bg-[#383838]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#0F0F0F] transition-transform ${
                securitySettings.privacyScreen ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 5. High Value Auth */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#FB7185] text-[20px]">
              verified_user
            </span>
            <div>
              <p className="font-bold text-[#FFFFFF] text-[14px]">High-Value Transfers</p>
              <p className="text-[11px] text-[#888888]">Confirm before moving &gt; ₹10,000</p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !securitySettings.highValueAuth;
              updateSecuritySettings({ highValueAuth: next });
              showFeedback(next ? 'High-value auth enabled' : 'High-value auth disabled');
            }}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              securitySettings.highValueAuth ? 'bg-[#D4AF37]' : 'bg-[#383838]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#0F0F0F] transition-transform ${
                securitySettings.highValueAuth ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsSecurityModalOpen(false)}
          className="w-full bg-[#262626] hover:bg-[#303030] text-[#FFFFFF] font-body font-bold text-[14px] py-3 rounded-2xl transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
