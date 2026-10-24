import React, { useState } from 'react';
import { AccountType, CustomerRecord, ServiceProvider } from '../types';
import {
  ACCOUNT_TYPES_META,
  formatDhakaDate,
  formatTaka,
  getAccountStatusMeta,
  PROVIDERS_META,
  toBanglaNumber,
} from '../utils/formatters';
import {
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Clock,
  Radio,
  Search,
  Filter,
  PlusCircle,
  FileText,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface CustomerRecordsViewProps {
  records: CustomerRecord[];
  onEditRecord: (record: CustomerRecord) => void;
  onDeleteRecord: (recordId: string) => Promise<void>;
  onAddNewRecord: () => void;
  isLoading: boolean;
}

export const CustomerRecordsView: React.FC<CustomerRecordsViewProps> = ({
  records,
  onEditRecord,
  onDeleteRecord,
  onAddNewRecord,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter records
  const filteredRecords = records.filter((r) => {
    // Provider filter
    if (providerFilter !== 'all' && r.serviceProvider !== providerFilter) return false;
    // Type filter
    if (typeFilter !== 'all' && r.accountType !== typeFilter) return false;
    // Status filter
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = r.accountName.toLowerCase().includes(q);
      const matchPhone = r.personalNumber.includes(q);
      const matchPostal = r.postalCode.includes(q);
      const matchOperator = r.operator.toLowerCase().includes(q);
      return matchName || matchPhone || matchPostal || matchOperator;
    }
    return true;
  });

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await onDeleteRecord(deleteId);
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search/Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-emerald-600" />
              আপনার সংরক্ষিত অ্যাকাউন্টসমূহ ({toBanglaNumber(records.length)})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              সকল নতুন অ্যাকাউন্ট প্রাথমিকভাবে <span className="font-semibold text-amber-700">অপেক্ষমাণ (Pending)</span> থাকে। অ্যাডমিন যাচাই ও অনুমোদনের পর তা সক্রিয় হয়।
            </p>
          </div>

          <button
            type="button"
            onClick={onAddNewRecord}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 transition-all self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন অ্যাকাউন্ট যোগ করুন</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="অ্যাকাউন্টের নাম বা নম্বর দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">সকল সার্ভিস (বিকাশ, রকেট, নগদ)</option>
            <option value="bkash">বিকাশ (bKash)</option>
            <option value="rocket">রকেট (Rocket)</option>
            <option value="nagad">নগদ (Nagad)</option>
          </select>

          {/* Type Filter */}
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="approved">অনুমোদিত (Approved)</option>
            <option value="pending">অপেক্ষমাণ (Pending)</option>
            <option value="rejected">প্রত্যাখ্যাত (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Record Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-semibold text-slate-600">তথ্য লোড হচ্ছে...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Filter className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">কোনো রেকর্ড পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {records.length === 0
              ? 'আপনার এখনও কোনো মোবাইল ব্যাংকিং অ্যাকাউন্ট যোগ করা হয়নি। উপরের বাটনে ক্লিক করে প্রথম অ্যাকাউন্টটি যোগ করুন।'
              : 'ফিল্টার শর্তের সাথে মিলে এমন কোনো অ্যাকাউন্ট রেকর্ড পাওয়া যায়নি।'}
          </p>
          {records.length === 0 && (
            <button
              onClick={onAddNewRecord}
              className="mt-4 inline-flex items-center px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              অ্যাকাউন্ট যোগ করুন
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecords.map((record) => {
            const provider = PROVIDERS_META[record.serviceProvider];
            const type = ACCOUNT_TYPES_META[record.accountType];
            const statusMeta = getAccountStatusMeta(record.status);

            const isApproved = record.status === 'approved';
            const isRunning = isApproved && (record.operationalState === 'running' || !record.operationalState);
            const isLimitOrOff = isApproved && (record.operationalState === 'limit_reached' || record.operationalState === 'off');

            return (
              <div
                key={record.id}
                className={`bg-white rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group ${
                  isRunning 
                    ? 'border-2 border-emerald-500 bg-emerald-50/15' 
                    : isLimitOrOff 
                    ? 'border-2 border-rose-500 bg-rose-50/25' 
                    : 'border border-slate-200'
                }`}
              >
                {/* Provider Color Top Bar */}
                <div
                  className={`h-2.5 ${
                    isRunning 
                      ? 'bg-emerald-500' 
                      : isLimitOrOff 
                      ? 'bg-rose-500' 
                      : provider?.gradientBg || 'bg-slate-400'
                  }`}
                />

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Header: Badges & Status */}
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2.5 flex-wrap">
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${provider?.badgeBg}`}>
                          {provider?.nameBangla || record.serviceProvider}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${type?.badgeClass}`}>
                          {type?.nameBangla || record.accountType}
                        </span>
                      </div>

                      {/* State Badge: Green for running, Red for limit_reached/off, Amber for pending */}
                      {isRunning ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500 bg-emerald-100 text-emerald-800 flex items-center">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 mr-1 animate-pulse" />
                          চলমান (সবুজ কালার)
                        </span>
                      ) : isLimitOrOff ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-500 bg-rose-100 text-rose-800 flex items-center">
                          <span className="w-2 h-2 rounded-full bg-rose-600 mr-1" />
                          {record.operationalState === 'limit_reached' ? 'লিমিট শেষ (অফ - লাল)' : 'অফ / স্থগিত (লাল)'}
                        </span>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.badgeClass}`}>
                          {statusMeta.labelBangla}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {record.accountName}
                    </h4>
                  </div>

                  {/* Status Banner / Commission Rate Info */}
                  {isRunning ? (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-900 flex items-center">
                          <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          কমিশন হার:
                        </span>
                        <span className="font-black text-emerald-700 text-sm">
                          {toBanglaNumber(record.commissionRate || 0)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/60">
                        <span className="text-emerald-800">ডেমো ওয়ালেটে জমা:</span>
                        <span className="font-bold text-emerald-900">
                          {formatTaka(record.demoCommission || 0)}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-700 leading-tight">
                        💡 অ্যাকাউন্টের লিমিট শেষ হলে এই টাকা স্বয়ংক্রিয়ভাবে মেইন ওয়ালেটে চলে যাবে এবং উত্তোলন করতে পারবেন।
                      </p>
                    </div>
                  ) : isLimitOrOff ? (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1 text-rose-900">
                      <div className="flex items-center justify-between font-bold">
                        <span>অ্যাকাউন্ট স্ট্যাটাস:</span>
                        <span className="text-rose-700">লিমিট সমাপ্ত / অফ</span>
                      </div>
                      <p className="text-[11px] text-rose-800">
                        {record.transferredToMain 
                          ? `✅ অর্জিত কমিশন ৳${record.demoCommission || 0} মেইন ওয়ালেটে যোগ হয়েছে। আপনি এখন টাকা উত্তোলন করতে পারবেন।`
                          : 'অ্যাকাউন্টটি বর্তমানে এডমিন কর্তৃক অফ রয়েছে।'}
                      </p>
                    </div>
                  ) : record.status === 'pending' ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" />
                      <span>অপেক্ষমাণ (Pending): এডমিন এপ্রুভ করলে একাউন্ট সক্রিয় হবে ও কমিশন জমা হবে।</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                      <p className="font-bold">আবেদন প্রত্যাখ্যাত:</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">{record.rejectionReason || 'যাচাইয়ে ত্রুটি'}</p>
                    </div>
                  )}

                  {/* Details List */}
                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-slate-500">
                        <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        পার্সোনাল নম্বর:
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {record.personalNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-slate-500">
                        <Radio className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        অপারেটর:
                      </span>
                      <span className="font-semibold text-slate-700">{record.operator}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-slate-500">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        পোস্টাল কোড:
                      </span>
                      <span className="font-mono text-slate-700">{record.postalCode}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-slate-500">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        সার্ভিস টাইম:
                      </span>
                      <span className="text-slate-700">{record.serviceTime}</span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">লেনদেন লিমিট:</span>
                      <span className="text-emerald-700 font-bold text-sm">
                        {formatTaka(record.limitAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Timestamps & Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span title="সংরক্ষণের সময়">
                      হালনাগাদ: {formatDhakaDate(record.updatedAt || record.createdAt)}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => onEditRecord(record)}
                        title="সম্পাদনা করুন"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteId(record.id)}
                        title="মুছে ফেলুন"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">রেকর্ডটি মুছে ফেলতে চান?</h3>
            <p className="text-xs text-slate-500 mt-1">
              একবার মুছে ফেললে ডাটাবেজ থেকে এই অ্যাকাউন্টের রেকর্ডটি চিরতরে মুছে যাবে।
            </p>
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
