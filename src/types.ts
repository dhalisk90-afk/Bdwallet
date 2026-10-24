export type AccountType = 'personal' | 'agent' | 'merchant';
export type ServiceProvider = 'bkash' | 'rocket' | 'nagad';
export type MobileOperator = 'Grameenphone' | 'Banglalink' | 'Robi' | 'Airtel' | 'Teletalk';
export type UserRole = 'customer' | 'admin';

export type AccountApprovalStatus = 'pending' | 'approved' | 'rejected';
export type MonthlyEarningStatus = 'draft' | 'pending' | 'pending_review' | 'finalized';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type TransactionType =
  | 'commission_credit'
  | 'deposit'
  | 'withdrawal'
  | 'adjustment'
  | 'account_approval'
  | 'installment_deduction'
  | 'daily_commission';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  status?: 'pending' | 'approved' | 'rejected';
  accountCapacity?: number;
  telegramUsername?: string;
  securityDepositPaid?: number;
  securityDepositRemaining?: number;
  securityDepositTarget?: number;
  depositPlan?: 'full' | 'installment' | 'none';
  approvedAt?: string;
  createdAt: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  accountCapacity?: number;
  telegramUsername?: string;
  securityDepositPaid?: number;
  securityDepositRemaining?: number;
  securityDepositTarget?: number;
  depositPlan?: 'full' | 'installment' | 'none';
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  accountsCount: number;
  walletBalance: number;
}

export type AccountOperationalState = 'running' | 'limit_reached' | 'off';

export interface CustomerRecord {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  accountType: AccountType;
  serviceProvider: ServiceProvider;
  accountName: string;
  personalNumber: string;
  postalCode: string;
  accountPassword?: string; // ৫ ডিজিটের পাসওয়ার্ড
  operator: MobileOperator;
  limitAmount: number;
  serviceTime: string;
  status: AccountApprovalStatus;
  commissionRate: number; // e.g. 2.0%
  monthlyTargetAmount?: number; // অ্যাডমিন নির্ধারিত মাসিক লেনদেন টাকা (যেমন: ৫০,০০০)
  demoCommission?: number; // ডেমো ওয়ালেটে জমতে থাকা কমিশন
  dailyCommission?: number; // প্রতিদিনের কমিশন (রাত ১২টায় যোগ হয়)
  isLimitReached?: boolean; // লিমিট শেষ হয়েছে কিনা
  operationalState?: AccountOperationalState; // 'running' (সবুজ) | 'limit_reached' (লাল) | 'off' (লাল)
  transferredToMain?: boolean; // ডেমো ওয়ালেট থেকে মেইন ওয়ালেটে নেওয়া হয়েছে কিনা
  lastLimitResetMonth?: string; // e.g. "2026-10"
  lastLimitResetAt?: string;
  usedLimitThisMonth?: number;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositAccountSettings {
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  bankDetails: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  recipientId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  mediaName?: string;
  mediaSize?: number;
}

export interface DatabaseSnapshotInfo {
  id: string;
  fileName: string;
  createdAt: string;
  sizeBytes: number;
  counts: {
    users: number;
    records: number;
    deposits: number;
    withdrawals: number;
    transactions: number;
    chatMessages: number;
  };
}

export interface MonthlyEarning {
  id: string;
  accountId: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  accountName?: string;
  accountType?: AccountType;
  serviceProvider?: ServiceProvider;
  month: string; // e.g. "October 2026"
  monthlyAmount: number; // e.g. 50000
  commissionPercentage: number; // e.g. 2.0
  commissionAmount: number; // e.g. 1000
  note?: string;
  status: MonthlyEarningStatus;
  isCredited: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletSummary {
  availableBalance: number; // মেইন ওয়ালেট থেকে উত্তোলনযোগ্য ব্যালেন্স (শুধুমাত্র অর্জিত কমিশন)
  withdrawableCommissionBalance: number; // উত্তোলনের জন্য শুধুমাত্র কমিশনের টাকা উপলব্ধ
  mainWalletBalance: number; // মেইন কমিশন ওয়ালেট ব্যালেন্স
  demoWalletBalance: number; // ডেমো ওয়ালেট ব্যালেন্স (দৈনিক কমিশন)
  grossDemoWalletBalance?: number;
  securityDepositPaid: number; // পরিশোধিত সিকিউরিটি ডিপোজিট (যেমন: ১৫,০০০ বা ৩০,০০০)
  securityDepositRemaining: number; // অবশিষ্ট সিকিউরিটি কিস্তি টাকা (১৫,০০০ বা ০)
  securityDepositTarget: number; // সিকিউরিটি ডিপোজিট লক্ষ্যমাত্রা (৩০,০০০ টাকা)
  totalDeductedFromCommission: number; // কমিশন থেকে কর্তনকৃত কিস্তি টাকা (৩০% হারে)
  depositPlan: 'full' | 'installment' | 'none'; // ডিপোজিট প্ল্যান
  totalEarnings: number;
  netEarnings?: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  pendingDepositsCount: number;
  pendingDepositsAmount: number;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  amount: number;
  paymentMethod: string;
  senderPhone?: string; // যে নম্বর থেকে টাকা পাঠানো হয়েছে
  transactionRef: string;
  note?: string;
  status: RequestStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  amount: number;
  paymentMethod: string;
  accountNumber: string;
  note?: string;
  status: RequestStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  status: 'completed' | 'pending' | 'rejected';
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetEntity: string;
  targetId: string;
  reason?: string;
  previousValue?: any;
  newValue?: any;
  timestamp: string;
}

export interface InviteCode {
  code: string;
  createdBy: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface SecurityAuditItem {
  id: string;
  nameBangla: string;
  descriptionBangla: string;
  status: 'passed' | 'failed' | 'pending';
  details: string;
  timestamp: string;
}
