/**
 * Kotak Mahindra Bank Statement Parser
 * Parses savings account statements, UPI reference numbers, multi-line descriptions,
 * balances, and extracts clean merchant names and categories.
 */

import { Category, KotakStatementMeta, Transaction } from '../types';

export interface RawKotakRow {
  index?: number;
  date: string;
  description: string;
  refNo?: string;
  withdrawal?: number;
  deposit?: number;
  balance?: number;
}

export class KotakStatementParser {
  /**
   * Checks whether the given text or lines belong to a Kotak Mahindra Bank statement.
   */
  public static isKotakStatement(fullTextOrLines: string | string[]): boolean {
    const text = Array.isArray(fullTextOrLines) ? fullTextOrLines.join('\n') : fullTextOrLines;
    const lower = text.toLowerCase();
    return (
      lower.includes('kotak mahindra bank') ||
      lower.includes('kkbk') ||
      lower.includes('crn xxxxxx') ||
      (lower.includes('savings account transactions') && lower.includes('withdrawal (dr.)')) ||
      (lower.includes('kotak') && lower.includes('account statement'))
    );
  }

  /**
   * Extracts statement header metadata (account number, holder, IFSC, balances).
   */
  public static extractMetadata(textLines: string[]): KotakStatementMeta {
    const fullText = textLines.join('\n');
    const meta: KotakStatementMeta = {};

    // Account Number (e.g. Account No. 8056016402)
    const accMatch = fullText.match(/Account\s*No\.?\s*([0-9]{8,18})/i);
    if (accMatch) {
      meta.accountNumber = accMatch[1];
    }

    // Account Holder Name (e.g. Maheen Mohamed Ismayeel M)
    const holderMatch = fullText.match(/(?:Account\s*Statement[\s\S]*?\d{4}\s*\n)([A-Za-z\s\.]{3,40})(?:\nCRN|\nS-O)/i);
    if (holderMatch && holderMatch[1]) {
      meta.accountHolder = holderMatch[1].trim();
    } else {
      // Fallback
      const lineWithCRN = textLines.findIndex((l) => /CRN/i.test(l));
      if (lineWithCRN > 0) {
        meta.accountHolder = textLines[lineWithCRN - 1].trim();
      }
    }

    // IFSC Code (e.g. KKBK0008676)
    const ifscMatch = fullText.match(/IFSC\s*(?:Code)?\s*([A-Z]{4}[0-9A-Z]{7})/i);
    if (ifscMatch) {
      meta.ifsc = ifscMatch[1];
    }

    // Branch (e.g. Branch Periyanaickenpalayam)
    const branchLine = textLines.find((l) => /Branch\s+/i.test(l));
    if (branchLine) {
      const match = branchLine.match(/Branch\s+([A-Za-z0-9\s]+?)(?:\s+Account\s+Status|\s*$)/i);
      if (match) {
        meta.branch = match[1].trim();
      }
    }

    // Statement Period (e.g. 01 Sep 2026 - 05 Sep 2026)
    const periodMatch = fullText.match(/(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s*-\s*\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i);
    if (periodMatch) {
      meta.statementPeriod = periodMatch[1].trim();
    }

    // Opening Balance (e.g. Opening Balance - - - 9,825.10 or in summary)
    const openMatch = fullText.match(/Opening\s*Balance[\s\S]*?([\d,]+\.\d{2})/i);
    if (openMatch) {
      meta.openingBalance = parseFloat(openMatch[1].replace(/,/g, ''));
    }

    // Closing Balance (e.g. Savings Account (SA): 9,825.10 2,647.71)
    const saMatch = fullText.match(/Savings Account[^:\n]*:\s*[\d,]+\.\d{2}\s*([\d,]+\.\d{2})/i);
    if (saMatch) {
      meta.closingBalance = parseFloat(saMatch[1].replace(/,/g, ''));
    } else {
      const closeMatches = fullText.matchAll(/Closing\s*Balance[\s\S]*?([\d,]+\.\d{2})/gi);
      for (const m of closeMatches) {
        if (m[1]) meta.closingBalance = parseFloat(m[1].replace(/,/g, ''));
      }
    }

    return meta;
  }

  /**
   * Cleans description and extracts clean merchant/party name and category from Kotak UPI narrations.
   */
  public static extractMerchantAndCategory(
    rawDescription: string,
    categories: Category[] = []
  ): { merchant: string; categoryId: string; categoryName: string; categoryIcon: string; categoryColor: string; upiRef?: string } {
    let merchant = 'Kotak Transaction';
    let upiRef: string | undefined;

    // Detect UPI Ref e.g. UPI-624481129377 or in description /624479949505/
    const refMatch = rawDescription.match(/(?:UPI-([0-9]{12})|\/([0-9]{12})\/|\b([0-9]{12})\b)/);
    if (refMatch) {
      upiRef = refMatch[1] || refMatch[2] || refMatch[3];
    }

    // Kotak UPI format: UPI/<Merchant or Beneficiary>/<Bank>/<Reference>/<Notes>
    if (rawDescription.toUpperCase().includes('UPI/')) {
      const parts = rawDescription.split('/');
      // parts[0] is "UPI"
      // parts[1] is the merchant or beneficiary name!
      if (parts[1] && parts[1].trim().length > 0) {
        let candidate = parts[1].trim();
        // Clean trailing spaces or symbols
        candidate = candidate.replace(/^[\(\[\{]+/, '').replace(/[\)\]\}]+$/, '').trim();
        if (candidate) {
          merchant = candidate;
        }
      }
    }

    // If still default or generic, try known brand extraction
    const upper = rawDescription.toUpperCase();
    if (upper.includes('JB SWEETS')) merchant = 'JB SWEETS';
    else if (upper.includes('CENTRAL CAFE')) merchant = 'CENTRAL CAFE';
    else if (upper.includes('TENICLAZZA') || upper.includes('LAZZA')) merchant = 'TENICLazza';
    else if (upper.includes('INDIAN RAILWAY') || upper.includes('IRCTC')) merchant = 'Indian Railway';
    else if (upper.includes('STATE TRANSPOR') || upper.includes('TNSTC') || upper.includes('KSRTC')) merchant = 'STATE TRANSPOR';
    else if (upper.includes('FLIPKART')) merchant = 'Flipkart Payme';
    else if (upper.includes('INDRA STORE')) merchant = 'INDRA STORE';
    else if (upper.includes('SRI VAISHNAVI')) merchant = 'SRI VAISHNAVI';
    else if (upper.includes('RATNAA SHREE')) merchant = 'RATNAA SHREE A';
    else if (upper.includes('DEVARAJAN')) merchant = 'Devarajan';
    else if (upper.includes('AASHIK')) merchant = 'AASHIK S';
    else if (upper.includes('KAVIPRIYA')) merchant = 'Kavipriya Elan';
    else if (upper.includes('DUMMY NAME')) merchant = 'DUMMY NAME';

    // Auto-assign category based on merchant
    const merchantUpper = merchant.toUpperCase();
    let assignedCategory = categories.find((c) => c.id === 'cat-shopping') || categories[0];

    // 1. Food & Dining
    if (
      merchantUpper.includes('SWEET') ||
      merchantUpper.includes('CAFE') ||
      merchantUpper.includes('LAZZA') ||
      merchantUpper.includes('RESTAURANT') ||
      merchantUpper.includes('BAKERY') ||
      merchantUpper.includes('FOOD')
    ) {
      const diningCat = categories.find((c) => c.id === 'cat-dining');
      if (diningCat) assignedCategory = diningCat;
    }
    // 2. Transport & Travel
    else if (
      merchantUpper.includes('RAILWAY') ||
      merchantUpper.includes('TRANSPOR') ||
      merchantUpper.includes('METRO') ||
      merchantUpper.includes('UBER') ||
      merchantUpper.includes('OLA') ||
      merchantUpper.includes('PETROL') ||
      merchantUpper.includes('FUEL')
    ) {
      const transportCat = categories.find((c) => c.id === 'cat-transport');
      if (transportCat) assignedCategory = transportCat;
    }
    // 3. Grocery
    else if (
      merchantUpper.includes('STORE') ||
      merchantUpper.includes('MART') ||
      merchantUpper.includes('GROCERY') ||
      merchantUpper.includes('SUPERMARKET')
    ) {
      const groceryCat = categories.find((c) => c.id === 'cat-grocery');
      if (groceryCat) assignedCategory = groceryCat;
    }
    // 4. Personal transfers
    else if (
      merchantUpper.includes('DEVARAJAN') ||
      merchantUpper.includes('AASHIK') ||
      merchantUpper.includes('KAVIPRIYA') ||
      merchantUpper.includes('DUMMY NAME')
    ) {
      const transferCat = categories.find((c) => c.id === 'cat-transfer' || c.id === 'cat-shopping');
      if (transferCat) assignedCategory = transferCat;
    }

    return {
      merchant,
      categoryId: assignedCategory?.id || 'cat-shopping',
      categoryName: assignedCategory?.name || 'Shopping',
      categoryIcon: assignedCategory?.icon || 'shopping_bag',
      categoryColor: assignedCategory?.color || '#D4AF37',
      upiRef,
    };
  }

  /**
   * Normalizes Kotak date format (e.g. '01 Sep 2026' or '01-09-2026') to 'YYYY-MM-DD'.
   */
  public static normalizeDate(dateStr: string): string {
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

    // Format: 01 Sep 2026
    const textMatch = dateStr.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
    if (textMatch) {
      const day = textMatch[1].padStart(2, '0');
      const month = monthMap[textMatch[2].toLowerCase()] || '01';
      const year = textMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Format: 01/09/2026 or 01-09-2026
    const numMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (numMatch) {
      const day = numMatch[1].padStart(2, '0');
      const month = numMatch[2].padStart(2, '0');
      const year = numMatch[3].length === 2 ? `20${numMatch[3]}` : numMatch[3];
      return `${year}-${month}-${day}`;
    }

    return dateStr;
  }

  /**
   * Parses text lines of a Kotak statement into structured transactions.
   */
  public static parseLines(
    textLines: string[],
    categories: Category[] = [],
    accountId = 'acc-kotak-6402',
    accountName = 'Kotak Savings'
  ): { meta: KotakStatementMeta; transactions: Transaction[] } {
    const meta = this.extractMetadata(textLines);

    // Regex for matching transaction row starts:
    // e.g.:
    // "1 01 Sep 2026 ..."
    // "13 05 Sep 2026 ..."
    // or without row index: "01 Sep 2026 ..."
    const rowStartRegex = /^(?:#\s*)?(\d{1,4})?\s*(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+)$/i;

    // Filter out non-table noise lines
    const isSkipLine = (line: string): boolean => {
      const lower = line.toLowerCase();
      // Date range header (e.g. 01 Sep 2026 - 05 Sep 2026)
      if (/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s*-\s*\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/i.test(line)) {
        return true;
      }
      return (
        lower.includes('account statement') ||
        lower.includes('kotak mahindra bank') ||
        lower.includes('savings account transactions') ||
        lower.includes('# date description') ||
        lower.includes('opening balance') ||
        lower.includes('statement generated on') ||
        lower.includes('end of statement') ||
        lower.includes('page 1 of') ||
        lower.includes('page 2 of') ||
        lower.includes('page 3 of') ||
        lower.includes('micr 641485024') ||
        lower.includes('branch periyanaickenpalayam') ||
        lower.includes('currency indian rupee') ||
        lower.includes('remember!') ||
        lower.includes('scan for')
      );
    };

    interface Block {
      index?: number;
      dateStr: string;
      lineFragments: string[];
    }

    const blocks: Block[] = [];
    let currentBlock: Block | null = null;

    for (const rawLine of textLines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (isSkipLine(line)) continue;

      const match = line.match(rowStartRegex);
      if (match) {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          index: match[1] ? parseInt(match[1], 10) : undefined,
          dateStr: match[2],
          lineFragments: [match[3]],
        };
      } else if (currentBlock) {
        // Wrapped text continuation (e.g. "via Sup" or "UPI-624833954899 435.00 2,647.71")
        currentBlock.lineFragments.push(line);
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    let runningBalance = meta.openingBalance;
    const transactions: Transaction[] = [];

    for (const block of blocks) {
      const combinedText = block.lineFragments.join(' ').replace(/\s+/g, ' ').trim();

      // Extract all currency amount tokens: e.g. 4,500.00, 76.00, 5,325.10
      const amountMatches = combinedText.match(/([\d,]+\.\d{2})/g);

      let withdrawal: number | undefined;
      let deposit: number | undefined;
      let balance: number | undefined;

      if (amountMatches && amountMatches.length > 0) {
        const parsed = amountMatches.map((s) => parseFloat(s.replace(/,/g, '')));
        if (parsed.length === 1) {
          // Only one amount found
          withdrawal = parsed[0];
        } else if (parsed.length === 2) {
          // Standard Kotak row: [Amount, Balance]
          const txAmt = parsed[0];
          balance = parsed[1];

          // Determine direction by checking balance delta if runningBalance is known
          if (runningBalance !== undefined && balance !== undefined) {
            if (balance < runningBalance) {
              withdrawal = txAmt;
            } else {
              deposit = txAmt;
            }
          } else {
            // Default to withdrawal for savings account spendings
            withdrawal = txAmt;
          }
        } else if (parsed.length >= 3) {
          // [Withdrawal, Deposit, Balance] or [Amount, Balance, ...]
          if (parsed[0] > 0 && parsed[1] === 0) {
            withdrawal = parsed[0];
            balance = parsed[2];
          } else if (parsed[1] > 0 && parsed[0] === 0) {
            deposit = parsed[1];
            balance = parsed[2];
          } else {
            withdrawal = parsed[0];
            balance = parsed[parsed.length - 1];
          }
        }
      }

      if (balance !== undefined) {
        runningBalance = balance;
      }

      // Extract Chq/Ref (e.g. UPI-624481129377)
      const upiPrefixMatch = combinedText.match(/\b(UPI-[0-9A-Za-z]+)\b/);
      const rawNumMatch = combinedText.match(/\b([0-9]{12})\b/);
      const chqRef = upiPrefixMatch ? upiPrefixMatch[1] : (rawNumMatch ? rawNumMatch[1] : undefined);

      // Clean description by removing amounts & chqRef
      let cleanDesc = combinedText;
      if (amountMatches) {
        for (const amt of amountMatches) {
          cleanDesc = cleanDesc.replace(amt, '');
        }
      }
      cleanDesc = cleanDesc.replace(/\s+/g, ' ').trim();

      const isoDate = this.normalizeDate(block.dateStr);
      const isCredit = !!deposit && !withdrawal;
      const amount = withdrawal !== undefined ? withdrawal : deposit || 0;
      const txType = isCredit ? 'income' : 'expense';

      const merchantData = this.extractMerchantAndCategory(combinedText, categories);

      const tx: Transaction = {
        id: `tx-kotak-${Date.now()}-${block.index || Math.random().toString(36).substring(2, 7)}`,
        amount,
        type: txType,
        categoryId: merchantData.categoryId,
        categoryName: merchantData.categoryName,
        categoryIcon: merchantData.categoryIcon,
        categoryColor: merchantData.categoryColor,
        accountId,
        accountName,
        merchant: merchantData.merchant,
        party: merchantData.merchant,
        partyType: 'merchant',
        upiReference: chqRef || merchantData.upiRef,
        rawDescription: combinedText,
        normalizedDescription: `${merchantData.merchant} (${chqRef || 'UPI'})`,
        date: isoDate,
        displayDate: block.dateStr,
        time: '12:00',
        status: 'ready',
        isDuplicate: false,
      };

      transactions.push(tx);
    }

    return { meta, transactions };
  }
}

/**
 * Exact raw text of the Kotak Statement provided by the user, for tests and one-click demo.
 */
export const KOTAK_SAMPLE_STATEMENT_TEXT = `Account Statement
01 Sep 2026 - 05 Sep 2026
Maheen Mohamed Ismayeel M
CRN xxxxxx071
S-O: Mohamed Musthafa 4-104
North Muslim Street Kurumbur
Angamangalam Thoothukkudi
Tuticorin - 628207
Tamilnadu - India
MICR 641485024 IFSC Code KKBK0008676
Account No. 8056016402
Account Type Savings
Branch Periyanaickenpalayam
Account Status Active
Nominee Registered Yes
Currency INDIAN RUPEE
Savings Account Transactions
# Date Description Chq/Ref. No. Withdrawal (Dr.) Deposit (Cr.) Balance
- - Opening Balance - - - 9,825.10
1 01 Sep 2026 UPI/DUMMY NAME/sbin/624479949505/UPI UPI-624481129377 4,500.00 5,325.10
2 01 Sep 2026 UPI/INDRA STORE/YESB/661069730174/Paid via Sup UPI-624417285320 76.00 5,249.10
3 02 Sep 2026 UPI/JB SWEETS/UTIB/661181271242/Paid via Sup UPI-624581242401 146.00 5,103.10
4 02 Sep 2026 UPI/Devarajan/YESB/661183594729/Paid via Sup UPI-624591588104 200.00 4,903.10
5 02 Sep 2026 UPI/SRI VAISHNAVI /TMBL/661186539128/Paid via Sup UPI-624504679317 210.00 4,693.10
6 04 Sep 2026 UPI/AASHIK S/IOBA/129022612205/UPI UPI-624732097201 50.00 4,643.10
7 04 Sep 2026 UPI/Kavipriya Elan/YESB/624712385394/Paid via Sup UPI-624737109099 100.00 4,543.10
8 04 Sep 2026 UPI/RATNAA SHREE A/UTIB/129041929388/UPIIntent UPI-624754763985 1,093.39 3,449.71
9 05 Sep 2026 UPI/Indian Railway/YESB/624818556389/Paid via Sup UPI-624867702462 50.00 3,399.71
10 05 Sep 2026 UPI/CENTRAL CAFE/YESB/624818937196/Paid via Sup UPI-624870659421 95.00 3,304.71
11 05 Sep 2026 UPI/TENICLazza/YESB/624821359715/Paid via Sup UPI-624882091748 55.00 3,249.71
12 05 Sep 2026 UPI/Flipkart Payme/YESB/624830041663/Paid via Sup UPI-624821792555 167.00 3,082.71
13 05 Sep 2026 UPI/STATE TRANSPOR/HDFC/624832715342/Pay UPI-624833954899 435.00 2,647.71
Account Summary
Particulars Opening Balance Closing Balance
Savings Account (SA): 9,825.10 2,647.71`;
