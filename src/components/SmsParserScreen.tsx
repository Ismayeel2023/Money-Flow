import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { SmsParserService } from '../services/smsParserService';
import { ParsedSmsResult } from '../types';
import { CustomDropdown } from './CustomDropdown';

export const SmsParserScreen: React.FC = () => {
  const { accounts, categories, addTransactionFromSms, formatCurrency, setTab } = useFinance();

  const [inputText, setInputText] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedSmsResult | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

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
    setSuccessToast(`Saved ₹${parsed.amount.toFixed(2)} to ${parsed.merchant}!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto px-4 pt-4 sm:pt-5 pb-32 gap-5">
      {/* Top Banner */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <span className="material-symbols-outlined text-[26px]">sms</span>
          </div>
          <div>
            <h1 className="font-display text-[20px] font-bold text-[#FFFFFF]">
              SMS & Clipboard Auto-Detection
            </h1>
            <p className="font-body text-[13px] text-[#888888]">
              Paste or type any bank or UPI transaction message
            </p>
          </div>
        </div>
      </div>

      {/* Quick Sample Chips */}
      <div className="flex flex-col gap-2">
        <span className="font-body text-[12px] font-bold text-[#888888] tracking-wider uppercase">
          Try Sample Statements & SMS
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
