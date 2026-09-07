import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { ScreenTab } from '../types';
import logoImg from '../assets/logo.png';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const { tab, setTab, goBack, setIsProfileModalOpen, lockApp } = useFinance();

  const getDisplayTitle = () => {
    if (title) return title;
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'activity':
        return 'Activity';
      case 'add-transaction':
        return 'Add Transaction';
      case 'budgets':
        return 'Budgets';
      case 'categories':
        return 'Categories';
      case 'rules':
        return 'Automation Rules';
      case 'accounts':
        return 'Accounts';
      case 'reports':
        return 'Reports';
      case 'import-statement':
        return 'Statement Summary';
      case 'import-review':
        return 'Review & Categorize';
      case 'settings':
        return 'Settings';
      default:
        return 'Money Flow';
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  const isSubScreen =
    showBack ||
    (tab !== 'dashboard' && tab !== 'activity' && tab !== 'budgets' && tab !== 'settings');

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#0F0F0F]/90 backdrop-blur-xl pt-safe border-b border-[#222222] transition-all duration-300">
      <div className="max-w-md mx-auto h-20 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSubScreen ? (
            <div className="flex items-center gap-2">
              <button
                id="header-back-btn"
                onClick={handleBack}
                aria-label="Go back"
                className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#A0A0A0] hover:text-[#D4AF37] hover:bg-white/5 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
              </button>
              <h1 className="font-display font-semibold text-[22px] tracking-tight text-[#E0E0E0]">
                {getDisplayTitle()}
              </h1>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setTab('dashboard')}>
              <img
                alt="Money Flow"
                className="h-8 w-auto object-contain transition-transform hover:scale-105 rounded-lg"
                src={logoImg}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = './logo.png';
                }}
              />
              <span className="font-display font-bold text-[24px] text-[#D4AF37] tracking-tight">
                {getDisplayTitle()}
              </span>
            </div>
          )}
        </div>

        <div>
          {rightAction ? (
            rightAction
          ) : isSubScreen && tab === 'add-transaction' ? (
            <button
              id="header-info-btn"
              onClick={() => setIsProfileModalOpen(true)}
              className="w-10 h-10 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37]/25 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">info</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="header-lock-btn"
                onClick={lockApp}
                aria-label="Lock App with Biometrics"
                title="Lock Vault with Biometrics / PIN"
                className="w-9 h-9 rounded-full bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-[#A0A0A0] hover:text-[#D4AF37] hover:border-[#D4AF37]/40 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
              </button>
              <button
                id="header-profile-btn"
                onClick={() => setIsProfileModalOpen(true)}
                aria-label="User Profile"
                className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-[0_2px_12px_rgba(212,175,55,0.3)] hover:bg-[#E5C158] active:scale-95 transition-all text-[#0F0F0F]"
              >
                <span className="material-symbols-outlined text-[20px] font-bold">person</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
