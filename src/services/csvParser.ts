/**
 * CSV Statement Parser
 * Fully RFC-4180 compliant CSV parser supporting UTF-8, UTF-8 BOM,
 * Unicode characters, ₹ currency symbol, quoted fields with commas,
 * long descriptions, and flexible bank/UPI statement schemas.
 */

import { Category, Transaction } from '../types';
import { RuleEngineService } from './ruleEngine';
import { TransactionService } from './transactionService';

export interface CsvParseResult {
  transactions: Transaction[];
  totalParsed: number;
}

export class CsvParser {
  /**
   * Decodes ArrayBuffer to string handling UTF-8 and stripping UTF-8 BOM (\uFEFF)
   */
  public static decodeBufferToString(buffer: ArrayBuffer): string {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = decoder.decode(buffer);
    // Strip UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }
    return text;
  }

  /**
   * Parses CSV string into 2D array of string cells, complying with RFC 4180:
   * - Quoted fields with escaped quotes ("")
   * - Commas inside quoted fields
   * - Preserves full text without truncating
   * - Preserves Unicode & special characters (e.g. ₹, emojis, symbols)
   */
  public static parseCsvToRows(csvText: string): string[][] {
    let cleanText = csvText;
    if (cleanText.charCodeAt(0) === 0xfeff) {
      cleanText = cleanText.slice(1);
    }

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while (i < cleanText.length) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote: "" inside quotes becomes a single "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
          i++;
          continue;
        }
      }

      if (!inQuotes && char === ',') {
        // Gracefully handle unquoted thousand-separated currency amounts (e.g. ₹1,499.50 or 85,000.00)
        const isPrecededByCurrencyNumber = /(?:₹|rs\.?|inr|\$)?\s*\d+$/i.test(currentField);
        if (isPrecededByCurrencyNumber) {
          const rest = cleanText.slice(i + 1);
          const nextDelimiterIdx = rest.search(/[,\r\n]/);
          const nextSegment = nextDelimiterIdx === -1 ? rest : rest.slice(0, nextDelimiterIdx);
          if (/^\d{2,3}(?:\.\d+)?$/.test(nextSegment.trim())) {
            currentField += ',';
            i++;
            continue;
          }
        }

        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      }

      if (!inQuotes && (char === '\r' || char === '\n')) {
        // End of row
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n in \r\n
        }
        currentRow.push(currentField.trim());
        currentField = '';

        // Only push non-empty rows
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      }

      // Normal character (including Unicode, whitespace, etc.)
      currentField += char;
      i++;
    }

    // Flush remaining field/row
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  /**
   * Normalizes header name for column matching
   */
  private static normalizeHeader(header: string): string {
    return header.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Cleans and parses a monetary amount string.
   * Handles: ₹1,499.00, 1,499.50, (500.00), -350, Cr / Dr notations
   */
  public static parseAmount(val: string): number {
    if (!val) return 0;
    let clean = val.replace(/₹|rs\.?|inr|\$/gi, '').trim();
    const isNegative = clean.startsWith('-') || (clean.startsWith('(') && clean.endsWith(')'));
    clean = clean.replace(/[(),]/g, '').trim();
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return isNegative ? -Math.abs(num) : Math.abs(num);
  }

  /**
   * Normalizes various date string formats to YYYY-MM-DD
   */
  public static normalizeDate(dateStr: string): string {
    if (!dateStr) {
      return new Date().toISOString().split('T')[0];
    }

    const trimmed = dateStr.trim();

    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      let year = dmyMatch[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }

    // DD Mon YYYY (e.g. 25 Aug 2026 or 25-Aug-2026)
    const monthMap: Record<string, string> = {
      jan: '01',
      feb: '02',
      mar: '03',
      apr: '04',
      may: '05',
      jun: '06',
      jul: '07',
      aug: '08',
      sep: '09',
      oct: '10',
      nov: '11',
      dec: '12',
    };
    const monMatch = trimmed.match(/^(\d{1,2})[\/\-\s]+([A-Za-z]{3})[\/\-\s]+(\d{2,4})/);
    if (monMatch) {
      const day = monMatch[1].padStart(2, '0');
      const monStr = monMatch[2].toLowerCase();
      const month = monthMap[monStr] || '01';
      let year = monMatch[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }

    // Fallback: try Date.parse
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
  }

  /**
   * Reconstructs a clean merchant / payee / party name from raw narration.
   * If narration contains standard UPI syntax (e.g. TRANSFER-UPI/DR/123/Swiggy/Pym),
   * extracts the party cleanly.
   * Otherwise preserves the intact text.
   */
  public static extractMerchant(rawDescription: string): {
    merchant: string;
    party: string;
    upiReference?: string;
  } {
    if (!rawDescription) {
      return { merchant: 'Bank Transaction', party: 'Bank' };
    }

    const desc = rawDescription.trim();

    // Check UPI reference pattern: e.g. /12-digit-ref/ or UPI/12-digit
    const upiMatch = desc.match(/(?:UPI|RRR|REF|UTR)[\/:](?:DR|CR)?[\/:]?(\d{10,14})/i) ||
      desc.match(/[\/](\d{12})[\/]/);
    const upiReference = upiMatch ? upiMatch[1] : undefined;

    // Check SBI / UPI slash pattern: TRANSFER-UPI/DR/REF/PARTY/REMARK
    const slashParts = desc.split('/').map((p) => p.trim()).filter(Boolean);
    if (slashParts.length >= 4 && (slashParts[0].includes('UPI') || slashParts[1] === 'DR' || slashParts[1] === 'CR')) {
      const candidate = slashParts[3];
      if (candidate && !/^\d+$/.test(candidate)) {
        return {
          merchant: candidate,
          party: candidate,
          upiReference: upiReference || (slashParts[2].match(/^\d+$/) ? slashParts[2] : undefined),
        };
      }
    }

    // If description starts with UPI- or POS- or ACH-
    const prefixMatch = desc.match(/^(?:UPI|POS|NEFT|RTGS|IMPS|ACH|INB)[-:\s]+([^\-]+)/i);
    if (prefixMatch && prefixMatch[1] && prefixMatch[1].trim().length > 2) {
      const candidate = prefixMatch[1].trim();
      return {
        merchant: candidate,
        party: candidate,
        upiReference,
      };
    }

    // Preserve full description as merchant
    return {
      merchant: desc,
      party: desc,
      upiReference,
    };
  }

  /**
   * Parses CSV string into structured Transaction items
   */
  public static parseCsv(
    csvText: string,
    categories: Category[] = [],
    existingLedger: Transaction[] = [],
    accountId: string = 'acc-sbi',
    accountName: string = 'SBI Savings'
  ): CsvParseResult {
    const rawRows = this.parseCsvToRows(csvText);
    if (rawRows.length < 2) {
      return { transactions: [], totalParsed: 0 };
    }

    // Locate header row
    let headerRowIndex = -1;
    let colIndices = {
      date: -1,
      description: -1,
      debit: -1,
      credit: -1,
      amount: -1,
      type: -1,
      ref: -1,
      balance: -1,
    };

    for (let r = 0; r < Math.min(10, rawRows.length); r++) {
      const row = rawRows[r].map(this.normalizeHeader);
      const dateIdx = row.findIndex((h) => h.includes('date') || h === 'txndate');
      const descIdx = row.findIndex((h) =>
        h.includes('desc') || h.includes('narrat') || h.includes('particular') || h.includes('remark') || h.includes('detail')
      );

      if (dateIdx !== -1 && descIdx !== -1) {
        headerRowIndex = r;
        colIndices.date = dateIdx;
        colIndices.description = descIdx;
        colIndices.debit = row.findIndex((h) => h.includes('debit') || h === 'dr' || h.includes('withdrawal') || h.includes('spent'));
        colIndices.credit = row.findIndex((h) => h.includes('credit') || h === 'cr' || h.includes('deposit') || h.includes('received'));
        colIndices.amount = row.findIndex((h) => h === 'amount' || h.includes('txnamount'));
        colIndices.type = row.findIndex((h) => h === 'type' || h.includes('txntype') || h === 'drcr');
        colIndices.ref = row.findIndex((h) => h.includes('ref') || h.includes('cheque') || h.includes('utr') || h.includes('upi'));
        colIndices.balance = row.findIndex((h) => h.includes('bal') || h.includes('closing'));
        break;
      }
    }

    // If no header found, assume standard default column layout: Date, Description, Debit, Credit, Balance
    if (headerRowIndex === -1) {
      headerRowIndex = 0;
      colIndices = {
        date: 0,
        description: 1,
        debit: 2,
        credit: 3,
        amount: -1,
        type: -1,
        ref: -1,
        balance: 4,
      };
    }

    const transactions: Transaction[] = [];

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (row.length === 0 || row.every((c) => c === '')) continue;

      const rawDate = colIndices.date !== -1 ? row[colIndices.date] : '';
      const rawDescription = colIndices.description !== -1 ? row[colIndices.description] : '';
      if (!rawDate && !rawDescription) continue;

      let debitAmount = colIndices.debit !== -1 ? this.parseAmount(row[colIndices.debit]) : 0;
      let creditAmount = colIndices.credit !== -1 ? this.parseAmount(row[colIndices.credit]) : 0;

      // Single amount column with Type column
      if (debitAmount === 0 && creditAmount === 0 && colIndices.amount !== -1) {
        const amt = this.parseAmount(row[colIndices.amount]);
        const typeStr = colIndices.type !== -1 ? (row[colIndices.type] || '').toLowerCase() : '';
        if (typeStr.includes('cr') || typeStr.includes('credit') || typeStr.includes('inflow') || amt < 0) {
          creditAmount = Math.abs(amt);
        } else {
          debitAmount = Math.abs(amt);
        }
      }

      const isDebit = debitAmount > 0;
      const isCredit = creditAmount > 0;
      if (!isDebit && !isCredit) continue;

      const finalAmount = isDebit ? debitAmount : creditAmount;
      const parsedDate = this.normalizeDate(rawDate);

      // Extract merchant, party, and upiReference
      const { merchant, party, upiReference } = this.extractMerchant(rawDescription);
      const explicitRef = colIndices.ref !== -1 && row[colIndices.ref] ? row[colIndices.ref].trim() : undefined;

      // Determine TransactionType
      let type: 'expense' | 'income' | 'refund' = isDebit ? 'expense' : 'income';
      const lowerDesc = rawDescription.toLowerCase();
      if (isCredit && (lowerDesc.includes('refund') || lowerDesc.includes('reversal') || lowerDesc.includes('cashback') || lowerDesc.includes('/ret/'))) {
        type = 'refund';
      }

      // Default category assignment
      let assignedCategory: Category | undefined;
      const candidateTx: Partial<Transaction> = {
        amount: finalAmount,
        type,
        party,
        merchant,
        rawDescription,
        normalizedDescription: rawDescription.replace(/\s+/g, ' ').trim(),
        upiReference: explicitRef || upiReference,
        date: parsedDate,
        accountId,
      };

      // 1. Check automation rules
      const ruleMatch = RuleEngineService.evaluateTransaction(candidateTx as Transaction, categories);
      if (ruleMatch) {
        assignedCategory = ruleMatch.category;
      } else {
        // Fallback by type
        if (type === 'income') {
          assignedCategory = categories.find((c) => c.type === 'income') || categories.find((c) => c.type === 'both') || categories[0];
        } else if (type === 'refund') {
          const linkedDebitId = TransactionService.linkRefund(candidateTx, existingLedger);
          if (linkedDebitId) {
            candidateTx.refundLinkId = linkedDebitId;
            const linkedDebit = existingLedger.find((t) => t.id === linkedDebitId);
            if (linkedDebit) {
              assignedCategory = categories.find((c) => c.id === linkedDebit.categoryId);
            }
          }
          if (!assignedCategory) {
            assignedCategory = categories.find((c) => c.type === 'expense') || categories[0];
          }
        } else {
          // General expense
          assignedCategory = categories.find((c) => c.type === 'expense') || categories[0];
        }
      }

      // 2. Duplicate detection
      const dupCheck = TransactionService.detectDuplicate(candidateTx as Transaction, existingLedger);

      const tx: Transaction = {
        id: `tx-csv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        amount: finalAmount,
        type,
        categoryId: assignedCategory?.id || 'cat-other',
        categoryName: assignedCategory?.name || 'General',
        categoryIcon: assignedCategory?.icon || 'receipt',
        categoryColor: assignedCategory?.color || '#D4AF37',
        accountId,
        accountName,
        merchant,
        party,
        upiReference: explicitRef || upiReference,
        rawDescription, // CRITICAL: Preserve complete original description
        normalizedDescription: rawDescription.replace(/\s+/g, ' ').trim(),
        refundLinkId: candidateTx.refundLinkId ?? null,
        date: parsedDate,
        time: '12:00',
        status: dupCheck.status,
        isDuplicate: dupCheck.isDuplicate,
        possibleDuplicate: dupCheck.possibleDuplicate,
        matchReason: dupCheck.matchReason,
      };

      transactions.push(tx);
    }

    return {
      transactions,
      totalParsed: transactions.length,
    };
  }
}
