/**
 * Transaction Service
 * Deterministic fingerprinting, duplicate detection, refund linking,
 * and ledger balance calculations.
 */

import { Account, Transaction } from '../types';

export class TransactionService {
  /**
   * Generates a deterministic fingerprint for a transaction.
   * Balance is explicitly NOT included in the fingerprint.
   */
  public static generateFingerprint(tx: {
    bank?: string;
    accountId?: string;
    accountNumber?: string;
    date: string;
    amount: number;
    type: string;
    upiReference?: string;
    normalizedDescription?: string;
  }): string {
    const acc = (tx.accountId || tx.accountNumber || tx.bank || 'default').toLowerCase().trim();
    const upi = tx.upiReference ? tx.upiReference.toLowerCase().trim() : 'no_upi';
    const desc = (tx.normalizedDescription || '').toLowerCase().trim();
    const roundedAmount = tx.amount.toFixed(2);

    return `${acc}|${tx.date}|${roundedAmount}|${tx.type}|${upi}|${desc}`;
  }

  /**
   * Evaluates duplicate status against existing transactions in the ledger.
   */
  public static detectDuplicate(
    candidate: Partial<Transaction>,
    existingLedger: Transaction[]
  ): {
    isDuplicate: boolean;
    possibleDuplicate: boolean;
    status: 'duplicate' | 'review' | 'ready';
    matchReason?: string;
    matchedTransactionId?: string;
  } {
    // 1. Exact UPI reference match (strongest signal)
    if (candidate.upiReference) {
      const upiMatch = existingLedger.find(
        (t) =>
          t.upiReference &&
          t.upiReference.toLowerCase() === candidate.upiReference?.toLowerCase() &&
          t.type === candidate.type
      );
      if (upiMatch) {
        return {
          isDuplicate: true,
          possibleDuplicate: false,
          status: 'duplicate',
          matchReason: `Exact UPI reference match (${candidate.upiReference})`,
          matchedTransactionId: upiMatch.id,
        };
      }
    }

    // 2. Exact Fingerprint match (Account + Date + Amount + Type + Normalized Description)
    const candidateFp = candidate.fingerprint || this.generateFingerprint({
      accountId: candidate.accountId,
      date: candidate.date || '',
      amount: candidate.amount || 0,
      type: candidate.type || 'expense',
      upiReference: candidate.upiReference,
      normalizedDescription: candidate.normalizedDescription,
    });

    const exactFpMatch = existingLedger.find((t) => {
      const existingFp = t.fingerprint || this.generateFingerprint({
        accountId: t.accountId,
        date: t.date,
        amount: t.amount,
        type: t.type,
        upiReference: t.upiReference,
        normalizedDescription: t.normalizedDescription,
      });
      return existingFp === candidateFp;
    });

    if (exactFpMatch) {
      return {
        isDuplicate: true,
        possibleDuplicate: false,
        status: 'duplicate',
        matchReason: `Exact transaction match on ${candidate.date} for ₹${candidate.amount}`,
        matchedTransactionId: exactFpMatch.id,
      };
    }

    // 3. Possible Duplicate Check (Same Date + Same Amount + Similar Merchant, or ±1 day Date + Same Amount + Same Merchant)
    const candidateDate = candidate.date || '';
    const candidateMerchant = (candidate.merchant || candidate.party || '').toLowerCase().trim();
    const candidateAmount = candidate.amount || 0;

    const possibleMatches = existingLedger.filter((t) => {
      if (t.type !== candidate.type) return false;
      const isSameAmount = Math.abs(t.amount - candidateAmount) < 0.01;
      if (!isSameAmount) return false;

      const tMerchant = (t.merchant || t.party || '').toLowerCase().trim();
      const isSameMerchant = tMerchant === candidateMerchant || (candidateMerchant && tMerchant.includes(candidateMerchant));

      // Same day match with similar merchant
      if (t.date === candidateDate && isSameMerchant) {
        return true;
      }

      // Date proximity (within 1 day)
      const diffTime = Math.abs(new Date(t.date).getTime() - new Date(candidateDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 1 && isSameMerchant) {
        return true;
      }

      return false;
    });

    if (possibleMatches.length > 0) {
      return {
        isDuplicate: false,
        possibleDuplicate: true,
        status: 'review',
        matchReason: `Similar transaction of ₹${candidateAmount} to ${candidate.merchant} found around ${candidateDate}`,
        matchedTransactionId: possibleMatches[0].id,
      };
    }

    return {
      isDuplicate: false,
      possibleDuplicate: false,
      status: 'ready',
    };
  }

  /**
   * Deterministic & Conservative Refund Linking
   * Matches candidate refund with original debit/expense transaction.
   * Priority:
   * 1. Explicit reference identifier
   * 2. Matching UPI reference when safe
   * 3. Same account + amount + party
   * 4. Same account + amount + normalizedDescription
   * Only links if EXACTLY one safe candidate exists.
   */
  public static linkRefund(
    refundTx: Partial<Transaction>,
    existingLedger: Transaction[]
  ): string | null {
    if (refundTx.type !== 'refund') return null;

    const debits = existingLedger.filter((t) => t.type === 'expense');

    // Priority 1: Matching UPI Reference
    if (refundTx.upiReference) {
      const upiMatches = debits.filter(
        (d) => d.upiReference && d.upiReference.toLowerCase() === refundTx.upiReference?.toLowerCase()
      );
      if (upiMatches.length === 1) {
        return upiMatches[0].id;
      }
    }

    // Priority 2: Same Account + Exact Amount + Same Party
    const partyName = (refundTx.party || refundTx.merchant || '').toLowerCase().trim();
    if (partyName && refundTx.amount) {
      const partyMatches = debits.filter((d) => {
        const dParty = (d.party || d.merchant || '').toLowerCase().trim();
        const sameParty = dParty === partyName || (partyName.length > 3 && dParty.includes(partyName));
        const sameAmount = Math.abs(d.amount - refundTx.amount!) < 0.01;
        const sameAccount = !refundTx.accountId || d.accountId === refundTx.accountId;
        return sameParty && sameAmount && sameAccount;
      });

      if (partyMatches.length === 1) {
        return partyMatches[0].id;
      }
    }

    // Priority 3: Same Account + Exact Amount + Same Normalized Description
    const normDesc = (refundTx.normalizedDescription || '').toLowerCase().trim();
    if (normDesc && refundTx.amount) {
      const descMatches = debits.filter((d) => {
        const dDesc = (d.normalizedDescription || '').toLowerCase().trim();
        const sameDesc = dDesc === normDesc || (normDesc.length > 3 && dDesc.includes(normDesc));
        const sameAmount = Math.abs(d.amount - refundTx.amount!) < 0.01;
        const sameAccount = !refundTx.accountId || d.accountId === refundTx.accountId;
        return sameDesc && sameAmount && sameAccount;
      });

      if (descMatches.length === 1) {
        return descMatches[0].id;
      }
    }

    return null;
  }

  /**
   * Applies a transaction to update account balances correctly.
   */
  public static applyTransactionToAccounts(
    tx: Transaction,
    accounts: Account[]
  ): Account[] {
    return this.updateAccountBalances([tx], accounts);
  }

  /**
   * Updates account balances for a list of transactions safely.
   */
  public static updateAccountBalances(
    transactions: Transaction[],
    accounts: Account[]
  ): Account[] {
    const updatedMap = new Map<string, Account>(accounts.map((a) => [a.id, { ...a }]));

    for (const tx of transactions) {
      if (tx.status === 'duplicate' || tx.isDuplicate) {
        continue;
      }

      const source = updatedMap.get(tx.accountId);
      if (source) {
        let newBalance = source.balance;
        let newOutstanding = source.outstanding ?? 0;
        let newLimit = source.availableLimit;

        if (source.type === 'credit') {
          if (tx.type === 'expense') {
            newOutstanding += tx.amount;
            newBalance = -newOutstanding;
            if (newLimit !== undefined) {
              newLimit = Math.max(0, newLimit - tx.amount);
            }
          } else if (tx.type === 'income' || tx.type === 'refund') {
            newOutstanding = Math.max(0, newOutstanding - tx.amount);
            newBalance = -newOutstanding;
            if (newLimit !== undefined) {
              newLimit += tx.amount;
            }
          }
        } else {
          if (tx.type === 'expense' || tx.type === 'transfer') {
            newBalance -= tx.amount;
          } else if (tx.type === 'income' || tx.type === 'refund') {
            newBalance += tx.amount;
          }
        }

        updatedMap.set(tx.accountId, {
          ...source,
          balance: newBalance,
          outstanding: newOutstanding,
          availableLimit: newLimit,
        });
      }

      // Handle Destination Account in case of transfer
      if (tx.type === 'transfer' && tx.destinationAccountId) {
        const dest = updatedMap.get(tx.destinationAccountId);
        if (dest) {
          let destBalance = dest.balance;
          let destOutstanding = dest.outstanding ?? 0;
          let destLimit = dest.availableLimit;

          if (dest.type === 'credit') {
            destOutstanding = Math.max(0, destOutstanding - tx.amount);
            destBalance = -destOutstanding;
            if (destLimit !== undefined) {
              destLimit += tx.amount;
            }
          } else {
            destBalance += tx.amount;
          }

          updatedMap.set(tx.destinationAccountId, {
            ...dest,
            balance: destBalance,
            outstanding: destOutstanding,
            availableLimit: destLimit,
          });
        }
      }
    }

    return Array.from(updatedMap.values());
  }
}
