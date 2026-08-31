import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Category } from '../types';
import { AddCategoryModal } from './AddCategoryModal';

export const CategoriesScreen: React.FC = () => {
  const {
    categories,
    deleteCategory,
    transactions,
    budgets,
    setIsNewBudgetModalOpen,
    setTab,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesTab =
        activeTab === 'all' || cat.type === activeTab || cat.type === 'both';
      const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [categories, activeTab, searchQuery]);

  const handleEdit = (category: Category) => {
    setCategoryToEdit(category);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setCategoryToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    if (category.isSystem) {
      alert('System categories cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      deleteCategory(category.id);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-2 pb-32 gap-5">
      {/* Top Header Card */}
      <div className="bg-[#1A1A1A] rounded-3xl p-5 border border-[#262626] shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-[20px] font-bold text-[#FFFFFF]">
              Manage Categories
            </h2>
            <p className="font-body text-[13px] text-[#888888]">
              {categories.length} custom and system categories
            </p>
          </div>
          <button
            id="btn-add-new-category"
            onClick={handleCreateNew}
            className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] px-4 py-2 rounded-full font-body text-[13px] font-bold flex items-center gap-1.5 shadow-[0_2px_12px_rgba(212,175,55,0.25)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Category</span>
          </button>
        </div>

        {/* Search & Filter bar */}
        <div className="flex items-center bg-[#242424] rounded-2xl px-3.5 py-2.5 border border-[#333333] focus-within:border-[#D4AF37] transition-colors">
          <span className="material-symbols-outlined text-[#888888] text-[20px] mr-2">search</span>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[#E0E0E0] placeholder-[#666666] font-body text-[14px] w-full focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#888888] hover:text-[#FFFFFF] ml-1"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Type Filter Pills */}
        <div className="flex gap-2">
          {(['all', 'expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-1.5 rounded-xl font-body text-[12px] font-bold uppercase tracking-wider transition-all border ${
                activeTab === t
                  ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37]'
                  : 'bg-[#242424] border-[#333333] text-[#888888] hover:text-[#E0E0E0]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Category List */}
      <div className="flex flex-col gap-3">
        {filteredCategories.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-3xl p-8 text-center border border-[#262626] flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-[#888888]">category</span>
            <p className="font-body text-[14px] text-[#888888]">
              No categories found matching &quot;{searchQuery}&quot;
            </p>
            <button
              onClick={handleCreateNew}
              className="bg-[#D4AF37] text-[#0F0F0F] px-4 py-2 rounded-full font-body text-[13px] font-bold"
            >
              Create New Category
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const txCount = transactions.filter((t) => t.categoryId === cat.id).length;
            const existingBudget = budgets.find((b) => b.categoryId === cat.id);

            return (
              <div
                key={cat.id}
                className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#262626] hover:border-[#D4AF37]/30 transition-all flex items-center justify-between shadow-sm"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                    style={{
                      backgroundColor: `${cat.color || '#D4AF37'}20`,
                      color: cat.color || '#D4AF37',
                    }}
                  >
                    <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-body font-bold text-[15px] text-[#FFFFFF] truncate">
                        {cat.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          cat.type === 'income'
                            ? 'bg-[#10B981]/15 text-[#34D399]'
                            : cat.type === 'both'
                            ? 'bg-[#8B5CF6]/15 text-[#A78BFA]'
                            : 'bg-[#FB7185]/15 text-[#FB7185]'
                        }`}
                      >
                        {cat.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-body text-[12px] text-[#888888]">
                        {txCount} transaction{txCount !== 1 ? 's' : ''}
                      </span>
                      {existingBudget && (
                        <span className="font-body text-[11px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-md font-semibold">
                          Budget: ₹{existingBudget.allocated}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => handleEdit(cat)}
                    title="Edit Category"
                    className="w-8 h-8 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#888888] hover:text-[#FFFFFF] flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  {!cat.isSystem && (
                    <button
                      onClick={() => handleDelete(cat)}
                      title="Delete Category"
                      className="w-8 h-8 rounded-xl bg-[#262626] hover:bg-[#FB7185]/20 text-[#888888] hover:text-[#FB7185] flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
      />
    </div>
  );
};
