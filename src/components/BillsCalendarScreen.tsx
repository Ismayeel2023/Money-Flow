import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';
import { BillDueItem, BillRecurrence, BillReminderDays, BillType } from '../types';
import { BillDueService } from '../services/billDueService';
import { CustomDropdown, DropdownOption } from './CustomDropdown';

export const BillsCalendarScreen: React.FC = () => {
  const {
    bills,
    addBill,
    updateBill,
    deleteBill,
    markBillPaid,
    markBillUnpaid,
    toggleBillReminder,
    accounts,
    categories,
    formatCurrency,
  } = useFinance();

  // Calendar State: Year & Month
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(() => today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => today.getMonth()); // 0-indexed
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);

  // View & Filter States
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<BillDueItem | null>(null);
  const [payingBill, setPayingBill] = useState<BillDueItem | null>(null);
  const [paymentAccountId, setPaymentAccountId] = useState<string>(accounts[0]?.id || '');
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formBiller, setFormBiller] = useState('');
  const [formType, setFormType] = useState<BillType>('utility');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDay, setFormDueDay] = useState<number>(10);
  const [formRecurrence, setFormRecurrence] = useState<BillRecurrence>('monthly');
  const [formAccountId, setFormAccountId] = useState(accounts[0]?.id || '');
  const [formCategoryId, setFormCategoryId] = useState(categories[0]?.id || '');
  const [formConsumerNo, setFormConsumerNo] = useState('');
  const [formReminderEnabled, setFormReminderEnabled] = useState(true);
  const [formReminderDays, setFormReminderDays] = useState<BillReminderDays>(3);
  const [formAutoDebit, setFormAutoDebit] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  // Month navigation helpers
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
    setSelectedCalendarDay(null);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
    setSelectedCalendarDay(null);
  };

  const handleJumpToToday = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setSelectedCalendarDay(today.getDate());
  };

  // Compute month calendar cells
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sunday
  }, [selectedYear, selectedMonth]);

  // Map bills by due day
  const billsByDay = useMemo(() => {
    const map = new Map<number, BillDueItem[]>();
    bills.forEach((bill) => {
      const day = bill.dueDay;
      const list = map.get(day) || [];
      list.push(bill);
      map.set(day, list);
    });
    return map;
  }, [bills]);

  // Overall metric computations
  const totalMonthlyCommitment = useMemo(() => {
    return bills.reduce((sum, b) => sum + b.amount, 0);
  }, [bills]);

  const totalPaidAmount = useMemo(() => {
    return bills.filter((b) => b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  }, [bills]);

  const totalPendingAmount = useMemo(() => {
    return bills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  }, [bills]);

  const overdueBills = useMemo(() => {
    return bills.filter((b) => !b.isPaid && BillDueService.getDueStatus(b).status === 'overdue');
  }, [bills]);

  const dueTodayBills = useMemo(() => {
    return bills.filter((b) => !b.isPaid && BillDueService.getDueStatus(b).status === 'due_today');
  }, [bills]);

  // Filtered & Sorted bills list
  const filteredBills = useMemo(() => {
    return bills
      .filter((b) => {
        // Day filter if selected on calendar
        if (selectedCalendarDay !== null && b.dueDay !== selectedCalendarDay) {
          return false;
        }

        // Type filter
        if (filterType !== 'all' && b.type !== filterType) {
          return false;
        }

        // Status filter
        const dueStatus = BillDueService.getDueStatus(b);
        if (filterStatus === 'paid' && !b.isPaid) return false;
        if (filterStatus === 'pending' && b.isPaid) return false;
        if (filterStatus === 'overdue' && dueStatus.status !== 'overdue') return false;

        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = b.title.toLowerCase().includes(q);
          const matchBiller = b.billerName.toLowerCase().includes(q);
          const matchConsumer = b.consumerNumber?.toLowerCase().includes(q) || false;
          if (!matchTitle && !matchBiller && !matchConsumer) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const statusA = BillDueService.getDueStatus(a);
        const statusB = BillDueService.getDueStatus(b);
        if (statusA.urgencyRank !== statusB.urgencyRank) {
          return statusA.urgencyRank - statusB.urgencyRank;
        }
        return a.dueDay - b.dueDay;
      });
  }, [bills, selectedCalendarDay, filterType, filterStatus, searchQuery]);

  // Modal open for New Bill
  const openNewBillModal = () => {
    setEditingBill(null);
    setFormTitle('');
    setFormBiller('');
    setFormType('utility');
    const preset = BillDueService.getPresetForType('utility');
    setFormAmount('');
    setFormDueDay(selectedCalendarDay || 10);
    setFormRecurrence('monthly');
    setFormAccountId(accounts[0]?.id || '');
    setFormCategoryId(categories.find((c) => c.id === 'cat-bills')?.id || categories[0]?.id || '');
    setFormConsumerNo('');
    setFormReminderEnabled(true);
    setFormReminderDays(3);
    setFormAutoDebit(false);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  // Modal open for Edit Bill
  const openEditBillModal = (bill: BillDueItem) => {
    setEditingBill(bill);
    setFormTitle(bill.title);
    setFormBiller(bill.billerName);
    setFormType(bill.type);
    setFormAmount(bill.amount.toString());
    setFormDueDay(bill.dueDay);
    setFormRecurrence(bill.recurrence);
    setFormAccountId(bill.accountId || accounts[0]?.id || '');
    setFormCategoryId(bill.categoryId || categories[0]?.id || '');
    setFormConsumerNo(bill.consumerNumber || '');
    setFormReminderEnabled(bill.reminderEnabled);
    setFormReminderDays(bill.reminderDaysBefore);
    setFormAutoDebit(bill.autoDebit || false);
    setFormNotes(bill.notes || '');
    setIsAddModalOpen(true);
  };

  // Handle Preset Selection
  const handleSelectPresetType = (type: BillType) => {
    setFormType(type);
    const preset = BillDueService.getPresetForType(type);
    if (!formTitle || formTitle.includes('Bill') || formTitle.includes('Due') || formTitle.includes('EMI')) {
      setFormTitle(preset.defaultTitle);
    }
  };

  // Save Bill handler
  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (!formTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const preset = BillDueService.getPresetForType(formType);
    const selectedAcc = accounts.find((a) => a.id === formAccountId) || accounts[0];
    const selectedCat = categories.find((c) => c.id === formCategoryId) || categories[0];

    // Compute next due date for current or next cycle
    const currentYear = selectedYear;
    const currentMonth = selectedMonth + 1;
    const pad = (n: number) => String(n).padStart(2, '0');
    const daysInTargetMonth = new Date(currentYear, currentMonth, 0).getDate();
    const clampedDay = Math.min(formDueDay, daysInTargetMonth);
    const nextDueDate = `${currentYear}-${pad(currentMonth)}-${pad(clampedDay)}`;

    if (editingBill) {
      updateBill(editingBill.id, {
        title: formTitle.trim(),
        billerName: formBiller.trim() || formTitle.trim(),
        type: formType,
        amount: parsedAmount,
        dueDay: formDueDay,
        recurrence: formRecurrence,
        nextDueDate,
        accountId: selectedAcc?.id,
        accountName: selectedAcc?.name,
        categoryId: selectedCat?.id,
        categoryName: selectedCat?.name,
        icon: preset.icon,
        color: preset.color,
        reminderEnabled: formReminderEnabled,
        reminderDaysBefore: formReminderDays,
        consumerNumber: formConsumerNo.trim() || undefined,
        autoDebit: formAutoDebit,
        notes: formNotes.trim() || undefined,
      });
    } else {
      addBill({
        title: formTitle.trim(),
        billerName: formBiller.trim() || formTitle.trim(),
        type: formType,
        amount: parsedAmount,
        dueDay: formDueDay,
        recurrence: formRecurrence,
        nextDueDate,
        accountId: selectedAcc?.id,
        accountName: selectedAcc?.name,
        categoryId: selectedCat?.id,
        categoryName: selectedCat?.name,
        icon: preset.icon,
        color: preset.color,
        reminderEnabled: formReminderEnabled,
        reminderDaysBefore: formReminderDays,
        consumerNumber: formConsumerNo.trim() || undefined,
        autoDebit: formAutoDebit,
        notes: formNotes.trim() || undefined,
      });
    }

    setIsAddModalOpen(false);
  };

  // Payment Confirmation Action
  const handleConfirmPayment = () => {
    if (!payingBill) return;
    const res = markBillPaid(payingBill.id, paymentAccountId);
    if (res.success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#34D399', '#D4AF37'],
      });
      setNotificationBanner(res.message);
      setTimeout(() => setNotificationBanner(null), 4000);
    }
    setPayingBill(null);
  };

  // Test / Request Notification
  const handleTestNotification = async () => {
    const nextUpcoming = bills.find((b) => !b.isPaid);
    const targetBill = nextUpcoming || bills[0];
    if (!targetBill) return;

    const perm = await BillDueService.requestNotificationPermission();
    const status = BillDueService.getDueStatus(targetBill);

    if (perm === 'granted') {
      BillDueService.triggerLocalNotification(targetBill, status);
      setNotificationBanner(`🔔 Local reminder pushed for ${targetBill.title}!`);
    } else {
      setNotificationBanner(
        `🔔 [Reminder Simulation] ${targetBill.title} is ${status.badgeLabel} (₹${targetBill.amount.toLocaleString('en-IN')})`
      );
    }
    setTimeout(() => setNotificationBanner(null), 4500);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 sm:px-5 pt-4 sm:pt-5 pb-32 gap-5">
      {/* Dynamic Toast / Notification Banner */}
      {notificationBanner && (
        <div className="bg-[#10B981]/20 border border-[#10B981]/50 text-[#FFFFFF] px-4 py-3 rounded-2xl flex items-center justify-between text-sm shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#10B981] text-[20px]">notifications_active</span>
            <span className="font-medium">{notificationBanner}</span>
          </div>
          <button
            onClick={() => setNotificationBanner(null)}
            className="text-[#888888] hover:text-[#FFFFFF] text-xs font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Urgent Overdue or Due Today Alert */}
      {(overdueBills.length > 0 || dueTodayBills.length > 0) && (
        <div className="bg-gradient-to-r from-rose-950/40 via-[#1A1A1A] to-amber-950/30 border border-rose-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#FFFFFF]">
                {overdueBills.length > 0 && `${overdueBills.length} Bill Overdue`}
                {overdueBills.length > 0 && dueTodayBills.length > 0 && ' • '}
                {dueTodayBills.length > 0 && `${dueTodayBills.length} Due Today`}
              </h4>
              <p className="text-xs text-[#A0A0A0]">
                Immediate action advised to avoid late fees or service interruption.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => {
                setFilterStatus('overdue');
                setSelectedCalendarDay(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
            >
              View Overdue
            </button>
          </div>
        </div>
      )}

      {/* Header Month Selector & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] border border-[#262626] rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#1F1F1F] border border-[#333333] rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2A2A2A] text-[#CCCCCC] hover:text-[#FFFFFF] transition-colors"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="px-3 text-sm font-bold text-[#FFFFFF] min-w-[140px] text-center">
              {monthNames[selectedMonth]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2A2A2A] text-[#CCCCCC] hover:text-[#FFFFFF] transition-colors"
              title="Next Month"
              aria-label="Next Month"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <button
            onClick={handleJumpToToday}
            className="px-3 py-2 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-xs font-semibold text-[#D4AF37] transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Push notification test button */}
          <button
            onClick={handleTestNotification}
            className="px-3 py-2 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-xs font-medium text-[#CCCCCC] hover:text-[#FFFFFF] flex items-center gap-1.5 transition-colors"
            title="Test local bill reminder notification"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-400">notifications</span>
            <span>Test Reminder</span>
          </button>

          {/* Add Bill Button */}
          <button
            onClick={openNewBillModal}
            className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add Due Bill</span>
          </button>
        </div>
      </div>

      {/* Monthly Financial Commitment Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-[#888888] font-medium">Total Monthly Dues</span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-bold text-[#FFFFFF]">
              {formatCurrency(totalMonthlyCommitment)}
            </span>
            <div className="text-[11px] text-[#666666] mt-0.5">{bills.length} recurring items</div>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-[#10B981] font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            Paid This Cycle
          </span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-bold text-[#10B981]">
              {formatCurrency(totalPaidAmount)}
            </span>
            <div className="text-[11px] text-[#666666] mt-0.5">
              {bills.filter((b) => b.isPaid).length} bills settled
            </div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-[#141414] border border-[#262626] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Remaining Balance Due
          </span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-bold text-amber-400">
              {formatCurrency(totalPendingAmount)}
            </span>
            <div className="text-[11px] text-[#666666] mt-0.5">
              {bills.filter((b) => !b.isPaid).length} dues pending
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher: Calendar Grid vs. List */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setViewMode('calendar');
              setSelectedCalendarDay(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              viewMode === 'calendar'
                ? 'bg-[#D4AF37] text-[#0A0A0A]'
                : 'bg-[#1A1A1A] text-[#888888] hover:text-[#FFFFFF]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            <span>Monthly Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-[#D4AF37] text-[#0A0A0A]'
                : 'bg-[#1A1A1A] text-[#888888] hover:text-[#FFFFFF]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
            <span>Agenda & List</span>
          </button>
        </div>

        {selectedCalendarDay !== null && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#D4AF37] font-semibold">
              Filter: Day {selectedCalendarDay}
            </span>
            <button
              onClick={() => setSelectedCalendarDay(null)}
              className="text-xs text-[#888888] hover:text-[#FFFFFF] underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* MONTHLY CALENDAR GRID VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 sm:p-5 shadow-sm">
          {/* Day of week labels */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-[#777777]">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cell matrix */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty prefix cells for start of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[52px] sm:min-h-[68px] rounded-xl bg-transparent opacity-20" />
            ))}

            {/* Actual day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday =
                selectedYear === today.getFullYear() &&
                selectedMonth === today.getMonth() &&
                day === today.getDate();
              const isSelected = selectedCalendarDay === day;
              const dayBills = billsByDay.get(day) || [];
              const hasDue = dayBills.length > 0;
              const allPaid = hasDue && dayBills.every((b) => b.isPaid);

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => {
                    if (selectedCalendarDay === day) {
                      setSelectedCalendarDay(null); // toggle off
                    } else {
                      setSelectedCalendarDay(day);
                    }
                  }}
                  className={`min-h-[52px] sm:min-h-[68px] p-1.5 sm:p-2 rounded-xl flex flex-col justify-between items-start transition-all border text-left relative ${
                    isSelected
                      ? 'bg-[#2A2410] border-[#D4AF37] ring-1 ring-[#D4AF37]/50'
                      : isToday
                      ? 'bg-[#1C1C1C] border-[#D4AF37]/70'
                      : hasDue
                      ? 'bg-[#181818] border-[#303030] hover:border-[#444444]'
                      : 'bg-[#121212] border-[#202020] hover:bg-[#161616]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isToday
                          ? 'text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded-md'
                          : isSelected
                          ? 'text-[#FFFFFF]'
                          : hasDue
                          ? 'text-[#EEEEEE]'
                          : 'text-[#666666]'
                      }`}
                    >
                      {day}
                    </span>

                    {/* Today indicator pill */}
                    {isToday && (
                      <span className="hidden sm:inline-block text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Day Due Indicators */}
                  {hasDue ? (
                    <div className="w-full mt-1 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {dayBills.slice(0, 3).map((b) => (
                          <span
                            key={b.id}
                            className={`w-2 h-2 rounded-full ${
                              b.isPaid ? 'bg-emerald-500' : 'animate-pulse'
                            }`}
                            style={{ backgroundColor: b.isPaid ? undefined : b.color }}
                            title={`${b.title} (${b.isPaid ? 'Paid' : 'Due'})`}
                          />
                        ))}
                        {dayBills.length > 3 && (
                          <span className="text-[9px] text-[#888888] font-bold">+{dayBills.length - 3}</span>
                        )}
                      </div>

                      {/* Mini amount on larger screens */}
                      <span
                        className={`hidden sm:block text-[10px] truncate font-medium ${
                          allPaid ? 'text-emerald-400' : 'text-[#CCCCCC]'
                        }`}
                      >
                        {allPaid ? '✓ Paid' : `₹${dayBills.reduce((s, b) => s + b.amount, 0).toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  ) : (
                    <div className="h-4" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="mt-4 pt-3 border-t border-[#202020] flex flex-wrap items-center justify-between text-xs text-[#777777] gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Electricity / Utility
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" /> Credit Card
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /> Loan EMI
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" /> Rent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Paid Status
              </span>
            </div>
            <span className="italic text-[11px]">Click any date to filter bills due on that day</span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { id: 'all', label: 'All Dues' },
              { id: 'pending', label: 'Pending' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'paid', label: 'Paid' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === st.id
                  ? 'bg-[#D4AF37] text-[#0A0A0A]'
                  : 'bg-[#1C1C1C] text-[#888888] hover:text-[#FFFFFF]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#666666] text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search bills, billers, card..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#141414] border border-[#2B2B2B] text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#D4AF37]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[#888888] hover:text-[#FFFFFF]"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Bills Agenda List */}
      <div className="flex flex-col gap-3">
        {filteredBills.length === 0 ? (
          <div className="bg-[#141414] border border-dashed border-[#2B2B2B] rounded-2xl p-8 text-center text-[#777777] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-[#555555]">event_available</span>
            <h4 className="text-sm font-bold text-[#FFFFFF]">No bills found</h4>
            <p className="text-xs max-w-sm">
              {selectedCalendarDay
                ? `No bills scheduled on the ${selectedCalendarDay}th of the month.`
                : 'No recurring dues match your current filter criteria.'}
            </p>
            {selectedCalendarDay && (
              <button
                onClick={() => setSelectedCalendarDay(null)}
                className="mt-2 text-xs font-bold text-[#D4AF37] hover:underline"
              >
                Show all bills for {monthNames[selectedMonth]}
              </button>
            )}
          </div>
        ) : (
          filteredBills.map((bill) => {
            const statusInfo = BillDueService.getDueStatus(bill);

            return (
              <div
                key={bill.id}
                className={`bg-[#141414] border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  bill.isPaid
                    ? 'border-[#222222] opacity-75 hover:opacity-100'
                    : statusInfo.status === 'overdue'
                    ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/20 to-[#141414]'
                    : statusInfo.status === 'due_today'
                    ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/20 to-[#141414]'
                    : 'border-[#262626] hover:border-[#383838]'
                }`}
              >
                {/* Left: Icon & Meta */}
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[#FFFFFF] shadow-sm shrink-0"
                    style={{ backgroundColor: bill.color || '#3B82F6' }}
                  >
                    <span className="material-symbols-outlined text-[24px]">{bill.icon || 'receipt'}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-[#FFFFFF]">{bill.title}</h3>
                      {bill.autoDebit && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                          e-Mandate
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[#888888] flex-wrap">
                      <span>{bill.billerName}</span>
                      <span>•</span>
                      <span>Due {bill.dueDay}th of month</span>
                      {bill.consumerNumber && (
                        <>
                          <span>•</span>
                          <span className="text-[#AAAAAA]">{bill.consumerNumber}</span>
                        </>
                      )}
                    </div>

                    {bill.accountName && (
                      <div className="text-[11px] text-[#777777] mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">account_balance</span>
                        <span>Pay from: {bill.accountName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Amount, Countdown Badge & Actions */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#222222]">
                  <div className="text-left sm:text-right">
                    <span className="text-base sm:text-lg font-bold text-[#FFFFFF]">
                      {formatCurrency(bill.amount)}
                    </span>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.badgeBg} ${statusInfo.badgeColor} ${statusInfo.badgeBorder}`}
                      >
                        {statusInfo.badgeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Reminder Toggle */}
                  <div className="flex items-center gap-2">
                    {/* Reminder toggle */}
                    <button
                      onClick={() => toggleBillReminder(bill.id)}
                      className={`p-1.5 rounded-xl border transition-colors ${
                        bill.reminderEnabled
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-[#1C1C1C] border-[#303030] text-[#666666] hover:text-[#AAAAAA]'
                      }`}
                      title={
                        bill.reminderEnabled
                          ? `Reminder ON (${bill.reminderDaysBefore}d before)`
                          : 'Turn reminder ON'
                      }
                      aria-label="Toggle Reminder"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {bill.reminderEnabled ? 'notifications_active' : 'notifications_off'}
                      </span>
                    </button>

                    {/* Mark Paid / Unpaid Button */}
                    {bill.isPaid ? (
                      <button
                        onClick={() => markBillUnpaid(bill.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-xs font-semibold text-[#888888] hover:text-[#FFFFFF] transition-colors"
                      >
                        Mark Unpaid
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setPayingBill(bill);
                          setPaymentAccountId(bill.accountId || accounts[0]?.id || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Pay</span>
                      </button>
                    )}

                    {/* Edit & Delete */}
                    <button
                      onClick={() => openEditBillModal(bill)}
                      className="p-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] text-[#888888] hover:text-[#FFFFFF] transition-colors"
                      title="Edit Bill"
                      aria-label="Edit Bill"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete recurring bill "${bill.title}"?`)) {
                          deleteBill(bill.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-[#1C1C1C] hover:bg-rose-500/20 text-[#888888] hover:text-rose-400 transition-colors"
                      title="Delete Bill"
                      aria-label="Delete Bill"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Add / Edit Due Bill */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141414] border border-[#2B2B2B] rounded-3xl w-full max-w-md p-5 sm:p-6 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#D4AF37] text-[24px]">
                  {editingBill ? 'edit_calendar' : 'calendar_add_on'}
                </span>
                <h3 className="font-display text-lg font-bold text-[#FFFFFF]">
                  {editingBill ? 'Edit Recurring Bill' : 'Add Bill / EMI Due Date'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[#888888] hover:text-[#FFFFFF]"
              >
                ×
              </button>
            </div>

            {/* Presets Row */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#888888]">Bill Type & Icon Preset</label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { type: 'utility', label: 'Electricity', icon: 'bolt' },
                    { type: 'credit_card', label: 'Credit Card', icon: 'credit_card' },
                    { type: 'loan_emi', label: 'Loan EMI', icon: 'account_balance' },
                    { type: 'rent', label: 'Rent', icon: 'home' },
                    { type: 'broadband', label: 'WiFi / Fiber', icon: 'wifi' },
                    { type: 'mobile', label: 'Mobile Postpaid', icon: 'smartphone' },
                    { type: 'insurance', label: 'Insurance', icon: 'health_and_safety' },
                    { type: 'subscription', label: 'Other Dues', icon: 'receipt_long' },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => handleSelectPresetType(preset.type)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      formType === preset.type
                        ? 'bg-[#2A2410] border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-[#191919] border-[#2C2C2C] text-[#888888] hover:text-[#CCCCCC]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{preset.icon}</span>
                    <span className="text-[10px] font-bold truncate max-w-full">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveBill} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#888888]">Bill Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BESCOM Electricity"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C1C1C] border border-[#2F2F2F] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#888888]">Biller / Provider Name</label>
                  <input
                    type="text"
                    placeholder="e.g. BESCOM Power Corp"
                    value={formBiller}
                    onChange={(e) => setFormBiller(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C1C1C] border border-[#2F2F2F] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#888888]">Due Amount (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 2450"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C1C1C] border border-[#2F2F2F] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#888888]">
                    Due Day of Month: <span className="text-[#D4AF37] font-bold">{formDueDay}th</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={31}
                    value={formDueDay}
                    onChange={(e) => setFormDueDay(parseInt(e.target.value, 10))}
                    className="w-full accent-[#D4AF37] mt-2"
                  />
                </div>
              </div>

              {/* Account Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#888888]">Payment Account</label>
                <CustomDropdown
                  options={accounts.map((a) => ({
                    id: a.id,
                    label: a.name,
                    icon: a.icon || 'account_balance',
                    sublabel: `₹${a.balance.toLocaleString('en-IN')}`,
                  }))}
                  value={formAccountId}
                  onChange={(val) => setFormAccountId(val)}
                  placeholder="Select payment account"
                />
              </div>

              {/* Consumer / Card reference number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#888888]">
                    Account / Card # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Card ending 6402 / CA-1029"
                    value={formConsumerNo}
                    onChange={(e) => setFormConsumerNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C1C1C] border border-[#2F2F2F] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#888888]">Recurrence Cycle</label>
                  <select
                    value={formRecurrence}
                    onChange={(e) => setFormRecurrence(e.target.value as BillRecurrence)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C1C1C] border border-[#2F2F2F] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="bi_monthly">Bi-Monthly (Every 2 mo)</option>
                    <option value="quarterly">Quarterly (Every 3 mo)</option>
                    <option value="yearly">Yearly</option>
                    <option value="one_time">One-time Due</option>
                  </select>
                </div>
              </div>

              {/* Reminder Settings */}
              <div className="bg-[#1C1C1C] border border-[#2C2C2C] rounded-2xl p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-[20px]">
                      notifications_active
                    </span>
                    <span className="text-xs font-bold text-[#FFFFFF]">Push / Local Reminder</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formReminderEnabled}
                    onChange={(e) => setFormReminderEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                  />
                </div>

                {formReminderEnabled && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-[#888888]">Alert me:</span>
                    {([0, 1, 2, 3, 7] as const).map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setFormReminderDays(days)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          formReminderDays === days
                            ? 'bg-[#D4AF37] text-[#0A0A0A]'
                            : 'bg-[#262626] text-[#888888] hover:text-[#FFFFFF]'
                        }`}
                      >
                        {days === 0 ? 'Same Day' : `${days}d before`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto Debit toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoDebitCheck"
                  checked={formAutoDebit}
                  onChange={(e) => setFormAutoDebit(e.target.checked)}
                  className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                />
                <label htmlFor="autoDebitCheck" className="text-xs text-[#CCCCCC] cursor-pointer">
                  Auto-debited via e-Mandate or standing bank instruction
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] text-xs font-semibold text-[#888888] hover:text-[#FFFFFF] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-xs font-bold text-[#0A0A0A] transition-colors shadow-sm"
                >
                  {editingBill ? 'Save Changes' : 'Add to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Quick Payment Confirmation */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141414] border border-[#2B2B2B] rounded-3xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-[#262626]">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[#FFFFFF]"
                style={{ backgroundColor: payingBill.color }}
              >
                <span className="material-symbols-outlined text-[22px]">{payingBill.icon}</span>
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#FFFFFF]">Confirm Bill Payment</h3>
                <span className="text-xs text-[#888888]">{payingBill.title}</span>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4 flex flex-col gap-2 text-center">
              <span className="text-xs text-[#888888]">Amount to Mark as Paid</span>
              <span className="text-2xl font-bold text-[#10B981]">
                {formatCurrency(payingBill.amount)}
              </span>
              <span className="text-[11px] text-[#666666]">
                This will automatically record an expense transaction in your ledger.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#888888]">Deduct from Account</label>
              <CustomDropdown
                options={accounts.map((a) => ({
                  id: a.id,
                  label: a.name,
                  icon: a.icon || 'account_balance',
                  sublabel: `Balance: ₹${a.balance.toLocaleString('en-IN')}`,
                }))}
                value={paymentAccountId}
                onChange={(val) => setPaymentAccountId(val)}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="px-4 py-2 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] text-xs font-semibold text-[#888888] hover:text-[#FFFFFF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-5 py-2 rounded-xl bg-[#10B981] hover:bg-[#10B981]/90 text-xs font-bold text-[#FFFFFF] shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                <span>Confirm Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
