import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Account } from '../types';
import { AccountActionSheet } from './AccountActionSheet';
import { EditAccountModal } from './EditAccountModal';
import { AdjustBalanceModal } from './AdjustBalanceModal';

export const AccountsScreen: React.FC = () => {
  const {
    accounts,
    totalNetWorth,
    formatCurrency,
    setIsAddAccountModalOpen,
    setIsTransferModalOpen,
    updateAccount,
    deleteAccount,
    setTransferPreselectedFromAccount,
    setActivityFilterAccount,
    setTab,
  } = useFinance();

  const [selectedAccountForMenu, setSelectedAccountForMenu] = useState<Account | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustBalanceModalOpen, setIsAdjustBalanceModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [accountToAdjust, setAccountToAdjust] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const bankAccounts = accounts.filter((a) => a.type === 'bank');
  const cashAccounts = accounts.filter((a) => a.type === 'cash');
  const creditAccounts = accounts.filter((a) => a.type === 'credit');

  const handleOpenMenu = (e: React.MouseEvent, acc: Account) => {
    e.stopPropagation();
    setSelectedAccountForMenu(acc);
  };

  const handleEdit = (acc: Account) => {
    setSelectedAccountForMenu(null);
    setAccountToEdit(acc);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (id: string, updates: Partial<Account>) => {
    updateAccount(id, updates);
    showToast('Account details updated successfully');
  };

  const handleAdjustBalance = (acc: Account) => {
    setSelectedAccountForMenu(null);
    setAccountToAdjust(acc);
    setIsAdjustBalanceModalOpen(true);
  };

  const handleSaveBalance = (id: string, newBalance: number) => {
    const acc = accounts.find((a) => a.id === id);
    updateAccount(id, {
      balance: newBalance,
      outstanding: acc?.type === 'credit' ? Math.abs(newBalance) : undefined,
    });
    showToast(`Balance updated to ${formatCurrency(newBalance)}`);
  };

  const handleTransfer = (acc: Account) => {
    setSelectedAccountForMenu(null);
    setTransferPreselectedFromAccount(acc.id);
    setIsTransferModalOpen(true);
  };

  const handleViewTransactions = (acc: Account) => {
    setSelectedAccountForMenu(null);
    setActivityFilterAccount(acc.id);
    setTab('activity');
  };

  const handleSetDefault = (acc: Account) => {
    setSelectedAccountForMenu(null);
    accounts.forEach((a) => {
      updateAccount(a.id, { isDefault: a.id === acc.id });
    });
    showToast(`${acc.name} set as primary account`);
  };

  const handleDeleteRequest = (acc: Account) => {
    setSelectedAccountForMenu(null);
    if (accounts.length <= 1) {
      showToast('Cannot delete the only remaining account');
      return;
    }
    setAccountToDelete(acc);
  };

  const handleConfirmDelete = () => {
    if (!accountToDelete) return;
    const name = accountToDelete.name;
    const success = deleteAccount(accountToDelete.id);
    setAccountToDelete(null);
    if (success) {
      showToast(`${name} deleted`);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-4 sm:pt-5 pb-32 gap-6 relative">
      {/* Toast feedback banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] bg-[#1E1E1E] text-[#FFFFFF] border border-[#D4AF37]/50 shadow-[0_8px_24px_rgba(0,0,0,0.6)] px-4 py-2.5 rounded-full flex items-center gap-2 animate-fadeIn text-[13px] font-body">
          <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Total Net Worth Card */}
      <section className="bg-[#1A1A1A] rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border border-[#262626] relative overflow-hidden">
        {/* Glows */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-[#10B981]/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center gap-1">
          <h2 className="font-body text-[11px] font-bold text-[#888888] uppercase tracking-wider">
            Total Net Worth
          </h2>
          <p className="font-display text-[34px] sm:text-[38px] font-bold text-[#FFFFFF] my-1 tracking-tight">
            {formatCurrency(totalNetWorth)}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-[18px] text-[#34D399]">
              trending_up
            </span>
            <span className="font-body text-[13px] text-[#34D399] font-semibold">
              +2.4% this month
            </span>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          id="btn-add-account"
          onClick={() => setIsAddAccountModalOpen(true)}
          className="flex-1 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-bold rounded-full py-3.5 px-4 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(212,175,55,0.3)] active:scale-95 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[20px] font-bold">add_circle</span>
          <span className="font-body text-[14px]">Add Account</span>
        </button>

        <button
          id="btn-move-money"
          onClick={() => {
            setTransferPreselectedFromAccount(null);
            setIsTransferModalOpen(true);
          }}
          className="flex-1 bg-[#262626] hover:bg-[#333333] text-[#E0E0E0] border border-[#383838] rounded-full py-3.5 px-4 flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.4)] active:scale-95 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[20px] text-[#D4AF37]">swap_horiz</span>
          <span className="font-body text-[14px] font-bold">Move Money</span>
        </button>
      </div>

      {/* Bank Accounts Section */}
      <section className="flex flex-col gap-3">
        <h3 className="font-display text-[20px] sm:text-[22px] font-bold text-[#E0E0E0]">
          Bank Accounts
        </h3>

        <div className="flex flex-col gap-3.5">
          {bankAccounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-[#1A1A1A] rounded-[32px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#262626] hover:border-[#D4AF37]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-300 relative group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#262626] flex items-center justify-center rounded-2xl text-[#D4AF37] border border-[#333333]">
                    <span className="material-symbols-outlined text-[24px]">
                      {acc.icon || 'account_balance'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-body text-[16px] font-bold text-[#E0E0E0]">
                        {acc.name}
                      </h4>
                      {acc.isDefault && (
                        <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="font-body text-[13px] text-[#888888]">
                      **** {acc.accountNumber || '4589'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`Options for ${acc.name}`}
                  onClick={(e) => handleOpenMenu(e, acc)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#888888] hover:text-[#D4AF37] hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[22px]">more_vert</span>
                </button>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider mb-0.5">
                    Available Balance
                  </p>
                  <p className="font-display text-[22px] sm:text-[24px] font-bold text-[#FFFFFF]">
                    {formatCurrency(acc.balance)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAccountToAdjust(acc);
                    setIsAdjustBalanceModalOpen(true);
                  }}
                  className="text-[11px] font-body text-[#888888] hover:text-[#D4AF37] flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  <span>Adjust</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cash & Cards Section */}
      <section className="flex flex-col gap-3">
        <h3 className="font-display text-[20px] sm:text-[22px] font-bold text-[#E0E0E0]">
          Cash &amp; Cards
        </h3>

        <div className="flex flex-col gap-3.5">
          {/* Wallet Cash */}
          {cashAccounts.map((cash) => (
            <div
              key={cash.id}
              className="bg-[#1A1A1A] rounded-[32px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#262626] hover:border-[#D4AF37]/30 transition-all duration-300 relative group"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#10B981]/15 flex items-center justify-center rounded-2xl text-[#34D399]">
                    <span className="material-symbols-outlined text-[24px]">payments</span>
                  </div>
                  <div>
                    <h4 className="font-body text-[16px] font-bold text-[#E0E0E0]">
                      {cash.name}
                    </h4>
                    <p className="font-body text-[12px] text-[#888888]">Physical Wallet</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-display text-[20px] sm:text-[22px] font-bold text-[#FFFFFF]">
                      {formatCurrency(cash.balance)}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={`Options for ${cash.name}`}
                    onClick={(e) => handleOpenMenu(e, cash)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#888888] hover:text-[#D4AF37] hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[22px]">more_vert</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Credit Card */}
          {creditAccounts.map((card) => (
            <div
              key={card.id}
              className="bg-gradient-to-br from-[#24211A] via-[#1A1A1A] to-[#121212] border border-[#D4AF37]/30 rounded-[32px] p-5 sm:p-6 shadow-[0_8px_28px_rgba(0,0,0,0.5)] relative overflow-hidden text-[#E0E0E0]"
            >
              {/* Glow */}
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#D4AF37]/20 border border-[#D4AF37]/40 backdrop-blur-sm rounded-xl flex items-center justify-center text-[#D4AF37]">
                      <span className="material-symbols-outlined text-[20px]">
                        credit_card
                      </span>
                    </div>
                    <div>
                      <h4 className="font-body text-[16px] font-bold text-[#FFFFFF]">
                        {card.name}
                      </h4>
                      <span className="font-body text-[12px] font-bold tracking-wider text-[#D4AF37]">
                        VISA **** {card.accountNumber || '3310'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Options for ${card.name}`}
                    onClick={(e) => handleOpenMenu(e, card)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#888888] hover:text-[#D4AF37] hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[22px]">more_vert</span>
                  </button>
                </div>

                <div className="flex gap-4 pt-2">
                  <div className="flex-1">
                    <p className="font-body text-[10px] font-bold text-[#FB7185] uppercase tracking-wider mb-0.5">
                      Outstanding
                    </p>
                    <p className="font-display text-[18px] sm:text-[20px] font-bold text-[#FFFFFF]">
                      -{formatCurrency(card.outstanding || Math.abs(card.balance))}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider mb-0.5">
                      Available Limit
                    </p>
                    <p className="font-display text-[18px] sm:text-[20px] font-bold text-[#D4AF37]">
                      {formatCurrency(card.availableLimit || 81800)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Dot Options Action Sheet */}
      <AccountActionSheet
        account={selectedAccountForMenu}
        isOpen={Boolean(selectedAccountForMenu)}
        onClose={() => setSelectedAccountForMenu(null)}
        onEdit={handleEdit}
        onAdjustBalance={handleAdjustBalance}
        onTransfer={handleTransfer}
        onViewTransactions={handleViewTransactions}
        onSetDefault={handleSetDefault}
        onDelete={handleDeleteRequest}
        isOnlyAccount={accounts.length <= 1}
      />

      {/* Edit Account Modal */}
      <EditAccountModal
        account={accountToEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setAccountToEdit(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Adjust Balance Modal */}
      <AdjustBalanceModal
        account={accountToAdjust}
        isOpen={isAdjustBalanceModalOpen}
        onClose={() => {
          setIsAdjustBalanceModalOpen(false);
          setAccountToAdjust(null);
        }}
        onSave={handleSaveBalance}
      />

      {/* Delete Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#EF4444]/30 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>

            <div className="text-center flex flex-col gap-1">
              <h3 className="font-display font-bold text-[18px] text-[#FFFFFF]">
                Delete Account?
              </h3>
              <p className="font-body text-[13px] text-[#AAAAAA]">
                Are you sure you want to delete <span className="text-[#FFFFFF] font-bold">"{accountToDelete.name}"</span>?
              </p>
              <p className="font-body text-[11px] text-[#888888] mt-1">
                Existing transactions linked to this account will remain safely in your history.
              </p>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="flex-1 bg-[#262626] hover:bg-[#333333] text-[#E0E0E0] font-body text-[14px] font-bold py-3.5 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-[#FFFFFF] font-display text-[14px] font-bold py-3.5 rounded-full shadow-[0_4px_16px_rgba(239,68,68,0.3)] transition-all active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

