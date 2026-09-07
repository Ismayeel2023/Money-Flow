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
    verifyBiometricForAction,
    enrollBiometric,
    removeBiometric,
    biometricCapability,
  } = useFinance();

  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isTestingBiometrics, setIsTestingBiometrics] = useState<boolean>(false);
  const [isEnrollingBiometrics, setIsEnrollingBiometrics] = useState<boolean>(false);

  // In-modal biometric security challenge state
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isBiometricChallengeOpen, setIsBiometricChallengeOpen] = useState<boolean>(false);
  const [challengeMethod, setChallengeMethod] = useState<'biometric' | 'pin'>('biometric');
  const [challengePinInput, setChallengePinInput] = useState<string>('');
  const [challengeError, setChallengeError] = useState<string>('');

  if (!isSecurityModalOpen) return null;

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  /**
   * Guards a sensitive action (like changing PIN or turning off locks)
   * with a biometric check if requireBiometricsForSecurityChanges is enabled.
   */
  const executeWithBiometricGate = (action: () => void) => {
    if (securitySettings.requireBiometricsForSecurityChanges && securitySettings.biometricEnabled) {
      setPendingAction(() => action);
      setChallengePinInput('');
      setChallengeError('');
      setChallengeMethod('biometric');
      setIsBiometricChallengeOpen(true);
      // Auto-trigger biometric prompt after opening challenge
      setTimeout(() => {
        handleChallengeBiometric(action);
      }, 250);
    } else {
      action();
    }
  };

  const handleChallengeBiometric = async (targetAction?: () => void) => {
    setChallengeError('');
    try {
      const verified = await verifyBiometricForAction('Verify Security Modification');
      if (verified) {
        setIsBiometricChallengeOpen(false);
        const act = targetAction || pendingAction;
        if (act) act();
        setPendingAction(null);
        showFeedback('Identity verified with biometrics', 'success');
      } else {
        setChallengeError('Biometric verification canceled or not recognized. Try again or use PIN.');
      }
    } catch (e: any) {
      setChallengeError(e?.message || 'Biometric verification failed. Please enter PIN.');
    }
  };

  const handleChallengePinSubmit = () => {
    if (challengePinInput === securitySettings.pin) {
      setIsBiometricChallengeOpen(false);
      if (pendingAction) pendingAction();
      setPendingAction(null);
      showFeedback('Identity verified with PIN', 'success');
    } else {
      setChallengeError('Incorrect PIN. Please try again.');
      setChallengePinInput('');
    }
  };

  const handleSavePin = () => {
    if (newPin.length !== 4) {
      showFeedback('PIN must be exactly 4 digits', 'error');
      return;
    }
    if (confirmPin && newPin !== confirmPin) {
      showFeedback('PINs do not match. Please re-enter.', 'error');
      return;
    }
    updateSecuritySettings({ pin: newPin });
    setNewPin('');
    setConfirmPin('');
    setIsChangingPin(false);
    showFeedback('App PIN updated successfully', 'success');
  };

  const handleTestBiometrics = async () => {
    setIsTestingBiometrics(true);
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        showFeedback(`${biometricCapability.platformLabel || 'Biometrics'} verified successfully!`, 'success');
      } else {
        showFeedback('Biometric prompt closed or not recognized.', 'info');
      }
    } catch (e: any) {
      showFeedback(e?.message || 'Biometric test failed.', 'error');
    } finally {
      setIsTestingBiometrics(false);
    }
  };

  const handleEnrollBiometrics = async () => {
    setIsEnrollingBiometrics(true);
    try {
      const result = await enrollBiometric();
      if (result.success) {
        showFeedback(`${biometricCapability.platformLabel || 'Biometrics'} enrolled and bound to device!`, 'success');
      } else {
        showFeedback(result.error || 'Biometric enrollment was canceled.', 'info');
      }
    } catch (e: any) {
      showFeedback(e?.message || 'Biometric enrollment failed.', 'error');
    } finally {
      setIsEnrollingBiometrics(false);
    }
  };

  const handleRemoveBiometricCredential = () => {
    removeBiometric();
    showFeedback('Biometric credential removed from this device.', 'info');
  };

  const handleLockNow = () => {
    setIsSecurityModalOpen(false);
    lockApp();
  };

  const platformIcon = biometricCapability.platformIcon || 'fingerprint';
  const platformLabel = biometricCapability.platformLabel || 'Fingerprint / Face Unlock';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#141414] rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl border border-[#262626] relative flex flex-col gap-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#10B981]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <span className="material-symbols-outlined text-[24px] material-symbols-fill">
                {platformIcon}
              </span>
            </div>
            <div>
              <h3 className="font-display font-bold text-[17px] text-[#FFFFFF] tracking-tight">
                Biometrics &amp; Privacy Vault
              </h3>
              <p className="font-body text-[12px] text-[#888888]">
                {platformLabel} &bull; Security Controls
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsSecurityModalOpen(false);
              setIsChangingPin(false);
              setIsBiometricChallengeOpen(false);
            }}
            className="w-8 h-8 rounded-full bg-[#242424] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`text-[12px] font-bold py-2.5 px-3.5 rounded-xl text-center border animate-fadeIn transition-all ${
              feedbackMsg.type === 'success'
                ? 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
                : feedbackMsg.type === 'error'
                ? 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/30'
                : 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30'
            }`}
          >
            {feedbackMsg.text}
          </div>
        )}

        {/* ======================================================== */}
        {/* IN-MODAL BIOMETRIC CHALLENGE OVERLAY                      */}
        {/* ======================================================== */}
        {isBiometricChallengeOpen && (
          <div className="bg-gradient-to-b from-[#1C1C1C] to-[#121212] border-2 border-[#D4AF37]/50 rounded-2xl p-5 flex flex-col items-center gap-4 text-center animate-fadeIn shadow-2xl">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#10B981]/15 border-2 border-[#10B981] flex items-center justify-center text-[#10B981] shadow-[0_0_25px_rgba(16,185,129,0.35)]">
                <span className="material-symbols-outlined text-[32px] material-symbols-fill animate-pulse">
                  {platformIcon}
                </span>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#D4AF37] text-[#0F0F0F] flex items-center justify-center font-bold text-[12px]">
                <span className="material-symbols-outlined text-[14px]">lock</span>
              </div>
            </div>

            <div>
              <h4 className="font-display font-bold text-[16px] text-[#FFFFFF]">
                Biometric Verification Required
              </h4>
              <p className="font-body text-[12px] text-[#AAAAAA] mt-1 max-w-xs">
                Scan your fingerprint or face to authorize modifying vault security settings.
              </p>
            </div>

            {challengeError && (
              <p className="font-body text-[12px] text-[#FB7185] font-semibold bg-[#FB7185]/10 px-3 py-1 rounded-lg border border-[#FB7185]/20">
                {challengeError}
              </p>
            )}

            {challengeMethod === 'biometric' ? (
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => handleChallengeBiometric()}
                  className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 text-[#0F0F0F] font-bold text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">{platformIcon}</span>
                  <span>Scan {platformLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChallengeMethod('pin');
                    setChallengeError('');
                  }}
                  className="text-[12px] font-semibold text-[#888888] hover:text-[#D4AF37] transition-colors py-1"
                >
                  Verify with 4-Digit PIN instead
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    autoFocus
                    value={challengePinInput}
                    onChange={(e) => setChallengePinInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="bg-[#181818] border border-[#3A3A3A] rounded-xl px-4 py-2 text-[#FFFFFF] text-center font-mono text-[20px] tracking-widest w-36 focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={handleChallengePinSubmit}
                    disabled={challengePinInput.length !== 4}
                    className="bg-[#D4AF37] disabled:opacity-50 text-[#0F0F0F] px-4 py-2 rounded-xl font-bold text-[13px] hover:bg-[#E5C158] transition-colors"
                  >
                    Verify
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChallengeMethod('biometric');
                    setChallengeError('');
                  }}
                  className="text-[12px] font-semibold text-[#888888] hover:text-[#10B981] transition-colors"
                >
                  Switch back to {platformLabel}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setIsBiometricChallengeOpen(false);
                setPendingAction(null);
              }}
              className="text-[11px] text-[#666666] hover:text-[#999999]"
            >
              Cancel Verification
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. INTERACTIVE BIOMETRICS COMMAND CENTER                  */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-br from-[#1C1C1C] to-[#161616] rounded-2xl p-4 sm:p-5 border border-[#2B2B2B] flex flex-col gap-4 shadow-md">
          {/* Header row with hardware detection chips */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[15px] text-[#FFFFFF]">
                  Device Biometrics
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30">
                  {biometricCapability.hasPlatformAuthenticator ? 'Hardware Ready' : 'WebAuthn Ready'}
                </span>
              </div>
              <p className="font-body text-[12px] text-[#888888] mt-0.5">
                {platformLabel} integration via W3C Web Authentication
              </p>
            </div>

            {/* Credential Status Badge */}
            <div className="text-right">
              {biometricCapability.isEnrolled ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Enrolled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25">
                  Not Paired
                </span>
              )}
            </div>
          </div>

          {/* Interactive Biometric Sensor Touchpad */}
          <div className="bg-[#121212] rounded-2xl p-4 border border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <button
                id="btn-interactive-sensor"
                type="button"
                onClick={handleTestBiometrics}
                disabled={isTestingBiometrics || isEnrollingBiometrics}
                title="Tap to test biometric sensor"
                className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer group shrink-0 ${
                  isTestingBiometrics
                    ? 'bg-[#10B981]/20 border-2 border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105'
                    : 'bg-[#1E1E1E] border border-[#333333] hover:border-[#D4AF37] hover:bg-[#252525] active:scale-95'
                }`}
              >
                {/* Visual pulse ring */}
                <div
                  className={`absolute inset-0 rounded-2xl border border-[#D4AF37]/40 transition-all ${
                    isTestingBiometrics ? 'animate-ping' : 'group-hover:scale-110'
                  }`}
                />
                <span
                  className={`material-symbols-outlined text-[28px] transition-colors material-symbols-fill ${
                    isTestingBiometrics
                      ? 'text-[#10B981] animate-pulse'
                      : 'text-[#D4AF37] group-hover:text-[#F3E5AB]'
                  }`}
                >
                  {platformIcon}
                </span>
              </button>

              <div>
                <p className="font-body font-bold text-[13px] text-[#FFFFFF]">
                  {isTestingBiometrics ? 'Waiting for Sensor...' : 'Interactive Biometric Sensor'}
                </p>
                <p className="font-body text-[11px] text-[#888888] mt-0.5">
                  {biometricCapability.isEnrolled && biometricCapability.enrolledDate
                    ? `Paired on ${biometricCapability.enrolledDate}`
                    : 'Touch to test prompt or enroll below'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                id="btn-test-sensor"
                type="button"
                onClick={handleTestBiometrics}
                disabled={isTestingBiometrics}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-[#E0E0E0] border border-[#333333] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px] text-[#34D399]">
                  verified_user
                </span>
                <span>{isTestingBiometrics ? 'Scanning...' : 'Test Sensor'}</span>
              </button>

              {!biometricCapability.isEnrolled ? (
                <button
                  id="btn-enroll-biometrics"
                  type="button"
                  onClick={handleEnrollBiometrics}
                  disabled={isEnrollingBiometrics}
                  className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#0F0F0F] text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[15px] font-bold">add_moderator</span>
                  <span>{isEnrollingBiometrics ? 'Enrolling...' : 'Enroll Sensor'}</span>
                </button>
              ) : (
                <button
                  id="btn-remove-biometrics"
                  type="button"
                  onClick={handleRemoveBiometricCredential}
                  title="Unpair biometric credential"
                  className="p-2 rounded-xl bg-[#222222] hover:bg-[#2F2121] text-[#FB7185] border border-[#3A2828] text-[11px] font-bold flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">link_off</span>
                </button>
              )}
            </div>
          </div>

          {/* Biometric Unlock Toggle */}
          <div className="pt-2 border-t border-[#262626] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#34D399] text-[20px]">
                fingerprint
              </span>
              <div>
                <p className="font-bold text-[#FFFFFF] text-[13px]">
                  Use Biometrics to Unlock App
                </p>
                <p className="text-[11px] text-[#888888]">
                  Skip manual PIN entry using {platformLabel}
                </p>
              </div>
            </div>
            <button
              id="toggle-biometrics"
              onClick={() => {
                executeWithBiometricGate(() => {
                  const next = !securitySettings.biometricEnabled;
                  updateSecuritySettings({ biometricEnabled: next });
                  showFeedback(next ? 'Biometric unlock enabled' : 'Biometric unlock disabled');
                });
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

          {/* Biometric Verification Priority Mode */}
          {securitySettings.biometricEnabled && (
            <div className="bg-[#141414] p-3 rounded-xl border border-[#242424] flex flex-col gap-2">
              <label className="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-wider">
                Unlock Verification Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  {
                    key: 'biometric_preferred' as const,
                    label: 'Biometric 1st',
                    desc: 'Sensor pops up first',
                  },
                  {
                    key: 'pin_first' as const,
                    label: 'PIN 1st',
                    desc: 'Numeric keypad first',
                  },
                  {
                    key: 'biometric_strict' as const,
                    label: 'Strict Vault',
                    desc: 'Hides all data first',
                  },
                ].map((mode) => {
                  const isSelected =
                    (securitySettings.biometricMode || 'biometric_preferred') === mode.key;
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => {
                        updateSecuritySettings({ biometricMode: mode.key });
                        showFeedback(`Unlock mode: ${mode.label}`);
                      }}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#FFFFFF]'
                          : 'bg-[#181818] border-[#2B2B2B] text-[#888888] hover:text-[#FFFFFF]'
                      }`}
                    >
                      <p className="font-bold text-[11px] leading-tight flex items-center justify-between">
                        <span>{mode.label}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        )}
                      </p>
                      <p className="text-[9px] text-[#777777] mt-0.5">{mode.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Biometric Guard for Security Changes */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D4AF37] text-[18px]">
                admin_panel_settings
              </span>
              <div>
                <p className="text-[12px] font-bold text-[#E0E0E0]">
                  Require Biometrics for PIN Changes
                </p>
                <p className="text-[10px] text-[#888888]">
                  Prevents tampering with vault PIN or security settings
                </p>
              </div>
            </div>
            <button
              id="toggle-require-biometrics-settings"
              onClick={() => {
                executeWithBiometricGate(() => {
                  const next = !securitySettings.requireBiometricsForSecurityChanges;
                  updateSecuritySettings({ requireBiometricsForSecurityChanges: next });
                  showFeedback(next ? 'Biometric security guard enabled' : 'Biometric security guard disabled');
                });
              }}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                securitySettings.requireBiometricsForSecurityChanges ? 'bg-[#D4AF37]' : 'bg-[#383838]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#0F0F0F] transition-transform ${
                  securitySettings.requireBiometricsForSecurityChanges ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. APP PIN LOCK & FALLBACK CODE                           */}
        {/* ======================================================== */}
        <div className="bg-[#1C1C1C] rounded-2xl p-4 border border-[#2A2A2A] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#262626] flex items-center justify-center text-[#D4AF37]">
                <span className="material-symbols-outlined text-[18px]">pin</span>
              </div>
              <div>
                <p className="font-bold text-[#FFFFFF] text-[14px]">App PIN Lock</p>
                <p className="text-[11px] text-[#888888]">4-Digit master recovery code</p>
              </div>
            </div>
            <button
              id="toggle-pin-lock"
              onClick={() => {
                executeWithBiometricGate(() => {
                  const next = !securitySettings.isLockEnabled;
                  updateSecuritySettings({ isLockEnabled: next });
                  showFeedback(next ? 'App lock enabled' : 'App lock disabled');
                });
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
                <span className="font-mono text-[11px] text-[#888888] ml-2">Current PIN Active</span>
              </div>
              <button
                type="button"
                id="btn-change-pin"
                onClick={() => {
                  executeWithBiometricGate(() => {
                    setIsChangingPin(true);
                    setNewPin('');
                    setConfirmPin('');
                  });
                }}
                className="text-[12px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                <span>Change PIN</span>
              </button>
            </div>
          )}

          {securitySettings.isLockEnabled && isChangingPin && (
            <div className="pt-2 border-t border-[#2C2C2C] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#A0A0A0] uppercase">
                  Enter New 4-Digit PIN
                </label>
                <span className="text-[10px] text-[#888888]">Numbers only</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    autoFocus
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="New PIN"
                    className="w-full bg-[#141414] border border-[#3A3A3A] rounded-xl px-3 py-2 text-[#FFFFFF] text-center font-mono text-[16px] tracking-widest focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Confirm"
                    className="w-full bg-[#141414] border border-[#3A3A3A] rounded-xl px-3 py-2 text-[#FFFFFF] text-center font-mono text-[16px] tracking-widest focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPin(false);
                    setNewPin('');
                    setConfirmPin('');
                  }}
                  className="text-[#888888] hover:text-[#FFFFFF] px-3 py-1.5 text-[12px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePin}
                  disabled={newPin.length !== 4 || (confirmPin.length > 0 && newPin !== confirmPin)}
                  className="bg-[#D4AF37] disabled:opacity-50 text-[#0F0F0F] px-4 py-1.5 rounded-xl font-bold text-[12px] hover:bg-[#E5C158] transition-colors"
                >
                  Save PIN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. AUTO-LOCK TIMEOUT & INACTIVITY                         */}
        {/* ======================================================== */}
        <div className="bg-[#1C1C1C] rounded-2xl p-4 border border-[#2A2A2A] flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#38BDF8] text-[20px]">
              timer
            </span>
            <div>
              <p className="font-bold text-[#FFFFFF] text-[14px]">Auto-Lock Inactivity</p>
              <p className="text-[11px] text-[#888888]">Re-locks vault when app is backgrounded</p>
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
                    : 'bg-[#141414] text-[#888888] border-[#2C2C2C] hover:text-[#FFFFFF]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. PRIVACY SHIELD & HIGH VALUE AUTH                       */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Privacy Screen */}
          <div className="bg-[#1C1C1C] rounded-2xl p-3.5 border border-[#2A2A2A] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#A78BFA] text-[20px]">
                visibility_off
              </span>
              <div>
                <p className="font-bold text-[#FFFFFF] text-[12px]">Privacy Masking</p>
                <p className="text-[10px] text-[#888888]">Hide in app switcher</p>
              </div>
            </div>
            <button
              id="toggle-privacy-screen"
              onClick={() => {
                const next = !securitySettings.privacyScreen;
                updateSecuritySettings({ privacyScreen: next });
                showFeedback(next ? 'Privacy screen enabled' : 'Privacy screen disabled');
              }}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                securitySettings.privacyScreen ? 'bg-[#D4AF37]' : 'bg-[#383838]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#0F0F0F] transition-transform ${
                  securitySettings.privacyScreen ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* High-Value Auth */}
          <div className="bg-[#1C1C1C] rounded-2xl p-3.5 border border-[#2A2A2A] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#FB7185] text-[20px]">
                verified_user
              </span>
              <div>
                <p className="font-bold text-[#FFFFFF] text-[12px]">High-Value Auth</p>
                <p className="text-[10px] text-[#888888]">&gt; ₹10,000 checks</p>
              </div>
            </div>
            <button
              id="toggle-high-value-auth"
              onClick={() => {
                const next = !securitySettings.highValueAuth;
                updateSecuritySettings({ highValueAuth: next });
                showFeedback(next ? 'High-value auth enabled' : 'High-value auth disabled');
              }}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                securitySettings.highValueAuth ? 'bg-[#D4AF37]' : 'bg-[#383838]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#0F0F0F] transition-transform ${
                  securitySettings.highValueAuth ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FOOTER ACTIONS                                           */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            id="btn-lock-now-modal"
            type="button"
            onClick={handleLockNow}
            className="w-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-body font-bold text-[13px] py-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>Lock App Now</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSecurityModalOpen(false)}
            className="w-full bg-[#262626] hover:bg-[#303030] text-[#FFFFFF] font-body font-bold text-[13px] py-3 rounded-2xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
