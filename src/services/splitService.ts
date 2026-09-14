import { BillSplit, SplitParticipant } from '../types';

export const INITIAL_DEMO_SPLITS: BillSplit[] = [
  {
    id: 'split-demo-1',
    transactionId: 'tx-swiggy-lunch',
    title: 'Team Swiggy Feast (Biryani & Starters)',
    totalAmount: 1800,
    userShare: 600,
    date: '2026-09-06',
    categoryName: 'Food & Dining',
    categoryIcon: 'restaurant',
    notes: 'Office lunch ordered via Swiggy. Split equally 3 ways.',
    isFullySettled: false,
    participants: [
      {
        id: 'p-101',
        name: 'Rahul Sharma',
        phone: '9876543210',
        upiId: 'rahul@okhdfcbank',
        amount: 600,
        paid: false,
      },
      {
        id: 'p-102',
        name: 'Priya Patel',
        phone: '9823456789',
        upiId: 'priya@oksbi',
        amount: 600,
        paid: true,
        settledDate: '2026-09-07',
        settledAccountId: 'acc-kotak-811',
      },
    ],
  },
  {
    id: 'split-demo-2',
    transactionId: 'tx-goa-cab',
    title: 'Airport Outstation Cab',
    totalAmount: 2400,
    userShare: 800,
    date: '2026-09-04',
    categoryName: 'Transportation',
    categoryIcon: 'directions_car',
    notes: 'Cab booking split with friends.',
    isFullySettled: false,
    participants: [
      {
        id: 'p-201',
        name: 'Amit Verma',
        phone: '9988776655',
        upiId: 'amit@paytm',
        amount: 800,
        paid: false,
      },
      {
        id: 'p-202',
        name: 'Vikram Joshi',
        phone: '9123456780',
        upiId: 'vikram@icici',
        amount: 800,
        paid: false,
      },
    ],
  },
  {
    id: 'split-demo-3',
    transactionId: 'tx-central-cafe',
    title: 'Central Cafe Coffee & Desserts',
    totalAmount: 380,
    userShare: 190,
    date: '2026-09-02',
    categoryName: 'Food & Dining',
    categoryIcon: 'local_cafe',
    notes: 'Evening coffee meetup.',
    isFullySettled: false,
    participants: [
      {
        id: 'p-301',
        name: 'Sneha Rao',
        phone: '9765432109',
        upiId: 'sneha@ybl',
        amount: 190,
        paid: false,
      },
    ],
  },
];

export class SplitService {
  /**
   * Generates a WhatsApp reminder link with pre-formatted UPI details
   */
  static getWhatsAppReminderLink(
    participant: SplitParticipant,
    billTitle: string,
    userUpiId?: string
  ): string {
    const text = `Hey ${participant.name}! 👋\n\nYour share of *₹${participant.amount.toLocaleString(
      'en-IN'
    )}* for *"${billTitle}"* is pending on Money Flow.${
      userUpiId ? `\n\n💸 You can settle via UPI to: *${userUpiId}*` : ''
    }\n\nThank you!`;

    const encoded = encodeURIComponent(text);
    if (participant.phone) {
      const cleanPhone = participant.phone.replace(/[^0-9]/g, '');
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      return `https://wa.me/${fullPhone}?text=${encoded}`;
    }
    return `https://wa.me/?text=${encoded}`;
  }

  /**
   * Generates a UPI intent link for Indian payment apps (GPay, PhonePe, Paytm, BHIM)
   */
  static getUpiPayLink(
    userUpiId: string,
    userName: string,
    amount: number,
    billTitle: string
  ): string {
    const pa = encodeURIComponent(userUpiId);
    const pn = encodeURIComponent(userName || 'Money Flow User');
    const am = amount.toFixed(2);
    const tn = encodeURIComponent(`Split share: ${billTitle}`);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}&cu=INR`;
  }

  /**
   * Calculates equal shares ensuring exact penny/paise precision
   */
  static calculateEqualShares(
    totalAmount: number,
    participantNames: string[]
  ): { userShare: number; participantShares: { name: string; amount: number }[] } {
    const totalPeople = participantNames.length + 1; // User + friends
    if (totalPeople <= 0 || totalAmount <= 0) {
      return { userShare: totalAmount, participantShares: [] };
    }

    const baseShare = Math.floor((totalAmount / totalPeople) * 100) / 100;
    let remainder = Math.round((totalAmount - baseShare * totalPeople) * 100) / 100;

    // Distribute remaining paise to participant shares
    const participantShares = participantNames.map((name) => {
      let share = baseShare;
      if (remainder > 0) {
        share = Math.round((share + 0.01) * 100) / 100;
        remainder = Math.round((remainder - 0.01) * 100) / 100;
      }
      return { name, amount: share };
    });

    const userShare = Math.round((totalAmount - participantShares.reduce((s, p) => s + p.amount, 0)) * 100) / 100;

    return {
      userShare,
      participantShares,
    };
  }
}
