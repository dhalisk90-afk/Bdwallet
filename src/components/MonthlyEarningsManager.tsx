import React, { useState, useEffect } from 'react';
import { CustomerRecord, MonthlyEarning, MonthlyEarningStatus, User } from '../types';
import { api } from '../api';
import {
  ACCOUNT_TYPES_META,
  formatDhakaDate,
  formatTaka,
  getMonthlyEarningStatusMeta,
  PROVIDERS_META,
  toBanglaNumber,
} from '../utils/formatters';
import {
  Calculator,
  Search,
  Filter,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  X,
  FileCheck2,
  HelpCircle,
  Eye,
  Store,
  UserCheck,
  ShoppingBag,
  TrendingUp,
  Clock,
  Check,
} from 'lucide-react';

interface MonthlyEarningsManagerProps {
  currentUser: User;
  onViewCustomerWallet?: (userId: string) => void;
}

export const MonthlyEarningsManager: React.FC<MonthlyEarningsManagerProps> = ({
  currentUser,
  onViewCustomerWallet,
}) => {
  const [viewMode, setViewMode] = useState<'per_account' | 'all_records'>('per_account');
  const [earnings, setEarnings] = useState<MonthlyEarning[]>([]);
  const [approvedAccounts, setApprovedAccounts] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State for New/Edit Record
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formAccountId, setFormAccountId] = useState('');
  const [formMonth, setFormMonth] = useState('October 2026');
  const [formMonthlyAmount, setFormMonthlyAmount] = useState('50000');
  const [formCommissionRate, setFormCommissionRate] = useState('2.0');
  const [formNote, setFormNote] = useState('');
  const [formStatus, setFormStatus] = useState<MonthlyEarningStatus>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Finalize Confirmation Modal
  const [finalizeId, setFinalizeId] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Banner
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allEarnings, allRecords] = await Promise.all([
        api.getAdminMonthlyEarnings(),
        api.getAdminRecords(),
      ]);
      setEarnings(allEarnings);
      setApprovedAccounts(allRecords.filter((r) => r.status === 'approved'));
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'উপাত্ত লোড করা যায়নি।' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When selected account changes in modal, auto-populate its commission rate
  const handleAccountSelect = (accId: string) => {
    setFormAccountId(accId);
    const selected = approvedAccounts.find((a) => a.id === accId);
    if (selected && selected.commissionRate) {
      setFormCommissionRate(String(selected.commissionRate));
    }
  };

  // Open Create Modal for a specific account (Per Account Base action)
  const handleOpenCreateForAccount = (account: CustomerRecord) => {
    setEditingId(null);
    setFormAccountId(account.id);
    setFormCommissionRate(String(account.commissionRate || 2.0));
    setFormMonth('October 2026');
    setFormMonthlyAmount('50000');
    setFormNote('');
    setFormStatus('draft');
    setIsModalOpen(true);
  };

  // Open Generic Create Modal
  const handleOpenCreateModal = () => {
    setEditingId(null);
    if (approvedAccounts.length > 0) {
      setFormAccountId(approvedAccounts[0].id);
      setFormCommissionRate(String(approvedAccounts[0].commissionRate || 2.0));
    } else {
      setFormAccountId('');
      setFormCommissionRate('2.0');
    }
    setFormMonth('October 2026');
    setFormMonthlyAmount('50000');
    setFormNote('');
    setFormStatus('draft');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (earning: MonthlyEarning) => {
    if (earning.status === 'finalized') {
      alert('চূড়ান্তকৃত রেকর্ড সম্পাদনা করা যাবে না।');
      return;
    }
    setEditingId(earning.id);
    setFormAccountId(earning.accountId);
    setFormMonth(earning.month);
    setFormMonthlyAmount(String(earning.monthlyAmount));
    setFormCommissionRate(String(earning.commissionPercentage));
    setFormNote(earning.note || '');
    setFormStatus(earning.status);
    setIsModalOpen(true);
  };

  // Quick Status Change (from Draft -> Pending, or from Pending -> Finalize)
  const handleQuickStatusChange = async (earning: MonthlyEarning, targetStatus: MonthlyEarningStatus) => {
    if (targetStatus === 'finalized') {
      setFinalizeId(earning.id);
      return;
    }

    try {
      const res = await api.updateAdminMonthlyEarning(earning.id, {
        status: targetStatus,
      });
      setBanner({ type: 'success', message: res.messageBangla });
      await fetchData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'স্ট্যাটাস পরিবর্তন করা যায়নি।' });
    }
  };

  // Live Formula Calculation
  // Commission = Monthly Amount × Commission Percentage ÷ 100
  const parsedAmount = Number(formMonthlyAmount) || 0;
  const parsedRate = Number(formCommissionRate) || 0;
  const calculatedCommission = Math.round(((parsedAmount * parsedRate) / 100) * 100) / 100;

  // Handle Form Submit
  const handleSaveMonthlyEarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAccountId) {
      alert('অনুগ্রহ করে একটি অনুমোদিত অ্যাকাউন্ট নির্বাচন করুন');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await api.updateAdminMonthlyEarning(editingId, {
          month: formMonth,
          monthlyAmount: parsedAmount,
          commissionPercentage: parsedRate,
          note: formNote,
          status: formStatus,
        });
        setBanner({ type: 'success', message: res.messageBangla });
      } else {
        const res = await api.createAdminMonthlyEarning({
          accountId: formAccountId,
          month: formMonth,
          monthlyAmount: parsedAmount,
          commissionPercentage: parsedRate,
          note: formNote,
          status: formStatus,
        });
        setBanner({ type: 'success', message: res.messageBangla });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'সংরক্ষণ ব্যর্থ হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Finalize
  const handleConfirmFinalize = async () => {
    if (!finalizeId) return;
    setIsFinalizing(true);
    try {
      const res = await api.finalizeAdminMonthlyEarning(finalizeId);
      setBanner({ type: 'success', message: res.messageBangla });
      setFinalizeId(null);
      await fetchData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'চূড়ান্তকরণ ব্যর্থ হয়েছে।' });
    } finally {
      setIsFinalizing(false);
    }
  };

  // Filtered earnings list
  const filteredEarnings = earnings.filter((e) => {
    if (typeFilter !== 'all' && e.accountType !== typeFilter) return false;
    if (monthFilter !== 'all' && e.month !== monthFilter) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && (e.status === 'pending' || e.status === 'pending_review')) {
        // match
      } else if (e.status !== statusFilter) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCustomer = (e.userName || '').toLowerCase().includes(q);
      const matchPhone = (e.userPhone || '').includes(q);
      const matchAccount = (e.accountName || '').toLowerCase().includes(q);
      return matchCustomer || matchPhone || matchAccount;
    }
    return true;
  });

  // Filtered accounts list for Per Account Base
  const filteredAccounts = approvedAccounts.filter((a) => {
    if (typeFilter !== 'all' && a.accountType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = a.accountName.toLowerCase().includes(q);
      const matchPhone = a.personalNumber.includes(q);
      const matchOwner = (a.userName || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchOwner;
    }
    return true;
  });

  // Unique months for filter
  const distinctMonths = Array.from(new Set(earnings.map((e) => e.month))).filter(Boolean);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header & Action */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>মাসিক কমিশন ও আয় ব্যবস্থাপনা</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Monthly Earnings Manager (মাসিক আয় ম্যানেজার)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              প্রতিটি অনুমোদিত অ্যাকাউন্টের জন্য নির্দিষ্ট মাসের লেনদেন ভলিউম ও কমিশন হার প্রয়োগ করে আয় খসড়া (Draft), অপেক্ষমাণ (Pending) ও চূড়ান্ত (Finalized) করুন।
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন মাসিক আয় হিসাব করুন</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher: Per Account Base vs All Records Table */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('per_account')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl transition-all ${
                viewMode === 'per_account'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>অ্যাকাউন্টভিত্তিক কমিশন ভিউ (Per Account Base)</span>
            </button>

            <button
              onClick={() => setViewMode('all_records')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl transition-all ${
                viewMode === 'all_records'
                  ? 'bg-white text-purple-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-purple-600" />
              <span>সকল মাসিক রেকর্ড ও স্ট্যাটাস তালিকা ({toBanglaNumber(earnings.length)})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>কমিশন সূত্র: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-emerald-700">ভলিউম × হার ÷ ১০০</code></span>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="গ্রাহকের নাম, ফোন বা অ্যাকাউন্টে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">সকল অ্যাকাউন্টের ধরন</option>
            <option value="personal">পার্সোনাল অ্যাকাউন্ট</option>
            <option value="agent">এজেন্ট অ্যাকাউন্ট</option>
            <option value="merchant">মার্চেন্ট অ্যাকাউন্ট</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">সকল মাস</option>
            {distinctMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="draft">খসড়া (Draft)</option>
            <option value="pending">অপেক্ষমাণ (Pending)</option>
            <option value="finalized">চূড়ান্তকৃত (Finalized)</option>
          </select>
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

      {/* VIEW MODE 1: PER ACCOUNT BASE */}
      {viewMode === 'per_account' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-emerald-600" />
              প্রতিটি অনুমোদিত অ্যাকাউন্টের কমিশন বিশ্লেষণ (Per Account Base)
            </h3>
            <span className="text-xs text-slate-500">
              অনুমোদিত অ্যাকাউন্ট: {toBanglaNumber(filteredAccounts.length)} টি
            </span>
          </div>

          {filteredAccounts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs bg-white rounded-3xl border border-slate-200">
              কোনো অনুমোদিত অ্যাকাউন্ট পাওয়া যায়নি। প্রথমে 'অ্যাকাউন্ট ও অনুমোদন' ট্যাব থেকে অ্যাকাউন্ট অনুমোদন করুন।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAccounts.map((account) => {
                const provider = PROVIDERS_META[account.serviceProvider];
                const type = ACCOUNT_TYPES_META[account.accountType];
                const accountEarnings = earnings.filter((e) => e.accountId === account.id);
                const totalAccountEarned = accountEarnings
                  .filter((e) => e.status === 'finalized')
                  .reduce((sum, e) => sum + (e.commissionAmount || 0), 0);

                return (
                  <div
                    key={account.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div className={`h-2 bg-gradient-to-r ${provider?.gradientBg || 'from-emerald-500 to-teal-500'}`} />

                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      {/* Top Account Info */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${provider?.badgeBg}`}>
                            {provider?.nameBangla || account.serviceProvider}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${type?.badgeClass}`}>
                            {type?.nameBangla || account.accountType}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900">{account.accountName}</h4>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {account.personalNumber} • {account.operator}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
                          <span>মালিক: <strong className="text-slate-800">{account.userName}</strong> ({account.userPhone})</span>
                          {onViewCustomerWallet && (
                            <button
                              onClick={() => onViewCustomerWallet(account.userId)}
                              className="text-[11px] text-emerald-700 hover:underline flex items-center font-semibold"
                            >
                              <Eye className="w-3 h-3 mr-0.5" /> ওয়ালেট
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Commission Metrics Box */}
                      <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium">নির্ধারিত কমিশন হার</p>
                          <p className="text-lg font-black text-emerald-700">
                            {toBanglaNumber(account.commissionRate || 0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium">মোট ফাইনাল কমিশন আয়</p>
                          <p className="text-lg font-black text-slate-800">
                            {formatTaka(totalAccountEarned)}
                          </p>
                        </div>
                      </div>

                      {/* Monthly Records History for This Account */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>মাসভিত্তিক রেকর্ডসমূহ:</span>
                          <span className="text-slate-400 font-normal">{toBanglaNumber(accountEarnings.length)} টি রেকর্ড</span>
                        </div>

                        {accountEarnings.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">এখনও কোনো মাসের কমিশন হিসাব করা হয়নি।</p>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {accountEarnings.map((earn) => {
                              const statusMeta = getMonthlyEarningStatusMeta(earn.status);
                              return (
                                <div
                                  key={earn.id}
                                  className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs flex items-center justify-between"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800">{earn.month}</span>
                                    <div className="text-[10px] text-slate-500">
                                      ভলিউম: {formatTaka(earn.monthlyAmount)} × {toBanglaNumber(earn.commissionPercentage)}%
                                    </div>
                                  </div>

                                  <div className="text-right flex items-center space-x-2">
                                    <div>
                                      <div className="font-bold text-emerald-700 text-xs">
                                        {formatTaka(earn.commissionAmount)}
                                      </div>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusMeta.badgeClass}`}>
                                        {statusMeta.labelBangla}
                                      </span>
                                    </div>

                                    {earn.status !== 'finalized' && (
                                      <button
                                        onClick={() => setFinalizeId(earn.id)}
                                        title="ফাইনাল ও ক্রেডিট করুন"
                                        className="p-1 rounded-md bg-emerald-600 text-white text-[10px] hover:bg-emerald-700"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Action: Add new month earning for this specific account */}
                      <button
                        onClick={() => handleOpenCreateForAccount(account)}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-600" />
                        <span>এই অ্যাকাউন্টের জন্য নতুন মাসের কমিশন নির্ধারণ করুন</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: ALL MONTHLY RECORDS & STATUS TABLE */}
      {viewMode === 'all_records' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                সকল মাসিক কমিশন হিসাব ও স্ট্যাটাস ব্যবস্থাপনা ({toBanglaNumber(filteredEarnings.length)})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Draft (খসড়া) বা Pending (অপেক্ষমাণ) রেকর্ডগুলোকে এক ক্লিকেই Finalized (চূড়ান্ত) করে ওয়ালেটে ক্রেডিট করা যায়।
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mb-2" />
              <p className="text-xs font-semibold text-slate-500">মাসিক উপাত্ত লোড হচ্ছে...</p>
            </div>
          ) : filteredEarnings.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              কোনো মাসিক কমিশন রেকর্ড পাওয়া যায়নি।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">গ্রাহক ও ফোন</th>
                    <th className="py-3 px-4">অ্যাকাউন্টের বিবরণ</th>
                    <th className="py-3 px-4">মাস (Month)</th>
                    <th className="py-3 px-4">মাসিক ভলিউম (BDT)</th>
                    <th className="py-3 px-4">কমিশন %</th>
                    <th className="py-3 px-4">মোট কমিশন আয়</th>
                    <th className="py-3 px-4">স্ট্যাটাস (Status)</th>
                    <th className="py-3 px-4 text-right">স্ট্যাটাস ম্যানেজমেন্ট / অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEarnings.map((earn) => {
                    const statusMeta = getMonthlyEarningStatusMeta(earn.status);
                    const provider = PROVIDERS_META[earn.serviceProvider || 'bkash'];
                    const type = ACCOUNT_TYPES_META[earn.accountType || 'personal'];

                    return (
                      <tr key={earn.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{earn.userName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{earn.userPhone}</div>
                        </td>

                        {/* Account Details */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{earn.accountName}</div>
                          <div className="flex items-center space-x-1.5 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${provider?.badgeBg}`}>
                              {provider?.shortName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${type?.badgeClass}`}>
                              {type?.nameBangla}
                            </span>
                          </div>
                        </td>

                        {/* Month */}
                        <td className="py-3.5 px-4 font-bold text-slate-700">{earn.month}</td>

                        {/* Monthly Amount */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {formatTaka(earn.monthlyAmount)}
                        </td>

                        {/* Commission % */}
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                          {toBanglaNumber(earn.commissionPercentage)}%
                        </td>

                        {/* Commission Earnings */}
                        <td className="py-3.5 px-4 font-bold text-emerald-700 text-sm">
                          {formatTaka(earn.commissionAmount)}
                        </td>

                        {/* Status Management Dropdown / Badge */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col items-start gap-1">
                            {earn.status === 'finalized' ? (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.badgeClass}`}>
                                {statusMeta.labelBangla}
                              </span>
                            ) : (
                              <select
                                value={earn.status}
                                onChange={(e) => handleQuickStatusChange(earn, e.target.value as MonthlyEarningStatus)}
                                className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-300 bg-white"
                              >
                                <option value="draft">Draft (খসড়া)</option>
                                <option value="pending">Pending (অপেক্ষমাণ)</option>
                                <option value="finalized">Finalized (চূড়ান্ত)</option>
                              </select>
                            )}

                            {earn.isCredited && (
                              <span className="text-[10px] text-emerald-700 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> ওয়ালেটে যুক্ত
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {earn.status !== 'finalized' ? (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(earn)}
                                  title="সম্পাদনা করুন"
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => setFinalizeId(earn.id)}
                                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors"
                                >
                                  চূড়ান্ত করুন
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-semibold px-2 py-1 bg-slate-100 rounded-lg flex items-center">
                                <Lock className="w-3 h-3 mr-1" /> চূড়ান্ত
                              </span>
                            )}
                          </div>
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

      {/* Modal: Create or Edit Monthly Earning Record with Live Calculation Formula */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-emerald-600" />
                {editingId ? 'মাসিক আয় রেকর্ড সম্পাদনা' : 'নতুন মাসিক কমিশন নির্ধারণ (Commission Calculation)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMonthlyEarning} className="space-y-4 mt-5">
              {/* Account Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অনুমোদিত অ্যাকাউন্ট নির্বাচন করুন (Per Account Base) <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={!!editingId}
                  value={formAccountId}
                  onChange={(e) => handleAccountSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {approvedAccounts.length === 0 ? (
                    <option value="">কোনো অনুমোদিত অ্যাকাউন্ট নেই</option>
                  ) : (
                    approvedAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.userName} ({a.personalNumber}) - {a.accountName} [{a.serviceProvider}] - রেট: {toBanglaNumber(a.commissionRate)}%
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  অ্যাকাউন্ট নির্বাচন করলে তার নির্ধারিত কমিশন শতকরা হার স্বয়ংক্রিয়ভাবে নিচে বসে যাবে।
                </p>
              </div>

              {/* Month */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    মাস (Month, e.g. October 2026) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setFormMonth('October 2026')}
                      className="text-[10px] text-emerald-700 hover:underline font-semibold"
                    >
                      October 2026
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setFormMonth('November 2026')}
                      className="text-[10px] text-emerald-700 hover:underline font-semibold"
                    >
                      November 2026
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={formMonth}
                  onChange={(e) => setFormMonth(e.target.value)}
                  placeholder="যেমন: October 2026"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              {/* Monthly Amount & Commission % in 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মাসিক ভলিউম (BDT ৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={formMonthlyAmount}
                    onChange={(e) => setFormMonthlyAmount(e.target.value)}
                    placeholder="যেমন: 50000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কমিশন শতকরা হার (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={formCommissionRate}
                    onChange={(e) => setFormCommissionRate(e.target.value)}
                    placeholder="যেমন: 2.0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* LIVE FORMULA CALCULATION PREVIEW */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-1">
                  <span className="flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    কমিশন হিসাব সূত্র:
                  </span>
                  <span className="font-mono text-emerald-700">Commission = Monthly Amount × Commission % ÷ 100</span>
                </div>
                <div className="text-sm font-semibold text-emerald-900 mt-1">
                  {formatTaka(parsedAmount)} × {toBanglaNumber(parsedRate)}% ÷ ১০০ ={' '}
                  <span className="text-base font-black text-emerald-700 underline">
                    {formatTaka(calculatedCommission)}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700/80 mt-1">
                  উভয় ইনপুট পরিবর্তন করলেই স্বয়ংক্রিয়ভাবে মোট আয় আপডেট হয়।
                </p>
              </div>

              {/* Status Selection: Draft, Pending, Finalized */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  রেকর্ড স্ট্যাটাস (Status Management) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as MonthlyEarningStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value="draft">Draft (খসড়া) - পরবর্তীতে রিভিউ ও এডিট করা যাবে</option>
                  <option value="pending">Pending (অপেক্ষমাণ) - চূড়ান্তকরণের অপেক্ষায় থাকবে</option>
                  <option value="finalized">Finalized (চূড়ান্তকৃত) - সাথে সাথে গ্রাহকের ওয়ালেটে ক্রেডিট হবে</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  * শুধুমাত্র Finalized হিসেবে সংরক্ষণ করলে টাকা ওয়ালেটে ক্রেডিট হবে।
                </p>
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মন্তব্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="রেফারেন্স বা বিবরণ"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Finalization */}
      {finalizeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">কমিশন চূড়ান্ত ও ক্রেডিট নিশ্চিতকরণ</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              আপনি কি নিশ্চিতভাবে এই মাসের কমিশন চূড়ান্ত (Finalize) করতে চান? চূড়ান্ত করার সাথে সাথে হিসাবকৃত অর্থ সরাসরি গ্রাহকের ওয়ালেটে ক্রেডিট হবে এবং লেনদেন লেজারে চিরস্থায়ী রেকর্ড সংরক্ষিত হবে।
            </p>
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setFinalizeId(null)}
                disabled={isFinalizing}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalize}
                disabled={isFinalizing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isFinalizing ? 'প্রক্রিয়াধীন...' : 'হ্যাঁ, ফাইনাল ও ক্রেডিট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
