import {
  AccountApprovalStatus,
  AccountType,
  MobileOperator,
  MonthlyEarningStatus,
  RequestStatus,
  ServiceProvider,
  TransactionType,
} from '../types';

// Convert English numbers to Bangla digits
export function toBanglaNumber(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
}

// Format Taka currency
export function formatTaka(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN').format(amount);
  return `৳ ${toBanglaNumber(formatted)}`;
}

// Format ISO date string into Asia/Dhaka time in Bangla
export function formatDhakaDate(isoString: string): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    const formatted = new Intl.DateTimeFormat('bn-BD', options).format(date);
    return formatted;
  } catch {
    return isoString;
  }
}

// Service Provider Meta
export interface ProviderMeta {
  id: ServiceProvider;
  nameBangla: string;
  shortName: string;
  themeColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  gradientBg: string;
  logoText: string;
}

export const PROVIDERS_META: Record<ServiceProvider, ProviderMeta> = {
  bkash: {
    id: 'bkash',
    nameBangla: 'বিকাশ (bKash)',
    shortName: 'বিকাশ',
    themeColor: '#e2136e',
    badgeBg: 'bg-pink-100 text-pink-700 border-pink-300',
    badgeText: 'text-pink-700',
    borderColor: 'border-pink-500',
    gradientBg: 'from-pink-600 to-rose-600',
    logoText: 'bKash',
  },
  rocket: {
    id: 'rocket',
    nameBangla: 'রকেট (Rocket)',
    shortName: 'রকেট',
    themeColor: '#8c3494',
    badgeBg: 'bg-purple-100 text-purple-700 border-purple-300',
    badgeText: 'text-purple-700',
    borderColor: 'border-purple-500',
    gradientBg: 'from-purple-700 to-indigo-700',
    logoText: 'Rocket',
  },
  nagad: {
    id: 'nagad',
    nameBangla: 'নগদ (Nagad)',
    shortName: 'নগদ',
    themeColor: '#f7931e',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    badgeText: 'text-amber-700',
    borderColor: 'border-amber-500',
    gradientBg: 'from-amber-600 to-orange-600',
    logoText: 'Nagad',
  },
};

// Account Type Meta
export interface AccountTypeMeta {
  id: AccountType;
  nameBangla: string;
  descriptionBangla: string;
  badgeClass: string;
  gradient: string;
}

export const ACCOUNT_TYPES_META: Record<AccountType, AccountTypeMeta> = {
  personal: {
    id: 'personal',
    nameBangla: 'পার্সোনাল অ্যাকাউন্ট',
    descriptionBangla: 'ব্যক্তিগত দৈনন্দিন লেনদেন এবং ফান্ড ট্রান্সফারের জন্য',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    gradient: 'from-blue-600 to-indigo-600',
  },
  agent: {
    id: 'agent',
    nameBangla: 'এজেন্ট অ্যাকাউন্ট',
    descriptionBangla: 'গ্রাহকদের ক্যাশ ইন, ক্যাশ আউট এবং এমএফএস পয়েন্টের জন্য',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    gradient: 'from-emerald-600 to-teal-700',
  },
  merchant: {
    id: 'merchant',
    nameBangla: 'মার্চেন্ট অ্যাকাউন্ট',
    descriptionBangla: 'ব্যবসা, দোকান এবং অনলাইন পেমেন্ট সংগ্রহের জন্য',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    gradient: 'from-amber-600 to-orange-600',
  },
};

export const OPERATORS: MobileOperator[] = [
  'Grameenphone',
  'Banglalink',
  'Robi',
  'Airtel',
  'Teletalk',
];

// Account Approval Status Badge
export function getAccountStatusMeta(status: AccountApprovalStatus) {
  switch (status) {
    case 'approved':
      return {
        labelBangla: 'অনুমোদিত (Approved)',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
    case 'rejected':
      return {
        labelBangla: 'প্রত্যাখ্যাত (Rejected)',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        dotColor: 'bg-rose-500',
      };
    case 'pending':
    default:
      return {
        labelBangla: 'অপেক্ষমাণ (Pending)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
      };
  }
}

// Monthly Earning Status Badge
export function getMonthlyEarningStatusMeta(status: MonthlyEarningStatus) {
  switch (status) {
    case 'finalized':
      return {
        labelBangla: 'চূড়ান্তকৃত (Finalized)',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    case 'pending':
    case 'pending_review':
      return {
        labelBangla: 'অপেক্ষমাণ (Pending)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    case 'draft':
    default:
      return {
        labelBangla: 'খসড়া (Draft)',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      };
  }
}

// Request Status Badge
export function getRequestStatusMeta(status: RequestStatus) {
  switch (status) {
    case 'approved':
      return {
        labelBangla: 'অনুমোদিত',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'rejected':
      return {
        labelBangla: 'প্রত্যাখ্যাত',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    case 'pending':
    default:
      return {
        labelBangla: 'প্রক্রিয়াধীন',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
  }
}

// Transaction Type Meta
export function getTransactionTypeMeta(type: TransactionType) {
  switch (type) {
    case 'commission_credit':
      return {
        labelBangla: 'মাসিক কমিশন ক্রেডিট',
        sign: '+',
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        iconName: 'TrendingUp',
      };
    case 'deposit':
      return {
        labelBangla: 'ডিপোজিট',
        sign: '+',
        colorClass: 'text-blue-700 bg-blue-50 border-blue-200',
        iconName: 'ArrowDownLeft',
      };
    case 'withdrawal':
      return {
        labelBangla: 'উত্তোলন',
        sign: '-',
        colorClass: 'text-purple-700 bg-purple-50 border-purple-200',
        iconName: 'ArrowUpRight',
      };
    case 'adjustment':
      return {
        labelBangla: 'অ্যাডজাস্টমেন্ট',
        sign: '±',
        colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
        iconName: 'RefreshCw',
      };
    case 'installment_deduction':
      return {
        labelBangla: 'সিকিউরিটি কিস্তি কর্তন (৩০%)',
        sign: '-',
        colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
        iconName: 'ArrowDownLeft',
      };
    case 'daily_commission':
      return {
        labelBangla: 'দৈনিক কমিশন',
        sign: '+',
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        iconName: 'TrendingUp',
      };
    case 'account_approval':
      return {
        labelBangla: 'অ্যাকাউন্ট অনুমোদন',
        sign: '',
        colorClass: 'text-slate-700 bg-slate-50 border-slate-200',
        iconName: 'CheckCircle',
      };
  }
}

// Visual status colors as requested:
// চলমান (Running): সবুজ (Green)
// লিমিট শেষ / অফ (Limit Reached / Turned Off): লাল (Red)
export function getAccountOperationalStateMeta(record: {
  status: string;
  operationalState?: 'running' | 'limit_reached' | 'off';
  isLimitReached?: boolean;
}) {
  if (record.status !== 'approved') {
    return {
      state: 'pending',
      labelBangla: 'অনুমোদনের অপেক্ষায়',
      subtextBangla: 'অ্যাডমিন পর্যালোচনায় রয়েছে',
      isGreen: false,
      isRed: false,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      cardBorder: 'border-2 border-amber-300',
      cardBg: 'bg-amber-50/20',
      accentColor: 'text-amber-700',
      indicatorColor: 'bg-amber-500',
    };
  }

  const opState = record.operationalState || (record.isLimitReached ? 'limit_reached' : 'running');

  if (opState === 'running') {
    return {
      state: 'running',
      labelBangla: 'চলমান (Active)',
      subtextBangla: 'কমিশন ডেমো ওয়ালেটে জমা হচ্ছে',
      isGreen: true,
      isRed: false,
      badgeClass: 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs',
      cardBorder: 'border-2 border-emerald-500 shadow-md shadow-emerald-500/15',
      cardBg: 'bg-emerald-50/30',
      accentColor: 'text-emerald-700',
      indicatorColor: 'bg-emerald-500',
    };
  } else if (opState === 'limit_reached') {
    return {
      state: 'limit_reached',
      labelBangla: 'লিমিট সমাপ্ত / অফ (Limit Reached)',
      subtextBangla: 'কমিশন মেইন ওয়ালেটে স্থানান্তরিত',
      isGreen: false,
      isRed: true,
      badgeClass: 'bg-rose-600 text-white border-rose-700 font-black shadow-xs',
      cardBorder: 'border-2 border-rose-500 shadow-md shadow-rose-500/15',
      cardBg: 'bg-rose-50/30',
      accentColor: 'text-rose-700',
      indicatorColor: 'bg-rose-600',
    };
  } else {
    return {
      state: 'off',
      labelBangla: 'অ্যাকাউন্ট অফ / বন্ধ (Off)',
      subtextBangla: 'অ্যাডমিন কর্তৃক বন্ধ করা হয়েছে',
      isGreen: false,
      isRed: true,
      badgeClass: 'bg-rose-600 text-white border-rose-700 font-black shadow-xs',
      cardBorder: 'border-2 border-rose-400 shadow-sm',
      cardBg: 'bg-rose-50/25',
      accentColor: 'text-rose-700',
      indicatorColor: 'bg-rose-600',
    };
  }
}

// Official Payment Account Numbers for Customer Deposit
export const OFFICIAL_DEPOSIT_ACCOUNTS: Record<string, {
  name: string;
  number: string;
  type: string;
  instruction: string;
  badgeBg: string;
}> = {
  'বিকাশ (bKash)': {
    name: 'বিকাশ (bKash)',
    number: '01700000000',
    type: 'মার্চেন্ট / পার্সোনাল নম্বর',
    instruction: 'বিকাশ অ্যাপ বা *২৪৭# ডায়াল করে Send Money অথবা Payment সম্পন্ন করুন।',
    badgeBg: 'bg-pink-100 text-pink-800 border-pink-300',
  },
  'নগদ (Nagad)': {
    name: 'নগদ (Nagad)',
    number: '01811000002',
    type: 'মার্চেন্ট / পার্সোনাল নম্বর',
    instruction: 'নগদ অ্যাপ বা *১৬৭# ডায়াল করে Send Money সম্পন্ন করুন।',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  'রকেট (Rocket)': {
    name: 'রকেট (Rocket)',
    number: '01700000000',
    type: 'পার্সোনাল অ্যাকাউন্ট নম্বর',
    instruction: 'রকেট অ্যাপ বা *৩২২# ডায়াল করে Send Money সম্পন্ন করুন।',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  'ব্যাংক ডিপোজিট': {
    name: 'ব্যাংক ডিপোজিট (Bank Transfer)',
    number: 'Dutch-Bangla Bank (A/C: 123-100-998877)',
    type: 'কর্পোরেট ব্যাংক অ্যাকাউন্ট',
    instruction: 'যেকোনো ব্যাংক বা অ্যাপ থেকে সরাসরি ফান্ড ট্রান্সফার করুন।',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
  },
};
