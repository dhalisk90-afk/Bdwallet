import React, { useState } from 'react';
import { WalletSummary, WalletTransaction } from '../types';
import {
  formatDhakaDate,
  formatTaka,
  getTransactionTypeMeta,
  toBanglaNumber,
} from '../utils/formatters';
import {
  X,
  History,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface CustomerTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: WalletTransaction[];
  walletSummary: WalletSummary | null;
  onRefresh?: () => void;
}

export const CustomerTransactionsModal: React.FC<CustomerTransactionsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  walletSummary,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter transactions
  const safeTransactions = (transactions || []).filter(
    (t): t is WalletTransaction => Boolean(t && typeof t === 'object' && t.id)
  );

  const filtered = safeTransactions.filter((tx) => {
    if (filterType !== 'all') {
      if (filterType === 'commission' && tx.type !== 'commission_credit' && tx.type !== 'daily_commission') {
        return false;
      }
      if (filterType === 'deposit' && tx.type !== 'deposit') {
        return false;
      }
      if (filterType === 'withdrawal' && tx.type !== 'withdrawal') {
        return false;
      }
      if (filterType === 'installment' && tx.type !== 'installment_deduction') {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchDesc = (tx.description || '').toLowerCase().includes(q);
      const matchRef = (tx.referenceId || '').toLowerCase().includes(q);
      const matchAmount = String(tx.amount || '').includes(q);
      return matchDesc || matchRef || matchAmount;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              <History className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base flex items-center space-x-2">
                <span>গ্রাহক লেনদেন হিস্টোরি (Transaction History)</span>
              </h3>
              <p className="text-[11px] text-slate-300">
                সকল জমা, উত্তোলন, অর্জিত কমিশন ও কিস্তি কর্তনের লেজার রেকর্ড
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Card 1: Available Commission */}
          <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 block truncate">উত্তোলনযোগ্য কমিশন</span>
            <span className="text-sm sm:text-base font-black text-emerald-600 block mt-0.5">
              {formatTaka(walletSummary?.withdrawableCommissionBalance ?? walletSummary?.availableBalance ?? 0)}
            </span>
          </div>

          {/* Card 2: Security Deposit */}
          <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 block truncate">সিকিউরিটি ডিপোজিট</span>
            <span className="text-sm sm:text-base font-black text-blue-600 block mt-0.5">
              {formatTaka(walletSummary?.securityDepositPaid || 0)}
            </span>
            <span className="text-[9px] text-slate-400 block truncate">
              {walletSummary?.securityDepositRemaining && walletSummary.securityDepositRemaining > 0
                ? `বকেয়া: ৳${walletSummary.securityDepositRemaining.toLocaleString()}`
                : 'পরিশোধিত'}
            </span>
          </div>

          {/* Card 3: 30% Installment Deductions */}
          <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 block truncate">কমিশন থেকে কিস্তি কর্তন</span>
            <span className="text-sm sm:text-base font-black text-rose-600 block mt-0.5">
              {formatTaka(walletSummary?.totalDeductedFromCommission || 0)}
            </span>
            <span className="text-[9px] text-slate-400 block truncate">প্রতিদিন ৩০% হারে</span>
          </div>

          {/* Card 4: Total Withdrawals */}
          <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 block truncate">মোট উত্তোলন</span>
            <span className="text-sm sm:text-base font-black text-purple-600 block mt-0.5">
              {formatTaka(walletSummary?.totalWithdrawals || 0)}
            </span>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              সকল ({toBanglaNumber(safeTransactions.length)})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('commission')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'commission'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              কমিশন ক্রেডিট
            </button>

            <button
              type="button"
              onClick={() => setFilterType('installment')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'installment'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              কিস্তি কর্তন (৩০%)
            </button>

            <button
              type="button"
              onClick={() => setFilterType('deposit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'deposit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              ডিপোজিট
            </button>

            <button
              type="button"
              onClick={() => setFilterType('withdrawal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'withdrawal'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              উত্তোলন
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-48">
            <input
              type="text"
              placeholder="খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 bg-slate-50/50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
            </div>
          ) : (
            filtered.map((tx) => {
              const meta = getTransactionTypeMeta(tx.type);
              const isCredit =
                tx.type === 'commission_credit' ||
                tx.type === 'daily_commission' ||
                tx.type === 'deposit';
              const isDebit = tx.type === 'withdrawal' || tx.type === 'installment_deduction';

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${meta.colorClass}`}
                    >
                      {tx.type === 'commission_credit' || tx.type === 'daily_commission' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : tx.type === 'deposit' ? (
                        <ArrowDownLeft className="w-4 h-4 text-blue-600" />
                      ) : tx.type === 'withdrawal' ? (
                        <ArrowUpRight className="w-4 h-4 text-purple-600" />
                      ) : tx.type === 'installment_deduction' ? (
                        <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.colorClass}`}>
                          {meta.labelBangla}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDhakaDate(tx.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1 break-words">
                        {tx.description}
                      </p>
                      {tx.referenceId && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          রেফারেন্স: {tx.referenceId}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0 pl-12 sm:pl-0">
                    <div
                      className={`text-sm sm:text-base font-black ${
                        isCredit
                          ? 'text-emerald-600'
                          : isDebit
                          ? 'text-rose-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {isCredit ? '+' : isDebit ? '-' : ''}
                      {formatTaka(tx.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      ব্যালেন্স পরবর্তী: {formatTaka(tx.balanceAfter)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>মোট লেনদেন: {toBanglaNumber(safeTransactions.length)}টি</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
