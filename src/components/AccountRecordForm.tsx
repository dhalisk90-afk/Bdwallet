import React, { useState, useEffect } from 'react';
import { AccountType, CustomerRecord, MobileOperator, ServiceProvider } from '../types';
import { ACCOUNT_TYPES_META, OPERATORS, PROVIDERS_META } from '../utils/formatters';
import { ShieldAlert, CheckCircle, ArrowLeft, Send, Sparkles } from 'lucide-react';

interface AccountRecordFormProps {
  accountType: AccountType;
  serviceProvider: ServiceProvider;
  editingRecord?: CustomerRecord | null;
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  serverErrors?: Record<string, string>;
}

export const AccountRecordForm: React.FC<AccountRecordFormProps> = ({
  accountType,
  serviceProvider,
  editingRecord,
  onSubmit,
  onCancel,
  isSubmitting,
  serverErrors = {},
}) => {
  // The 6 requested fields
  const [accountName, setAccountName] = useState(editingRecord?.accountName || '');
  const [personalNumber, setPersonalNumber] = useState(editingRecord?.personalNumber || '');
  const [accountPassword, setAccountPassword] = useState(editingRecord?.accountPassword || editingRecord?.postalCode || '');
  const [operator, setOperator] = useState<MobileOperator>(editingRecord?.operator || 'Grameenphone');
  const [limitAmount, setLimitAmount] = useState<string>(
    editingRecord ? String(editingRecord.limitAmount) : '25000'
  );
  const [serviceTime, setServiceTime] = useState(editingRecord?.serviceTime || '২৪ ঘণ্টা (24 Hours)');

  // Client-side validation errors
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingRecord) {
      setAccountName(editingRecord.accountName);
      setPersonalNumber(editingRecord.personalNumber);
      setAccountPassword(editingRecord.accountPassword || editingRecord.postalCode || '');
      setOperator(editingRecord.operator);
      setLimitAmount(String(editingRecord.limitAmount));
      setServiceTime(editingRecord.serviceTime);
    }
  }, [editingRecord]);

  const providerMeta = PROVIDERS_META[serviceProvider];
  const typeMeta = ACCOUNT_TYPES_META[accountType];

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. অ্যাকাউন্টের নাম
    if (!accountName.trim() || accountName.trim().length < 2) {
      errs.accountName = 'অ্যাকাউন্টের নাম আবশ্যক (কমপক্ষে ২ অক্ষরের হতে হবে)।';
    }

    // 2. আপনার পার্সোনাল নাম্বার
    const cleanPhone = personalNumber.replace(/[\s-]/g, '');
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!cleanPhone) {
      errs.personalNumber = 'আপনার পার্সোনাল মোবাইল নম্বরটি লিখুন।';
    } else if (!phoneRegex.test(cleanPhone)) {
      errs.personalNumber = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)।';
    }

    // 3. পাসওয়ার্ড (৫ ডিজিট)
    const cleanPass = accountPassword.trim();
    const passRegex = /^\d{5}$/;
    if (!cleanPass) {
      errs.accountPassword = 'পাসওয়ার্ড লিখুন (৫ ডিজিট)।';
    } else if (!passRegex.test(cleanPass)) {
      errs.accountPassword = 'পাসওয়ার্ড অবশ্যই ৫ ডিজিটের সংখ্যা হতে হবে (যেমন: 12345)।';
    }

    // 4. অপারেটর
    if (!operator) {
      errs.operator = 'মোবাইল অপারেটর নির্বাচন করুন।';
    }

    // 5. লিমিট
    const numLimit = Number(limitAmount);
    if (!limitAmount || isNaN(numLimit) || numLimit <= 0) {
      errs.limitAmount = 'টাকার লিমিট ০-এর বেশি সঠিক সংখ্যা হতে হবে।';
    }

    // 6. সার্ভিস টাইম
    if (!serviceTime.trim()) {
      errs.serviceTime = 'সার্ভিস টাইম উল্লেখ করুন (যেমন: ২৪ ঘণ্টা)।';
    }

    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      accountType,
      serviceProvider,
      accountName: accountName.trim(),
      personalNumber: personalNumber.replace(/[\s-]/g, ''),
      postalCode: accountPassword.trim(),
      accountPassword: accountPassword.trim(),
      operator,
      limitAmount: Number(limitAmount),
      serviceTime: serviceTime.trim(),
    });
  };

  const allErrors = { ...clientErrors, ...serverErrors };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 max-w-3xl mx-auto">
      {/* Top Breadcrumb & Selected Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1 text-slate-500" />
          <span>পেছনে ফিরে যান</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Account Type Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${typeMeta.badgeClass}`}>
            {typeMeta.nameBangla}
          </span>
          {/* Service Provider Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${providerMeta.badgeBg}`}>
            {providerMeta.nameBangla}
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <div className="mt-6 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-emerald-600" />
          {editingRecord ? 'অ্যাকাউন্টের তথ্য সম্পাদনা করুন' : `${typeMeta.nameBangla}র বিবরণ দিন`}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          নিচের ছয়টি প্রয়োজনীয় ব্যবসায়িক তথ্য পূরণ করে ডাটাবেজে সংরক্ষণ করুন।
        </p>
      </div>

      {/* Prominent Security Reminder */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start space-x-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">গুরুত্বপূর্ণ নিরাপত্তা নির্দেশিকা:</p>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            এখানে শুধুমাত্র হিসাব পরিচালনার মৌলিক তথ্য চাওয়া হয়েছে। কখনোই আপনার বিকাশ, রকেট বা নগদ অ্যাকাউন্টের পিন (PIN), ওটিপি (OTP) বা সিকিউরিটি কোড এখানে লিখবেন না।
          </p>
        </div>
      </div>

      {/* Main Form: The 6 Fields */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* 1. অ্যাকাউন্টের নাম */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              ১. অ্যাকাউন্টের নাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="যেমন: কামালের পার্সোনাল বিকাশ বা গুলশান স্টোর নগদ"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                allErrors.accountName
                  ? 'border-rose-300 bg-rose-50/50 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
              }`}
            />
            {allErrors.accountName && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{allErrors.accountName}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              সহজে চেনার সুবিধার্থে অ্যাকাউন্টের একটি উপযুক্ত নাম লিখুন।
            </p>
          </div>

          {/* 2. আপনার পার্সোনাল নাম্বার */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              ২. আপনার পার্সোনাল নাম্বার <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={personalNumber}
              onChange={(e) => setPersonalNumber(e.target.value)}
              placeholder="01XXXXXXXXX (১১ ডিজিট)"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none transition-colors ${
                allErrors.personalNumber
                  ? 'border-rose-300 bg-rose-50/50 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
              }`}
            />
            {allErrors.personalNumber && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{allErrors.personalNumber}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              যেই নম্বরে এমএফএস অ্যাকাউন্টটি সক্রিয় রয়েছে।
            </p>
          </div>

          {/* 3. পাসওয়ার্ড */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              ৩. পাসওয়ার্ড <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={accountPassword}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                setAccountPassword(val);
              }}
              placeholder="৫ ডিজিটের পাসওয়ার্ড (যেমন: 12345)"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-widest focus:outline-none transition-colors ${
                allErrors.accountPassword || allErrors.postalCode
                  ? 'border-rose-300 bg-rose-50/50 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
              }`}
            />
            {(allErrors.accountPassword || allErrors.postalCode) && (
              <p className="text-xs text-rose-600 mt-1 font-medium">
                {allErrors.accountPassword || allErrors.postalCode}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              ৫ ডিজিটের গোপন পাসওয়ার্ড সংখ্যা লিখুন।
            </p>
          </div>

          {/* 4. অপারেটর */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              ৪. অপারেটর <span className="text-rose-500">*</span>
            </label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as MobileOperator)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
            {allErrors.operator && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{allErrors.operator}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              সিমটির নেটওয়ার্ক প্রোভাইডার নির্বাচন করুন।
            </p>
          </div>

          {/* 5. লিমিট */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              ৫. লিমিট (৳ টাকায়) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm font-bold">
                ৳
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="যেমন: 25000"
                className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                  allErrors.limitAmount
                    ? 'border-rose-300 bg-rose-50/50 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
              />
            </div>
            {allErrors.limitAmount && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{allErrors.limitAmount}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              দৈনিক বা মাসিক লেনদেনের সর্বোচ্চ সীমা।
            </p>
          </div>

          {/* 6. সার্ভিস টাইম */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              ৬. সার্ভিস টাইম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={serviceTime}
              onChange={(e) => setServiceTime(e.target.value)}
              placeholder="যেমন: সকাল ৯টা - রাত ৮টা অথবা ২৪ ঘণ্টা (24 Hours)"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                allErrors.serviceTime
                  ? 'border-rose-300 bg-rose-50/50 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
              }`}
            />
            {allErrors.serviceTime && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{allErrors.serviceTime}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              যে সময়ে অ্যাকাউন্টটিতে লেনদেন বা সেবা সচল থাকে।
            </p>
          </div>
        </div>

        {/* Global Security Error if any */}
        {allErrors.security && (
          <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-rose-800 text-xs font-medium">
            {allErrors.security}
          </div>
        )}

        {/* Submit & Cancel Actions */}
        <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            বাতিল করুন
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-2.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <span>সংরক্ষণ হচ্ছে...</span>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" />
                <span>সাবমিট করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
