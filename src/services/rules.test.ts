import { describe, expect, it, beforeEach } from 'vitest';
import { dbService } from '../database/dbSetup';
import { RuleEngineService } from './ruleEngine';
import { AutomationRule, Category } from '../types';

describe('Rules Engine Verification', () => {
  beforeEach(() => {
    dbService.clear();
  });

  const categories: Category[] = [
    {
      id: 'cat-dining',
      name: 'Food & Dining',
      icon: 'restaurant',
      color: '#3525cd',
      type: 'expense',
    },
    {
      id: 'cat-coffee',
      name: 'Coffee',
      icon: 'local_cafe',
      color: '#ba1a1a',
      type: 'expense',
    },
    {
      id: 'cat-salary',
      name: 'Salary',
      icon: 'payments',
      color: '#006c49',
      type: 'income',
    },
  ];

  it('deterministically matches rule based on partyPattern and transactionType', () => {
    const rules: AutomationRule[] = [
      {
        id: 'rule-1',
        name: 'Starbucks Rule',
        priority: 10,
        partyPattern: 'starbucks|cafe|coffee',
        partyType: 'merchant',
        transactionType: 'expense',
        categoryId: 'cat-coffee',
        categoryName: 'Coffee',
        isActive: true,
        createdAt: '2026-08-01',
      },
    ];

    const match = RuleEngineService.evaluateTransaction(
      {
        merchant: 'Starbucks Coffee Corp',
        party: 'STARBUCKS',
        partyType: 'merchant',
        type: 'expense',
        amount: 450,
      },
      categories,
      rules
    );

    expect(match).not.toBeNull();
    expect(match?.category.id).toBe('cat-coffee');
    expect(match?.matchedRule.id).toBe('rule-1');
  });

  it('respects rule priority when multiple patterns match', () => {
    const rules: AutomationRule[] = [
      {
        id: 'rule-low',
        name: 'General Food Rule',
        priority: 50, // lower priority (higher number)
        partyPattern: 'bistro|cafe|food',
        partyType: 'all',
        transactionType: 'all',
        categoryId: 'cat-dining',
        categoryName: 'Food & Dining',
        isActive: true,
        createdAt: '2026-08-01',
      },
      {
        id: 'rule-high',
        name: 'Specialty Coffee Rule',
        priority: 10, // higher priority
        partyPattern: 'cafe',
        partyType: 'all',
        transactionType: 'all',
        categoryId: 'cat-coffee',
        categoryName: 'Coffee',
        isActive: true,
        createdAt: '2026-08-01',
      },
    ];

    const match = RuleEngineService.evaluateTransaction(
      {
        merchant: 'The Olive Cafe & Bistro',
        party: 'The Olive Cafe',
        partyType: 'merchant',
        type: 'expense',
        amount: 1200,
      },
      categories,
      rules
    );

    expect(match).not.toBeNull();
    expect(match?.category.id).toBe('cat-coffee');
    expect(match?.matchedRule.id).toBe('rule-high');
  });

  it('creates and persists rule on "Remember This Decision"', () => {
    RuleEngineService.rememberDecision(
      'FLIPKART INTERNET PVT',
      'merchant',
      'expense',
      'cat-dining',
      categories
    );

    const savedRules = RuleEngineService.getRules();
    expect(savedRules.length).toBeGreaterThan(0);
    const flipkartRule = savedRules.find((r) => r.name.includes('FLIPKART'));
    expect(flipkartRule).toBeDefined();
    expect(flipkartRule?.categoryId).toBe('cat-dining');
  });
});
