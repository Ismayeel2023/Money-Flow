/**
 * SMS & Clipboard UPI Parser Service
 * Parses transactional SMS messages from Indian banks (Kotak, SBI, HDFC, ICICI, Axis)
 * and UPI apps (GPay, PhonePe, Paytm, CRED).
 */

import { Account, Category, ParsedSmsResult } from '../types';

export class SmsParserService {
  /**
   * Parses arbitrary bank / UPI transaction SMS text.
   */
  public static parseSms(
    rawText: string,
    accounts: Account[] = [],
    categories: Category[] = []
  ): ParsedSmsResult | null {
    const text = rawText.trim();
    if (!text || text.length < 10) return null;

    // 1. Amount Extraction: e.g. Rs. 450.00, Rs 1,093.39, INR 200.00, Debited with Rs 167
    const amountRegex = /(?:rs\.?|inr|inr\.)\s*([\d,]+(?:\.\d{1,2})?)/i;
    const altAmountRegex = /(?:debited|credited|sent|paid|withdrawn)(?:\s+by|\s+with)?\s*(?:rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i;

    let amount = 0;
    const amtMatch = text.match(amountRegex) || text.match(altAmountRegex);
    if (amtMatch && amtMatch[1]) {
      amount = parseFloat(amtMatch[1].replace(/,/g, ''));
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return null;
    }

    // 2. Transaction Type (Expense vs Income)
    const lower = text.toLowerCase();
    const isCredit =
      lower.includes('credited') ||
      lower.includes('received') ||
      lower.includes('refund') ||
      lower.includes('deposited');

    const type: 'expense' | 'income' = isCredit ? 'income' : 'expense';

    // 3. Bank Name Detection
    let bankName: string | undefined;
    if (lower.includes('kotak')) bankName = 'Kotak Mahindra Bank';
    else if (lower.includes('sbi') || lower.includes('state bank')) bankName = 'State Bank of India';
    else if (lower.includes('hdfc')) bankName = 'HDFC Bank';
    else if (lower.includes('icici')) bankName = 'ICICI Bank';
    else if (lower.includes('axis')) bankName = 'Axis Bank';
    else if (lower.includes('paytm')) bankName = 'Paytm';
    else if (lower.includes('phonepe')) bankName = 'PhonePe';
    else if (lower.includes('gpay') || lower.includes('google pay')) bankName = 'Google Pay';

    // 4. Account Number / Card Last 4 Digits
    let accountNumber: string | undefined;
    const accMatch =
      text.match(/(?:a\/c|ac|acct|account|card)(?:\s+ending|\s+no|\s*xx|\s*\*\*|\s+in)?\s*[:\.]?\s*(?:xx|\*\*)?([0-9]{3,6})/i) ||
      text.match(/ending\s+([0-9]{4})/i) ||
      text.match(/(?:xx|\*\*|\.\.)([0-9]{4})/i);
    if (accMatch) {
      accountNumber = accMatch[1];
    }

    // 5. UPI Reference Number (12 digits or UPI- prefix)
    let upiReference: string | undefined;
    const upiMatch =
      text.match(/(?:ref|rrn|upi\s*ref|txn\s*id|reference|id)[:\s]*([0-9]{9,16}|UPI-[0-9A-Za-z]+)/i) ||
      text.match(/\b([0-9]{12})\b/);
    if (upiMatch) {
      upiReference = upiMatch[1];
    }

    // 6. Merchant / Beneficiary Extraction
    let merchant = 'Unknown Merchant';
    // Match "to <Merchant>", "at <Merchant>", "towards <Merchant>", "Info: UPI/<Merchant>"
    const toMatch =
      text.match(/(?:to|at|towards|for)\s+([A-Za-z0-9\s&'\.-]{2,30}?)(?:\s+on|\s+via|\s+using|\s+ref|\.|$)/i) ||
      text.match(/info:\s*(?:upi\/)?([A-Za-z0-9\s&'\.-]{2,30}?)(?:\/|\.|$)/i) ||
      text.match(/(?:from|by)\s+([A-Za-z0-9\s&'\.-]{2,30}?)(?:\s+on|\s+via|\s+using|\s+ref|\.|$)/i);

    if (toMatch && toMatch[1]) {
      const candidate = toMatch[1].trim();
      if (!['a/c', 'ac', 'upi', 'bank', 'your', 'rs', 'inr'].includes(candidate.toLowerCase())) {
        merchant = candidate;
      }
    }

    // 7. Date & Time
    let date = new Date().toISOString().split('T')[0];
    let time = new Date().toTimeString().slice(0, 5);

    // Try finding date in SMS: e.g. 05-09-26, 05-Sep-26, 05/09/2026
    const dateMatch =
      text.match(/(\d{1,2})[\/\-](\d{1,2}|[A-Za-z]{3})[\/\-](\d{2,4})/) ||
      text.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})/);

    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const rawMonth = dateMatch[2];
      let year = dateMatch[3];
      if (year.length === 2) year = `20${year}`;

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

      let month = '01';
      if (/^\d+$/.test(rawMonth)) {
        month = rawMonth.padStart(2, '0');
      } else {
        month = monthMap[rawMonth.toLowerCase()] || '01';
      }

      date = `${year}-${month}-${day}`;
    }

    // 8. Match Account
    let matchedAccountId: string | undefined;
    if (accountNumber && accounts.length > 0) {
      const matched = accounts.find((acc) => {
        if (!acc.accountNumber) return false;
        return acc.accountNumber.endsWith(accountNumber!) || accountNumber!.endsWith(acc.accountNumber);
      });
      if (matched) {
        matchedAccountId = matched.id;
      }
    }

    if (!matchedAccountId && accounts.length > 0) {
      if (bankName) {
        const bankMatched = accounts.find((a) => a.name.toLowerCase().includes(bankName!.toLowerCase().split(' ')[0]));
        if (bankMatched) matchedAccountId = bankMatched.id;
      }
      if (!matchedAccountId) {
        matchedAccountId = accounts[0].id;
      }
    }

    // 9. Match Category
    let suggestedCategoryId = categories[0]?.id || 'cat-dining';
    const mUpper = merchant.toUpperCase();
    if (
      mUpper.includes('SWIGGY') ||
      mUpper.includes('ZOMATO') ||
      mUpper.includes('CAFE') ||
      mUpper.includes('SWEET') ||
      mUpper.includes('RESTAURANT') ||
      mUpper.includes('FOOD') ||
      mUpper.includes('LAZZA')
    ) {
      const cat = categories.find((c) => c.id === 'cat-dining');
      if (cat) suggestedCategoryId = cat.id;
    } else if (
      mUpper.includes('FLIPKART') ||
      mUpper.includes('AMAZON') ||
      mUpper.includes('MYNTRA') ||
      mUpper.includes('STORE') ||
      mUpper.includes('SHOP')
    ) {
      const cat = categories.find((c) => c.id === 'cat-shopping');
      if (cat) suggestedCategoryId = cat.id;
    } else if (
      mUpper.includes('RAILWAY') ||
      mUpper.includes('IRCTC') ||
      mUpper.includes('UBER') ||
      mUpper.includes('OLA') ||
      mUpper.includes('TRANSPOR') ||
      mUpper.includes('PETROL') ||
      mUpper.includes('FUEL')
    ) {
      const cat = categories.find((c) => c.id === 'cat-transport');
      if (cat) suggestedCategoryId = cat.id;
    } else if (
      mUpper.includes('GROCERY') ||
      mUpper.includes('BLINKIT') ||
      mUpper.includes('ZEPTO') ||
      mUpper.includes('INSTAMART')
    ) {
      const cat = categories.find((c) => c.id === 'cat-grocery');
      if (cat) suggestedCategoryId = cat.id;
    }

    return {
      amount,
      type,
      merchant,
      accountNumber,
      bankName,
      upiReference,
      date,
      time,
      matchedAccountId,
      suggestedCategoryId,
      rawText,
    };
  }
}
