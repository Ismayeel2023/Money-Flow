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

    // Detect UPI Reference
    // Example: TRANSFER-UPI/DR/423456789012/FLIPKART/PYM or TO TRANSFER-INB UPI/CR/423456789012/...
    const upiMatch = cleanDesc.match(/UPI(?:\/DR|\/CR)?\/([0-9]{9,16})/i) || cleanDesc.match(/\/([0-9]{12})\//);
    if (upiMatch) {
      upiRef = upiMatch[1];
    }

    // Detect Refund
    if (
      cleanDesc.toLowerCase().includes('refund') ||
      cleanDesc.toLowerCase().includes('reversal') ||
      cleanDesc.toLowerCase().includes('cashback') ||
      (isCredit && cleanDesc.toLowerCase().includes('amazon') && cleanDesc.toLowerCase().includes('ret'))
    ) {
      isRefund = true;
    }

    let party = '';
    let partyType: PartyType = 'unknown';

    // Parse UPI Segments
    if (cleanDesc.toUpperCase().includes('UPI')) {
      const parts = cleanDesc.split('/');
      if (parts.length >= 4) {
        // usually parts[3] or parts[4] contains the payee/payer
        const candidate = parts[3]?.trim();
        if (candidate && !/^\d+$/.test(candidate)) {
          party = candidate;
        } else if (parts[4]?.trim() && !/^\d+$/.test(parts[4]?.trim())) {
          party = parts[4].trim();
        }
      }
    }

    // Known merchant heuristics
    const upper = cleanDesc.toUpperCase();
    if (upper.includes('FLIPKART')) {
      party = 'FLIPKART';
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
      // Fallback: extract first substantial words
      const cleaned = cleanDesc
        .replace(/TRANSFER-UPI\/(?:DR|CR)\/\d+\//gi, '')
        .replace(/TO TRANSFER-INB/gi, '')
        .replace(/BY TRANSFER/gi, '')
        .trim();
      party = cleaned.split('/')[0]?.slice(0, 30)?.trim() || 'Merchant/Payee';
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
        pUpper.includes('RESTAURANT')
      ) {
        partyType = 'merchant';
      } else if (/^[A-Z\s.]+$/.test(party) && party.split(' ').length >= 2) {
        partyType = 'person';
      }
    }

    return { party, partyType, upiRef, isRefund };
  }

  /**
   * Parses standard SBI date format (e.g. "25/08/2026" or "25 Aug 2026") into ISO "YYYY-MM-DD"
   */
  public static parseDate(dateStr: string): string {
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const day = slashMatch[1].padStart(2, '0');
      const month = slashMatch[2].padStart(2, '0');
      const year = slashMatch[3];
      return `${year}-${month}-${day}`;
    }

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
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
      const normDesc = row.description.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();

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
