import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { SavingsGoal } from '../types';
import { CustomDropdown } from './CustomDropdown';

export const SavingsGoalsScreen: React.FC = () => {
  const {
    savingsGoals,
    addSavingsGoal,
    deleteSavingsGoal,
    depositToGoal,
    withdrawFromGoal,
    formatCurrency,
    accounts,
  } = useFinance();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeGoalForAction, setActiveGoalForAction] = useState<{
    goal: SavingsGoal;
    action: 'deposit' | 'withdraw';
  } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [categoryName, setCategoryName] = useState('Emergency Fund');
  const [icon, setIcon] = useState('savings');
  const [color, setColor] = useState('#10B981');

  // Action modal state
  const [actionAmount, setActionAmount] = useState('');
  const [actionAccountId, setActionAccountId] = useState(accounts[0]?.id || '');

  // Aggregated metrics
  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(targetAmount);
    if (!name.trim() || isNaN(num) || num <= 0) return;

    addSavingsGoal({
      name: name.trim(),
      targetAmount: num,
      targetDate: targetDate || undefined,
      categoryName,
      icon,
      color,
    });

    setName('');
    setTargetAmount('');
    setIsAddModalOpen(false);
  };

  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoalForAction) return;

    const amt = parseFloat(actionAmount);
    if (isNaN(amt) || amt <= 0) return;

    if (activeGoalForAction.action === 'deposit') {
      depositToGoal(activeGoalForAction.goal.id, amt, actionAccountId);
    } else {
      withdrawFromGoal(activeGoalForAction.goal.id, amt, actionAccountId);
    }

    setActionAmount('');
    setActiveGoalForAction(null);
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto px-4 pt-4 sm:pt-5 pb-32 gap-5">
      {/* Header Banner */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
                <span className="material-symbols-outlined text-[26px]">savings</span>
              </div>
              <div>
                <h1 className="font-display text-[22px] font-bold text-[#FFFFFF]">
                  Savings Goals & Sinking Funds
                </h1>
                <p className="font-body text-[13px] text-[#888888]">
                  Track progress for emergency fund, vacation, tech & big purchases
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] rounded-full px-4 py-2 text-[13px] font-bold shadow-md flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Goal</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-[#121212] border border-[#262626] rounded-2xl p-4">
              <span className="font-body text-[11px] font-bold tracking-wider text-[#888888] uppercase block">
                Total Saved
              </span>
              <span className="font-display text-[24px] font-bold text-[#10B981]">
                {formatCurrency(totalSaved)}
              </span>
            </div>
            <div className="bg-[#121212] border border-[#262626] rounded-2xl p-4">
              <span className="font-body text-[11px] font-bold tracking-wider text-[#888888] uppercase block">
                Overall Progress
              </span>
              <span className="font-display text-[24px] font-bold text-[#FFFFFF]">
                {overallPercentage}%
                <span className="text-[12px] text-[#888888] font-normal"> of {formatCurrency(totalTarget)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="flex flex-col gap-3">
        {savingsGoals.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-dashed border-[#2B2B2B] rounded-2xl p-8 text-center text-[#777777]">
            <span className="material-symbols-outlined text-[32px] mb-2 block">savings</span>
            <span>No savings goals yet. Create your first target above!</span>
          </div>
        ) : (
          savingsGoals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const isFinished = goal.currentAmount >= goal.targetAmount;

            return (
              <div
                key={goal.id}
                className="bg-[#1A1A1A] border border-[#262626] hover:border-[#383838] rounded-2xl p-4 flex flex-col gap-3.5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#FFFFFF] shadow-sm"
                      style={{ backgroundColor: goal.color || '#10B981' }}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {goal.icon || 'savings'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-[16px] font-bold text-[#FFFFFF] flex items-center gap-2">
                        <span>{goal.name}</span>
                        {isFinished && (
                          <span className="text-[11px] bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded-full font-bold border border-[#10B981]/30">
                            Completed 🎉
                          </span>
                        )}
                      </h3>
                      <span className="text-[12px] text-[#888888]">
                        {goal.categoryName || 'Savings'} {goal.targetDate ? `• Target: ${goal.targetDate}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display text-[17px] font-bold text-[#FFFFFF]">
                      {formatCurrency(goal.currentAmount)}
                    </div>
                    <div className="text-[12px] text-[#888888]">
                      target {formatCurrency(goal.targetAmount)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-[#888888] font-semibold">
                    <span>{pct}% funded</span>
                    <span>{formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))} remaining</span>
                  </div>
                  <div className="w-full bg-[#121212] rounded-full h-2.5 overflow-hidden border border-[#262626]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: goal.color || '#10B981',
                      }}
                    />
                  </div>
                </div>

                {/* Actions: Deposit / Withdraw / Delete */}
                <div className="flex items-center justify-between border-t border-[#262626] pt-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveGoalForAction({ goal, action: 'deposit' })}
                      className="px-3.5 py-1.5 rounded-full bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 text-[12px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">add</span>
                      <span>Deposit</span>
                    </button>

                    <button
                      disabled={goal.currentAmount <= 0}
                      onClick={() => setActiveGoalForAction({ goal, action: 'withdraw' })}
                      className="px-3.5 py-1.5 rounded-full bg-[#262626] hover:bg-[#333333] disabled:opacity-40 text-[#E0E0E0] text-[12px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">remove</span>
                      <span>Withdraw</span>
                    </button>
                  </div>

                  <button
                    onClick={() => deleteSavingsGoal(goal.id)}
                    className="p-1.5 rounded-full text-[#888888] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete goal"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h2 className="font-display text-[18px] font-bold text-[#FFFFFF]">
                Create Savings Goal
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#888888] hover:text-[#FFFFFF]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[12px] font-semibold text-[#888888] block mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, Goa Trip, Bike"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl p-3 text-[14px] text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#888888] block mb-1">
                    Target Amount (INR)
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="50000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl p-3 text-[14px] text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#888888] block mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl p-3 text-[14px] text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#888888] block mb-1">
                  Tag / Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Travel, Safety Net, Electronics"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl p-3 text-[14px] text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-3 rounded-full bg-[#262626] hover:bg-[#333333] text-[#FFFFFF] text-[14px] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] text-[14px] font-bold shadow-md transition-all"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit / Withdraw Action Modal */}
      {activeGoalForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h2 className="font-display text-[18px] font-bold text-[#FFFFFF] capitalize">
                {activeGoalForAction.action} - {activeGoalForAction.goal.name}
              </h2>
              <button
                onClick={() => setActiveGoalForAction(null)}
                className="text-[#888888] hover:text-[#FFFFFF]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleExecuteAction} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[12px] font-semibold text-[#888888] block mb-1">
                  Amount (INR)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. 5000"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl p-3 text-[14px] text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <CustomDropdown
                  label={activeGoalForAction.action === 'deposit' ? 'From Bank Account' : 'To Bank Account'}
                  options={accounts.map((a) => ({
                    id: a.id,
                    label: a.name,
                    icon: a.type === 'credit' ? 'credit_card' : 'account_balance',
                    sublabel: `Bal: ${formatCurrency(a.balance)}`,
                    color: a.color || '#D4AF37',
                  }))}
                  value={actionAccountId}
                  onChange={(val) => setActionAccountId(val)}
                  searchable={accounts.length > 4}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveGoalForAction(null)}
                  className="w-1/2 py-3 rounded-full bg-[#262626] hover:bg-[#333333] text-[#FFFFFF] text-[14px] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] text-[14px] font-bold shadow-md transition-all capitalize"
                >
                  Confirm {activeGoalForAction.action}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
