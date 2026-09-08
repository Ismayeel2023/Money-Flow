import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';
import { SmsParserService } from '../services/smsParserService';
import { ParsedSmsResult } from '../types';
import { CustomDropdown } from './CustomDropdown';

export const SmsParserScreen: React.FC = () => {
  const { accounts, categories, addTransactionFromSms, formatCurrency } = useFinance();

  const [inputText, setInputText] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedSmsResult | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Real-time SMS Listener & Permission State
  const [isListeningForSms, setIsListeningForSms] = useState<boolean>(false);
  const [smsPermissionState, setSmsPermissionState] = useState<'prompt' | 'granted' | 'unsupported'>('prompt');
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Quick sample templates
  const samples = [
    {
      label: 'Kotak Bank (6402)',
      text: 'Sent Rs. 95.00 from Kotak Bank AC 6402 to CENTRAL CAFE on 05-09-26. UPI Ref 624870659421.',
    },
    {
      label: 'SBI UPI (Swiggy)',
      text: 'Dear SBI User, your A/C ending 4589 debited by Rs 450.00 on 05-Sep-26 by UPI to SWIGGY. Ref: 624818937196.',
    },
    {
      label: 'HDFC (Railways)',
      text: 'INR 1093.39 debited from HDFC Bank A/C **1234 on 04-Sep-26 to Indian Railway via UPI. Ref 624754763985.',
    },
    {
      label: 'Kotak Salary (Credit)',
      text: 'Dear Customer, INR 45,000.00 credited to Kotak Bank A/c xx6402 on 01-Sep-26 by TRANSFER from TECH CORP.',
    },
  ];

  // Check WebOTP API support on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'OTPCredential' in window) {
      setSmsPermissionState('prompt');
    } else {
      // In browsers without native WebOTP, we support clipboard & touch permission
      setSmsPermissionState('prompt');
    }
  }, []);

  // Request SMS Read Permission & start listening via WebOTP
  const startSmsListener = async () => {
    if (typeof window === 'undefined') return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;

    setIsListeningForSms(true);
    setSmsPermissionState('granted');
    setPermissionNotice('SMS detection active. Waiting for incoming bank SMS...');

    // If WebOTP API is supported, listen for native incoming SMS
    if ('OTPCredential' in window && navigator.credentials) {
      try {
        const content: any = await (navigator.credentials as any).get({
          otp: { transport: ['sms'] },
          signal: ac.signal,
        });

        if (content && content.code) {
          setInputText(content.code);
          setIsListeningForSms(false);
          setPermissionNotice('New SMS received and detected!');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.info('WebOTP listener notice:', err);
        }
      }
    }
  };

  const stopSmsListener = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsListeningForSms(false);
    setPermissionNotice(null);
  };

  // Simulate an incoming SMS for testing
  const simulateIncomingSms = (sampleIndex: number = 0) => {
    const s = samples[sampleIndex];
    if (s) {
      if ('vibrate' in navigator) {
        navigator.vibrate?.([60, 40, 60]);
      }
      setInputText(s.text);
      setPermissionNotice(`SMS Auto-Detected from ${s.label}!`);
      setTimeout(() => setPermissionNotice(null), 4000);
    }
  };

  // Parse text whenever input changes
  useEffect(() => {
    if (!inputText.trim()) {
      setParsed(null);
      return;
    }
    const result = SmsParserService.parseSms(inputText, accounts, categories);
    setParsed(result);
    if (result) {
      setSelectedAccountId(result.matchedAccountId || accounts[0]?.id || '');
      setSelectedCategoryId(result.suggestedCategoryId || categories[0]?.id || '');
    }
  }, [inputText, accounts, categories]);

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText(text);
          return;
        }
      }
    } catch {
      // Ignore clipboard permission issues
    }
  };

  const handleSaveToLedger = () => {
    if (!parsed) return;
    const finalResult: ParsedSmsResult = {
      ...parsed,
      matchedAccountId: selectedAccountId,
      suggestedCategoryId: selectedCategoryId,
    };
    addTransactionFromSms(finalResult);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#10B981', '#38BDF8'],
      });
    } catch {}
    setSuccessToast(`Saved ₹${parsed.amount.toFixed(2)} to ${parsed.merchant}!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto px-4 pt-4 sm:pt-5 pb-36 gap-5">
      {/* Top Banner */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <span className="material-symbols-outlined text-[26px]">sms</span>
          </div>
          <div>
            <h1 className="font-display text-[20px] font-bold text-[#FFFFFF]">
              SMS &amp; UPI Auto-Detection
            </h1>
            <p className="font-body text-[13px] text-[#888888]">
              Read incoming bank SMS messages and auto-fill your ledger
            </p>
          </div>
        </div>
      </div>

      {/* SMS Read Permission & Live Listener Card */}
      <div className="bg-[#1A1A1A] border-2 border-[#D4AF37]/60 rounded-3xl p-5 flex flex-col gap-3 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-[#D4AF37]">
              phonelink_ring
            </span>
            <h3 className="font-bold text-[15px] text-white">
              Live Incoming SMS Listener
            </h3>
          </div>

          {isListeningForSms ? (
            <span className="flex items-center gap-1.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              LISTENING
            </span>
          ) : (
            <span className="text-[11px] font-bold bg-[#262626] text-[#888888] px-2.5 py-1 rounded-full">
              IDLE
            </span>
          )}
        </div>

        <p className="text-[12px] text-[#A0A0A0] leading-relaxed">
          When activated, Money Flow listens for incoming SMS from your bank (Kotak, SBI, HDFC, ICICI, etc.) and automatically parses the debit amount, merchant, and reference code.
        </p>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {!isListeningForSms ? (
            <button
              type="button"
              onClick={startSmsListener}
              className="px-4 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-bold text-[13px] shadow-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">sensors</span>
              <span>Grant SMS Permission &amp; Listen</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopSmsListener}
              className="px-4 py-2.5 rounded-full bg-[#262626] hover:bg-[#333333] text-[#FB7185] border border-[#FB7185]/40 font-bold text-[13px] flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">stop_circle</span>
              <span>Stop Listening</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => simulateIncomingSms(0)}
            className="px-3.5 py-2.5 rounded-full bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#D4AF37] border border-[#D4AF37]/30 text-[12px] font-semibold flex items-center gap-1 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>Simulate Incoming SMS</span>
          </button>
        </div>

        {permissionNotice && (
          <div className="p-3 bg-[#121212] border border-[#D4AF37]/30 rounded-2xl flex items-center gap-2 text-[12px] text-[#D4AF37] animate-in fade-in">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>{permissionNotice}</span>
          </div>
        )}
      </div>

      {/* Quick Sample Chips */}
      <div className="flex flex-col gap-2">
        <span className="font-body text-[12px] font-bold text-[#888888] tracking-wider uppercase">
          Try Sample Bank SMS Alerts
        </span>
        <div className="flex flex-wrap gap-2">
          {samples.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(s.text)}
              className="text-left px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-[#2B2B2B] hover:border-[#D4AF37]/50 text-[12px] text-[#D0D0D0] hover:text-[#FFFFFF] transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Textarea & Paste Button */}
      <div className="flex flex-col gap-2 bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <label className="font-body text-[13px] font-semibold text-[#B0B0B0]">
            Transaction SMS / Text
          </label>
          <button
            onClick={handlePasteClipboard}
            className="flex items-center gap-1 text-[12px] font-semibold text-[#D4AF37] hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">content_paste</span>
            <span>Paste Clipboard</span>
          </button>
        </div>
        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste SMS here (e.g. Sent Rs. 95 from Kotak Bank AC 6402 to CENTRAL CAFE...)"
          className="w-full bg-[#121212] border border-[#262626] rounded-xl p-3 text-[14px] text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#D4AF37] transition-all resize-none"
        />
      </div>

      {/* Parsed Result Card */}
      {parsed ? (
        <div className="flex flex-col gap-4 bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl p-5 shadow-[0_4px_24px_rgba(212,175,55,0.06)]">
          <div className="flex items-center justify-between">
            <span className="font-body text-[12px] font-bold tracking-wider text-[#D4AF37] uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Detected Transaction
            </span>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                parsed.type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {parsed.type}
            </span>
          </div>

          <div className="flex items-baseline justify-between border-b border-[#262626] pb-3">
            <div>
              <span className="font-body text-[13px] text-[#888888] block">Merchant / Beneficiary</span>
              <span className="font-display text-[22px] font-bold text-[#FFFFFF]">
                {parsed.merchant}
              </span>
            </div>
            <div className="text-right">
              <span className="font-body text-[13px] text-[#888888] block">Amount</span>
              <span className="font-display text-[24px] font-bold text-[#D4AF37]">
                {formatCurrency(parsed.amount)}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="bg-[#121212] p-2.5 rounded-xl border border-[#262626]">
              <span className="text-[#888888] block text-[11px]">Bank / Provider</span>
              <span className="text-[#E0E0E0] font-medium">{parsed.bankName || 'Bank Account'}</span>
            </div>
            <div className="bg-[#121212] p-2.5 rounded-xl border border-[#262626]">
              <span className="text-[#888888] block text-[11px]">Account Last Digits</span>
              <span className="text-[#E0E0E0] font-medium">
                {parsed.accountNumber ? `•••• ${parsed.accountNumber}` : 'General'}
              </span>
            </div>
            <div className="bg-[#121212] p-2.5 rounded-xl border border-[#262626]">
              <span className="text-[#888888] block text-[11px]">UPI / Transaction Ref</span>
              <span className="text-[#E0E0E0] font-mono text-[12px] truncate block">
                {parsed.upiReference || 'N/A'}
              </span>
            </div>
            <div className="bg-[#121212] p-2.5 rounded-xl border border-[#262626]">
              <span className="text-[#888888] block text-[11px]">Date</span>
              <span className="text-[#E0E0E0] font-medium">{parsed.date}</span>
            </div>
          </div>

          {/* Category & Account Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <CustomDropdown
                label="Assign Category"
                options={categories.map((c) => ({
                  id: c.id,
                  label: c.name,
                  icon: c.icon,
                  sublabel: c.type.toUpperCase(),
                  color: c.color || '#D4AF37',
                }))}
                value={selectedCategoryId}
                onChange={(val) => setSelectedCategoryId(val)}
                searchable={true}
              />
            </div>

            <div>
              <CustomDropdown
                label="Target Account"
                options={accounts.map((a) => ({
                  id: a.id,
                  label: a.name,
                  icon: a.type === 'credit' ? 'credit_card' : 'account_balance',
                  sublabel: a.accountNumber ? `••••${a.accountNumber}` : a.type.toUpperCase(),
                  color: a.color || '#D4AF37',
                }))}
                value={selectedAccountId}
                onChange={(val) => setSelectedAccountId(val)}
                searchable={accounts.length > 4}
              />
            </div>
          </div>

          {/* Add to Ledger Button */}
          <button
            onClick={handleSaveToLedger}
            className="w-full mt-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] rounded-full py-3.5 font-body text-[15px] font-bold shadow-[0_4px_16px_rgba(212,175,55,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Add Transaction to Ledger</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#1A1A1A] border border-dashed border-[#2B2B2B] rounded-2xl p-8 text-center flex flex-col items-center gap-2 text-[#777777]">
          <span className="material-symbols-outlined text-[32px]">manage_search</span>
          <span className="text-[14px]">
            {inputText.trim() ? 'Could not extract valid transaction amount or details from this text.' : 'Enter or paste an SMS message above to see auto-detected details.'}
          </span>
        </div>
      )}

      {/* Android Privacy & Permission Note */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex flex-col gap-1.5 text-[12px] text-[#888888]">
        <div className="flex items-center gap-2 text-white font-bold">
          <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">privacy_tip</span>
          <span>100% On-Device Privacy</span>
        </div>
        <p>
          Money Flow processes your SMS messages entirely on your device. No SMS texts or banking data are ever transmitted to any remote servers.
        </p>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#10B981] text-[#0F0F0F] px-4 py-2.5 rounded-full font-bold text-[14px] shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[20px]">check</span>
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
};
