import React, { useEffect } from 'react';
import { Account } from '../types';
import { useFinance } from '../context/FinanceContext';

interface AccountActionSheetProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (account: Account) => void;
  onAdjustBalance: (account: Account) => void;
  onTransfer: (account: Account) => void;
  onViewTransactions: (account: Account) => void;
  onSetDefault: (account: Account) => void;
  onDelete: (account: Account) => void;
  isOnlyAccount: boolean;
}

export const AccountActionSheet: React.FC<AccountActionSheetProps> = ({
  account,
  isOpen,
  onClose,
  onEdit,
  onAdjustBalance,
  onTransfer,
  onViewTransactions,
  onSetDefault,
  onDelete,
  isOnlyAccount,
}) => {
  const { formatCurrency } = useFinance();

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !account) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1A1A] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-[#262626] relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1 bg-[#333333] rounded-full mx-auto sm:hidden mb-1" />

        {/* Header with Account summary */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#262626] border border-[#333333] text-[#D4AF37] flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[26px]">
                {account.icon || (account.type === 'bank' ? 'account_balance' : account.type === 'credit' ? 'credit_card' : 'payments')}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-[18px] text-[#FFFFFF]">
                  {account.name}
                </h3>
                {account.isDefault && (
                  <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Primary
                  </span>
                )}
              </div>
              <p className="font-body text-[12px] text-[#888888]">
                {account.type === 'bank'
                  ? `Bank Account • **** ${account.accountNumber || '4589'}`
                  : account.type === 'credit'
                  ? `Credit Card • **** ${account.accountNumber || '3310'}`
                  : 'Cash Wallet'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="w-8 h-8 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Current Balance Banner */}
        <div className="bg-[#121212] rounded-2xl p-4 border border-[#242424] flex items-center justify-between">
          <div>
            <span className="font-body text-[10px] font-bold uppercase tracking-wider text-[#888888]">
              {account.type === 'credit' ? 'Outstanding Amount' : 'Available Balance'}
            </span>
            <p className="font-display text-[22px] font-bold text-[#FFFFFF]">
              {formatCurrency(account.balance)}
            </p>
          </div>
          <button
            onClick={() => onAdjustBalance(account)}
            className="bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 text-[12px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            <span>Adjust</span>
          </button>
        </div>

        {/* Actions Menu */}
        <div className="flex flex-col gap-1.5 pt-1">
          {/* Edit Details */}
          <button
            onClick={() => onEdit(account)}
            className="w-full text-left p-3.5 rounded-2xl bg-[#222222]/50 hover:bg-[#262626] text-[#E0E0E0] border border-transparent hover:border-[#333333] flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#282828] text-[#D4AF37] flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:text-[#0F0F0F] transition-colors">
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </div>
              <div>
                <p className="font-body text-[14px] font-bold text-[#FFFFFF]">Edit Account</p>
                <p className="font-body text-[12px] text-[#888888]">
                  Change name, last 4 digits, or icon
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#666666] group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all">
              chevron_right
            </span>
          </button>

          {/* Adjust Balance */}
          <button
            onClick={() => onAdjustBalance(account)}
            className="w-full text-left p-3.5 rounded-2xl bg-[#222222]/50 hover:bg-[#262626] text-[#E0E0E0] border border-transparent hover:border-[#333333] flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#282828] text-[#34D399] flex items-center justify-center group-hover:bg-[#34D399] group-hover:text-[#0F0F0F] transition-colors">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
              <div>
                <p className="font-body text-[14px] font-bold text-[#FFFFFF]">Update Balance</p>
                <p className="font-body text-[12px] text-[#888888]">
                  Reconcile and set actual balance
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#666666] group-hover:text-[#34D399] group-hover:translate-x-0.5 transition-all">
              chevron_right
            </span>
          </button>

          {/* Transfer Funds */}
          <button
            onClick={() => onTransfer(account)}
            className="w-full text-left p-3.5 rounded-2xl bg-[#222222]/50 hover:bg-[#262626] text-[#E0E0E0] border border-transparent hover:border-[#333333] flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#282828] text-[#38BDF8] flex items-center justify-center group-hover:bg-[#38BDF8] group-hover:text-[#0F0F0F] transition-colors">
                <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
              </div>
              <div>
                <p className="font-body text-[14px] font-bold text-[#FFFFFF]">Move Money</p>
                <p className="font-body text-[12px] text-[#888888]">
                  Transfer money from this account
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#666666] group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-all">
              chevron_right
            </span>
          </button>

          {/* View Transactions */}
          <button
            onClick={() => onViewTransactions(account)}
            className="w-full text-left p-3.5 rounded-2xl bg-[#222222]/50 hover:bg-[#262626] text-[#E0E0E0] border border-transparent hover:border-[#333333] flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#282828] text-[#A78BFA] flex items-center justify-center group-hover:bg-[#A78BFA] group-hover:text-[#0F0F0F] transition-colors">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </div>
              <div>
                <p className="font-body text-[14px] font-bold text-[#FFFFFF]">View Transactions</p>
                <p className="font-body text-[12px] text-[#888888]">
                  Filtered history for this account
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#666666] group-hover:text-[#A78BFA] group-hover:translate-x-0.5 transition-all">
              chevron_right
            </span>
          </button>

          {/* Set as Primary */}
          {!account.isDefault && (
            <button
              onClick={() => onSetDefault(account)}
              className="w-full text-left p-3.5 rounded-2xl bg-[#222222]/50 hover:bg-[#262626] text-[#E0E0E0] border border-transparent hover:border-[#333333] flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#282828] text-[#F59E0B] flex items-center justify-center group-hover:bg-[#F59E0B] group-hover:text-[#0F0F0F] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">star</span>
                </div>
                <div>
                  <p className="font-body text-[14px] font-bold text-[#FFFFFF]">Set as Primary</p>
                  <p className="font-body text-[12px] text-[#888888]">
                    Use by default for new transactions
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#666666] group-hover:text-[#F59E0B] group-hover:translate-x-0.5 transition-all">
                chevron_right
              </span>
            </button>
          )}

          {/* Delete Account */}
          <button
            onClick={() => onDelete(account)}
            disabled={isOnlyAccount}
            className={`w-full text-left p-3.5 rounded-2xl border flex items-center justify-between group transition-all ${
              isOnlyAccount
                ? 'bg-[#1C1C1C] border-transparent opacity-40 cursor-not-allowed text-[#666666]'
                : 'bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border-[#EF4444]/20 text-[#EF4444]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isOnlyAccount ? 'bg-[#262626] text-[#666666]' : 'bg-[#EF4444]/20 text-[#EF4444]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </div>
              <div>
                <p className="font-body text-[14px] font-bold">
                  {isOnlyAccount ? 'Cannot Delete Only Account' : 'Delete Account'}
                </p>
                <p className="font-body text-[12px] text-[#888888]">
                  {isOnlyAccount
                    ? 'At least one account is required'
                    : 'Remove this account from your wallet'}
                </p>
              </div>
            </div>
            {!isOnlyAccount && (
              <span className="material-symbols-outlined text-[18px] text-[#EF4444]">delete_forever</span>
            )}
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-[#262626] hover:bg-[#333333] text-[#E0E0E0] font-body text-[14px] font-bold transition-colors mt-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
