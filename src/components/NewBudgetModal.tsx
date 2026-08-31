import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export const NewBudgetModal: React.FC = () => {
  const { categories, addBudget, isNewBudgetModalOpen, setIsNewBudgetModalOpen } = useFinance();

  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-dining');
  const [allocatedStr, setAllocatedStr] = useState('');

  if (!isNewBudgetModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allocated = parseFloat(allocatedStr);
    if (!allocated || isNaN(allocated) || allocated <= 0) return;

    const cat = categories.find((c) => c.id === categoryId) || categories[0];

    addBudget({
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      allocated,
      spent: 0,
      period: 'monthly',
    });

    setIsNewBudgetModalOpen(false);
    setAllocatedStr('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#262626] relative flex flex-col gap-4">
        <button
          onClick={() => setIsNewBudgetModalOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">pie_chart</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-[18px] text-[#FFFFFF]">New Budget</h3>
            <p className="font-body text-[12px] text-[#888888]">Set monthly spending target</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-1">
          {/* Category */}
          <div className="bg-[#262626] rounded-2xl p-3 flex flex-col gap-1 border border-[#383838] relative">
            <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="bg-transparent font-body text-[14px] font-semibold text-[#FFFFFF] outline-none appearance-none pr-6 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1A1A1A] text-[#E0E0E0]">
                  {c.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[#888888] text-[18px] pointer-events-none absolute right-3 bottom-3">
              arrow_drop_down
            </span>
          </div>

          {/* Allocated Limit */}
          <div className="bg-[#262626] rounded-2xl p-3.5 flex flex-col gap-1 border border-[#383838]">
            <label className="font-body text-[10px] font-bold text-[#888888] uppercase tracking-wider">
              Monthly Limit (₹)
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="5000"
              value={allocatedStr}
              onChange={(e) => setAllocatedStr(e.target.value.replace(/[^0-9.]/g, ''))}
              required
              className="bg-transparent font-display text-[24px] font-bold text-[#FFFFFF] placeholder-[#555555] outline-none"
            />
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={() => setIsNewBudgetModalOpen(false)}
              className="flex-1 bg-[#262626] hover:bg-[#333333] text-[#E0E0E0] border border-[#383838] font-body text-[14px] font-bold py-3.5 rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-display text-[14px] font-bold py-3.5 rounded-full shadow-[0_4px_16px_rgba(212,175,55,0.3)]"
            >
              Set Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
