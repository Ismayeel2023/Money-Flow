import { describe, expect, it, beforeEach } from 'vitest';
import { dbService } from '../database/dbSetup';
import { CategoryService } from './categoryService';

describe('Category CRUD & Persistence Verification', () => {
  beforeEach(() => {
    dbService.clear();
  });

  it('loads default categories when none exist', () => {
    const cats = CategoryService.getCategories();
    expect(cats.length).toBeGreaterThan(0);
    expect(cats.some((c) => c.id === 'cat-dining')).toBe(true);
  });

  it('creates a custom category and generates slug ID properly', () => {
    const created = CategoryService.createCategory({
      name: 'Freelance Design',
      icon: 'palette',
      color: '#4F46E5',
      type: 'income',
    });

    expect(created.name).toBe('Freelance Design');
    expect(created.id.startsWith('cat-freelance-design')).toBe(true);
    expect(created.type).toBe('income');
    expect(created.isSystem).toBe(false);

    // Check persistence
    const reloaded = CategoryService.getCategories();
    expect(reloaded.some((c) => c.id === created.id)).toBe(true);
  });

  it('prevents creating duplicate category names under same type', () => {
    CategoryService.createCategory({
      name: 'Pet Food',
      icon: 'pets',
      color: '#10B981',
      type: 'expense',
    });

    expect(() => {
      CategoryService.createCategory({
        name: 'Pet Food',
        icon: 'pets',
        color: '#10B981',
        type: 'expense',
      });
    }).toThrow(/already exists/i);
  });

  it('updates an existing category successfully', () => {
    const created = CategoryService.createCategory({
      name: 'Gym & Fitness',
      icon: 'fitness_center',
      color: '#F43F5E',
      type: 'expense',
    });

    const updated = CategoryService.updateCategory(created.id, {
      name: 'Gym & Sports Club',
      color: '#FB7185',
    });

    expect(updated.name).toBe('Gym & Sports Club');
    expect(updated.color).toBe('#FB7185');

    const reloaded = CategoryService.getCategories().find((c) => c.id === created.id);
    expect(reloaded?.name).toBe('Gym & Sports Club');
  });

  it('deletes a custom category and retains system categories', () => {
    const created = CategoryService.createCategory({
      name: 'Temporary Tag',
      icon: 'label',
      color: '#888888',
      type: 'expense',
    });

    const deleted = CategoryService.deleteCategory(created.id);
    expect(deleted).toBe(true);

    const reloaded = CategoryService.getCategories();
    expect(reloaded.some((c) => c.id === created.id)).toBe(false);
  });

  it('strictly blocks deletion of system categories', () => {
    expect(() => {
      CategoryService.deleteCategory('cat-dining');
    }).toThrow(/system categories cannot be deleted/i);

    const reloaded = CategoryService.getCategories();
    expect(reloaded.some((c) => c.id === 'cat-dining')).toBe(true);
  });
});
