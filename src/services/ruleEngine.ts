/**
 * Rule Engine Service
 * Deterministic categorization rule matching, priority resolution, and
 * persistent "Remember This Decision" rules.
 */

import { dbService } from '../database/dbSetup';
import { AutomationRule, Category, Transaction } from '../types';

export class RuleEngineService {
  private static STORAGE_KEY = 'automation_rules';

  /**
   * Retrieves all rules from storage sorted by deterministic priority (asc).
   */
  public static getRules(): AutomationRule[] {
    const raw = dbService.getItem(this.STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed: AutomationRule[] = JSON.parse(raw);
      return parsed.sort((a, b) => a.priority - b.priority);
    } catch {
      return [];
    }
  }

  /**
   * Persists rules list.
   */
  public static saveRules(rules: AutomationRule[]): void {
    dbService.setItem(this.STORAGE_KEY, JSON.stringify(rules));
  }

  /**
   * Evaluates a transaction against active rules in deterministic order.
   * Returns matching category or null.
   */
  public static evaluateTransaction(
    tx: Partial<Transaction>,
    categories: Category[],
    customRules?: AutomationRule[]
  ): { matchedRule: AutomationRule; category: Category } | null {
    const rules = (customRules || this.getRules()).filter((r) => r.isActive);
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);

    for (const rule of sorted) {
      if (this.matchesRule(tx, rule)) {
        const cat = categories.find((c) => c.id === rule.categoryId);
        if (cat) {
          return { matchedRule: rule, category: cat };
        }
      }
    }

    return null;
  }

  /**
   * Checks if a transaction matches a rule based purely on stable fields.
   * Stable fields: party, partyType, transactionType, keyword. (NOT amount or date).
   */
  public static matchesRule(tx: Partial<Transaction>, rule: AutomationRule): boolean {
    // Transaction type match
    if (
      rule.transactionType &&
      rule.transactionType !== 'all' &&
      tx.type &&
      rule.transactionType !== tx.type
    ) {
      return false;
    }

    // Party type match
    if (
      rule.partyType &&
      rule.partyType !== 'all' &&
      tx.partyType &&
      rule.partyType !== tx.partyType
    ) {
      return false;
    }

    // Party pattern match
    if (rule.partyPattern) {
      const party = (tx.party || tx.merchant || '').toLowerCase();
      const pattern = rule.partyPattern.toLowerCase();
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(party)) {
          return true;
        }
      } catch {
        if (party.includes(pattern)) {
          return true;
        }
      }
    }

    // Description keyword match
    if (rule.descriptionKeyword) {
      const desc = (tx.rawDescription || tx.normalizedDescription || tx.merchant || '').toLowerCase();
      const keyword = rule.descriptionKeyword.toLowerCase();
      if (desc.includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Creates a persistent "Remember this decision" rule for a merchant/party.
   * Uses high deterministic priority (e.g. 10).
   */
  public static rememberDecision(
    txOrParty: Partial<Transaction> | string,
    categoryOrPartyType: Category | string,
    txType?: any,
    categoryId?: string,
    categories?: Category[]
  ): AutomationRule {
    const rules = this.getRules();

    let partyName = '';
    let partyType: any = 'unknown';
    let transactionType: any = 'expense';
    let targetCategory: Category | undefined;

    if (typeof txOrParty === 'string') {
      partyName = txOrParty.trim();
      partyType = categoryOrPartyType || 'unknown';
      transactionType = txType || 'expense';
      const catList = categories || [];
      targetCategory = catList.find((c) => c.id === categoryId) || {
        id: categoryId || 'cat-general',
        name: 'General',
        icon: 'receipt',
        color: '#D4AF37',
        type: 'expense',
      };
    } else {
      const tx = txOrParty as Partial<Transaction>;
      partyName = (tx.party || tx.merchant || 'Merchant').trim();
      partyType = tx.partyType || 'unknown';
      transactionType = tx.type || 'expense';
      targetCategory = categoryOrPartyType as Category;
    }

    const cleanPattern = partyName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    // Check if an existing rule exists for this party & type
    const existingIndex = rules.findIndex(
      (r) =>
        r.partyPattern?.toLowerCase() === cleanPattern.toLowerCase() &&
        (r.transactionType === transactionType || r.transactionType === 'all')
    );

    const ruleId = existingIndex >= 0 ? rules[existingIndex].id : `rule-user-${Date.now()}`;
    const newRule: AutomationRule = {
      id: ruleId,
      name: `Always categorize "${partyName}" as ${targetCategory.name}`,
      priority: 10, // High priority for explicit user choice
      partyPattern: cleanPattern,
      partyType: partyType,
      transactionType: transactionType,
      categoryId: targetCategory.id,
      categoryName: targetCategory.name,
      categoryIcon: targetCategory.icon,
      categoryColor: targetCategory.color,
      isActive: true,
      createdAt: new Date().toISOString(),
      matchCount: (existingIndex >= 0 ? rules[existingIndex].matchCount || 1 : 0) + 1,
    };

    if (existingIndex >= 0) {
      rules[existingIndex] = newRule;
    } else {
      rules.push(newRule);
    }

    this.saveRules(rules);
    return newRule;
  }
}
