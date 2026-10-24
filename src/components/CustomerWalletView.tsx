import React, { useState, useEffect } from 'react';
import {
  CustomerRecord,
  DepositRequest,
  MonthlyEarning,
  WalletSummary,
  WalletTransaction,
  WithdrawalRequest,
} from '../types';
import { api } from '../api';
import {
  ACCOUNT_TYPES_META,
  formatDhakaDate,
  formatTaka,
  getMonthlyEarningStatusMeta,
  getRequestStatusMeta,
  getTransactionTypeMeta,
  PROVIDERS_META,
  toBanglaNumber,
} from '../utils/formatters';
import {
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  PlusCircle,
  History,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  X,
} from 'lucide-react';

interface CustomerWalletViewProps {
  onBackToDashboard: () => void;
}

export const CustomerWalletView: React.FC<CustomerWalletViewProps> = ({ onBackToDashboard }) => {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [approvedAccounts, setApprovedAccounts] = useState<CustomerRecord[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Deposit Form
  const [depAmount, setDepAmount] = useState('');
  const [depMethod, setDepMethod] = useState('বিকাশ (bKash)');
  const [depSenderPhone, setDepSenderPhone] = useState('');
  const [depTxRef, setDepTxRef] = useState('');
  const [depNote, setDepNote] = useState('');
  const [isSubmittingDep, setIsSubmittingDep] = useState(false);

  // Withdrawal Form
  const [withAmount, setWithAmount] = useState('');
  const [withMethod, setWithMethod] = useState('বিকাশ (bKash)');
  const [withAccountNum, setWithAccountNum] = useState('');
  const [withNote, setWithNote] = useState('');
  const [isSubmittingWith, setIsSubmittingWith] = useState(false);

  // Alerts
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active view tab inside wallet
  const [walletTab, setWalletTab] = useState<'accounts_earnings' | 'ledger' | 'requests'>('accounts_earnings');

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [sumData, allRecords, earnsData, txsData, depsData, withsData] = await Promise.all([
        api.getWalletSummary(),
        api.getRecords(),
        api.getMonthlyEarnings(),
        api.getWalletTransactions(),
        api.getDeposits(),
        api.getWithdrawals(),
      ]);

      setSummary(sumData);
      setApprovedAccounts(allRecords.filter((r) => r.status === 'approved'));
      setMonthlyEarnings(earnsData);
      setTransactions(txsData);
      setDeposits(depsData);
      setWithdrawals(withsData);
    } catch (err: any) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Handle Submit Deposit Request
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(depAmount);
    if (isNaN(num) || num <= 0) {
      alert('সঠিক টাকার অঙ্ক লিখুন');
      return;
    }
    if (!depSenderPhone.trim()) {
      alert('যে নম্বর থেকে টাকা পাঠিয়েছেন তা উল্লেখ করুন।');
      return;
    }

    setIsSubmittingDep(true);
    try {
      const res = await api.createDeposit({
        amount: num,
        paymentMethod: depMethod,
        senderPhone: depSenderPhone.trim(),
        transactionRef: depTxRef,
        note: depNote,
      });
      setBanner({ type: 'success', message: res.messageBangla });
      setIsDepositModalOpen(false);
      setDepAmount('');
      setDepSenderPhone('');
      setDepTxRef('');
      setDepNote('');
      await fetchWalletData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'ডিপোজিট আবেদন ব্যর্থ হয়েছে।' });
    } finally {
      setIsSubmittingDep(false);
    }
  };

  // Handle Submit Withdrawal Request
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(withAmount);
    if (isNaN(num) || num <= 0) {
      alert('সঠিক টাকার অঙ্ক লিখুন');
      return;
    }

    setIsSubmittingWith(true);
    try {
      const res = await api.createWithdrawal({
        amount: num,
        paymentMethod: withMethod,
        accountNumber: withAccountNum,
        note: withNote,
      });
      setBanner({ type: 'success', message: res.messageBangla });
      setIsWithdrawModalOpen(false);
      setWithAmount('');
      setWithAccountNum('');
      setWithNote('');
      await fetchWalletData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'উত্তোলন আবেদন ব্যর্থ হয়েছে।' });
    } finally {
      setIsSubmittingWith(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackToDashboard}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 mb-1 flex items-center"
          >
            ← ড্যাশবোর্ডে ফিরে যান
          </button>
          <h1 className="text-2xl font-black text-slate-900 flex items-center">
            <Wallet className="w-6 h-6 mr-2 text-emerald-600" />
            আপনার গ্রাহক ওয়ালেট ও কমিশন হিসাব
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            অনুমোদিত অ্যাকাউন্ট কমিশন, ব্যালেন্স, ডিপোজিট এবং উত্তোলনের পূর্ণাঙ্গ স্বচ্ছ লেজার।
          </p>
        </div>

        {/* Quick Deposit & Withdrawal Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>ডিপোজিট আবেদন</span>
          </button>

          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>উত্তোলন আবেদন</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {banner && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-xs animate-in fade-in ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{banner.message}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-xs font-bold hover:underline">
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* 5 WALLET CARDS: Available Balance, Total Earnings, Total Deposits, Total Withdrawals, Pending Requests */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Available Balance */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-5 rounded-3xl text-white shadow-lg shadow-emerald-600/20 col-span-1 sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-emerald-100 text-xs font-semibold mb-1">
                <span>বর্তমান ব্যালেন্স</span>
                <Wallet className="w-4 h-4" />
              </div>
              <p className="text-2xl sm:text-3xl font-black tracking-tight">
                {formatTaka(summary.availableBalance)}
              </p>
            </div>
            <p className="text-[11px] text-emerald-100 mt-3 pt-2 border-t border-white/20">
              ব্যবহারযোগ্য অনুমোদিত ফান্ড
            </p>
          </div>

          {/* Card 2: Total Approved Earnings */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>অনুমোদিত কমিশন আয়</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-700">
                {formatTaka(summary.totalEarnings)}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
              চূড়ান্তকৃত মাসিক কমিশন
            </p>
          </div>

          {/* Card 3: Total Approved Deposits */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>অনুমোদিত ডিপোজিট</span>
                <ArrowDownLeft className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-blue-700">
                {formatTaka(summary.totalDeposits)}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
              অ্যাডমিন অনুমোদিত জমা
            </p>
          </div>

          {/* Card 4: Total Approved Withdrawals */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>সর্বমোট উত্তোলন</span>
                <ArrowUpRight className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-purple-700">
                {formatTaka(summary.totalWithdrawals)}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
              সফলভাবে পরিশোধিত উইথড্র
            </p>
          </div>

          {/* Card 5: Pending Requests */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>প্রক্রিয়াধীন আবেদন</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-700">
                {toBanglaNumber(summary.pendingWithdrawalsCount + summary.pendingDepositsCount)} টি
              </p>
            </div>
            <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>ডিপোজিট: {toBanglaNumber(summary.pendingDepositsCount)}</span>
              <span>উত্তোলন: {toBanglaNumber(summary.pendingWithdrawalsCount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs: Approved Accounts Breakdown vs Ledger vs Requests */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/60 p-1.5 gap-1 text-xs">
          <button
            onClick={() => setWalletTab('accounts_earnings')}
            className={`px-4 py-2.5 rounded-2xl font-bold transition-all ${
              walletTab === 'accounts_earnings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            অনুমোদিত অ্যাকাউন্ট ও মাসিক কমিশন বিবরণী ({toBanglaNumber(approvedAccounts.length)})
          </button>

          <button
            onClick={() => setWalletTab('ledger')}
            className={`px-4 py-2.5 rounded-2xl font-bold transition-all ${
              walletTab === 'ledger'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সম্পূর্ণ লেনদেন খতিয়ান ({toBanglaNumber(transactions.length)})
          </button>

          <button
            onClick={() => setWalletTab('requests')}
            className={`px-4 py-2.5 rounded-2xl font-bold transition-all ${
              walletTab === 'requests'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ডিপোজিট ও উত্তোলন হিস্ট্রি ({toBanglaNumber(deposits.length + withdrawals.length)})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: Show every approved account separately with Month, Amount, Commission % & Earnings */}
          {walletTab === 'accounts_earnings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  অনুমোদিত অ্যাকাউন্টভিত্তিক মাসিক কমিশন বিবরণী
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  নিচে আপনার প্রতিটি অনুমোদিত অ্যাকাউন্টের নির্ধারিত কমিশন হার, মাসিক ভলিউম এবং অর্জিত আয় প্রদর্শিত হচ্ছে।
                </p>
              </div>

              {approvedAccounts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                  এখনও কোনো অ্যাকাউন্ট অ্যাডমিন কর্তৃক অনুমোদিত হয়নি। আবেদন অপেক্ষমাণ থাকলে অ্যাডমিন তা অনুমোদন করবেন।
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {approvedAccounts.map((account) => {
                    const provider = PROVIDERS_META[account.serviceProvider];
                    const type = ACCOUNT_TYPES_META[account.accountType];
                    const accountEarnings = monthlyEarnings.filter((e) => e.accountId === account.id);

                    return (
                      <div
                        key={account.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between space-y-4"
                      >
                        {/* Header */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${provider?.badgeBg}`}>
                              {provider?.nameBangla || account.serviceProvider}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${type?.badgeClass}`}>
                              {type?.nameBangla || account.accountType}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-slate-900">
                            {account.accountName}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {account.personalNumber} • {account.operator}
                          </p>
                        </div>

                        {/* Commission Rate Badge */}
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
                          <span className="font-semibold text-emerald-900">নির্ধারিত কমিশন হার:</span>
                          <span className="font-black text-emerald-700 text-sm">
                            {toBanglaNumber(account.commissionRate)}%
                          </span>
                        </div>

                        {/* Monthly Records List for this account */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            মাসিক লেনদেন ও কমিশন রেকর্ড:
                          </p>

                          {accountEarnings.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">
                              এই অ্যাকাউন্টে এখনও কোনো মাসের কমিশন জেনারেট করা হয়নি।
                            </p>
                          ) : (
                            accountEarnings.map((earn) => {
                              const statusMeta = getMonthlyEarningStatusMeta(earn.status);
                              return (
                                <div
                                  key={earn.id}
                                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between"
                                >
                                  <div>
                                    <div className="font-bold text-slate-800">{earn.month}</div>
                                    <div className="text-[11px] text-slate-500">
                                      ভলিউম: {formatTaka(earn.monthlyAmount)} × {toBanglaNumber(earn.commissionPercentage)}%
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="font-bold text-emerald-700 text-sm">
                                      {formatTaka(earn.commissionAmount)}
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusMeta.badgeClass}`}>
                                      {statusMeta.labelBangla}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Complete Transaction History Ledger */}
          {walletTab === 'ledger' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  স্থায়ী লেনদেন খতিয়ান (Immutable Transaction Ledger)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  প্রতিটি কমিশন ক্রেডিট, ডিপোজিট বা উত্তোলনের নির্ভুল ডিজিটাল হিসাবরক্ষণ।
                </p>
              </div>

              {transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                  কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-3 px-4">তারিখ ও সময় (BST)</th>
                        <th className="py-3 px-4">লেনদেনের ধরন</th>
                        <th className="py-3 px-4">বিবরণ</th>
                        <th className="py-3 px-4">পরিমাণ (৳)</th>
                        <th className="py-3 px-4">ব্যালেন্স পরবর্তী</th>
                        <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx) => {
                        const meta = getTransactionTypeMeta(tx.type);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                              {formatDhakaDate(tx.createdAt)}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.colorClass}`}>
                                {meta.labelBangla}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-800 font-medium">{tx.description}</td>
                            <td className={`py-3.5 px-4 font-bold text-sm ${meta.sign === '-' ? 'text-purple-700' : 'text-emerald-700'}`}>
                              {meta.sign} {formatTaka(tx.amount)}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                              {formatTaka(tx.balanceAfter)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                সফল
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Deposits & Withdrawals Requests */}
          {walletTab === 'requests' && (
            <div className="space-y-6">
              {/* Deposits Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center">
                    <ArrowDownLeft className="w-4 h-4 mr-1 text-blue-600" />
                    ডিপোজিট আবেদনসমূহ
                  </h4>
                  <button
                    onClick={() => setIsDepositModalOpen(true)}
                    className="text-xs font-bold text-blue-700 hover:underline"
                  >
                    + নতুন আবেদন
                  </button>
                </div>

                {deposits.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">কোনো ডিপোজিট আবেদন নেই।</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <th className="py-2.5 px-3">তারিখ</th>
                          <th className="py-2.5 px-3">পেমেন্ট মাধ্যম</th>
                          <th className="py-2.5 px-3">রেফারেন্স ID</th>
                          <th className="py-2.5 px-3">পরিমাণ</th>
                          <th className="py-2.5 px-3">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deposits.map((d) => {
                          const statusMeta = getRequestStatusMeta(d.status);
                          return (
                            <tr key={d.id}>
                              <td className="py-2.5 px-3 text-[11px] text-slate-500">{formatDhakaDate(d.createdAt)}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{d.paymentMethod}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{d.transactionRef}</td>
                              <td className="py-2.5 px-3 font-bold text-emerald-700">{formatTaka(d.amount)}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.badgeClass}`}>
                                  {statusMeta.labelBangla}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Withdrawals Section */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-1 text-purple-600" />
                    উত্তোলন আবেদনসমূহ
                  </h4>
                  <button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="text-xs font-bold text-purple-700 hover:underline"
                  >
                    + নতুন আবেদন
                  </button>
                </div>

                {withdrawals.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">কোনো উত্তোলন আবেদন নেই।</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <th className="py-2.5 px-3">তারিখ</th>
                          <th className="py-2.5 px-3">উত্তোলন মাধ্যম</th>
                          <th className="py-2.5 px-3">অ্যাকাউন্ট নম্বর</th>
                          <th className="py-2.5 px-3">পরিমাণ</th>
                          <th className="py-2.5 px-3">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {withdrawals.map((w) => {
                          const statusMeta = getRequestStatusMeta(w.status);
                          return (
                            <tr key={w.id}>
                              <td className="py-2.5 px-3 text-[11px] text-slate-500">{formatDhakaDate(w.createdAt)}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{w.paymentMethod}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{w.accountNumber}</td>
                              <td className="py-2.5 px-3 font-bold text-purple-700">{formatTaka(w.amount)}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.badgeClass}`}>
                                  {statusMeta.labelBangla}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <ArrowDownLeft className="w-5 h-5 mr-1.5 text-blue-600" />
                ম্যানুয়াল ডিপোজিট আবেদন
              </h3>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ডিপোজিটের পরিমাণ (৳ BDT) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="50"
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  placeholder="যেমন: 5000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পেমেন্ট মাধ্যম <span className="text-rose-500">*</span>
                </label>
                <select
                  value={depMethod}
                  onChange={(e) => setDepMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white font-medium"
                >
                  <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                  <option value="নগদ (Nagad)">নগদ (Nagad)</option>
                  <option value="রকেট (Rocket)">রকেট (Rocket)</option>
                  <option value="ব্যাংক ডিপোজিট">ব্যাংক ডিপোজিট (Bank Transfer)</option>
                </select>
              </div>

              {/* Official Payment Number Box based on selected method */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-blue-900 block">
                      {depMethod.includes('বিকাশ') ? 'অফিসিয়াল বিকাশ পার্সোনাল নম্বর:' :
                       depMethod.includes('নগদ') ? 'অফিসিয়াল নগদ পার্সোনাল নম্বর:' :
                       depMethod.includes('রকেট') ? 'অফিসিয়াল রকেট পার্সোনাল নম্বর:' :
                       'অফিসিয়াল ব্যাংক অ্যাকাউন্ট:'}
                    </span>
                    <span className="text-sm font-black font-mono text-blue-700 select-all">
                      {depMethod.includes('বিকাশ') ? '01700000000' :
                       depMethod.includes('নগদ') ? '01800000000' :
                       depMethod.includes('রকেট') ? '01900000000-8' :
                       'City Bank: 110293847501 (Dhaka)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const num = depMethod.includes('বিকাশ') ? '01700000000' :
                                  depMethod.includes('নগদ') ? '01800000000' :
                                  depMethod.includes('রকেট') ? '019000000008' : '110293847501';
                      navigator.clipboard?.writeText(num);
                      alert(`নম্বরটি কপি হয়েছে: ${num}`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-blue-300 text-xs font-bold text-blue-700 hover:bg-blue-100 shadow-2xs transition-colors cursor-pointer"
                  >
                    নম্বর কপি করুন
                  </button>
                </div>
                <p className="text-[11px] text-blue-800 mt-1.5">
                  👉 অনুগ্রহ করে এই নম্বরে টাকা পাঠিয়ে নিচে প্রাপ্ত ট্রানজেকশন আইডি (TrxID) দিয়ে সাবমিট করুন।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  যে নম্বর থেকে টাকা পাঠিয়েছেন (আপনার প্রেরক নম্বর) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={depSenderPhone}
                  onChange={(e) => setDepSenderPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ট্রানজেকশন রেফারেন্স/ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={depTxRef}
                  onChange={(e) => setDepTxRef(e.target.value)}
                  placeholder="যেমন: TRX987654321"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মন্তব্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={depNote}
                  onChange={(e) => setDepNote(e.target.value)}
                  placeholder="রেফারেন্স নোট লিখুন"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDep}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmittingDep ? 'জমা হচ্ছে...' : 'আবেদন সাবমিট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <ArrowUpRight className="w-5 h-5 mr-1.5 text-purple-600" />
                টাকা উত্তোলন আবেদন
              </h3>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
              <span>ব্যবহারযোগ্য ব্যালেন্স:</span>
              <span className="font-bold text-sm">{formatTaka(summary?.availableBalance || 0)}</span>
            </div>

            <form onSubmit={handleSubmitWithdrawal} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  উত্তোলনের পরিমাণ (৳ BDT) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  max={summary?.availableBalance || 0}
                  step="100"
                  value={withAmount}
                  onChange={(e) => setWithAmount(e.target.value)}
                  placeholder="যেমন: 2000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  উত্তোলন মাধ্যম <span className="text-rose-500">*</span>
                </label>
                <select
                  value={withMethod}
                  onChange={(e) => setWithMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                  <option value="রকেট (Rocket)">রকেট (Rocket)</option>
                  <option value="নগদ (Nagad)">নগদ (Nagad)</option>
                  <option value="ব্যাংক একাউন্ট">ব্যাংক একাউন্ট (Bank Transfer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অ্যাকাউন্ট / মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={withAccountNum}
                  onChange={(e) => setWithAccountNum(e.target.value)}
                  placeholder="যেমন: 01711000001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মন্তব্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={withNote}
                  onChange={(e) => setWithNote(e.target.value)}
                  placeholder="উত্তোলন সংক্রান্ত কোনো নোট"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWith}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isSubmittingWith ? 'প্রক্রিয়াধীন...' : 'উত্তোলন সাবমিট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
