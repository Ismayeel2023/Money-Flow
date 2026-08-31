import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { ScreenTab } from '../types';

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
  const { tab, setTab, setIsProfileModalOpen } = useFinance();

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
      if (
        tab === 'categories' ||
        tab === 'rules' ||
        tab === 'accounts' ||
        tab === 'reports'
      ) {
        setTab('settings');
      } else if (tab === 'import-review') {
        setTab('import-statement');
      } else if (tab === 'import-statement') {
        setTab('settings');
      } else {
        setTab('dashboard');
      }
    }
  };

  const isSubScreen =
    showBack ||
    tab === 'add-transaction' ||
    tab === 'categories' ||
    tab === 'rules' ||
    tab === 'accounts' ||
    tab === 'reports' ||
    tab === 'import-statement' ||
    tab === 'import-review';

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
                alt="Money Flow Logo"
                className="h-8 w-auto object-contain transition-transform hover:scale-105"
                src="https://lh3.googleusercontent.com/aida/AEtjO1X4ePx3CYNLCY5LLTTiQHaUbrnIl6E10MK9H7nIjDU_d_rxexR3B4tpsZyU_If-6gE2Yj1cZ29dD948cAQfd7HxsmtTus2PDuY2rxuCUQw9Xu0HlU6nCnylVte1K-L_p6n3TACNPlh8PNfduDqqHsPj2i_XVdfUWC5IfbrMIduY36hB_d3gDJHmUjv0v-DSdsAeXvp5EwuYKxE7uRzc0cNzNr6o2ky4JgDRigrZg3Rp5YvWGFyHm-X8UcAs"
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
            <button
              id="header-profile-btn"
              onClick={() => setIsProfileModalOpen(true)}
              aria-label="User Profile"
              className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-[0_2px_12px_rgba(212,175,55,0.3)] hover:bg-[#E5C158] active:scale-95 transition-all text-[#0F0F0F]"
            >
              <span className="material-symbols-outlined text-[20px] font-bold">person</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
