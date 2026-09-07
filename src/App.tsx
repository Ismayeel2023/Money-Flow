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
import { SecurityModal } from './components/SecurityModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import { LockScreen } from './components/LockScreen';
import { MerchantsScreen } from './components/MerchantsScreen';
import { CategorySpendingAnalysis } from './components/CategorySpendingAnalysis';
import { SmsParserScreen } from './components/SmsParserScreen';
import { SubscriptionsScreen } from './components/SubscriptionsScreen';
import { SavingsGoalsScreen } from './components/SavingsGoalsScreen';
import { ExportBackupScreen } from './components/ExportBackupScreen';
import { EdgeSwipeBack } from './components/EdgeSwipeBack';

const MainContent: React.FC = () => {
  const {
    tab,
    setTab,
    goBack,
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
        goBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack]);

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
      case 'category-spending':
        return (
          <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-4 sm:pt-5 pb-32">
            <CategorySpendingAnalysis />
          </div>
        );
      case 'merchants':
        return <MerchantsScreen />;
      case 'sms-parser':
        return <SmsParserScreen />;
      case 'subscriptions':
        return <SubscriptionsScreen />;
      case 'goals':
        return <SavingsGoalsScreen />;
      case 'export-backup':
        return <ExportBackupScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  const getHeaderProps = () => {
    switch (tab) {
      case 'sms-parser':
        return {
          title: 'SMS & UPI Auto-Detect',
          showBack: true,
          onBack: () => goBack(),
        };
      case 'subscriptions':
        return {
          title: 'Subscriptions',
          showBack: true,
          onBack: () => goBack(),
        };
      case 'goals':
        return {
          title: 'Savings Goals',
          showBack: true,
          onBack: () => goBack(),
        };
      case 'export-backup':
        return {
          title: 'Export & Backup',
          showBack: true,
          onBack: () => goBack(),
        };
      case 'merchants':
        return {
          title: 'People & Merchants',
          showBack: true,
          onBack: () => goBack(),
        };
      case 'category-spending':
        return {
          title: 'Category Spending',
          showBack: true,
          onBack: () => goBack(),
        };
      case 'add-transaction':
        return {
          title: 'Add Transaction',
          showBack: true,
          onBack: () => goBack(),
        };
      case 'import-review':
        return {
          title: 'Review Transactions',
          showBack: true,
          onBack: () => goBack(),
        };
      case 'categories':
        return {
          title: 'Categories',
          showBack: true,
          onBack: () => goBack(),
        };
      case 'rules':
        return {
          title: 'Automation Rules',
          showBack: true,
          onBack: () => goBack(),
        };
      case 'reports':
        return {
          title: 'Reports & Analytics',
          showBack: true,
          onBack: () => goBack(),
        };
      case 'accounts':
        return {
          title: 'Accounts',
          showBack: true,
          onBack: () => goBack(),
        };
      case 'import-statement':
        return {
          title: 'Import Statement',
          showBack: true,
          onBack: () => goBack(),
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

      {/* Main Content View with natural document flow under sticky header */}
      <main className="flex-1 overflow-x-hidden">
        {renderScreen()}
      </main>

      {/* Bottom Navigation */}
      {!hideBottomNav && <BottomNavigation />}

      {/* Global Modals */}
      <EdgeSwipeBack />
      <AddAccountModal />
      <TransferModal />
      <NewBudgetModal />
      <TransactionDetailModal />
      <UserProfileModal />
      <SecurityModal />
      <AppSettingsModal />
      <LockScreen />
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
