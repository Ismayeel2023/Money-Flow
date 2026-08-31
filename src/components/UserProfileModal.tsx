import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export const UserProfileModal: React.FC = () => {
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    resetToDemoData,
    processStatementUpload,
  } = useFinance();

  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [currency, setCurrency] = useState('₹ (INR)');
  const [userName, setUserName] = useState('Mohamed Ismayeel');
  const [userEmail] = useState('mohamedismayeel2005@gmail.com');
  const [notification, setNotification] = useState('');

  if (!isProfileModalOpen) return null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#262626] relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsProfileModalOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Profile Card */}
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37] text-[#0F0F0F] flex items-center justify-center text-[28px] font-bold shadow-md">
            <span className="material-symbols-outlined text-[32px] font-bold">person</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-[18px] text-[#FFFFFF]">
              {userName}
            </h3>
            <p className="font-body text-[13px] text-[#888888]">{userEmail}</p>
          </div>
        </div>

        {notification && (
          <div className="bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30 text-[13px] font-bold py-2 px-3 rounded-xl text-center">
            {notification}
          </div>
        )}

        <div className="flex flex-col gap-3 mt-1 text-[14px]">
          {/* Security PIN / Biometric Toggle */}
          <div className="bg-[#262626] rounded-2xl p-3.5 flex items-center justify-between border border-[#383838]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#D4AF37] text-[20px]">
                fingerprint
              </span>
              <div>
                <p className="font-bold text-[#FFFFFF] text-[14px]">Biometric Lock</p>
                <p className="text-[11px] text-[#888888]">Require FaceID/Fingerprint</p>
              </div>
            </div>
            <button
              onClick={() => {
                setBiometricEnabled(!biometricEnabled);
                showNotification(
                  !biometricEnabled ? 'Biometric Lock enabled' : 'Biometric Lock disabled'
                );
              }}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                biometricEnabled ? 'bg-[#D4AF37]' : 'bg-[#383838]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#0F0F0F] transition-transform ${
                  biometricEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Currency Preference */}
          <div className="bg-[#262626] rounded-2xl p-3.5 flex items-center justify-between border border-[#383838]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#D4AF37] text-[20px]">
                currency_rupee
              </span>
              <div>
                <p className="font-bold text-[#FFFFFF] text-[14px]">Display Currency</p>
                <p className="text-[11px] text-[#888888]">Primary ledger currency</p>
              </div>
            </div>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                showNotification(`Currency set to ${e.target.value}`);
              }}
              className="bg-[#1A1A1A] text-[12px] font-bold text-[#E0E0E0] px-2.5 py-1.5 rounded-xl border border-[#383838] outline-none"
            >
              <option value="₹ (INR)">₹ (INR)</option>
              <option value="$ (USD)">$ (USD)</option>
              <option value="€ (EUR)">€ (EUR)</option>
              <option value="£ (GBP)">£ (GBP)</option>
            </select>
          </div>

          {/* Clear All Data */}
          <button
            type="button"
            onClick={() => {
              resetToDemoData();
              showNotification('All ledger data and balances reset to ₹0');
              setIsProfileModalOpen(false);
            }}
            className="w-full bg-[#241A1A] hover:bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 font-body text-[14px] font-bold py-3.5 rounded-full transition-colors mt-2 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            <span>Clear All Data &amp; Reset to ₹0</span>
          </button>
        </div>
      </div>
    </div>
  );
};
