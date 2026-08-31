/**
 * Category Service
 * Handles full Category lifecycle: creation, retrieval, validation, updates, deletion,
 * and persistence.
 */

import { INITIAL_CATEGORIES } from '../data/mockData';
import { dbService } from '../database/dbSetup';
import { Category } from '../types';

export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
  bgColor?: string;
  type: 'expense' | 'income' | 'both';
}

export class CategoryService {
  private static STORAGE_KEY = 'categories';

  /**
   * Retrieves all categories from persistent storage with fallback to initial set.
   */
  public static getCategories(): Category[] {
    const raw = dbService.getItem(this.STORAGE_KEY);
    if (!raw) {
      this.saveCategories(INITIAL_CATEGORIES);
      return INITIAL_CATEGORIES;
    }
    try {
      const parsed: Category[] = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveCategories(INITIAL_CATEGORIES);
        return INITIAL_CATEGORIES;
      }
      // Ensure system categories are flagged appropriately
      const initialSystemIds = new Set(INITIAL_CATEGORIES.map((c) => c.id));
      return parsed.map((cat) => {
        if (initialSystemIds.has(cat.id)) {
          return { ...cat, isSystem: true };
        }
        return cat;
      });
    } catch {
      return INITIAL_CATEGORIES;
    }
  }

  /**
   * Persists categories to storage.
   */
  public static saveCategories(categories: Category[]): void {
    dbService.setItem(this.STORAGE_KEY, JSON.stringify(categories));
  }

  /**
   * Validates category inputs.
   */
  public static validateCategory(
    input: CategoryInput,
    existingCategories: Category[],
    currentId?: string
  ): { valid: boolean; error?: string } {
    const trimmed = input.name?.trim();
    if (!trimmed) {
      return { valid: false, error: 'Category name cannot be empty.' };
    }

    if (trimmed.length > 40) {
      return { valid: false, error: 'Category name must be under 40 characters.' };
    }

    const isDuplicate = existingCategories.some(
      (c) =>
        c.id !== currentId &&
        c.name.toLowerCase() === trimmed.toLowerCase() &&
        (c.type === input.type || c.type === 'both' || input.type === 'both')
    );

    if (isDuplicate) {
      return { valid: false, error: `A category named "${trimmed}" already exists.` };
    }

    return { valid: true };
  }

  /**
   * Creates a new Category with deterministic ID and saves it to persistence.
   */
  public static createCategory(input: CategoryInput): Category {
    const existing = this.getCategories();
    const validation = this.validateCategory(input, existing);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid category input');
    }

    const name = input.name.trim();
    const idSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const id = `cat-${idSlug}-${Date.now().toString(36).slice(-4)}`;

    const newCategory: Category = {
      id,
      name,
      icon: input.icon || 'category',
      color: input.color || '#D4AF37',
      bgColor: input.bgColor || '',
      type: input.type,
      isSystem: false,
    };

    const updated = [...existing, newCategory];
    this.saveCategories(updated);
    return newCategory;
  }

  /**
   * Updates an existing Category.
   */
  public static updateCategory(id: string, updates: Partial<CategoryInput>): Category {
    const existing = this.getCategories();
    const target = existing.find((c) => c.id === id);
    if (!target) {
      throw new Error(`Category with ID ${id} not found.`);
    }

    const merged: CategoryInput = {
      name: updates.name !== undefined ? updates.name : target.name,
      icon: updates.icon !== undefined ? updates.icon : target.icon,
      color: updates.color !== undefined ? updates.color : target.color,
      bgColor: updates.bgColor !== undefined ? updates.bgColor : target.bgColor,
      type: updates.type !== undefined ? updates.type : target.type,
    };

    const validation = this.validateCategory(merged, existing, id);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid category update');
    }

    const updatedCategory: Category = {
      ...target,
      ...merged,
      name: merged.name.trim(),
    };

    const updatedList = existing.map((c) => (c.id === id ? updatedCategory : c));
    this.saveCategories(updatedList);
    return updatedCategory;
  }

  /**
   * Deletes a Category by ID.
   */
  public static deleteCategory(id: string): boolean {
    const existing = this.getCategories();
    const target = existing.find((c) => c.id === id);
    if (!target) {
      return false;
    }
    if (target.isSystem) {
      throw new Error('System categories cannot be deleted.');
    }
    const filtered = existing.filter((c) => c.id !== id);
    this.saveCategories(filtered);
    return true;
  }
}
