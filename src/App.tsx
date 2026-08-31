/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { DashboardScreen } from './components/DashboardScreen';
import { AddTransactionScreen } from './components/AddTransactionScreen';
import { ActivityScreen } from './components/ActivityScreen';
import { BudgetsScreen } from './components/BudgetsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AccountsScreen } from './components/AccountsScreen';
import { ImportStatementScreen } from './components/ImportStatementScreen';
import { ImportReviewModal } from './components/ImportReviewModal';
import { ReportsScreen } from './components/ReportsScreen';
import { CategoriesScreen } from './components/CategoriesScreen';
import { RulesScreen } from './components/RulesScreen';
import { AddAccountModal } from './components/AddAccountModal';
import { TransferModal } from './components/TransferModal';
import { NewBudgetModal } from './components/NewBudgetModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { UserProfileModal } from './components/UserProfileModal';

const MainContent: React.FC = () => {
  const {
    tab,
    setTab,
    activeTransactionForDetail,
    setActiveTransactionForDetail,
    isAddAccountModalOpen,
    setIsAddAccountModalOpen,
    isTransferModalOpen,
    setIsTransferModalOpen,
    isNewBudgetModalOpen,
    setIsNewBudgetModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
  } = useFinance();

  // Handle hardware / keyboard back actions (Escape key & popstate)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeTransactionForDetail) {
          setActiveTransactionForDetail(null);
          return;
        }
        if (isAddAccountModalOpen) {
          setIsAddAccountModalOpen(false);
          return;
        }
        if (isTransferModalOpen) {
          setIsTransferModalOpen(false);
          return;
        }
        if (isNewBudgetModalOpen) {
          setIsNewBudgetModalOpen(false);
          return;
        }
        if (isProfileModalOpen) {
          setIsProfileModalOpen(false);
          return;
        }
        if (tab !== 'dashboard' && tab !== 'activity' && tab !== 'budgets' && tab !== 'settings') {
          setTab('dashboard');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTransactionForDetail,
    isAddAccountModalOpen,
    isTransferModalOpen,
    isNewBudgetModalOpen,
    isProfileModalOpen,
    tab,
    setActiveTransactionForDetail,
    setIsAddAccountModalOpen,
    setIsTransferModalOpen,
    setIsNewBudgetModalOpen,
    setIsProfileModalOpen,
    setTab,
  ]);

  const renderScreen = () => {
    switch (tab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'activity':
        return <ActivityScreen />;
      case 'add-transaction':
        return <AddTransactionScreen />;
      case 'budgets':
        return <BudgetsScreen />;
      case 'categories':
        return <CategoriesScreen />;
      case 'rules':
        return <RulesScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'accounts':
        return <AccountsScreen />;
      case 'import-statement':
        return <ImportStatementScreen />;
      case 'import-review':
        return <ImportReviewModal />;
      case 'reports':
        return <ReportsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  const getHeaderProps = () => {
    switch (tab) {
      case 'add-transaction':
        return {
          title: 'Add Transaction',
          showBack: true,
          onBack: () => setTab('dashboard'),
        };
      case 'import-review':
        return {
          title: 'Review Transactions',
          showBack: true,
          onBack: () => setTab('import-statement'),
        };
      case 'categories':
        return {
          title: 'Categories',
          showBack: true,
          onBack: () => setTab('settings'),
        };
      case 'rules':
        return {
          title: 'Automation Rules',
          showBack: true,
          onBack: () => setTab('settings'),
        };
      case 'reports':
        return {
          title: 'Reports & Analytics',
          showBack: true,
          onBack: () => setTab('settings'),
        };
      case 'accounts':
        return {
          title: 'Accounts',
          showBack: true,
          onBack: () => setTab('settings'),
        };
      case 'import-statement':
        return {
          title: 'Import Statement',
          showBack: true,
          onBack: () => setTab('settings'),
        };
      default:
        return {
          showBack: false,
        };
    }
  };

  // Do not render bottom nav on Add Transaction or Review Transaction screens
  // to match the exact full-screen layout in screenshots
  const hideBottomNav = tab === 'add-transaction' || tab === 'import-review';

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#E0E0E0] flex flex-col antialiased selection:bg-[#D4AF37]/20 selection:text-[#D4AF37]">
      {/* Header */}
      <Header {...getHeaderProps()} />

      {/* Main Content View with paddingTop to account for fixed header */}
      <main className="flex-1 pt-20 overflow-x-hidden">
        {renderScreen()}
      </main>

      {/* Bottom Navigation */}
      {!hideBottomNav && <BottomNavigation />}

      {/* Global Modals */}
      <AddAccountModal />
      <TransferModal />
      <NewBudgetModal />
      <TransactionDetailModal />
      <UserProfileModal />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainContent />
    </FinanceProvider>
  );
}
