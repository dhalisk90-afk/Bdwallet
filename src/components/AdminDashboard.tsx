import React, { useState, useEffect } from 'react';
import {
  AdminActivityLog,
  ChatMessage,
  CustomerRecord,
  DepositAccountSettings,
  DepositRequest,
  InviteCode,
  User,
  WalletSummary,
  WalletTransaction,
  WithdrawalRequest,
} from '../types';
import { api } from '../api';
import {
  ACCOUNT_TYPES_META,
  formatDhakaDate,
  formatTaka,
  getAccountStatusMeta,
  getRequestStatusMeta,
  OPERATORS,
  PROVIDERS_META,
  toBanglaNumber,
} from '../utils/formatters';
import { MonthlyEarningsManager } from './MonthlyEarningsManager';
import { ErrorBoundary } from './ErrorBoundary';
import {
  ShieldAlert,
  Search,
  Trash2,
  Edit,
  Key,
  Users,
  Layers,
  TrendingUp,
  Ticket,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calculator,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Activity,
  FileCheck2,
  XCircle,
  Check,
  X,
  Eye,
  Power,
  RotateCcw,
  UserX,
  Lock,
  MessageSquare,
  Send,
  Smartphone,
  CreditCard,
  Settings,
  HardDrive,
} from 'lucide-react';
import { GoogleDriveModal } from './GoogleDriveModal';

interface AdminDashboardProps {
  currentUser: User;
}

type AdminTab =
  | 'customers'
  | 'accounts'
  | 'deposit_settings'
  | 'live_chat'
  | 'monthly_earnings'
  | 'requests'
  | 'wallets'
  | 'onboarding_logs';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('customers');
  const [customers, setCustomers] = useState<any[]>([]);
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Accounts Table
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Customer Management State
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [editingPasswordCustomer, setEditingPasswordCustomer] = useState<any | null>(null);
  const [newCustomerPassword, setNewCustomerPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<any | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Account Approval Modal State (Both Monthly Target Amount and Commission Rate)
  const [approvingRecord, setApprovingRecord] = useState<CustomerRecord | null>(null);
  const [approvalCommissionRate, setApprovalCommissionRate] = useState('2.0');
  const [approvalTargetAmount, setApprovalTargetAmount] = useState('50000');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Account Reject Modal State
  const [rejectingRecord, setRejectingRecord] = useState<CustomerRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('অসম্পূর্ণ বা বিভ্রান্তিকর তথ্য');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  // Customer Wallet Inspector State
  const [inspectUserId, setInspectUserId] = useState<string>('');
  const [inspectedWallet, setInspectedWallet] = useState<{
    user: any;
    summary: WalletSummary;
    transactions: WalletTransaction[];
    accounts: CustomerRecord[];
    earnings: any[];
  } | null>(null);
  const [inspecting, setInspecting] = useState(false);

  // Invite Code Form
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeUses, setNewCodeUses] = useState('5');
  const [creatingCode, setCreatingCode] = useState(false);

  // Deposit Settings State
  const [depositSettings, setDepositSettings] = useState<DepositAccountSettings>({
    bkashNumber: '',
    nagadNumber: '',
    rocketNumber: '',
    bankDetails: '',
  });
  const [savingDepositSettings, setSavingDepositSettings] = useState(false);

  // Live Chat State
  const [chatThreads, setChatThreads] = useState<Array<{ user: any; lastMessage: any; unreadCount: number }>>([]);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [sendingChatMessage, setSendingChatMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Google Drive & Banner
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [recordsData, statsData, depositsData, withdrawalsData, logsData, invitesData, customersData, settingsData, threadsData] =
        await Promise.all([
          api.getAdminRecords(),
          api.getAdminStats(),
          api.getAdminDeposits(),
          api.getAdminWithdrawals(),
          api.getAdminActivityLogs(),
          api.getAdminInviteCodes(),
          api.getAdminCustomers(),
          api.getDepositSettings().catch(() => ({ bkashNumber: '01912345678', nagadNumber: '01812345678', rocketNumber: '01712345678-9', bankDetails: 'City Bank' })),
          api.getChatThreads().catch(() => []),
        ]);
      setRecords(recordsData);
      setStats(statsData);
      setDeposits(depositsData);
      setWithdrawals(withdrawalsData);
      setActivityLogs(logsData);
      setInviteCodes(invitesData);
      setCustomers(customersData);
      if (settingsData) setDepositSettings(settingsData);
      if (threadsData) setChatThreads(Array.isArray(threadsData) ? threadsData : []);
    } catch (err: any) {
      setBanner({
        type: 'error',
        message: err.message || 'অ্যাডমিন ডেটা লোড করা সম্ভব হয়নি।',
      });
    } finally {
      setLoading(false);
    }
  };

  const [isResettingLimits, setIsResettingLimits] = useState(false);

  // 1st of Month Limit Reset Handler
  const handleResetAllMonthlyLimits = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে সকল অ্যাকাউন্টের লিমিট প্রতি মাসের ১ তারিখের নিয়মে রিসেট (০ BDT) করতে চান? এটি লিমিট আবার শুরু করবে কিন্তু গ্রাহকের মূল অ্যাকাউন্ট অপরিবর্তিত থাকবে।')) {
      return;
    }
    setIsResettingLimits(true);
    try {
      const res = await api.resetAllMonthlyLimits();
      setBanner({ type: 'success', message: res.messageBangla });
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'লিমিট রিসেট ব্যর্থ হয়েছে।' });
    } finally {
      setIsResettingLimits(false);
    }
  };

  const handleResetAccountMonthlyLimit = async (recordId: string, accountName: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে '${accountName}' অ্যাকাউন্টের চলতি মাসের লিমিট ব্যবহার রিসেট করে আবার প্রথম থেকে চালু করতে চান?`)) {
      return;
    }
    try {
      const res = await api.resetAccountMonthlyLimit(recordId);
      setBanner({ type: 'success', message: res.messageBangla });
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'অ্যাকাউন্ট লিমিট রিসেট ব্যর্থ হয়েছে।' });
    }
  };

  const loadChatMessages = async (userId: string) => {
    try {
      setChatLoading(true);
      const msgs = await api.getChatMessages(userId);
      setChatMessages(Array.isArray(msgs) ? msgs.filter((m) => Boolean(m && m.id)) : []);
    } catch (err: any) {
      console.error('Failed to load chat messages:', err);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (activeChatUserId) {
      loadChatMessages(activeChatUserId);
      const interval = setInterval(() => {
        api.getChatMessages(activeChatUserId)
          .then((msgs) => {
            if (Array.isArray(msgs)) {
              setChatMessages(msgs.filter((m) => Boolean(m && m.id)));
            }
          })
          .catch(() => {});
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeChatUserId]);

  const handleSendAdminChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUserId || !chatInputText.trim() || sendingChatMessage) return;
    setSendingChatMessage(true);
    try {
      const res = await api.sendChatMessage(chatInputText.trim(), activeChatUserId);
      const newMsg = res.chatMessage || (res as any).message;
      if (newMsg && newMsg.id) {
        setChatMessages((prev) => [...(Array.isArray(prev) ? prev : []), newMsg]);
      }
      setChatInputText('');
      const threads = await api.getChatThreads().catch(() => []);
      if (Array.isArray(threads)) {
        setChatThreads(threads);
      }
    } catch (err: any) {
      alert(err.message || 'বার্তা পাঠাতে ত্রুটি হয়েছে');
    } finally {
      setSendingChatMessage(false);
    }
  };

  const handleSaveDepositSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDepositSettings(true);
    try {
      const res = await api.updateDepositSettings(depositSettings);
      setDepositSettings(res.settings);
      setBanner({ type: 'success', message: res.messageBangla });
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'ডিপোজিট সেটিংস আপডেট ব্যর্থ হয়েছে।' });
    } finally {
      setSavingDepositSettings(false);
    }
  };

  const handleDeleteRecord = async (recordId: string, recordName: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে '${recordName}' অ্যাকাউন্টটি মুছে ফেলতে চান?`)) return;
    try {
      const res = await api.deleteAdminRecord(recordId);
      setBanner({ type: 'success', message: res.messageBangla });
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'অ্যাকাউন্ট মুছে ফেলা যায়নি।' });
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (providerFilter !== 'all' && r.serviceProvider !== providerFilter) return false;
    if (typeFilter !== 'all' && r.accountType !== typeFilter) return false;
    if (operatorFilter !== 'all' && r.operator !== operatorFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = r.accountName.toLowerCase().includes(q);
      const matchPhone = r.personalNumber.includes(q);
      const matchOwner = (r.userName || '').toLowerCase().includes(q);
      const matchOwnerPhone = (r.userPhone || '').includes(q);
      const matchPostal = r.postalCode.includes(q);
      return matchName || matchPhone || matchOwner || matchOwnerPhone || matchPostal;
    }
    return true;
  });

  // Filter customers
  const pendingCustomersCount = customers.filter((c) => (c.status || 'pending') === 'pending').length;

  const filteredCustomers = customers.filter((c) => {
    if (customerStatusFilter !== 'all') {
      const st = c.status || 'pending';
      if (st !== customerStatusFilter) return false;
    }
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase().trim();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.telegramUsername || '').toLowerCase().includes(q)
    );
  });

  // 1. Handle Approve Account & Set Commission % + Monthly Target Amount
  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRecord) return;
    setIsSubmittingApproval(true);
    try {
      const rate = Number(approvalCommissionRate);
      const targetAmt = Number(approvalTargetAmount) || 50000;
      const res = await api.approveAccount(approvingRecord.id, rate, targetAmt);
      setBanner({ type: 'success', message: res.messageBangla });
      setApprovingRecord(null);
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'অনুমোদন ব্যর্থ হয়েছে।' });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // 2. Handle Reject Account
  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRecord) return;
    setIsSubmittingRejection(true);
    try {
      const res = await api.rejectAccount(rejectingRecord.id, rejectionReason);
      setBanner({ type: 'success', message: res.messageBangla });
      setRejectingRecord(null);
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'প্রত্যাখ্যান ব্যর্থ হয়েছে।' });
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  // 3. Handle 3 Operational States: 'running' (সবুজ), 'limit_reached' (লাল - মেইন ওয়ালেটে ট্রান্সফার), 'off' (লাল)
  const handleSetOperationalState = async (
    recordId: string,
    state: 'running' | 'limit_reached' | 'off'
  ) => {
    try {
      const res = await api.updateAccountOperationalState(recordId, state);
      setBanner({ type: 'success', message: res.messageBangla });
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।' });
    }
  };

  // 4. Handle Edit Customer Password
  const handleConfirmPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPasswordCustomer) return;
    if (!newCustomerPassword || newCustomerPassword.trim().length < 4) {
      alert('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await api.updateCustomerPassword(
        editingPasswordCustomer.id,
        newCustomerPassword.trim()
      );
      setBanner({ type: 'success', message: res.messageBangla });
      setEditingPasswordCustomer(null);
      setNewCustomerPassword('');
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // 5. Handle Delete Customer
  const handleConfirmDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    setIsSubmittingDelete(true);
    try {
      const res = await api.deleteCustomer(deletingCustomer.id);
      setBanner({ type: 'success', message: res.messageBangla });
      setDeletingCustomer(null);
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'গ্রাহক মুছে ফেলা সম্ভব হয়নি।' });
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // 6. Customer Approval Actions (অ্যাডমিন কর্তৃক গ্রাহক অনুমোদন বা বাতিল)
  const handleApproveCustomer = async (customerId: string, customerName: string) => {
    try {
      const res = await api.approveCustomer(customerId);
      setBanner({ type: 'success', message: res.messageBangla || `গ্রাহক '${customerName}'-এর একাউন্ট সফলভাবে অনুমোদন করা হয়েছে!` });
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'গ্রাহক অনুমোদন ব্যর্থ হয়েছে।' });
    }
  };

  const handleRejectCustomer = async (customerId: string, customerName: string) => {
    const reason = prompt(`'${customerName}' গ্রাহকের আবেদন বাতিলের কারণ লিখুন:`, 'তথ্য অসম্পূর্ণ বা যাচাই করা যায়নি');
    if (reason === null) return;
    try {
      const res = await api.rejectCustomer(customerId, reason);
      setBanner({ type: 'success', message: res.messageBangla || `গ্রাহক '${customerName}'-এর একাউন্ট বাতিল করা হয়েছে।` });
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'গ্রাহক বাতিল ব্যর্থ হয়েছে।' });
    }
  };

  // Deposit Actions
  const handleApproveDeposit = async (id: string) => {
    try {
      const res = await api.approveAdminDeposit(id);
      setBanner({ type: 'success', message: res.messageBangla });
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message });
    }
  };

  const handleRejectDeposit = async (id: string) => {
    const reason = prompt('প্রত্যাখ্যানের কারণ লিখুন:', 'পেমেন্ট ট্রানজেকশন তথ্য যাচাই করা যায়নি');
    if (!reason) return;
    try {
      const res = await api.rejectAdminDeposit(id, reason);
      setBanner({ type: 'success', message: res.messageBangla });
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message });
    }
  };

  // Withdrawal Actions
  const handleApproveWithdrawal = async (id: string) => {
    try {
      const res = await api.approveAdminWithdrawal(id);
      setBanner({ type: 'success', message: res.messageBangla });
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message });
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    const reason = prompt('প্রত্যাখ্যানের কারণ লিখুন:', 'অ্যাকাউন্ট ভেরিফিকেশন অপর্যাপ্ত');
    if (!reason) return;
    try {
      const res = await api.rejectAdminWithdrawal(id, reason);
      setBanner({ type: 'success', message: res.messageBangla });
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message });
    }
  };

  // Customer Wallet Inspector
  const handleInspectCustomerWallet = async (userId: string) => {
    setInspectUserId(userId);
    setInspecting(true);
    try {
      const data = await api.getAdminUserWallet(userId);
      setInspectedWallet(data);
    } catch (err: any) {
      alert(err.message || 'ওয়ালেট তথ্য লোড করা যায়নি');
    } finally {
      setInspecting(false);
    }
  };

  // Create Invite Code
  const handleCreateInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim()) return;
    setCreatingCode(true);
    try {
      const res = await api.createAdminInviteCode(newCodeName.trim().toUpperCase(), Number(newCodeUses) || 5);
      setBanner({ type: 'success', message: res.messageBangla });
      setNewCodeName('');
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'কোড তৈরি ব্যর্থ হয়েছে।' });
    } finally {
      setCreatingCode(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Alert Banner */}
      {banner && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in ${
            banner.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{banner.message}</span>
          </div>
          <button onClick={() => setBanner(null)} className="font-bold hover:underline">
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-3 border border-purple-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>সুপার অ্যাডমিন নিয়ন্ত্রণ কেন্দ্র • পূর্ণ নিয়ন্ত্রণ এক্সেস</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              BD Wallet অ্যাডমিন প্যানেল
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              গ্রাহকের তথ্য, পাসওয়ার্ড পরিবর্তন, অ্যাকাউন্ট অনুমোদন, মাসিক কমিশন পার্সেন্টেজ নির্ধারণ ও লিমিট নিয়ন্ত্রণ করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDriveModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer active:scale-98 border border-white/20"
            >
              <HardDrive className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Google Drive ক্লাউড সিঙ্ক</span>
            </button>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-right">
              <span className="text-[10px] text-purple-300 block font-medium">লগইনকৃত অ্যাডমিন:</span>
              <span className="text-xs font-bold text-white">{currentUser.name}</span>
              <span className="text-[10px] text-slate-300 block font-mono">{currentUser.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Quick Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold">মোট গ্রাহক</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{toBanglaNumber(customers.length)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">নিবন্ধিত গ্রাহক অ্যাকাউন্ট</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold">মোট অ্যাকাউন্ট</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{toBanglaNumber(records.length)}</p>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">
              পেন্ডিং: {toBanglaNumber(stats.pendingAccountsCount)} টি
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold">বিতরণকৃত কমিশন</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg sm:text-xl font-black text-emerald-700">{formatTaka(stats.totalCommissionDisbursed)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">মেইন ওয়ালেটে স্থানান্তর</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold">ডিপোজিট কিউ</span>
              <ArrowDownLeft className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-blue-700">{toBanglaNumber(deposits.length)}</p>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">
              পেন্ডিং: {toBanglaNumber(stats.pendingDepositsCount)}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold">উত্তোলন কিউ</span>
              <ArrowUpRight className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-purple-700">{toBanglaNumber(withdrawals.length)}</p>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">
              পেন্ডিং: {toBanglaNumber(stats.pendingWithdrawalsCount)}
            </p>
          </div>
        </div>
      )}

      {/* Main Admin Navigation Tabs (Bigger & Colorful) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        {/* TAB 1: CUSTOMERS */}
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center justify-center space-x-2 py-3.5 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-sm ${
            activeTab === 'customers'
              ? 'bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white shadow-purple-500/25 ring-2 ring-purple-400 scale-[1.02]'
              : 'bg-white hover:bg-purple-50 text-purple-900 border-2 border-purple-200 hover:border-purple-300'
          }`}
        >
          <Users className="w-5 h-5 shrink-0 text-purple-400" />
          <span className="truncate">গ্রাহক ব্যবস্থাপনা ({toBanglaNumber(customers.length)})</span>
        </button>

        {/* TAB 2: ACCOUNTS */}
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center justify-center space-x-2 py-3.5 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-sm ${
            activeTab === 'accounts'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-emerald-500/25 ring-2 ring-emerald-400 scale-[1.02]'
              : 'bg-white hover:bg-emerald-50 text-emerald-900 border-2 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <Layers className="w-5 h-5 shrink-0 text-emerald-400" />
          <span className="truncate">অ্যাকাউন্ট অনুমোদন ({toBanglaNumber(records.length)})</span>
        </button>

        {/* TAB 3: DEPOSIT SETTINGS */}
        <button
          onClick={() => setActiveTab('deposit_settings')}
          className={`flex items-center justify-center space-x-2 py-3.5 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-sm ${
            activeTab === 'deposit_settings'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-amber-500/25 ring-2 ring-amber-400 scale-[1.02]'
              : 'bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-200 hover:border-amber-300'
          }`}
        >
          <Settings className="w-5 h-5 shrink-0 text-amber-400" />
          <span className="truncate">ডিপোজিট নম্বর পরিবর্তন</span>
        </button>

        {/* TAB 4: LIVE CHAT */}
        <button
          onClick={() => setActiveTab('live_chat')}
          className={`flex items-center justify-center space-x-2 py-3.5 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-sm relative ${
            activeTab === 'live_chat'
              ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white shadow-blue-500/25 ring-2 ring-blue-400 scale-[1.02]'
              : 'bg-white hover:bg-blue-50 text-blue-900 border-2 border-blue-200 hover:border-blue-300'
          }`}
        >
          <MessageSquare className="w-5 h-5 shrink-0 text-cyan-400" />
          <span className="truncate">লাইভ চ্যাট</span>
          {chatThreads.some((t) => t.unreadCount > 0) && (
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
          )}
        </button>

        {/* TAB 5: DEPOSITS & WITHDRAWALS */}
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs ${
            activeTab === 'requests'
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-rose-500/20 ring-2 ring-rose-400'
              : 'bg-white hover:bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <Wallet className="w-4 h-4 shrink-0 text-rose-500" />
          <span className="truncate">ডিপোজিট ও উত্তোলন</span>
        </button>

        {/* TAB 6: MONTHLY EARNINGS */}
        <button
          onClick={() => setActiveTab('monthly_earnings')}
          className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs ${
            activeTab === 'monthly_earnings'
              ? 'bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-indigo-500/20 ring-2 ring-indigo-400'
              : 'bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}
        >
          <Calculator className="w-4 h-4 shrink-0 text-indigo-500" />
          <span className="truncate">মাসিক কমিশন ও লেজার</span>
        </button>

        {/* TAB 7: WALLET AUDIT */}
        <button
          onClick={() => setActiveTab('wallets')}
          className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs ${
            activeTab === 'wallets'
              ? 'bg-gradient-to-r from-cyan-700 to-blue-800 text-white shadow-cyan-500/20 ring-2 ring-cyan-400'
              : 'bg-white hover:bg-cyan-50 text-cyan-800 border border-cyan-200'
          }`}
        >
          <Eye className="w-4 h-4 shrink-0 text-cyan-500" />
          <span className="truncate">গ্রাহক ওয়ালেট অডিট</span>
        </button>

        {/* TAB 8: ONBOARDING & LOGS */}
        <button
          onClick={() => setActiveTab('onboarding_logs')}
          className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs ${
            activeTab === 'onboarding_logs'
              ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-slate-500/20 ring-2 ring-slate-400'
              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0 text-slate-500" />
          <span className="truncate">ইনভাইট কোড ও অডিট</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CUSTOMER MANAGEMENT (কার্ড আকারে প্রদর্শন ও গ্রাহক অনুমোদন)           */}
      {/* ========================================================================= */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>গ্রাহক ব্যবস্থাপনা ও অনুমোদন তালিকা ({toBanglaNumber(filteredCustomers.length)})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                নতুন নিবন্ধিত গ্রাহকদের অ্যাকাউন্ট অনুমোদন করুন, টেলিগ্রামে যোগাযোগ করুন অথবা পাসওয়ার্ড নিয়ন্ত্রণ করুন।
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="নাম, মোবাইল, ইমেইল বা টেলিগ্রাম খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Sub-Filters: সকল গ্রাহক vs অপেক্ষমান অনুমোদন vs অনুমোদিত গ্রাহক */}
          <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCustomerStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                customerStatusFilter === 'all'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              সকল গ্রাহক ({toBanglaNumber(customers.length)})
            </button>

            <button
              onClick={() => setCustomerStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                customerStatusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-50'
              }`}
            >
              {pendingCustomersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
              <span>অপেক্ষমান অনুমোদন ({toBanglaNumber(pendingCustomersCount)})</span>
            </button>

            <button
              onClick={() => setCustomerStatusFilter('approved')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                customerStatusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              অনুমোদিত গ্রাহক ({toBanglaNumber(customers.filter((c) => (c.status || 'pending') === 'approved').length)})
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">গ্রাহক তথ্য লোড হচ্ছে...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              {customerSearch ? 'খোঁজার সাথে মিলে এমন কোনো গ্রাহক পাওয়া যায়নি।' : 'কোনো গ্রাহক পাওয়া যায়নি।'}
            </div>
          ) : (
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((cust) => {
                const isPending = (cust.status || 'pending') === 'pending';
                const isApproved = cust.status === 'approved';
                const isRejected = cust.status === 'rejected';

                return (
                  <div
                    key={cust.id}
                    className={`bg-white rounded-2xl border-2 p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                      isPending
                        ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20'
                        : isApproved
                        ? 'border-slate-200 hover:border-purple-300'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-11 h-11 rounded-2xl text-white font-bold text-base flex items-center justify-center shadow-xs ${
                            isPending
                              ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                              : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                          }`}>
                            {cust.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{cust.name}</h3>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              {isPending && (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  <span>পেন্ডিং অনুমোদন</span>
                                </span>
                              )}
                              {isApproved && (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  অনুমোদিত
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                  বাতিলকৃত
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance</div>
                          <div className="text-sm font-black text-emerald-700">
                            {formatTaka(cust.walletBalance || 0)}
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs border border-slate-100">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400">মোবাইল:</span>
                          <span className="font-mono font-bold text-slate-800">{cust.phone}</span>
                        </div>

                        {/* Telegram User ID */}
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400">টেলিগ্রাম আইডি:</span>
                          {cust.telegramUsername ? (
                            <a
                              href={`https://t.me/${cust.telegramUsername.replace(/^@/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-[#0066FF] hover:underline flex items-center space-x-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                              title="টেলিগ্রামে মেসেজ দিন"
                            >
                              <Send className="w-3 h-3 text-[#229ED9] -translate-x-0.5" />
                              <span className="font-mono">{cust.telegramUsername.startsWith('@') ? cust.telegramUsername : `@${cust.telegramUsername}`}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">দেওয়া হয়নি</span>
                          )}
                        </div>

                        {/* Capacity provided */}
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400">প্রস্তাবিত অ্যাকাউন্ট:</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {toBanglaNumber(cust.accountCapacity || 10)} টি একাউন্ট
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400">নিবন্ধন:</span>
                          <span className="font-mono text-[11px] text-slate-600">{formatDhakaDate(cust.createdAt)}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400">সংযুক্ত MFS অ্যাকাউন্ট:</span>
                          <span className="font-bold text-purple-700">{toBanglaNumber(cust.accountsCount || 0)} টি</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="pt-2 border-t border-slate-100">
                      {isPending ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleApproveCustomer(cust.id, cust.name)}
                            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer transition-all active:scale-98"
                            title="গ্রাহকের অ্যাকাউন্ট অনুমোদন করুন"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>অনুমোদন করুন (Approve)</span>
                          </button>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => {
                                setActiveChatUserId(cust.id);
                                setActiveTab('live_chat');
                              }}
                              className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                              title="গ্রাহকের সাথে লাইভ চ্যাট করুন"
                            >
                              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                              <span>চ্যাট</span>
                            </button>

                            <button
                              onClick={() => handleRejectCustomer(cust.id, cust.name)}
                              className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                              title="আবেদন প্রত্যাখ্যান করুন"
                            >
                              <X className="w-3.5 h-3.5 shrink-0" />
                              <span>বাতিল</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={() => {
                              setEditingPasswordCustomer(cust);
                              setNewCustomerPassword('');
                            }}
                            className="py-2 px-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                            title="পাসওয়ার্ড রিসেট বা পরিবর্তন করুন"
                          >
                            <Key className="w-3.5 h-3.5 shrink-0" />
                            <span>পাসওয়ার্ড</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveChatUserId(cust.id);
                              setActiveTab('live_chat');
                            }}
                            className="py-2 px-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                            title="গ্রাহকের সাথে লাইভ চ্যাট করুন"
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span>চ্যাট</span>
                          </button>

                          <button
                            onClick={() => setDeletingCustomer(cust)}
                            className="py-2 px-1 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                            title="গ্রাহক এবং তার সমস্ত ডাটা স্থায়ীভাবে মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            <span>রিমুভ</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACCOUNTS MANAGEMENT (কার্ড আকারে সম্পূর্ণ ইংরেজিতে তথ্য)             */}
      {/* ========================================================================= */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <span>Account Cards & Approval Control ({filteredRecords.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  All account records with 5-digit password, daily accumulating commission, and monthly 1st midnight reset.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleResetAllMonthlyLimits}
                  disabled={isResettingLimits}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
                  title="১ তারিখ রাত ১২:০০ টার মাসিক লিমিট রিসেট টেস্ট / অবিলম্বে কার্যকর করুন"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResettingLimits ? 'animate-spin' : ''}`} />
                  <span>১ তারিখের লিমিট রিসেট চালান (Reset Limits)</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, password..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="all">All Providers</option>
                <option value="bkash">bKash</option>
                <option value="rocket">Rocket</option>
                <option value="nagad">Nagad</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="all">All Types</option>
                <option value="personal">Personal</option>
                <option value="agent">Agent</option>
                <option value="merchant">Merchant</option>
              </select>

              <select
                value={operatorFilter}
                onChange={(e) => setOperatorFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="all">All Operators</option>
                {OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">Loading accounts...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">No accounts found matching criteria.</div>
          ) : (
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecords.map((r) => {
                const isApproved = r.status === 'approved';
                const isRunning = isApproved && (r.operationalState === 'running' || !r.operationalState);
                const isLimitReached = isApproved && r.operationalState === 'limit_reached';
                const isOff = isApproved && r.operationalState === 'off';
                const isPending = r.status === 'pending';
                const targetAmt = r.monthlyTargetAmount || r.limitAmount || 50000;
                const rate = r.commissionRate || 2.0;
                const dailyCommission = ((targetAmt * (rate / 100)) / 30);

                const addedDateFormatted = (() => {
                  try {
                    return new Date(r.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                  } catch {
                    return r.createdAt;
                  }
                })();

                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-400 p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Card Header: Badges & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            r.serviceProvider === 'bkash'
                              ? 'bg-pink-100 text-pink-800 border border-pink-300'
                              : r.serviceProvider === 'nagad'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-purple-100 text-purple-800 border border-purple-300'
                          }`}>
                            {r.serviceProvider}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                            {r.accountType}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {isPending ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-amber-400 bg-amber-50 text-amber-800 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        ) : isRunning ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500 bg-emerald-100 text-emerald-800 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5 animate-pulse" />
                            Running (Green)
                          </span>
                        ) : isLimitReached ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-500 bg-rose-100 text-rose-800 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-rose-600 mr-1.5" />
                            Limit Reached (Red)
                          </span>
                        ) : isOff ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-500 bg-rose-100 text-rose-800 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-rose-600 mr-1.5" />
                            Off (Red)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-300 bg-slate-100 text-slate-700">
                            {r.status}
                          </span>
                        )}
                      </div>

                      {/* Account Name & Customer */}
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{r.accountName}</h3>
                        <p className="text-xs text-slate-500">
                          Owner: <span className="font-semibold text-slate-700">{r.userName || 'Customer'}</span> ({r.userPhone || 'N/A'})
                        </p>
                      </div>

                      {/* English Account Data Grid */}
                      <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Account Number:</span>
                          <span className="font-mono font-bold text-slate-900">{r.personalNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Password (5-Digit):</span>
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            {r.accountPassword || r.postalCode || '*****'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Operator:</span>
                          <span className="font-semibold text-slate-700">{r.operator}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Limit Amount:</span>
                          <span className="font-bold text-slate-900">BDT {r.limitAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Monthly Target:</span>
                          <span className="font-bold text-slate-900">BDT {targetAmt.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Commission Rate:</span>
                          <span className="font-bold text-purple-700">{rate.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Daily Commission:</span>
                          <span className="font-bold text-emerald-700">BDT {dailyCommission.toFixed(2)} / day</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500 font-semibold">Demo Accumulated:</span>
                          <span className="font-black text-emerald-800 text-sm">
                            BDT {(r.demoCommission || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-400">Date Added:</span>
                          <span className="font-mono text-slate-600">{addedDateFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational State Actions & Delete */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
                      {isPending ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setApprovingRecord(r);
                              setApprovalCommissionRate('2.0');
                              setApprovalTargetAmount(String(r.limitAmount || 50000));
                            }}
                            className="py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectingRecord(r);
                              setRejectionReason('Incomplete or unverified account information');
                            }}
                            className="py-2 px-3 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : isApproved ? (
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => handleSetOperationalState(r.id, 'running')}
                            disabled={isRunning}
                            className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer text-center ${
                              isRunning
                                ? 'bg-emerald-600 text-white cursor-default'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                            }`}
                            title="Set Running (Green)"
                          >
                            Running (সবুজ)
                          </button>

                          <button
                            onClick={() => handleSetOperationalState(r.id, 'limit_reached')}
                            disabled={isLimitReached}
                            className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer text-center ${
                              isLimitReached
                                ? 'bg-rose-600 text-white cursor-default'
                                : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                            }`}
                            title="Transfer Demo to Main Wallet (Red)"
                          >
                            Limit End (লাল)
                          </button>

                          <button
                            onClick={() => handleSetOperationalState(r.id, 'off')}
                            disabled={isOff}
                            className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer text-center ${
                              isOff
                                ? 'bg-slate-700 text-white cursor-default'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Turn Off (Red)"
                          >
                            Off (লাল)
                          </button>
                        </div>
                      ) : null}

                      {/* Delete Account Button */}
                      <button
                        onClick={() => handleDeleteRecord(r.id, r.accountName)}
                        className="w-full py-1.5 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500" />
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DEPOSIT NUMBERS SETTINGS (ডিপোজিট নম্বর পরিবর্তন)                  */}
      {/* ========================================================================= */}
      {activeTab === 'deposit_settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <span>ডিপোজিট অ্যাকাউন্ট নম্বর পরিবর্তন সেটিংস</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              এখানে পরিবর্তিত নম্বরগুলো গ্রাহকরা তাদের ডিপোজিট পেজে তাৎক্ষণিকভাবে দেখতে পাবেন।
            </p>
          </div>

          <form onSubmit={handleSaveDepositSettings} className="space-y-5">
            <div className="space-y-4">
              {/* bKash Number */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  ১. অফিসিয়াল বিকাশ নম্বর (bKash) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-pink-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={depositSettings.bkashNumber}
                    onChange={(e) => setDepositSettings({ ...depositSettings, bkashNumber: e.target.value })}
                    placeholder="যেমন: 019XXXXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Nagad Number */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  ২. অফিসিয়াল নগদ নম্বর (Nagad) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={depositSettings.nagadNumber}
                    onChange={(e) => setDepositSettings({ ...depositSettings, nagadNumber: e.target.value })}
                    placeholder="যেমন: 018XXXXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Rocket Number */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  ৩. অফিসিয়াল রকেট নম্বর (Rocket) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-purple-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={depositSettings.rocketNumber}
                    onChange={(e) => setDepositSettings({ ...depositSettings, rocketNumber: e.target.value })}
                    placeholder="যেমন: 017XXXXXXXX-X"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  ৪. অফিসিয়াল ব্যাংক হিসাব বিবরণ (Bank Account Details) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-blue-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={depositSettings.bankDetails}
                    onChange={(e) => setDepositSettings({ ...depositSettings, bankDetails: e.target.value })}
                    placeholder="যেমন: City Bank: 110293847501 (Dhaka Branch, BD Wallet Hub)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingDepositSettings}
              className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-md shadow-amber-500/20 text-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {savingDepositSettings ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ডিপোজিট নম্বর পরিবর্তন সংরক্ষণ করুন</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LIVE CHAT SYSTEM (গ্রাহক ও এডমিন সরাসরি মেসেজিং)                  */}
      {/* ========================================================================= */}
      {activeTab === 'live_chat' && (
        <ErrorBoundary fallbackTitle="এডমিন চ্যাট সাময়িক বিভ্রাট">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[550px]">
            {/* Left: Customer Threads */}
            <div className="border-r border-slate-200 bg-slate-50/50 flex flex-col">
              <div className="p-4 border-b border-slate-200 bg-white">
                <h3 className="font-black text-slate-900 text-sm flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>গ্রাহক চ্যাট থ্রেড ({chatThreads.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">যে গ্রাহকের সাথে কথা বলতে চান তাকে নির্বাচন করুন।</p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {!chatThreads || chatThreads.filter((t) => Boolean(t && t.user && t.user.id)).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">কোনো চ্যাট মেসেজ এখনও আসেনি।</div>
                ) : (
                  chatThreads
                    .filter((thread) => Boolean(thread && thread.user && thread.user.id))
                    .map((thread) => {
                      const isSelected = activeChatUserId === thread.user.id;
                      return (
                        <button
                          key={thread.user.id}
                          onClick={() => setActiveChatUserId(thread.user.id)}
                          className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-start space-x-3 ${
                            isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {thread.user.name?.slice(0, 1)?.toUpperCase() || 'C'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs text-slate-900 truncate">{thread.user.name || 'গ্রাহক'}</h4>
                              {(thread.unreadCount || 0) > 0 && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">{thread.user.phone || ''}</p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{thread.lastMessage?.message || ''}</p>
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {/* Right: Message Window */}
            <div className="md:col-span-2 flex flex-col bg-white">
              {activeChatUserId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        💬
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">
                          {chatThreads.find((t) => t?.user?.id === activeChatUserId)?.user?.name || 'গ্রাহক'}
                        </h4>
                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                          অনলাইন চ্যাট
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => loadChatMessages(activeChatUserId)}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      রিফ্রেশ
                    </button>
                  </div>

                  {/* Messages Box */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[350px] max-h-[450px] bg-slate-50/30">
                    {chatLoading ? (
                      <div className="py-12 text-center text-xs text-slate-400">মেসেজ লোড হচ্ছে...</div>
                    ) : !chatMessages || chatMessages.filter((m) => Boolean(m && m.id)).length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">এই গ্রাহকের সাথে কোনো মেসেজ পাওয়া যায়নি। নিচে লিখে পাঠানো শুরু করুন।</div>
                    ) : (
                      chatMessages
                        .filter((msg) => Boolean(msg && msg.id))
                        .map((msg) => {
                          const isAdmin = msg.senderRole === 'admin';
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                  isAdmin
                                    ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-br-xs'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                                }`}
                              >
                                <div className="text-[10px] opacity-75 font-bold mb-0.5">
                                  {isAdmin ? 'অ্যাডমিন' : (msg.senderName || 'গ্রাহক')}
                                </div>
                                <p className="whitespace-pre-wrap">{msg.message || ''}</p>
                              </div>
                              <span className="text-[9px] text-slate-400 mt-1 font-mono px-1">
                                {formatDhakaDate(msg.timestamp)}
                              </span>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Send Input */}
                  <form onSubmit={handleSendAdminChatMessage} className="p-3 border-t border-slate-200 flex gap-2 bg-white">
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder="গ্রাহককে উত্তর লিখুন..."
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <button
                      type="submit"
                      disabled={sendingChatMessage || !chatInputText.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>পাঠান</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">বাম পাশের তালিকা থেকে যেকোনো গ্রাহককে নির্বাচন করুন</p>
                  <p className="text-[11px] text-slate-400 mt-1">তার সাথে রিয়েল-টাইম মেসেজিং করতে পারবেন।</p>
                </div>
              )}
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* ========================================================================= */}
      {/* TAB: MONTHLY EARNINGS                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'monthly_earnings' && (
        <MonthlyEarningsManager
          currentUser={currentUser}
          onViewCustomerWallet={handleInspectCustomerWallet}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: DEPOSITS & WITHDRAWALS                                               */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deposits Queue */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center">
              <ArrowDownLeft className="w-5 h-5 mr-1.5 text-blue-600" />
              ম্যানুয়াল ডিপোজিট আবেদন কিউ ({toBanglaNumber(deposits.length)})
            </h3>

            {deposits.length === 0 ? (
              <p className="text-xs text-slate-400 italic">কোনো ডিপোজিট আবেদন জমা নেই।</p>
            ) : (
              <div className="space-y-3">
                {deposits.map((d) => {
                  const statusMeta = getRequestStatusMeta(d.status);
                  return (
                    <div
                      key={d.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{d.userName} ({d.userPhone})</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {d.paymentMethod} • প্রেরক: {d.senderPhone || 'N/A'} • TrxID: {d.transactionRef}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-700 text-sm">{formatTaka(d.amount)}</div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.badgeClass}`}>
                            {statusMeta.labelBangla}
                          </span>
                        </div>
                      </div>

                      {d.note && <p className="text-[11px] text-slate-500 italic">নোট: {d.note}</p>}

                      {d.status === 'pending' && (
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleRejectDeposit(d.id)}
                            className="px-3 py-1 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                          >
                            প্রত্যাখ্যান
                          </button>
                          <button
                            onClick={() => handleApproveDeposit(d.id)}
                            className="px-3 py-1 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                          >
                            অনুমোদন ও ওয়ালেটে যুক্ত
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Withdrawals Queue */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center">
              <ArrowUpRight className="w-5 h-5 mr-1.5 text-purple-600" />
              উত্তোলন আবেদন কিউ ({toBanglaNumber(withdrawals.length)})
            </h3>

            {withdrawals.length === 0 ? (
              <p className="text-xs text-slate-400 italic">কোনো উত্তোলন আবেদন জমা নেই।</p>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => {
                  const statusMeta = getRequestStatusMeta(w.status);
                  return (
                    <div
                      key={w.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{w.userName} ({w.userPhone})</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {w.paymentMethod} • প্রাপক: {w.accountNumber}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-700 text-sm">{formatTaka(w.amount)}</div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.badgeClass}`}>
                            {statusMeta.labelBangla}
                          </span>
                        </div>
                      </div>

                      {w.note && <p className="text-[11px] text-slate-500 italic">নোট: {w.note}</p>}

                      {w.status === 'pending' && (
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleRejectWithdrawal(w.id)}
                            className="px-3 py-1 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                          >
                            প্রত্যাখ্যান
                          </button>
                          <button
                            onClick={() => handleApproveWithdrawal(w.id)}
                            className="px-3 py-1 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700"
                          >
                            উত্তোলন অনুমোদন
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: WALLET AUDIT                                                         */}
      {/* ========================================================================= */}
      {activeTab === 'wallets' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="max-w-xl mx-auto text-center mb-6">
            <h3 className="text-base font-bold text-slate-900">নির্দিষ্ট গ্রাহকের ওয়ালেট অডিট</h3>
            <p className="text-xs text-slate-500 mt-1">
              গ্রাহকের আইডি বা নির্বাচন করে তার সম্পূর্ণ লাইভ লেজার ব্যালেন্স ও লেনদেন যাচাই করুন।
            </p>

            <div className="flex gap-2 mt-4">
              <select
                value={inspectUserId}
                onChange={(e) => setInspectUserId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="">গ্রাহক নির্বাচন করুন...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - ব্যালেন্স: ৳{c.walletBalance || 0}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!inspectUserId || inspecting}
                onClick={() => handleInspectCustomerWallet(inspectUserId)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {inspecting ? 'যাচাই হচ্ছে...' : 'অডিট দেখুন'}
              </button>
            </div>
          </div>

          {inspectedWallet && (
            <div className="border-t border-slate-100 pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block">মেইন ওয়ালেট ব্যালেন্স</span>
                  <span className="text-xl font-black text-slate-900">{formatTaka(inspectedWallet.summary.availableBalance)}</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-xs text-amber-800 block">ডেমো ওয়ালেট (কমিশন জমার ঘর)</span>
                  <span className="text-xl font-black text-amber-900">{formatTaka(inspectedWallet.summary.demoWalletBalance)}</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs text-emerald-800 block">মোট উপার্জিত কমিশন</span>
                  <span className="text-xl font-black text-emerald-900">{formatTaka(inspectedWallet.summary.totalEarnings)}</span>
                </div>
              </div>

              {/* Transactions table */}
              <div>
                <h4 className="font-bold text-xs text-slate-800 mb-2">লেজার ট্রানজেকশন হিস্ট্রি</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-2 px-3">তারিখ</th>
                        <th className="py-2 px-3">ধরন</th>
                        <th className="py-2 px-3">পরিমাণ</th>
                        <th className="py-2 px-3">ব্যালেন্স পরবর্তী</th>
                        <th className="py-2 px-3">বিবরণ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspectedWallet.transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{formatDhakaDate(tx.createdAt)}</td>
                          <td className="py-2 px-3 font-semibold">{tx.type}</td>
                          <td className="py-2 px-3 font-bold text-emerald-700">+{formatTaka(tx.amount)}</td>
                          <td className="py-2 px-3 font-mono">{formatTaka(tx.balanceAfter)}</td>
                          <td className="py-2 px-3 text-slate-600">{tx.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: ONBOARDING & AUDIT LOGS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'onboarding_logs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center">
              <Ticket className="w-5 h-5 mr-2 text-purple-600" />
              আমন্ত্রণ কোড (Invite Codes)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              নতুন গ্রাহক অনবোর্ডিং নিয়ন্ত্রণ করতে আমন্ত্রণ কোড তৈরি ও ট্র্যাক করুন।
            </p>

            <form onSubmit={handleCreateInviteCode} className="flex gap-2 max-w-md">
              <input
                type="text"
                required
                placeholder="নতুন কোড (যেমন: VIP-2026)"
                value={newCodeName}
                onChange={(e) => setNewCodeName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold uppercase"
              />
              <input
                type="number"
                min="1"
                placeholder="ব্যবহার সংখ্যা"
                value={newCodeUses}
                onChange={(e) => setNewCodeUses(e.target.value)}
                className="w-24 px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
              <button
                type="submit"
                disabled={creatingCode}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                কোড তৈরি
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {inviteCodes.map((c) => (
                <div key={c.code} className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs flex items-center space-x-2">
                  <span className="font-mono font-bold text-purple-900">{c.code}</span>
                  <span className="text-[10px] bg-purple-200/70 text-purple-800 px-2 py-0.5 rounded-md font-bold">
                    {toBanglaNumber(c.usedCount)} / {toBanglaNumber(c.maxUses)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-600" />
              অ্যাডমিন অ্যাক্টিভিটি অডিট ট্রেইল
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">সময় (BST)</th>
                    <th className="py-2.5 px-3">অ্যাডমিন</th>
                    <th className="py-2.5 px-3">কার্যক্রম (Action)</th>
                    <th className="py-2.5 px-3">টার্গেট</th>
                    <th className="py-2.5 px-3">বিবরণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activityLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{formatDhakaDate(log.timestamp)}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{log.adminName}</td>
                      <td className="py-2.5 px-3 font-mono text-purple-700">{log.action}</td>
                      <td className="py-2.5 px-3 text-slate-600">{log.targetEntity}</td>
                      <td className="py-2.5 px-3 text-slate-700">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 1: EDIT CUSTOMER PASSWORD ===================== */}
      {editingPasswordCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">গ্রাহকের পাসওয়ার্ড পরিবর্তন</h3>
                  <p className="text-[11px] text-slate-500">অ্যাডমিন পাসওয়ার্ড রিসেট টুল</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPasswordCustomer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPasswordChange} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div className="font-bold text-slate-900">{editingPasswordCustomer.name}</div>
                <div className="text-slate-500 font-mono mt-0.5">{editingPasswordCustomer.phone} • {editingPasswordCustomer.email}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড লিখুন <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: NewPass@123"
                  value={newCustomerPassword}
                  onChange={(e) => setNewCustomerPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  এই পাসওয়ার্ডটি সেভ করলে গ্রাহক তার ফোন নম্বর এবং এই নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingPasswordCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPassword ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: DELETE CUSTOMER CONFIRMATION ===================== */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-900">গ্রাহক রিমুভ নিশ্চিতকরণ</h3>
                  <p className="text-[11px] text-slate-500">স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলা হবে</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingCustomer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900">
                <p className="font-bold text-sm mb-1">{deletingCustomer.name}</p>
                <p className="font-mono">মোবাইল: {deletingCustomer.phone}</p>
                <p className="font-mono text-[11px] mt-0.5">ইমেইল: {deletingCustomer.email}</p>
                <p className="mt-2 text-rose-800">
                  ⚠️ সতর্কতা: এই গ্রাহককে মুছে ফেললে তার সকল সংযুক্ত মোবাইল ব্যাংকিং অ্যাকাউন্ট, কমিশন রেকর্ড এবং লেনদেন স্থায়ীভাবে মুছে ফেলা হবে। এই প্রক্রিয়া অপরিবর্তনীয়।
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDeletingCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={isSubmittingDelete}
                  onClick={handleConfirmDeleteCustomer}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDelete ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, স্থায়ীভাবে ডিলিট করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: ACCOUNT APPROVAL & COMMISSION SETTING ===================== */}
      {approvingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">অ্যাকাউন্ট অনুমোদন ও পার্সেন্টেজ নির্ধারণ</h3>
                  <p className="text-[11px] text-slate-500">মাসিক লেনদেন সীমা ও কমিশন হার নির্ধারণ করুন</p>
                </div>
              </div>
              <button
                onClick={() => setApprovingRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div className="font-bold text-slate-900">{approvingRecord.accountName}</div>
                <div className="text-slate-500 font-mono mt-0.5">
                  {approvingRecord.personalNumber} • {approvingRecord.serviceProvider} ({approvingRecord.accountType})
                </div>
                <div className="text-slate-600 mt-1 font-semibold">মালিক: {approvingRecord.userName}</div>
              </div>

              {/* Monthly Target Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মাসিক লেনদেন সীমা / টার্গেট (৳ BDT) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="500"
                  value={approvalTargetAmount}
                  onChange={(e) => setApprovalTargetAmount(e.target.value)}
                  placeholder="যেমন: ৫০,০০০"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Commission Percentage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কমিশন শতকরা হার (%) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={approvalCommissionRate}
                    onChange={(e) => setApprovalCommissionRate(e.target.value)}
                    placeholder="যেমন: ২.০"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>ডেমো ওয়ালেটে প্রাথমিক জমা:</span>
                  <span className="text-emerald-700 text-sm font-black">
                    ৳{Math.round((((Number(approvalTargetAmount) || 0) * (Number(approvalCommissionRate) || 0)) / 100) * 100) / 100}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  ✅ অনুমোদনের পর অ্যাকাউন্টটি গ্রাহকের ড্যাশবোর্ডে <span className="font-bold">সবুজ (চলমান)</span> কালার হয়ে দেখাবে এবং ডেমো ওয়ালেটে এই টাকা জমা হতে থাকবে।
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setApprovingRecord(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApproval}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingApproval ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: ACCOUNT REJECTION ===================== */}
      {rejectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-rose-700 flex items-center">
                <XCircle className="w-5 h-5 mr-1.5" />
                অ্যাকাউন্ট আবেদন প্রত্যাখ্যান
              </h3>
              <button onClick={() => setRejectingRecord(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRejection} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রত্যাখ্যানের কারণ লিখুন <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectingRecord(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRejection}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingRejection ? 'প্রক্রিয়াধীন...' : 'প্রত্যাখ্যান করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Drive Workspace Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentUser={currentUser}
      />

    </div>
  );
};
