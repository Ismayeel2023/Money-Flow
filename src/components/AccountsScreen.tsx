import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Account } from '../types';

export const AccountsScreen: React.FC = () => {
  const {
    accounts,
    totalNetWorth,
    formatCurrency,
    setIsAddAccountModalOpen,
    setIsTransferModalOpen,
  } = useFinance();

  const bankAccounts = accounts.filter((a) => a.type === 'bank');
  const cashAccounts = accounts.filter((a) => a.type === 'cash');
  const creditAccounts = accounts.filter((a) => a.type === 'credit');

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-2 pb-32 gap-6">
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
          onClick={() => setIsTransferModalOpen(true)}
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
              className="bg-[#1A1A1A] rounded-[32px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#262626] hover:border-[#D4AF37]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#262626] flex items-center justify-center rounded-2xl text-[#D4AF37] border border-[#333333]">
                    <span className="material-symbols-outlined text-[24px]">
                      {acc.icon || 'account_balance'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-body text-[16px] font-bold text-[#E0E0E0]">
                      {acc.name}
                    </h4>
                    <p className="font-body text-[13px] text-[#888888]">
                      **** {acc.accountNumber || '4589'}
                    </p>
                  </div>
                </div>

                <button
                  aria-label="Account options"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#888888] hover:text-[#D4AF37] hover:bg-white/5"
                >
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
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
              className="bg-[#1A1A1A] rounded-[32px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#262626] hover:border-[#D4AF37]/30 transition-all duration-300"
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
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-display text-[20px] sm:text-[22px] font-bold text-[#FFFFFF]">
                    {formatCurrency(cash.balance)}
                  </p>
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
                    <h4 className="font-body text-[16px] font-bold text-[#FFFFFF]">
                      {card.name}
                    </h4>
                  </div>
                  <span className="font-body text-[12px] font-bold tracking-wider text-[#D4AF37]">
                    VISA **** {card.accountNumber || '3310'}
                  </span>
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
    </div>
  );
};
