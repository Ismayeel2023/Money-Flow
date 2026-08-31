import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { RuleEngineService } from '../services/ruleEngine';
import { AutomationRule } from '../types';

export const RulesScreen: React.FC = () => {
  const { categories, setTab } = useFinance();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [partyPattern, setPartyPattern] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || 'cat-dining');
  const [txType, setTxType] = useState<'expense' | 'income' | 'refund' | 'transfer'>('expense');

  const loadRules = () => {
    setRules(RuleEngineService.getRules());
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggleRule = (ruleId: string) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r));
    setRules(updated);
    RuleEngineService.saveRules(updated);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updated = rules.filter((r) => r.id !== ruleId);
    setRules(updated);
    RuleEngineService.saveRules(updated);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyPattern.trim()) return;

    const matchedCat = categories.find((c) => c.id === selectedCatId) || categories[0];
    const newRule: AutomationRule = {
      id: `rule-user-${Date.now()}`,
      name: `Match "${partyPattern.trim()}" → ${matchedCat.name}`,
      priority: 20,
      partyPattern: partyPattern.trim(),
      transactionType: txType,
      categoryId: matchedCat.id,
      categoryName: matchedCat.name,
      categoryIcon: matchedCat.icon,
      categoryColor: matchedCat.color,
      isActive: true,
      createdAt: new Date().toISOString(),
      matchCount: 0,
    };

    const updated = [...rules, newRule].sort((a, b) => a.priority - b.priority);
    setRules(updated);
    RuleEngineService.saveRules(updated);
    setPartyPattern('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-2 pb-32 gap-5">
      {/* Header Info */}
      <div className="bg-[#1A1A1A] rounded-3xl p-5 border border-[#262626] shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-[20px] font-bold text-[#FFFFFF]">
              Automation Rules
            </h2>
            <p className="font-body text-[13px] text-[#888888]">
              Auto-categorize transactions based on merchant or party names
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] px-4 py-2 rounded-full font-body text-[13px] font-bold flex items-center gap-1.5 shadow-[0_2px_12px_rgba(212,175,55,0.25)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Rule</span>
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="flex flex-col gap-3">
        {rules.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-3xl p-8 text-center border border-[#262626] flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-[#888888]">smart_toy</span>
            <p className="font-body text-[14px] text-[#888888]">
              No automation rules created yet.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#D4AF37] text-[#0F0F0F] px-4 py-2 rounded-full font-body text-[13px] font-bold"
            >
              Add First Rule
            </button>
          </div>
        ) : (
          rules.map((rule) => {
            return (
              <div
                key={rule.id}
                className={`bg-[#1A1A1A] rounded-2xl p-4 border transition-all flex items-center justify-between ${
                  rule.isActive ? 'border-[#262626]' : 'border-[#262626] opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${rule.categoryColor || '#D4AF37'}20`,
                      color: rule.categoryColor || '#D4AF37',
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {rule.categoryIcon || 'auto_awesome'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-body font-bold text-[14px] text-[#FFFFFF] truncate">
                      {rule.partyPattern || rule.name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-body text-[12px] text-[#D4AF37]">
                        → {rule.categoryName}
                      </span>
                      <span className="text-[10px] text-[#888888] bg-[#262626] px-1.5 py-0.5 rounded">
                        Priority {rule.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      rule.isActive
                        ? 'bg-[#10B981]/20 text-[#34D399]'
                        : 'bg-[#262626] text-[#888888]'
                    }`}
                    title={rule.isActive ? 'Disable rule' : 'Enable rule'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {rule.isActive ? 'check' : 'pause'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="w-9 h-9 rounded-xl bg-[#262626] hover:bg-[#FB7185]/20 text-[#888888] hover:text-[#FB7185] flex items-center justify-center transition-colors"
                    title="Delete rule"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Rule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-[18px] text-[#FFFFFF]">
                Create Automation Rule
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[11px] font-bold text-[#888888] uppercase">
                  Party / Merchant Pattern
                </label>
                <input
                  type="text"
                  placeholder="e.g. Starbucks, Uber, Zomato"
                  value={partyPattern}
                  onChange={(e) => setPartyPattern(e.target.value)}
                  className="w-full bg-[#242424] text-[#FFFFFF] px-4 py-3 rounded-2xl border border-[#333333] focus:border-[#D4AF37] focus:outline-none font-body text-[14px]"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[11px] font-bold text-[#888888] uppercase">
                  Assign Category
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full bg-[#242424] text-[#FFFFFF] px-4 py-3 rounded-2xl border border-[#333333] focus:border-[#D4AF37] focus:outline-none font-body text-[14px]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[11px] font-bold text-[#888888] uppercase">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['expense', 'income'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTxType(t)}
                      className={`py-2 rounded-xl text-[13px] font-bold capitalize border ${
                        txType === t
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                          : 'bg-[#242424] border-[#333333] text-[#888888]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-[#262626] text-[#888888] font-body text-[14px] font-bold py-3 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#D4AF37] text-[#0F0F0F] font-display text-[14px] font-bold py-3 rounded-full"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
