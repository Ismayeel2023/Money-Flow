import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import logoImg from '../assets/logo.png';

export const LockScreen: React.FC = () => {
  const {
    isAppLocked,
    unlockApp,
    authenticateWithBiometric,
    securitySettings,
    biometricCapability,
  } = useFinance();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const autoPromptRef = useRef<boolean>(false);

  // Trigger biometric prompt on mount if biometric unlock is enabled
  useEffect(() => {
    if (isAppLocked && securitySettings.biometricEnabled && !autoPromptRef.current) {
      autoPromptRef.current = true;
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isAppLocked, securitySettings.biometricEnabled]);

  // Reset state when lock state changes
  useEffect(() => {
    if (isAppLocked) {
      setEnteredPin('');
      setIsError(false);
      setStatusMessage('');
      autoPromptRef.current = false;
    }
  }, [isAppLocked]);

  if (!isAppLocked) return null;

  const handleBiometricAuth = async () => {
    setIsScanning(true);
    setStatusMessage('Scanning fingerprint / face...');

    try {
      const success = await authenticateWithBiometric();
      if (success) {
        setStatusMessage('Biometric verified! Unlocking...');
      } else {
        setIsScanning(false);
        setStatusMessage('Biometric prompt closed. Use PIN or tap to retry.');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (e) {
      setIsScanning(false);
      setStatusMessage('Biometric unavailable. Enter PIN.');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setIsError(false);

      if (nextPin.length === 4) {
        // Validate PIN
        setTimeout(() => {
          const success = unlockApp(nextPin);
          if (!success) {
            setIsError(true);
            setStatusMessage('Incorrect PIN. Please try again.');
            setTimeout(() => {
              setEnteredPin('');
              setIsError(false);
            }, 700);
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    if (enteredPin.length > 0) {
      setEnteredPin(enteredPin.slice(0, -1));
      setIsError(false);
    }
  };

  return (
    <div
      id="app-lock-screen"
      className="fixed inset-0 z-[99999] bg-[#0A0A0A] flex flex-col items-center justify-between px-6 py-10 select-none overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212, 175, 55, 0.12), transparent 70%), radial-gradient(ellipse 60% 40% at 50% 110%, rgba(16, 185, 129, 0.08), transparent 70%)',
      }}
    >
      {/* Top Brand & Security Header */}
      <div className="flex flex-col items-center gap-3 pt-4 text-center max-w-xs animate-fadeIn">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#262626] to-[#141414] border border-[#383838] shadow-[0_8px_30px_rgba(0,0,0,0.8)] p-2.5 flex items-center justify-center">
            <img
              src={logoImg}
              alt="Money Flow"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#10B981] border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] shadow-md">
            <span className="material-symbols-outlined text-[14px] font-bold material-symbols-fill">
              lock
            </span>
          </div>
        </div>

        <div>
          <h1 className="font-display text-[22px] font-bold text-[#FFFFFF] tracking-tight">
            Money Flow Vault
          </h1>
          <p className="font-body text-[13px] text-[#888888] mt-0.5">
            Financial ledger protected with biometrics
          </p>
        </div>

        {/* Biometric capability badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#2B2B2B] text-[11px] text-[#AAAAAA]">
          <span
            className={`w-2 h-2 rounded-full ${
              biometricCapability.hasPlatformAuthenticator ? 'bg-[#10B981]' : 'bg-[#D4AF37]'
            } animate-pulse`}
          />
          <span>
            {biometricCapability.hasPlatformAuthenticator
              ? 'Device Biometrics (Fingerprint/Face) Ready'
              : 'Biometric & PIN Security'}
          </span>
        </div>
      </div>

      {/* Center: Biometric Sensor & PIN Indicators */}
      <div className="flex flex-col items-center gap-6 w-full max-w-xs">
        {/* Biometric quick touch trigger */}
        {securitySettings.biometricEnabled && (
          <div className="flex flex-col items-center gap-2">
            <button
              id="btn-biometric-scan"
              type="button"
              onClick={handleBiometricAuth}
              disabled={isScanning}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer group ${
                isScanning
                  ? 'bg-[#10B981]/20 border-2 border-[#10B981] shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105'
                  : 'bg-[#1A1A1A] border border-[#333333] hover:border-[#D4AF37] hover:bg-[#242424] shadow-[0_8px_24px_rgba(0,0,0,0.6)] active:scale-95'
              }`}
            >
              {/* Pulsing ring animation */}
              <div
                className={`absolute inset-0 rounded-full border border-[#D4AF37]/40 transition-all ${
                  isScanning ? 'animate-ping' : 'group-hover:scale-110'
                }`}
              />

              <span
                className={`material-symbols-outlined text-[38px] transition-colors ${
                  isScanning
                    ? 'text-[#10B981] animate-pulse'
                    : 'text-[#D4AF37] group-hover:text-[#F3E5AB]'
                }`}
              >
                fingerprint
              </span>
            </button>

            <span className="font-body text-[12px] font-semibold text-[#888888] group-hover:text-[#D4AF37] transition-colors">
              {isScanning ? 'Scanning biometrics...' : 'Touch to Unlock (Fingerprint / Face)'}
            </span>
          </div>
        )}

        {/* PIN Dots Display */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`flex items-center gap-4 transition-transform duration-200 ${
              isError ? 'animate-shake translate-x-1' : ''
            }`}
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = enteredPin.length > index;
              return (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    isFilled
                      ? 'bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.7)] scale-110'
                      : 'bg-transparent border-2 border-[#444444]'
                  } ${isError ? '!bg-[#EF4444] !border-[#EF4444]' : ''}`}
                />
              );
            })}
          </div>

          {statusMessage && (
            <p
              className={`font-body text-[12px] font-medium transition-all ${
                isError ? 'text-[#EF4444]' : 'text-[#D4AF37]'
              }`}
            >
              {statusMessage}
            </p>
          )}
        </div>
      </div>

      {/* Bottom: Custom Numeric Keypad */}
      <div className="w-full max-w-xs pb-2 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              id={`keypad-${digit}`}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-[#181818] hover:bg-[#242424] active:bg-[#333333] active:scale-95 border border-[#282828] hover:border-[#383838] flex items-center justify-center font-display text-[20px] font-bold text-[#FFFFFF] shadow-sm transition-all outline-none"
            >
              {digit}
            </button>
          ))}

          {/* Biometric button in keypad */}
          <button
            type="button"
            onClick={handleBiometricAuth}
            className="h-14 rounded-2xl bg-[#181818] hover:bg-[#242424] active:bg-[#333333] active:scale-95 border border-[#282828] hover:border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] transition-all outline-none"
            title="Scan Biometrics"
          >
            <span className="material-symbols-outlined text-[24px]">fingerprint</span>
          </button>

          {/* Zero */}
          <button
            id="keypad-0"
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-[#181818] hover:bg-[#242424] active:bg-[#333333] active:scale-95 border border-[#282828] hover:border-[#383838] flex items-center justify-center font-display text-[20px] font-bold text-[#FFFFFF] shadow-sm transition-all outline-none"
          >
            0
          </button>

          {/* Delete / Backspace */}
          <button
            id="keypad-backspace"
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-[#181818] hover:bg-[#242424] active:bg-[#333333] active:scale-95 border border-[#282828] hover:border-[#383838] flex items-center justify-center text-[#888888] hover:text-[#FFFFFF] transition-all outline-none"
            title="Backspace"
          >
            <span className="material-symbols-outlined text-[22px]">backspace</span>
          </button>
        </div>

        {/* Quick helper for default PIN (1234) */}
        <div className="flex items-center justify-between px-1 text-[11px] text-[#666666]">
          <span>Default PIN: 1234</span>
          <button
            type="button"
            onClick={() => unlockApp('1234')}
            className="text-[#D4AF37] hover:underline font-semibold"
          >
            Quick Unlock (Demo)
          </button>
        </div>
      </div>
    </div>
  );
};
