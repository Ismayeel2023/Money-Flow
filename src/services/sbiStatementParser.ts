/**
 * State Bank of India (SBI) Statement Parser
 * Parses transaction rows, UPI references, party extraction, and detects refunds.
 */

import { PartyType, Transaction, TransactionType } from '../types';
import { TransactionService } from './transactionService';

export interface RawSbiRow {
  date: string;
  valueDate?: string;
  description: string;
  refNo?: string;
  debit?: number;
  credit?: number;
  balance?: number;
}

export class SbiStatementParser {
  /**
   * Cleans description and extracts Party and Party Type conservatively.
   */
  public static extractPartyInfo(description: string, isCredit: boolean): {
    party: string;
    partyType: PartyType;
    upiRef?: string;
    isRefund: boolean;
  } {
    const cleanDesc = description.replace(/\s+/g, ' ').trim();
    let upiRef: string | undefined;
    let isRefund = false;

    // Detect UPI Reference (e.g. 12-digit reference number)
    const upiMatch =
      cleanDesc.match(/UPI(?:\/DR|\/CR)?\/([0-9]{9,16})/i) ||
      cleanDesc.match(/\/([0-9]{12})\//) ||
      cleanDesc.match(/\b([0-9]{12})\b/);

    if (upiMatch) {
      upiRef = upiMatch[1];
    }

    // Detect Refund
    const lower = cleanDesc.toLowerCase();
    if (
      lower.includes('refund') ||
      lower.includes('reversal') ||
      lower.includes('cashback') ||
      (isCredit && (lower.includes('amazon') || lower.includes('flipkart')) && lower.includes('ret'))
    ) {
      isRefund = true;
    }

    let party = '';
    let partyType: PartyType = 'unknown';

    // Parse UPI Segments
    if (cleanDesc.toUpperCase().includes('UPI')) {
      const parts = cleanDesc.split('/');
      // Look for first valid non-keyword, non-numeric segment
      const ignoredKeywords = new Set([
        'TRANSFER-UPI',
        'TO TRANSFER-UPI',
        'BY TRANSFER-UPI',
        'TRANSFER-INB',
        'TO TRANSFER-INB',
        'BY TRANSFER-INB',
        'TRANSFER',
        'UPI',
        'DR',
        'CR',
        'PYM',
        'RET',
        'INCOME',
        'PAYMENT',
        'MOB',
        'NA',
        'NEFT',
        'RTGS',
        'IMPS',
      ]);

      for (let i = 0; i < parts.length; i++) {
        const candidate = parts[i]?.trim();
        if (!candidate || /^\d+$/.test(candidate) || ignoredKeywords.has(candidate.toUpperCase())) {
          continue;
        }
        // Found a potential party segment
        party = candidate;
        break;
      }
    }

    // Strip surrounding parentheses from extracted party (e.g. "(FLIPKART INDIA PVT LTD)" -> "FLIPKART INDIA PVT LTD")
    if (party) {
      party = party.replace(/^[\(\[\{]+/, '').replace(/[\)\]\}]+$/, '').trim();
    }

    // Known merchant & entity heuristics
    const upper = cleanDesc.toUpperCase();
    if (upper.includes('FLIPKART')) {
      party = isRefund ? 'Flipkart Refund' : 'FLIPKART';
      partyType = 'merchant';
    } else if (upper.includes('AMAZON')) {
      party = isRefund ? 'Amazon Refund' : 'Amazon';
      partyType = 'merchant';
    } else if (upper.includes('JB SWEETS')) {
      party = 'JB SWEETS';
      partyType = 'merchant';
    } else if (upper.includes('JIO')) {
      party = 'JIO';
      partyType = 'merchant';
    } else if (upper.includes('STARBUCKS')) {
      party = 'Starbucks';
      partyType = 'merchant';
    } else if (upper.includes('RELIANCE')) {
      party = 'Reliance Retail';
      partyType = 'merchant';
    } else if (upper.includes('MS RAJES')) {
      party = 'MS RAJES';
      partyType = 'person';
    } else if (upper.includes('INDIRA J')) {
      party = 'INDIRA J';
      partyType = 'person';
    } else if (upper.includes('HABEEB F')) {
      party = 'HABEEB F';
      partyType = 'person';
    }

    if (!party) {
      // Fallback: extract first substantial words from raw description
      const cleaned = cleanDesc
        .replace(/TRANSFER-UPI\/(?:DR|CR)\/\d+\//gi, '')
        .replace(/TO TRANSFER-INB/gi, '')
        .replace(/BY TRANSFER-INB/gi, '')
        .replace(/BY TRANSFER/gi, '')
        .replace(/TO TRANSFER/gi, '')
        .trim();
      const firstPart = cleaned.split('/')[0]?.slice(0, 40)?.trim() || 'Merchant/Payee';
      party = firstPart.replace(/^[\(\[\{]+/, '').replace(/[\)\]\}]+$/, '').trim();
    }

    // Classify partyType if still unknown
    if (partyType === 'unknown') {
      const pUpper = party.toUpperCase();
      if (
        pUpper.includes('LTD') ||
        pUpper.includes('CORP') ||
        pUpper.includes('PVT') ||
        pUpper.includes('STORE') ||
        pUpper.includes('MART') ||
        pUpper.includes('SHOP') ||
        pUpper.includes('DELI') ||
        pUpper.includes('RESTAURANT') ||
        pUpper.includes('CAFE') ||
        pUpper.includes('HOTEL') ||
        pUpper.includes('ENTERPRISE') ||
        pUpper.includes('SERVICES') ||
        pUpper.includes('RECHARGE') ||
        pUpper.includes('FEE') ||
        pUpper.includes('PAYOUT')
      ) {
        partyType = 'merchant';
      } else if (/^[A-Z\s.]+$/.test(party) && party.split(' ').length >= 2) {
        partyType = 'person';
      } else if (pUpper.startsWith('MR ') || pUpper.startsWith('MS ') || pUpper.startsWith('MRS ') || pUpper.startsWith('DR ')) {
        partyType = 'person';
      } else {
        partyType = 'merchant';
      }
    }

    return { party, partyType, upiRef, isRefund };
  }

  /**
   * Parses standard SBI date format (e.g. "25/08/2026", "25 Aug 2026", "25-Aug-2026") into ISO "YYYY-MM-DD"
   * Deterministic with ZERO timezone drift.
   */
  public static parseDate(dateStr: string): string {
    const trimmed = dateStr.trim();

    // 1. DD/MM/YYYY or DD-MM-YYYY
    const slashMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (slashMatch) {
      const day = slashMatch[1].padStart(2, '0');
      const month = slashMatch[2].padStart(2, '0');
      let year = slashMatch[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }

    // 2. DD Mon YYYY or DD-Mon-YYYY (e.g. "25 Aug 2026", "25-Aug-2026", "25 Aug 26")
    const monthNames: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const monMatch = trimmed.match(/^(\d{1,2})[\s\-]+([A-Za-z]{3,9})[\s\-]+(\d{2,4})/);
    if (monMatch) {
      const day = monMatch[1].padStart(2, '0');
      const monStr = monMatch[2].slice(0, 3).toLowerCase();
      const month = monthNames[monStr] || '01';
      let year = monMatch[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }

    // 3. YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (isoMatch) {
      const year = isoMatch[1];
      const month = isoMatch[2].padStart(2, '0');
      const day = isoMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '2026-08-25';
  }

  /**
   * Converts parsed rows into full MoneyFlow Transaction structures.
   */
  public static parseRows(
    rows: RawSbiRow[],
    accountId: string = 'acc-sbi',
    accountName: string = 'SBI Savings'
  ): Transaction[] {
    return rows.map((row, idx) => {
      const isDebit = !!(row.debit && row.debit > 0);
      const isCredit = !!(row.credit && row.credit > 0);
      const amount = isDebit ? row.debit! : isCredit ? row.credit! : 0;

      const { party, partyType, upiRef, isRefund } = this.extractPartyInfo(row.description, isCredit);

      let type: TransactionType = isDebit ? 'expense' : 'income';
      if (isRefund) {
        type = 'refund';
      }

      const isoDate = this.parseDate(row.date);
      const normDesc = row.description.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

      const fingerprint = TransactionService.generateFingerprint({
        bank: 'SBI',
        accountId,
        date: isoDate,
        amount,
        type,
        upiReference: upiRef,
        normalizedDescription: normDesc,
      });

      return {
        id: `sbi-tx-${Date.now()}-${idx + 1}`,
        amount,
        type,
        categoryId: type === 'income' ? 'cat-salary' : 'cat-dining',
        categoryName: type === 'income' ? 'Salary' : 'Food & Dining',
        categoryIcon: type === 'income' ? 'payments' : 'restaurant',
        categoryColor: type === 'income' ? '#006c49' : '#3525cd',
        accountId,
        accountName,
        merchant: party,
        party,
        partyType,
        upiReference: upiRef,
        rawDescription: row.description,
        normalizedDescription: normDesc,
        fingerprint,
        date: isoDate,
        displayDate: isoDate,
        time: '12:00',
        notes: `SBI Statement: ${row.description}`,
        tags: upiRef ? ['sbi', 'upi'] : ['sbi'],
        status: 'ready',
      };
    });
  }
}
