import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Category } from '../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
}

const AVAILABLE_ICONS = [
  'restaurant',
  'shopping_bag',
  'local_cafe',
  'shopping_cart',
  'directions_car',
  'directions_subway',
  'local_gas_station',
  'movie',
  'sports_esports',
  'fitness_center',
  'medical_services',
  'healing',
  'home',
  'apartment',
  'school',
  'work',
  'payments',
  'savings',
  'flight',
  'hotel',
  'card_giftcard',
  'pets',
  'wifi',
  'bolt',
  'water_drop',
  'receipt_long',
  'tune',
  'category',
];

const AVAILABLE_COLORS = [
  '#D4AF37', // Gold
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F43F5E', // Rose / Red
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
}) => {
  const { addCategory, updateCategory } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income' | 'both'>('expense');
  const [icon, setIcon] = useState('restaurant');
  const [color, setColor] = useState('#D4AF37');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setIcon(categoryToEdit.icon);
      setColor(categoryToEdit.color);
    } else {
      setName('');
      setType('expense');
      setIcon('restaurant');
      setColor('#D4AF37');
    }
    setErrorMessage(null);
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a category name.');
      return;
    }

    try {
      if (categoryToEdit) {
        updateCategory(categoryToEdit.id, {
          name: trimmedName,
          type,
          icon,
          color,
        });
      } else {
        addCategory({
          name: trimmedName,
          type,
          icon,
          color,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save category.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner"
              style={{ backgroundColor: `${color}20`, color: color }}
            >
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-[20px] text-[#FFFFFF]">
                {categoryToEdit ? 'Edit Category' : 'New Category'}
              </h3>
              <p className="font-body text-[12px] text-[#888888]">
                {categoryToEdit ? 'Update details' : 'Create a custom category'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#262626] text-[#888888] hover:text-[#FFFFFF] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {errorMessage && (
          <div className="bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185] px-3.5 py-2.5 rounded-xl text-[13px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Category Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-bold text-[#888888] tracking-wider uppercase">
              Category Name
            </label>
            <input
              id="category-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pet Care, Freelancing"
              className="w-full bg-[#242424] text-[#FFFFFF] placeholder-[#666666] px-4 py-3 rounded-2xl border border-[#333333] focus:border-[#D4AF37] focus:outline-none font-body text-[15px]"
              autoFocus
            />
          </div>

          {/* Category Type */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-bold text-[#888888] tracking-wider uppercase">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['expense', 'income', 'both'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2.5 px-3 rounded-xl font-body text-[13px] font-bold capitalize transition-all border ${
                    type === t
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-[#242424] border-[#333333] text-[#888888] hover:text-[#E0E0E0]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-bold text-[#888888] tracking-wider uppercase">
              Color Theme
            </label>
            <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-white shadow-lg' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[11px] font-bold text-[#888888] tracking-wider uppercase">
              Icon
            </label>
            <div className="grid grid-cols-7 gap-2 max-h-36 overflow-y-auto p-2 bg-[#222222] rounded-2xl border border-[#333333]">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-[#D4AF37] text-[#0F0F0F] font-bold shadow-md'
                      : 'text-[#888888] hover:text-[#E0E0E0] hover:bg-[#2A2A2A]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{ic}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#262626] hover:bg-[#303030] text-[#888888] hover:text-[#E0E0E0] font-body text-[14px] font-bold py-3.5 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-category-btn"
              type="submit"
              className="flex-1 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-display text-[15px] font-bold py-3.5 rounded-full shadow-[0_4px_16px_rgba(212,175,55,0.25)] transition-all active:scale-[0.98]"
            >
              {categoryToEdit ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
