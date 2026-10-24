import React, { useState, useEffect, useRef } from 'react';
import {
  AccountType,
  ChatMessage,
  CustomerRecord,
  DepositAccountSettings,
  DepositRequest,
  ServiceProvider,
  User,
  WalletSummary,
  WalletTransaction,
  WithdrawalRequest,
} from '../types';
import { api } from '../api';
import {
  formatDhakaDate,
  formatTaka,
  OPERATORS,
  toBanglaNumber,
} from '../utils/formatters';
import {
  notifyNewTransaction,
  notifyNewChatMessage,
  requestNotificationPermission,
} from '../utils/notifications';
import {
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  PlusCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  X,
  Copy,
  Check,
  Send,
  MessageSquare,
  Smartphone,
  CreditCard,
  Lock,
  RefreshCw,
  History,
  Info,
  RotateCcw,
  Paperclip,
  Image as ImageIcon,
  Video,
  Maximize2,
  HardDrive,
} from 'lucide-react';
import { CustomerTransactionsModal } from './CustomerTransactionsModal';
import { ErrorBoundary } from './ErrorBoundary';
import { GoogleDriveModal } from './GoogleDriveModal';

interface CustomerDashboardProps {
  currentUser: User;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ currentUser }) => {
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [depositSettings, setDepositSettings] = useState<DepositAccountSettings>({
    bkashNumber: '01912345678',
    nagadNumber: '01812345678',
    rocketNumber: '01712345678-9',
    bankDetails: 'City Bank: 110293847501 (Dhaka Branch)',
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Success / Error banners
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Add Account Form State
  const [newAccProvider, setNewAccProvider] = useState<ServiceProvider>('bkash');
  const [newAccType, setNewAccType] = useState<AccountType>('personal');
  const [newAccName, setNewAccName] = useState('');
  const [newAccPhone, setNewAccPhone] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('');
  const [newAccOperator, setNewAccOperator] = useState('Grameenphone');
  const [newAccLimit, setNewAccLimit] = useState('25000');
  const [newAccServiceTime, setNewAccServiceTime] = useState('২৪ ঘণ্টা (24 Hours)');
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);
  const [accountFormErrors, setAccountFormErrors] = useState<Record<string, string>>({});

  // Deposit Form State
  const [depMethod, setDepMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [depAmount, setDepAmount] = useState('');
  const [depSenderPhone, setDepSenderPhone] = useState('');
  const [depTxRef, setDepTxRef] = useState('');
  const [depNote, setDepNote] = useState('');
  const [depCopied, setDepCopied] = useState(false);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  // Withdrawal Form State
  const [withMethod, setWithMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [withAmount, setWithAmount] = useState('');
  const [withAccountNum, setWithAccountNum] = useState('');
  const [withNote, setWithNote] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Live Chat State & Media Attachment
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [sendingChatMessage, setSendingChatMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMediaFile, setChatMediaFile] = useState<{
    dataUrl: string;
    file: File;
    mediaType: 'image' | 'video';
  } | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('ফাইলের আকার সর্বোচ্চ ২৫ মেগাবাইট (25MB) হতে পারে।');
      return;
    }

    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');

    if (!isImg && !isVid) {
      alert('শুধুমাত্র ছবি (JPG, PNG, GIF, WEBP) অথবা ভিডিও (MP4, WEBM) নির্বাচন করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setChatMediaFile({
        dataUrl: reader.result as string,
        file,
        mediaType: isImg ? 'image' : 'video',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [recData, sumData, txData, depData, withData, settsData] = await Promise.all([
        api.getRecords(),
        api.getWalletSummary(),
        api.getWalletTransactions(),
        api.getDeposits(),
        api.getWithdrawals(),
        api.getDepositSettings().catch(() => null),
      ]);
      setRecords(recData);
      setWalletSummary(sumData);
      setTransactions(txData);
      setDeposits(depData);
      setWithdrawals(withData);
      if (settsData) {
        setDepositSettings(settsData);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    requestNotificationPermission();
  }, []);

  const lastMsgCountRef = useRef<number>(0);

  // Poll chat messages while chat modal is open
  const loadChatMessages = async () => {
    try {
      setChatLoading(true);
      const msgs = await api.getChatMessages();
      const valid = Array.isArray(msgs) ? msgs.filter((m) => Boolean(m && m.id)) : [];
      lastMsgCountRef.current = valid.length;
      setChatMessages(valid);
      setTimeout(() => {
        try {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch {}
      }, 100);
    } catch (err: any) {
      console.error('Chat load error:', err);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (isChatModalOpen) {
      loadChatMessages();
      const interval = setInterval(() => {
        api.getChatMessages()
          .then((msgs) => {
            if (Array.isArray(msgs)) {
              const valid = msgs.filter((m) => Boolean(m && m.id));
              if (valid.length > lastMsgCountRef.current && lastMsgCountRef.current > 0) {
                const latest = valid[valid.length - 1];
                if (latest && latest.senderRole === 'admin') {
                  notifyNewChatMessage('অ্যাডমিন', latest.message || 'নতুন ফাইল বা বার্তা');
                }
              }
              lastMsgCountRef.current = valid.length;
              setChatMessages(valid);
            }
          })
          .catch(() => {});
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isChatModalOpen]);

  // Handle Send Chat Message (With Photo/Video Upload Support)
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatInputText.trim() && !chatMediaFile) || sendingChatMessage || isUploadingMedia) return;
    setSendingChatMessage(true);

    try {
      let mediaData: { mediaUrl: string; mediaType: 'image' | 'video'; mediaName?: string; mediaSize?: number } | undefined = undefined;

      if (chatMediaFile) {
        setIsUploadingMedia(true);
        const uploadRes = await api.uploadChatMedia(
          chatMediaFile.dataUrl,
          chatMediaFile.file.name,
          chatMediaFile.file.type
        );
        mediaData = {
          mediaUrl: uploadRes.mediaUrl,
          mediaType: uploadRes.mediaType,
          mediaName: uploadRes.mediaName,
          mediaSize: uploadRes.mediaSize,
        };
      }

      const res = await api.sendChatMessage(chatInputText.trim(), undefined, mediaData);
      const newMsg = res.chatMessage || (res as any).message;
      if (newMsg && newMsg.id) {
        setChatMessages((prev) => [...(Array.isArray(prev) ? prev : []), newMsg]);
      }
      setChatInputText('');
      setChatMediaFile(null);
      setTimeout(() => {
        try {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch {}
      }, 100);
    } catch (err: any) {
      alert(err.message || 'বার্তা পাঠাতে ত্রুটি হয়েছে।');
    } finally {
      setSendingChatMessage(false);
      setIsUploadingMedia(false);
    }
  };

  // Handle Add New Account Submit
  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!newAccName.trim() || newAccName.trim().length < 2) {
      errs.name = 'অ্যাকাউন্টের নাম আবশ্যক (কমপক্ষে ২ অক্ষরের হতে হবে)।';
    }

    const cleanPhone = newAccPhone.replace(/[\s-]/g, '');
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      errs.phone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)।';
    }

    const cleanPassword = newAccPassword.trim();
    const passRegex = /^\d{5}$/;
    if (!cleanPassword || !passRegex.test(cleanPassword)) {
      errs.password = 'পাসওয়ার্ড অবশ্যই ৫ ডিজিটের সংখ্যা হতে হবে (যেমন: 12345)।';
    }

    if (Object.keys(errs).length > 0) {
      setAccountFormErrors(errs);
      return;
    }

    setIsSubmittingAccount(true);
    setAccountFormErrors({});
    try {
      const res = await api.createRecord({
        accountType: newAccType,
        serviceProvider: newAccProvider,
        accountName: newAccName.trim(),
        personalNumber: cleanPhone,
        postalCode: cleanPassword, // Compatible with postalCode field
        accountPassword: cleanPassword,
        operator: newAccOperator,
        limitAmount: Number(newAccLimit) || 25000,
        serviceTime: newAccServiceTime.trim() || '২৪ ঘণ্টা (24 Hours)',
      });

      setBanner({
        type: 'success',
        message: res.messageBangla || 'অ্যাকাউন্ট সফলভাবে জমা হয়েছে! এডমিন অনুমোদনের পর সক্রিয় (সবুজ) হবে এবং প্রতিদিনের কমিশন রাত ১২টায় যোগ হবে।',
      });
      setIsAddAccountModalOpen(false);
      setNewAccName('');
      setNewAccPhone('');
      setNewAccPassword('');
      await fetchDashboardData();
      setTimeout(() => setBanner(null), 7000);
    } catch (err: any) {
      if (err.errors) {
        setAccountFormErrors(err.errors);
      } else {
        setAccountFormErrors({ general: err.message || 'অ্যাকাউন্ট যোগ ব্যর্থ হয়েছে।' });
      }
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  // Handle Deposit Submit
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(depAmount);
    if (isNaN(num) || num <= 0) {
      alert('সঠিক টাকার অঙ্ক লিখুন');
      return;
    }
    // "গ্রাহকের সর্বনিম্ন জমার পরিমাণ 30 হাজার টাকা সে ইচ্ছে করলে ১৫ হাজার টাকা জমা করতে পারবে এবং পরবর্তী 15 হাজার টাকা তার কমিশনের প্রতিদিনের টাকা থেকে ৩০% করে কেটে নেওয়া হবে"
    if (num < 15000) {
      alert('গ্রাহকের সর্বনিম্ন জমার পরিমাণ ১৫,০০০ টাকা (কিস্তি সুবিধা) অথবা ৩০,০০০ টাকা (সম্পূর্ণ ডিপোজিট)। ১৫,০০০ টাকার নিচে কোনো ডিপোজিট গ্রহণযোগ্য নয়।');
      return;
    }
    if (!depSenderPhone.trim()) {
      alert('আপনার প্রেরক নম্বর লিখুন।');
      return;
    }
    if (!depTxRef.trim()) {
      alert('ট্রানজেকশন আইডি (TrxID) লিখুন।');
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      const methodName =
        depMethod === 'bkash'
          ? 'bKash'
          : depMethod === 'nagad'
          ? 'Nagad'
          : depMethod === 'rocket'
          ? 'Rocket'
          : 'Bank Deposit';

      const res = await api.createDeposit({
        amount: num,
        paymentMethod: methodName,
        senderPhone: depSenderPhone.trim(),
        transactionRef: depTxRef.trim(),
        note: depNote.trim(),
      });

      setBanner({ type: 'success', message: res.messageBangla });
      setIsDepositModalOpen(false);
      notifyNewTransaction(num, 'deposit', `৳${num.toLocaleString()} ডিপোজিট আবেদন সফলভাবে জমা হয়েছে।`);
      setDepAmount('');
      setDepSenderPhone('');
      setDepTxRef('');
      setDepNote('');
      await fetchDashboardData();
      setTimeout(() => setBanner(null), 6000);
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'ডিপোজিট আবেদন ব্যর্থ হয়েছে।' });
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  // Handle Withdrawal Submit
  // "আর উত্তোলন এর জন্য শুধুমাত্র কমিশনের টাকা উপলব্ধ থাকবে"
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(withAmount);
    const available = walletSummary?.withdrawableCommissionBalance ?? walletSummary?.availableBalance ?? 0;

    if (isNaN(num) || num <= 0) {
      alert('সঠিক উত্তোলনের টাকার অঙ্ক লিখুন।');
      return;
    }
    if (num > available) {
      alert(`উত্তোলনের জন্য শুধুমাত্র অর্জিত কমিশনের টাকা উপলব্ধ (সিকিউরিটি ডিপোজিটের টাকা উত্তোলনযোগ্য নয়)। আপনার বর্তমান উত্তোলনযোগ্য কমিশন: ${formatTaka(available)}।`);
      return;
    }
    if (!withAccountNum.trim()) {
      alert('যে নম্বরে টাকা গ্রহণ করবেন তা লিখুন।');
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      const methodName =
        withMethod === 'bkash'
          ? 'bKash'
          : withMethod === 'nagad'
          ? 'Nagad'
          : withMethod === 'rocket'
          ? 'Rocket'
          : 'Bank Account';

      const res = await api.createWithdrawal({
        amount: num,
        paymentMethod: methodName,
        accountNumber: withAccountNum.trim(),
        note: withNote.trim(),
      });

      setBanner({ type: 'success', message: res.messageBangla });
      setIsWithdrawModalOpen(false);
      notifyNewTransaction(num, 'withdrawal', `৳${num.toLocaleString()} উত্তোলন আবেদন সফলভাবে জমা হয়েছে।`);
      setWithAmount('');
      setWithAccountNum('');
      setWithNote('');
      await fetchDashboardData();
      setTimeout(() => setBanner(null), 6000);
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'উত্তোলন আবেদন ব্যর্থ হয়েছে।' });
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Copy helper
  const handleCopyNumber = (num: string) => {
    navigator.clipboard?.writeText(num.replace(/[^0-9]/g, ''));
    setDepCopied(true);
    setTimeout(() => setDepCopied(false), 2500);
  };

  // Dynamic deposit info based on Admin settings
  const dynamicDepositInfo = {
    bkash: {
      number: depositSettings.bkashNumber || '01912345678',
      label: 'অফিসিয়াল বিকাশ নম্বর (bKash)',
      color: 'text-pink-600',
      bg: 'bg-pink-50 border-pink-200',
    },
    nagad: {
      number: depositSettings.nagadNumber || '01812345678',
      label: 'অফিসিয়াল নগদ নম্বর (Nagad)',
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
    },
    rocket: {
      number: depositSettings.rocketNumber || '01712345678-9',
      label: 'অফিসিয়াল রকেট নম্বর (Rocket)',
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-200',
    },
    bank: {
      number: depositSettings.bankDetails || 'সিটি ব্যাংক: ১২০-৯৮৭৬-৫৪২১ (বনানী শাখা)',
      label: 'অফিসিয়াল ব্যাংক হিসাব বিবরণ',
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
    },
  };

  return (
    <div className="w-full max-w-md mx-auto sm:max-w-4xl px-3 sm:px-6 py-4 space-y-4 overflow-x-hidden">
      
      {/* Banner Notifications */}
      {banner && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in text-xs ${
            banner.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold leading-relaxed">{banner.message}</span>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ===================== COMPACT WALLET BALANCES (3 CARDS) ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Main Wallet (Commission-Only Withdrawable) */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-4 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                <Wallet className="w-3 h-3 mr-1" />
                <span>মেইন ওয়ালেট (কমিশন)</span>
              </span>
              <span className="text-[10px] text-emerald-300 font-semibold">উত্তোলনযোগ্য</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              {formatTaka(walletSummary?.withdrawableCommissionBalance ?? walletSummary?.availableBalance ?? 0)}
            </div>
          </div>
          <p className="text-[10px] text-slate-300 mt-2">
            উত্তোলনের জন্য শুধুমাত্র অর্জিত কমিশনের টাকা উপলব্ধ থাকে।
          </p>
        </div>

        {/* Card 2: Demo Wallet (Daily Net Commission) */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 rounded-2xl p-4 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/30">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>ডেমো ওয়ালেট (দৈনিক)</span>
              </span>
              <span className="text-[10px] text-amber-300 font-semibold">রাত ১২টায় ক্রেডিট</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight mt-1">
              {formatTaka(walletSummary?.demoWalletBalance || 0)}
            </div>
          </div>
          <p className="text-[10px] text-slate-300 mt-2">
            অনুমোদনের তারিখ থেকে প্রতিদিন রাত ১২:০০ টায় নির্ধারিত হারে কমিশন জমা হয়।
          </p>
        </div>

        {/* Card 3: Security Deposit & Installment Status */}
        <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-4 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold border border-purple-500/30">
                <ShieldCheck className="w-3 h-3 mr-1" />
                <span>সিকিউরিটি ডিপোজিট</span>
              </span>
              <span className="text-[10px] text-purple-200 font-bold">
                {walletSummary?.securityDepositRemaining && walletSummary.securityDepositRemaining > 0
                  ? 'কিস্তি চলমান'
                  : 'পরিশোধিত'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-200 tracking-tight mt-1">
              {formatTaka(walletSummary?.securityDepositPaid || 0)}
            </div>
          </div>
          <p className="text-[10px] text-purple-200/90 mt-2">
            {walletSummary?.securityDepositRemaining && walletSummary.securityDepositRemaining > 0 ? (
              <span>
                বকেয়া কিস্তি: ৳{(walletSummary.securityDepositRemaining).toLocaleString()} (দৈনিক কমিশন থেকে ৩০% হারে কর্তন হচ্ছে)
              </span>
            ) : (
              <span>
                সম্পূর্ণ ডিপোজিট (৳৩০,০০০) সম্পন্ন। কমিশন থেকে কোনো কর্তন নেই।
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ===================== CLEAN & SIMPLE 6 ACTION BUTTONS ===================== */}
      {/* ডিপোজিট, উইড্র, একাউন্ট যোগ, ট্রানজেকশন হিস্টোরি, লাইভ চ্যাট, গুগল ড্রাইভ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-xs grid grid-cols-2 sm:grid-cols-6 gap-2">
        {/* 1. Deposit */}
        <button
          onClick={() => setIsDepositModalOpen(true)}
          className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-all cursor-pointer"
        >
          <ArrowDownLeft className="w-4 h-4 shrink-0" />
          <span>ডিপোজিট</span>
        </button>

        {/* 2. Withdraw */}
        <button
          onClick={() => setIsWithdrawModalOpen(true)}
          className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs transition-all cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4 shrink-0" />
          <span>উইড্র / ক্যাশআউট</span>
        </button>

        {/* 3. Add Account */}
        <button
          onClick={() => setIsAddAccountModalOpen(true)}
          className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-xs transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>অ্যাকাউন্ট যোগ</span>
        </button>

        {/* 4. Transaction History (গ্রাহকের ট্রানজেকশন হিস্টরি) */}
        <button
          onClick={() => setIsHistoryModalOpen(true)}
          className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-slate-800 to-slate-900 hover:from-black hover:to-slate-800 text-white shadow-xs transition-all cursor-pointer"
        >
          <History className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>লেনদেন হিস্টোরি</span>
        </button>

        {/* 5. Live Chat with Admin */}
        <button
          onClick={() => setIsChatModalOpen(true)}
          className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs transition-all cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>লাইভ চ্যাট</span>
        </button>

        {/* 6. Google Drive Sync */}
        <button
          onClick={() => setIsDriveModalOpen(true)}
          className="col-span-2 sm:col-span-1 flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 hover:from-blue-800 hover:to-cyan-800 text-white shadow-xs transition-all cursor-pointer"
        >
          <HardDrive className="w-4 h-4 shrink-0 text-cyan-300" />
          <span>ড্রাইভ ক্লাউড</span>
        </button>
      </div>

      {/* ===================== ALL ACCOUNTS INFO (কার্ড আকারে সম্পূর্ণ ইংরেজিতে) ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>All Accounts Information ({records.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Complete account details in English with approval date, password, and daily commission.
            </p>
          </div>

          <button
            onClick={() => setIsAddAccountModalOpen(true)}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>

        {/* Accounts List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            Loading accounts...
          </div>
        ) : records.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl p-4">
            <Smartphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Account Added Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Add your bKash, Rocket, or Nagad account to start earning daily commission from the date of approval.
            </p>
            <button
              onClick={() => setIsAddAccountModalOpen(true)}
              className="mt-3 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-xs hover:bg-purple-700 cursor-pointer"
            >
              + Add First Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {records.map((r) => {
              const isApproved = r.status === 'approved';
              const isRunning = isApproved && (r.operationalState === 'running' || !r.operationalState);
              const isLimitReached = isApproved && r.operationalState === 'limit_reached';
              const isOff = isApproved && r.operationalState === 'off';
              const isPending = r.status === 'pending';

              const targetAmt = r.monthlyTargetAmount || r.limitAmount || 50000;
              const rate = r.commissionRate || 2.0;
              const dailyRate = ((targetAmt * (rate / 100)) / 30);

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
                  className={`rounded-2xl border-2 p-4 transition-all flex flex-col justify-between space-y-3 ${
                    isRunning
                      ? 'border-emerald-500 bg-emerald-50/15'
                      : isLimitReached || isOff
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-amber-300 bg-amber-50/15'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header: Provider, Type & Status */}
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-400 bg-amber-100 text-amber-800 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Approval
                        </span>
                      ) : isRunning ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500 bg-emerald-100 text-emerald-800 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1 animate-pulse" />
                          Active / Running (Green)
                        </span>
                      ) : isLimitReached ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-500 bg-rose-100 text-rose-800 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1" />
                          Limit Reached (Red)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-500 bg-rose-100 text-rose-800 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1" />
                          Off (Red)
                        </span>
                      )}
                    </div>

                    {/* Account Name & Number */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{r.accountName}</h4>
                      <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{r.personalNumber}</p>
                    </div>

                    {/* English Details Box */}
                    <div className="bg-white/80 rounded-xl p-2.5 space-y-1 text-xs border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Password (5-Digit):</span>
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {r.accountPassword || r.postalCode || '*****'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Operator:</span>
                        <span className="font-semibold text-slate-700">{r.operator}</span>
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
                        <span className="font-bold text-emerald-700">BDT {dailyRate.toFixed(2)} / day</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-semibold">Demo Accumulated:</span>
                        <span className="font-black text-emerald-800 text-sm">
                          BDT {(r.demoCommission || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-0.5 text-slate-400">
                        <span>Date Added:</span>
                        <span className="font-mono text-slate-600">{addedDateFormatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Limit Reset Schedule Indicator */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="flex items-center text-indigo-700 font-bold">
                      <RotateCcw className="w-3 h-3 mr-1 text-indigo-600" />
                      মাসিক লিমিট রিসেট:
                    </span>
                    <span className="font-semibold text-slate-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      প্রতি মাসের ১ তারিখ রাত ১২:০০ টায়
                    </span>
                  </div>

                  {/* Status explanation */}
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    {isRunning ? (
                      <span className="text-emerald-800 font-medium">
                        ✓ কমিশন প্রতিদিন রাত ১২:০০ টায় ডেমো ওয়ালেটে স্বয়ংক্রিয়ভাবে যোগ হচ্ছে।
                      </span>
                    ) : isLimitReached ? (
                      <span className="text-rose-800 font-medium">
                        ✓ লিমিট শেষ হওয়ায় কমিশন মেইন ওয়ালেটে ক্রেডিট হয়েছে।
                      </span>
                    ) : isOff ? (
                      <span className="text-rose-800 font-medium">অ্যাকাউন্টটি বর্তমানে বন্ধ রয়েছে।</span>
                    ) : (
                      <span className="text-amber-800 font-medium">অ্যাডমিনের অনুমোদনের পর কমিশন জমা শুরু হবে।</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================== SECTION: RECENT TRANSACTIONS PREVIEW ===================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center space-x-2">
                <span>সাম্প্রতিক লেনদেন হিস্টোরি (Recent Transactions)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {transactions.length} টি
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                কমিশন জমা, ৩০% কিস্তি কর্তন, ডিপোজিট এবং উত্তোলনের নির্ভুল লাইভ হিসাব
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <History className="w-3.5 h-3.5" />
            <span>সম্পূর্ণ লেনদেন হিস্টোরি দেখুন</span>
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            কোনো লেনদেনের রেকর্ড এখনও পাওয়া যায়নি।
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 5).map((tx) => {
              const isCredit = tx.type === 'deposit' || tx.type === 'commission_credit' || tx.type === 'daily_commission';
              return (
                <div key={tx.id} className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'installment_deduction'
                        ? 'bg-amber-100 text-amber-700'
                        : isCredit
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {tx.type === 'installment_deduction' ? (
                        <span className="text-[11px] font-black">৩০%</span>
                      ) : isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          tx.type === 'installment_deduction'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : tx.type === 'daily_commission' || tx.type === 'commission_credit'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : tx.type === 'deposit'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-purple-100 text-purple-800 border border-purple-300'
                        }`}>
                          {tx.type === 'installment_deduction'
                            ? '৩০% কিস্তি কর্তন'
                            : tx.type === 'daily_commission'
                            ? 'দৈনিক কমিশন'
                            : tx.type === 'commission_credit'
                            ? 'মাসিক কমিশন'
                            : tx.type === 'deposit'
                            ? 'সিকিউরিটি ডিপোজিট'
                            : 'কমিশন উত্তোলন'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {formatDhakaDate(tx.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 truncate">
                        {tx.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs sm:text-sm font-black font-mono ${
                      isCredit ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {isCredit ? '+' : '-'}{formatTaka(tx.amount)}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      ব্যালেন্স: {formatTaka(tx.balanceAfter)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {transactions.length > 5 && (
          <div className="p-3 text-center bg-slate-50/50 border-t border-slate-100">
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              আরো {toBanglaNumber(transactions.length - 5)} টি লেনদেন দেখুন →
            </button>
          </div>
        )}
      </div>

      {/* ===================== MODAL 1: ADD ACCOUNT (পোস্টাল কোডের বদলে ৫ ডিজিটের পাসওয়ার্ড) ===================== */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">নতুন একাউন্ট যোগ করুন</h3>
                  <p className="text-[11px] text-slate-500">বিকাশ, রকেট বা নগদ অ্যাকাউন্ট তথ্য দিন</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddAccountModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAccountSubmit} className="space-y-3.5 mt-4">
              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সার্ভিস বেছে নিন
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAccProvider('bkash')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                      newAccProvider === 'bkash'
                        ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    বিকাশ (bKash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccProvider('nagad')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                      newAccProvider === 'nagad'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    নগদ (Nagad)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccProvider('rocket')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                      newAccProvider === 'rocket'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    রকেট (Rocket)
                  </button>
                </div>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অ্যাকাউন্টের ধরন
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAccType('personal')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                      newAccType === 'personal'
                        ? 'border-purple-500 bg-purple-50 text-purple-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    পার্সোনাল
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccType('agent')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                      newAccType === 'agent'
                        ? 'border-purple-500 bg-purple-50 text-purple-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    এজেন্ট
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccType('merchant')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                      newAccType === 'merchant'
                        ? 'border-purple-500 bg-purple-50 text-purple-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    মার্চেন্ট
                  </button>
                </div>
              </div>

              {/* 1. Account Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ১. অ্যাকাউন্টের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ সাব্বির আহমেদ"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
                {accountFormErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1">{accountFormErrors.name}</p>
                )}
              </div>

              {/* 2. Personal Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ২. মোবাইল / অ্যাকাউন্ট নম্বর <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  value={newAccPhone}
                  onChange={(e) => setNewAccPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                {accountFormErrors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1">{accountFormErrors.phone}</p>
                )}
              </div>

              {/* 3. Password (পোস্টাল কোডের পরিবর্তে শুধুমাত্র পাসওয়ার্ড - ৫ ডিজিটের সংখ্যা) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ৩. পাসওয়ার্ড <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    required
                    placeholder="৫ ডিজিটের সংখ্যা (যেমন: 12345)"
                    value={newAccPassword}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setNewAccPassword(val);
                    }}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono tracking-widest font-bold"
                  />
                </div>
                {accountFormErrors.password && (
                  <p className="text-[11px] text-rose-600 mt-1">{accountFormErrors.password}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-0.5">
                  সঠিক ৫ ডিজিটের সংখ্যা বসান।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 4. Operator */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ৪. অপারেটর
                  </label>
                  <select
                    value={newAccOperator}
                    onChange={(e) => setNewAccOperator(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Limit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ৫. মাসিক লিমিট (৳)
                  </label>
                  <input
                    type="number"
                    value={newAccLimit}
                    onChange={(e) => setNewAccLimit(e.target.value)}
                    placeholder="25000"
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  বাতিল
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingAccount}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAccount ? 'জমা হচ্ছে...' : 'অ্যাকাউন্ট যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: DEPOSIT (ডিপোজিট আবেদন - লাইভ সেটিংস নম্বরসহ) ===================== */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">ডিপোজিট আবেদন</h3>
                  <p className="text-[11px] text-slate-500">টাকা পাঠিয়ে TrxID প্রদান করুন</p>
                </div>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-3.5 mt-4">
              {/* Method Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পেমেন্ট মাধ্যম বেছে নিন <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDepMethod('bkash')}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all text-center ${
                      depMethod === 'bkash'
                        ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    bKash
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepMethod('nagad')}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all text-center ${
                      depMethod === 'nagad'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Nagad
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepMethod('rocket')}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all text-center ${
                      depMethod === 'rocket'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Rocket
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepMethod('bank')}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all text-center ${
                      depMethod === 'bank'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Bank
                  </button>
                </div>
              </div>

              {/* Live Official Payment Number Box */}
              <div className={`p-3.5 rounded-2xl border ${dynamicDepositInfo[depMethod].bg}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-bold text-slate-600 block truncate">
                      {dynamicDepositInfo[depMethod].label}:
                    </span>
                    <span className={`text-sm sm:text-base font-black font-mono tracking-wider break-all ${dynamicDepositInfo[depMethod].color}`}>
                      {dynamicDepositInfo[depMethod].number}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyNumber(dynamicDepositInfo[depMethod].number)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  >
                    {depCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  👉 এই নম্বরে টাকা পাঠিয়ে নিচের ঘরে TrxID এবং প্রেরক নম্বর লিখুন।
                </p>
              </div>

              {/* Deposit Policy Notice & Quick Options */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-blue-900 font-black">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>গ্রাহক সিকিউরিটি ডিপোজিট ও কিস্তি পলিসি</span>
                </div>
                <div className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                  <p>• <strong>সর্বনিম্ন জমার পরিমাণ:</strong> ৳৩০,০০০ (ত্রিশ হাজার টাকা)।</p>
                  <p>• <strong>কিস্তি সুবিধা:</strong> আপনি চাইলে শুরুতে <strong>৳১৫,০০০</strong> জমা দিয়ে একাউন্ট শুরু করতে পারবেন। বাকি ৳১৫,০০০ আপনার প্রতিদিনের অর্জিত কমিশন থেকে <strong>৩০%</strong> করে স্বয়ংক্রিয়ভাবে কিস্তি হিসেবে কেটে নেওয়া হবে।</p>
                  <p>• <strong>এককালীন সুবিধা:</strong> একবারে ৳৩০,০০০ বা তার বেশি জমা দিলে কমিশন থেকে কোনো কিস্তি কর্তন হবে না, ১০০% কমিশন সরাসরি পাবেন।</p>
                </div>

                {/* Quick Presets */}
                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDepAmount('15000')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      depAmount === '15000'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-blue-800 border-blue-300 hover:bg-blue-100/60'
                    }`}
                  >
                    ৳১৫,০০০ (কিস্তি প্ল্যান)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepAmount('30000')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      depAmount === '30000'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-indigo-800 border-indigo-300 hover:bg-indigo-100/60'
                    }`}
                  >
                    ৳৩০,০০০ (এককালীন সম্পূর্ণ)
                  </button>
                </div>
              </div>

              {/* Deposit Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ডিপোজিটের পরিমাণ (টাকা ৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="15000"
                  placeholder="যেমন: 15000 বা 30000"
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  সর্বনিম্ন ৳১৫,০০০ জমা দিয়ে কিস্তি চালু করতে পারেন অথবা ৳৩০,০০০ সম্পূর্ণ জমা দিন।
                </p>
              </div>

              {/* Sender Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  আপনার প্রেরক নম্বর <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  value={depSenderPhone}
                  onChange={(e) => setDepSenderPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* TrxID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: BL918K2Q9"
                  value={depTxRef}
                  onChange={(e) => setDepTxRef(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  বাতিল
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingDeposit}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDeposit ? 'সাবমিট হচ্ছে...' : 'ডিপোজিট সাবমিট'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: WITHDRAWAL (টাকা উত্তোলন) ===================== */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">টাকা উত্তোলন আবেদন</h3>
                  <p className="text-[11px] text-slate-500">মেইন ওয়ালেট থেকে ক্যাশআউট করুন</p>
                </div>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdrawalSubmit} className="space-y-3.5 mt-4">
              {/* Available balance indicator */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">উত্তোলনযোগ্য কমিশন ব্যালেন্স:</span>
                  <span className="text-base font-black text-emerald-700">
                    {formatTaka(walletSummary?.withdrawableCommissionBalance ?? 0)}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-800 leading-tight space-y-0.5">
                  <p>✓ <strong>উত্তোলনের নিয়ম:</strong> শুধুমাত্র অর্জিত কমিশন টাকা ক্যাশআউট/উত্তোলন করা যাবে।</p>
                  <p className="text-slate-500">
                    (সিকিউরিটি ডিপোজিটের টাকা একাউন্টের নিরাপত্তার জামানত হিসেবে সংরক্ষিত থাকে)।
                  </p>
                  {(walletSummary?.securityDepositRemaining || 0) > 0 && (
                    <p className="text-amber-800 font-medium">
                      ℹ️ অবশিষ্ট কিস্তি বাবদ প্রতিদিনের কমিশন থেকে ৩০% সমন্বয় চলছে (বাকি: {formatTaka(walletSummary?.securityDepositRemaining || 0)})।
                    </p>
                  )}
                </div>
              </div>

              {/* Method Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  উত্তোলন মাধ্যম <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithMethod('bkash')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                      withMethod === 'bkash'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    bKash
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithMethod('nagad')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                      withMethod === 'nagad'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Nagad
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithMethod('rocket')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                      withMethod === 'rocket'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Rocket
                  </button>
                </div>
              </div>

              {/* Withdraw Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  উত্তোলনের পরিমাণ (৳ BDT) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  max={walletSummary?.withdrawableCommissionBalance || 0}
                  placeholder="যেমন: 1000"
                  value={withAmount}
                  onChange={(e) => setWithAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  সর্বোচ্চ উত্তোলনযোগ্য কমিশন: {formatTaka(walletSummary?.withdrawableCommissionBalance || 0)}
                </p>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রাপক নম্বর (যেখানে টাকা গ্রহণ করবেন) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  value={withAccountNum}
                  onChange={(e) => setWithAccountNum(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  বাতিল
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingWithdraw || (walletSummary?.withdrawableCommissionBalance || 0) <= 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingWithdraw ? 'আবেদন হচ্ছে...' : 'উত্তোলন সাবমিট'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: LIVE CHAT (গ্রাহক ও এডমিন সরাসরি যোগাযোগ) ===================== */}
      {isChatModalOpen && (
        <ErrorBoundary fallbackTitle="লাইভ চ্যাট সাময়িক বিভ্রাট">
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 flex flex-col h-[560px] overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
                    💬
                  </div>
                  <div>
                    <h3 className="font-black text-sm">এডমিন সাপোর্ট লাইভ চ্যাট</h3>
                    <p className="text-[10px] text-blue-100 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                      ছবি ও ভিডিও সহ সরাসরি মেসেজিং
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsChatModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-slate-50/50">
                {chatLoading && (!chatMessages || chatMessages.length === 0) ? (
                  <div className="py-12 text-center text-xs text-slate-400">মেসেজ লোড হচ্ছে...</div>
                ) : (!chatMessages || chatMessages.filter((m) => Boolean(m && m.id)).length === 0) ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    এডমিনের সাথে কোনো বার্তা নেই। যেকোনো জিজ্ঞাসা, ছবি বা ভিডিও পাঠান।
                  </div>
                ) : (
                  (chatMessages || [])
                    .filter((msg) => Boolean(msg && msg.id))
                    .map((msg) => {
                      const isMe = msg.senderRole === 'customer';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-xs'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                            }`}
                          >
                            <div className="text-[9px] opacity-75 font-bold mb-0.5">
                              {isMe ? 'আপনি' : 'অ্যাডমিন'}
                            </div>

                            {/* Media Attachment Rendering */}
                            {msg.mediaUrl && (
                              <div className="mt-1.5 mb-1">
                                {msg.mediaType === 'image' ? (
                                  <img
                                    src={msg.mediaUrl}
                                    alt="Chat attachment"
                                    className="rounded-xl max-h-48 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity border border-black/10"
                                    onClick={() => setPreviewMediaUrl(msg.mediaUrl!)}
                                  />
                                ) : (
                                  <video
                                    src={msg.mediaUrl}
                                    controls
                                    className="rounded-xl max-h-48 w-full object-cover border border-black/10"
                                  />
                                )}
                              </div>
                            )}

                            {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 font-mono px-1">
                            {formatDhakaDate(msg.timestamp)}
                          </span>
                        </div>
                      );
                    })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                className="hidden"
              />

              {/* Media Preview before sending */}
              {chatMediaFile && (
                <div className="px-3.5 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {chatMediaFile.mediaType === 'image' ? (
                      <img src={chatMediaFile.dataUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-300 shrink-0" />
                    ) : (
                      <video src={chatMediaFile.dataUrl} className="w-10 h-10 rounded-lg object-cover border border-slate-300 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate max-w-[200px]">{chatMediaFile.file.name}</p>
                      <p className="text-[10px] text-slate-500">{(chatMediaFile.file.size / (1024 * 1024)).toFixed(2)} MB • {chatMediaFile.mediaType === 'image' ? 'ছবি' : 'ভিডিও'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatMediaFile(null)}
                    className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Chat Send Form */}
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 flex items-center gap-2 bg-white">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
                  title="ছবি বা ভিডিও সংযুক্ত করুন"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder={isUploadingMedia ? 'মিডিয়া আপলোড হচ্ছে...' : 'মেসেজ বা ছবি/ভিডিও পাঠান...'}
                  disabled={isUploadingMedia}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  type="submit"
                  disabled={sendingChatMessage || isUploadingMedia || (!chatInputText.trim() && !chatMediaFile)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isUploadingMedia ? 'আপলোড...' : 'পাঠান'}</span>
                </button>
              </form>
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* Full-Screen Media Lightbox Modal */}
      {previewMediaUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setPreviewMediaUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewMediaUrl(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={previewMediaUrl} alt="Full preview" className="rounded-2xl max-h-[80vh] max-w-full object-contain shadow-2xl" />
          </div>
        </div>
      )}

      {/* ===================== MODAL 5: FULL TRANSACTIONS MODAL ===================== */}
      <CustomerTransactionsModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        transactions={transactions}
        walletSummary={walletSummary}
        onRefresh={fetchDashboardData}
      />

      {/* Google Drive Workspace Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentUser={currentUser}
      />

    </div>
  );
};
