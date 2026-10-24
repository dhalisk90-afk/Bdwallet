import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecordDb {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'customer' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  accountCapacity?: number; // কতগুলো অ্যাকাউন্ট দিতে পারবেন (ন্যূনতম ১০টি)
  telegramUsername?: string; // টেলিগ্রাম ইউজার আইডি
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  securityDepositPaid?: number; // পরিশোধিত সিকিউরিটি ডিপোজিট (যেমন: ১৫,০০০ বা ৩০,০০০)
  securityDepositRemaining?: number; // অবশিষ্ট কিস্তি টাকা (১৫,০০০ বা ০)
  depositPlan?: 'full' | 'installment' | 'none'; // 'full' (৩০,০০০) বা 'installment' (১৫,০০০)
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface CustomerRecordDb {
  id: string;
  userId: string;
  accountType: 'personal' | 'agent' | 'merchant';
  serviceProvider: 'bkash' | 'rocket' | 'nagad';
  accountName: string;
  personalNumber: string;
  postalCode: string;
  accountPassword?: string; // ৫ ডিজিটের পাসওয়ার্ড
  operator: 'Grameenphone' | 'Banglalink' | 'Robi' | 'Airtel' | 'Teletalk';
  limitAmount: number;
  serviceTime: string;
  status: 'pending' | 'approved' | 'rejected';
  commissionRate: number; // e.g. 2.0%
  monthlyTargetAmount?: number; // অ্যাডমিন নির্ধারিত মাসিক লেনদেন টাকা
  demoCommission?: number; // ডেমো ওয়ালেটে জমতে থাকা কমিশন
  dailyCommission?: number; // প্রতিদিনের কমিশন (রাত ১২টায় যোগ হয়)
  isLimitReached?: boolean; // লিমিট শেষ হয়েছে কিনা
  operationalState?: 'running' | 'limit_reached' | 'off'; // 'running' (সবুজ) | 'limit_reached' (লাল) | 'off' (লাল)
  transferredToMain?: boolean; // ডেমো থেকে মেইন ওয়ালেটে স্থানান্তর হয়েছে কিনা
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  lastLimitResetMonth?: string; // e.g. "2026-10" (প্রতি মাসের ১ তারিখ রাত ১২:০০ টায় রিসেট হয়)
  lastLimitResetAt?: string;
  usedLimitThisMonth?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepositAccountSettingsDb {
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  bankDetails: string;
}

export interface ChatMessageDb {
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

export interface MonthlyEarningDb {
  id: string;
  accountId: string;
  userId: string;
  month: string; // e.g. "October 2026"
  monthlyAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  note?: string;
  status: 'draft' | 'pending' | 'pending_review' | 'finalized';
  isCredited: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositRequestDb {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  senderPhone?: string; // গ্রাহকের প্রেরক নম্বর
  transactionRef: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequestDb {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  accountNumber: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionDb {
  id: string;
  userId: string;
  type: 'commission_credit' | 'deposit' | 'withdrawal' | 'adjustment' | 'account_approval' | 'installment_deduction' | 'daily_commission';
  amount: number;
  balanceAfter: number;
  status: 'completed' | 'pending' | 'rejected';
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface AdminActivityLogDb {
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

export interface InviteCodeDb {
  code: string;
  createdBy: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: UserRecordDb[];
  records: CustomerRecordDb[];
  inviteCodes: InviteCodeDb[];
  monthly_earnings: MonthlyEarningDb[];
  deposit_requests: DepositRequestDb[];
  withdrawal_requests: WithdrawalRequestDb[];
  wallet_transactions: WalletTransactionDb[];
  admin_activity_logs: AdminActivityLogDb[];
  deposit_settings?: DepositAccountSettingsDb;
  chat_messages?: ChatMessageDb[];
}

// On Netlify Functions the deploy directory is read-only, so BDW_DATA_ROOT points at a writable scratch dir.
// The durable copy of the database lives in Netlify Blobs (see netlify/functions/api.mts).
const DATA_DIR = path.resolve(process.env.BDW_DATA_ROOT || process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'bd_wallet_db.json');
const BACKUP_FILE = path.join(DATA_DIR, 'bd_wallet_db.backup.json');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');

export interface DatabaseSnapshotInfoDb {
  id: string;
  fileName: string;
  createdAt: string;
  sizeBytes: number;
  reason?: string;
  counts: {
    users: number;
    records: number;
    deposits: number;
    withdrawals: number;
    transactions: number;
    chatMessages: number;
  };
}

// Helper to hash passwords using PBKDF2
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return result === hash;
}

export function getDhakaTimestamp(): string {
  return new Date().toISOString();
}

function getInitialSeedData(): DatabaseSchema {
  const adminAuth = hashPassword('Skdev@001', 'seed_salt_admin_888');
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: 'user_admin_01',
        name: 'সিস্টেম অ্যাডমিন (System Admin)',
        phone: '01700000000',
        email: 'dhalisk90@gmail.com',
        role: 'admin',
        status: 'approved',
        passwordHash: adminAuth.hash,
        salt: adminAuth.salt,
        createdAt: now,
      },
    ],
    records: [],
    inviteCodes: [
      {
        code: 'BDW-INVITE-2026',
        createdBy: 'user_admin_01',
        maxUses: 15,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000 * 365).toISOString(),
        createdAt: now,
      },
      {
        code: 'BDW-VIP-9988',
        createdBy: 'user_admin_01',
        maxUses: 5,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000 * 90).toISOString(),
        createdAt: now,
      },
    ],
    monthly_earnings: [],
    deposit_requests: [],
    withdrawal_requests: [],
    wallet_transactions: [],
    admin_activity_logs: [
      {
        id: 'log_seed_01',
        adminId: 'user_admin_01',
        adminName: 'সিস্টেম অ্যাডমিন',
        action: 'system_initialize',
        targetEntity: 'system',
        targetId: 'sys_root',
        reason: 'সিস্টেম প্রাথমিক কনফিগারেশন ও পারসিসটেন্স সেটআপ',
        timestamp: now,
      },
    ],
    deposit_settings: {
      bkashNumber: '01912345678',
      nagadNumber: '01812345678',
      rocketNumber: '01712345678-9',
      bankDetails: 'City Bank: 110293847501 (Dhaka)',
    },
    chat_messages: [],
  };
}

class JsonDatabase {
  private data: DatabaseSchema;
  private dirty = false;

  constructor() {
    this.ensureDirectory();
    this.data = this.readFromDisk();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SNAPSHOTS_DIR)) {
      fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    }
  }

  private readFromDisk(): DatabaseSchema {
    const candidateFiles = [DB_FILE, BACKUP_FILE];

    for (const filePath of candidateFiles) {
      try {
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed.users && parsed.records) {
            const records = parsed.records.map((r: any) => {
              const monthlyTargetAmount = r.monthlyTargetAmount !== undefined ? r.monthlyTargetAmount : (r.limitAmount || 50000);
              const commissionRate = r.commissionRate !== undefined ? r.commissionRate : 2.0;
              const demoCommission = r.demoCommission !== undefined ? r.demoCommission : Math.round((monthlyTargetAmount * commissionRate) / 100);
              return {
                ...r,
                status: r.status || 'approved',
                commissionRate,
                monthlyTargetAmount,
                demoCommission,
                operationalState: r.operationalState || (r.status === 'approved' ? 'running' : 'off'),
                isLimitReached: r.isLimitReached || false,
                transferredToMain: r.transferredToMain || false,
                approvedAt: r.approvedAt || (r.status === 'approved' ? r.createdAt : undefined),
                approvedBy: r.approvedBy || (r.status === 'approved' ? 'user_admin_01' : undefined),
              };
            });

            const monthly_earnings = parsed.monthly_earnings || [];
            const deposit_requests = parsed.deposit_requests || [];
            const withdrawal_requests = parsed.withdrawal_requests || [];
            const wallet_transactions = parsed.wallet_transactions || [];
            const admin_activity_logs = parsed.admin_activity_logs || [];
            const inviteCodes = parsed.inviteCodes || [];

            const users = (parsed.users || []).map((u: any) => ({
              ...u,
              status: u.status || (u.role === 'admin' ? 'approved' : 'pending'),
            }));

            const deposit_settings = parsed.deposit_settings || {
              bkashNumber: '01912345678',
              nagadNumber: '01812345678',
              rocketNumber: '01712345678-9',
              bankDetails: 'City Bank: 110293847501 (Dhaka)',
            };

            const chat_messages = (parsed.chat_messages || []).map((m: any) => ({
              ...m,
              isRead: m.isRead || false,
            }));

            return {
              users,
              records,
              inviteCodes,
              monthly_earnings,
              deposit_requests,
              withdrawal_requests,
              wallet_transactions,
              admin_activity_logs,
              deposit_settings,
              chat_messages,
            };
          }
        }
      } catch (e) {
        console.error(`Error reading ${filePath}:`, e);
      }
    }

    // If both main and backup file failed, check snapshots directory
    try {
      if (fs.existsSync(SNAPSHOTS_DIR)) {
        const snapFiles = fs.readdirSync(SNAPSHOTS_DIR).filter((f) => f.endsWith('.json')).sort().reverse();
        if (snapFiles.length > 0) {
          const latestSnapPath = path.join(SNAPSHOTS_DIR, snapFiles[0]);
          const raw = fs.readFileSync(latestSnapPath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed.users && parsed.records) {
            console.log(`[BD Wallet Persistence] Restored from latest snapshot: ${snapFiles[0]}`);
            return parsed;
          }
        }
      }
    } catch (snapErr) {
      console.error('Error recovering from snapshot:', snapErr);
    }

    const seed = getInitialSeedData();
    this.saveToDisk(seed);
    return seed;
  }

  private saveToDisk(data: DatabaseSchema) {
    try {
      this.ensureDirectory();
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      const jsonContent = JSON.stringify(data, null, 2);
      fs.writeFileSync(tmpFile, jsonContent, 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);

      // Keep rolling backup copy on disk to survive rebuilds
      try {
        fs.writeFileSync(BACKUP_FILE, jsonContent, 'utf-8');
      } catch (errBackup) {
        console.warn('Could not write rolling backup copy:', errBackup);
      }
    } catch (e) {
      console.error('Failed to persist database to disk:', e);
    }
  }

  // Database Backup, Snapshot & Restore Methods
  createSnapshot(reason = 'Manual backup snapshot'): DatabaseSnapshotInfoDb {
    this.ensureDirectory();
    const id = `snap_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    const fileName = `${id}.json`;
    const targetPath = path.join(SNAPSHOTS_DIR, fileName);
    const content = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(targetPath, content, 'utf-8');

    return {
      id,
      fileName,
      createdAt: getDhakaTimestamp(),
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
      reason,
      counts: {
        users: this.data.users?.length || 0,
        records: this.data.records?.length || 0,
        deposits: this.data.deposit_requests?.length || 0,
        withdrawals: this.data.withdrawal_requests?.length || 0,
        transactions: this.data.wallet_transactions?.length || 0,
        chatMessages: this.data.chat_messages?.length || 0,
      },
    };
  }

  getSnapshots(): DatabaseSnapshotInfoDb[] {
    this.ensureDirectory();
    try {
      const files = fs.readdirSync(SNAPSHOTS_DIR).filter((f) => f.endsWith('.json'));
      return files.map((fileName) => {
        const fullPath = path.join(SNAPSHOTS_DIR, fileName);
        const stats = fs.statSync(fullPath);
        let counts = { users: 0, records: 0, deposits: 0, withdrawals: 0, transactions: 0, chatMessages: 0 };
        try {
          const raw = fs.readFileSync(fullPath, 'utf-8');
          const p = JSON.parse(raw);
          counts = {
            users: p.users?.length || 0,
            records: p.records?.length || 0,
            deposits: p.deposit_requests?.length || 0,
            withdrawals: p.withdrawal_requests?.length || 0,
            transactions: p.wallet_transactions?.length || 0,
            chatMessages: p.chat_messages?.length || 0,
          };
        } catch {}
        return {
          id: fileName.replace('.json', ''),
          fileName,
          createdAt: stats.mtime.toISOString(),
          sizeBytes: stats.size,
          counts,
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }

  restoreFromSnapshot(snapshotId: string, adminId: string, adminName: string): { success: boolean; messageBangla: string } {
    this.ensureDirectory();
    const fileName = snapshotId.endsWith('.json') ? snapshotId : `${snapshotId}.json`;
    const fullPath = path.join(SNAPSHOTS_DIR, fileName);
    if (!fs.existsSync(fullPath)) {
      return { success: false, messageBangla: 'স্ন্যাপশট ফাইল খুঁজে পাওয়া যায়নি।' };
    }
    try {
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.users || !Array.isArray(parsed.users)) {
        return { success: false, messageBangla: 'স্ন্যাপশটের ডেটা ফরম্যাট সঠিক নয়।' };
      }
      this.data = parsed;
      this.persist();
      this.logAdminActivity({
        adminId,
        adminName,
        action: 'restore_snapshot',
        targetEntity: 'database',
        targetId: snapshotId,
        reason: `স্ন্যাপশট ${fileName} থেকে ডেটা সফলভাবে রিস্টোর করা হয়েছে।`,
      });
      return { success: true, messageBangla: 'স্ন্যাপশট থেকে ডেটাবেস সফলভাবে রিস্টোর হয়েছে!' };
    } catch (e: any) {
      return { success: false, messageBangla: e.message || 'স্ন্যাপশট রিস্টোর ব্যর্থ হয়েছে।' };
    }
  }

  exportDatabase(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.data));
  }

  importDatabase(importedData: any, adminId: string, adminName: string): { success: boolean; messageBangla: string } {
    if (!importedData || typeof importedData !== 'object' || !Array.isArray(importedData.users)) {
      return { success: false, messageBangla: 'অবৈধ ব্যাকআপ ফাইল! সঠিক JSON ব্যাকআপ ফাইল নির্বাচন করুন।' };
    }

    // Safety backup of current state before importing
    this.createSnapshot('Pre-import automatic safety backup');

    this.data = {
      users: importedData.users || [],
      records: importedData.records || [],
      inviteCodes: importedData.inviteCodes || [],
      monthly_earnings: importedData.monthly_earnings || [],
      deposit_requests: importedData.deposit_requests || [],
      withdrawal_requests: importedData.withdrawal_requests || [],
      wallet_transactions: importedData.wallet_transactions || [],
      admin_activity_logs: importedData.admin_activity_logs || [],
      deposit_settings: importedData.deposit_settings || this.data.deposit_settings,
      chat_messages: importedData.chat_messages || [],
    };

    this.persist();
    this.logAdminActivity({
      adminId,
      adminName,
      action: 'import_database_backup',
      targetEntity: 'database',
      targetId: 'all',
      reason: 'বাহ্যিক ব্যাকআপ ফাইল থেকে সম্পূর্ণ ডাটাবেস রিস্টোর করা হয়েছে।',
    });

    return { success: true, messageBangla: 'সম্পূর্ণ ব্যাকআপ ফাইল থেকে সকল তথ্য সফলভাবে রিস্টোর করা হয়েছে!' };
  }

  private persist() {
    this.dirty = true;
    this.saveToDisk(this.data);
  }

  // Replace the in-memory state with an externally stored copy (e.g. from Netlify Blobs)
  loadState(state: DatabaseSchema) {
    this.data = state;
    this.dirty = false;
  }

  // Returns the current state if it changed since the last loadState/takeDirtyState call
  takeDirtyState(): DatabaseSchema | null {
    if (!this.dirty) return null;
    this.dirty = false;
    return this.data;
  }

  // Users
  getUsers(): UserRecordDb[] {
    return this.data.users;
  }

  getUserById(id: string): UserRecordDb | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByLogin(identifier: string): UserRecordDb | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      (u) => u.phone.toLowerCase() === clean || u.email.toLowerCase() === clean
    );
  }

  createUser(user: UserRecordDb): UserRecordDb {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  updateUserPassword(userId: string, newPassword: string): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;

    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    this.persist();
    return true;
  }

  deleteUser(userId: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u.id !== userId);
    if (this.data.users.length === initialLen) return false;

    // Delete associated records, earnings, requests, transactions
    this.data.records = this.data.records.filter((r) => r.userId !== userId);
    this.data.monthly_earnings = this.data.monthly_earnings.filter((e) => e.userId !== userId);
    this.data.deposit_requests = this.data.deposit_requests.filter((d) => d.userId !== userId);
    this.data.withdrawal_requests = this.data.withdrawal_requests.filter((w) => w.userId !== userId);
    this.data.wallet_transactions = this.data.wallet_transactions.filter((t) => t.userId !== userId);

    this.persist();
    return true;
  }

  approveUser(userId: string, adminId: string, adminName: string): UserRecordDb | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.status = 'approved';
    user.approvedAt = getDhakaTimestamp();
    user.approvedBy = adminId;
    delete user.rejectionReason;
    this.persist();

    this.logAdminActivity({
      adminId,
      adminName,
      action: 'approve_customer',
      targetEntity: 'users',
      targetId: userId,
      reason: `গ্রাহক ${user.name} (${user.phone}) অ্যাকাউন্ট অনুমোদন করা হয়েছে।`,
    });

    return user;
  }

  rejectUser(userId: string, reason: string, adminId: string, adminName: string): UserRecordDb | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.status = 'rejected';
    user.rejectionReason = reason;
    this.persist();

    this.logAdminActivity({
      adminId,
      adminName,
      action: 'reject_customer',
      targetEntity: 'users',
      targetId: userId,
      reason: `গ্রাহক ${user.name} (${user.phone}) অ্যাকাউন্ট প্রত্যাখ্যান করা হয়েছে। কারণ: ${reason}`,
    });

    return user;
  }

  // Records (MFS Accounts)
  checkAndResetMonthlyLimits(): { resetCount: number; month: string } {
    const now = new Date();
    // Dhaka time formatter for Year and Month e.g. "2026-10"
    const dhakaMonthStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
    }).format(now); // e.g. "2026-10"

    let resetCount = 0;
    for (const record of this.data.records) {
      if (record.status !== 'approved') continue;

      // First time initialization: if record doesn't have lastLimitResetMonth, set it to current month
      if (!record.lastLimitResetMonth) {
        record.lastLimitResetMonth = dhakaMonthStr;
        record.usedLimitThisMonth = record.usedLimitThisMonth || 0;
        continue;
      }

      // If month has rolled over to a new month (e.g. 1st of month at 12:00 AM midnight):
      if (record.lastLimitResetMonth !== dhakaMonthStr) {
        // If it was in limit_reached state or had commissions, transfer before resetting:
        if ((record.operationalState === 'limit_reached' || record.isLimitReached) && !record.transferredToMain) {
          const accumulatedAmt = this.getAccumulatedDemoCommission(record) || record.demoCommission || 0;
          if (accumulatedAmt > 0) {
            record.transferredToMain = true;
          }
        }

        // Reset account limit for the new month:
        record.isLimitReached = false;
        record.operationalState = 'running';
        record.transferredToMain = false;
        record.usedLimitThisMonth = 0;
        record.lastLimitResetMonth = dhakaMonthStr;
        record.lastLimitResetAt = getDhakaTimestamp();
        record.approvedAt = getDhakaTimestamp(); // Reset approval date baseline so new month starts from day 1
        record.updatedAt = getDhakaTimestamp();

        resetCount++;

        this.logAdminActivity({
          adminId: 'system_auto',
          adminName: 'স্বয়ংক্রিয় ১ তারিখ মাসিক সিস্টেম',
          action: 'monthly_limit_auto_reset',
          targetEntity: 'records',
          targetId: record.id,
          reason: `১ তারিখ রাত ১২:০০ টা (BST) মাসিক লিমিট রিসেট: ${record.accountName} (${record.personalNumber}) এর লিমিট নতুন মাস (${dhakaMonthStr}) উপলক্ষে সফলভাবে প্রথম থেকে শুরু করা হয়েছে। মূল অ্যাকাউন্ট অপরিবর্তিত রয়েছে।`,
          newValue: {
            operationalState: 'running',
            isLimitReached: false,
            usedLimitThisMonth: 0,
            lastLimitResetMonth: dhakaMonthStr,
          },
        });
      }
    }

    if (resetCount > 0) {
      this.persist();
    }

    return { resetCount, month: dhakaMonthStr };
  }

  // Admin Manual Reset for all approved accounts
  resetAllMonthlyLimits(adminId: string, adminName: string): { resetCount: number; month: string } {
    const dhakaMonthStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
    }).format(new Date());

    let resetCount = 0;
    for (const record of this.data.records) {
      if (record.status !== 'approved') continue;
      record.isLimitReached = false;
      record.operationalState = 'running';
      record.transferredToMain = false;
      record.usedLimitThisMonth = 0;
      record.lastLimitResetMonth = dhakaMonthStr;
      record.lastLimitResetAt = getDhakaTimestamp();
      record.approvedAt = getDhakaTimestamp();
      record.updatedAt = getDhakaTimestamp();
      resetCount++;
    }

    this.logAdminActivity({
      adminId,
      adminName,
      action: 'manual_reset_all_monthly_limits',
      targetEntity: 'records',
      targetId: 'all_approved_records',
      reason: `অ্যাডমিন কর্তৃক ম্যানুয়ালি সকল অ্যাকাউন্টের ১ তারিখের মাসিক লিমিট রিসেট কার্যকর করা হয়েছে (${resetCount}টি অ্যাকাউন্ট)।`,
      newValue: { resetCount, month: dhakaMonthStr },
    });

    this.persist();
    return { resetCount, month: dhakaMonthStr };
  }

  // Admin Manual Reset for a single account
  resetAccountMonthlyLimit(recordId: string, adminId: string, adminName: string): CustomerRecordDb | null {
    const record = this.getRecordById(recordId);
    if (!record) return null;

    const dhakaMonthStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
    }).format(new Date());

    record.isLimitReached = false;
    record.operationalState = 'running';
    record.transferredToMain = false;
    record.usedLimitThisMonth = 0;
    record.lastLimitResetMonth = dhakaMonthStr;
    record.lastLimitResetAt = getDhakaTimestamp();
    record.approvedAt = getDhakaTimestamp();
    record.updatedAt = getDhakaTimestamp();

    this.logAdminActivity({
      adminId,
      adminName,
      action: 'manual_account_limit_reset',
      targetEntity: 'records',
      targetId: record.id,
      reason: `অ্যাডমিন কর্তৃক ম্যানুয়ালি অ্যাকাউন্টের (${record.accountName}) লিমিট রিসেট করা হয়েছে এবং নতুন করে শুরু করা হয়েছে।`,
      newValue: { operationalState: 'running', isLimitReached: false, usedLimitThisMonth: 0 },
    });

    this.persist();
    return record;
  }

  getRecordsByUserId(userId: string): CustomerRecordDb[] {
    this.checkAndResetMonthlyLimits();
    return this.data.records.filter((r) => r.userId === userId);
  }

  getAllRecords(): CustomerRecordDb[] {
    this.checkAndResetMonthlyLimits();
    return this.data.records;
  }

  getRecordById(id: string): CustomerRecordDb | undefined {
    return this.data.records.find((r) => r.id === id);
  }

  createRecord(record: CustomerRecordDb): CustomerRecordDb {
    this.data.records.push(record);
    this.persist();
    return record;
  }

  updateRecord(id: string, updates: Partial<CustomerRecordDb>): CustomerRecordDb | null {
    const idx = this.data.records.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    const existing = this.data.records[idx];
    const updated: CustomerRecordDb = {
      ...existing,
      ...updates,
      id: existing.id,
      userId: existing.userId,
      createdAt: existing.createdAt,
      updatedAt: getDhakaTimestamp(),
    };

    this.data.records[idx] = updated;
    this.persist();
    return updated;
  }

  deleteRecord(id: string): boolean {
    const initialLen = this.data.records.length;
    this.data.records = this.data.records.filter((r) => r.id !== id);
    if (this.data.records.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Account Approval Workflow (Admin sets monthlyTargetAmount and commissionRate)
  approveAccount(
    id: string,
    commissionRate: number,
    monthlyTargetAmount: number,
    adminId: string,
    adminName: string
  ): CustomerRecordDb | null {
    const record = this.getRecordById(id);
    if (!record) return null;

    const prev = { status: record.status, commissionRate: record.commissionRate };
    const targetAmt = monthlyTargetAmount > 0 ? monthlyTargetAmount : (record.limitAmount || 50000);
    const calculatedDemoCommission = Math.round(((targetAmt * commissionRate) / 100) * 100) / 100;

    record.status = 'approved';
    record.commissionRate = commissionRate;
    record.monthlyTargetAmount = targetAmt;
    record.demoCommission = calculatedDemoCommission;
    record.dailyCommission = Math.round((calculatedDemoCommission / 30) * 100) / 100;
    record.operationalState = 'running'; // চলমান (সবুজ)
    record.isLimitReached = false;
    record.transferredToMain = false;
    record.approvedAt = getDhakaTimestamp();
    record.approvedBy = adminId;
    record.rejectionReason = undefined;
    record.updatedAt = getDhakaTimestamp();

    this.logAdminActivity({
      adminId,
      adminName,
      action: 'approve_account',
      targetEntity: 'records',
      targetId: id,
      reason: `অ্যাকাউন্ট অনুমোদিত: মাসিক লেনদেন ৳${targetAmt}, কমিশন হার ${commissionRate}%, দৈনিক কমিশন ৳${record.dailyCommission}`,
      previousValue: prev,
      newValue: {
        status: 'approved',
        commissionRate,
        monthlyTargetAmount: targetAmt,
        demoCommission: calculatedDemoCommission,
        dailyCommission: record.dailyCommission,
        operationalState: 'running',
      },
    });

    this.persist();
    return record;
  }

  // Calculate dynamic accumulated demo commission based on days passed since approval
  getAccumulatedDemoCommission(record: CustomerRecordDb): number {
    if (record.status !== 'approved' || !record.approvedAt) return 0;
    if (record.transferredToMain) return 0;

    const targetAmt = record.monthlyTargetAmount || record.limitAmount || 50000;
    const monthlyTotal = Math.round(((targetAmt * (record.commissionRate || 0)) / 100) * 100) / 100;
    const dailyRate = Math.round((monthlyTotal / 30) * 100) / 100;

    const approvedDate = new Date(record.approvedAt);
    const nowDate = new Date();
    const diffMs = Math.max(0, nowDate.getTime() - approvedDate.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    // Day 1 commission added upon approval, each subsequent midnight adds 1 day
    const daysCount = Math.min(30, 1 + diffDays);

    return Math.min(monthlyTotal, Math.round((dailyRate * daysCount) * 100) / 100);
  }

  // 3 Admin Operational Control Options:
  // 1. 'running': চলমান (সবুজ) - কমিশন ডেমো ওয়ালেটে জমা হচ্ছে
  // 2. 'limit_reached': লিমিট শেষ / অফ (লাল) - ডেমো ওয়ালেট থেকে মেইন ওয়ালেটে ক্রেডিট হয়
  // 3. 'off': স্থগিত / অফ (লাল)
  updateAccountOperationalState(
    id: string,
    targetState: 'running' | 'limit_reached' | 'off',
    adminId: string,
    adminName: string,
    reason?: string
  ): { success: boolean; record?: CustomerRecordDb; messageBangla?: string; error?: string } {
    const record = this.getRecordById(id);
    if (!record) return { success: false, error: 'অ্যাকাউন্ট রেকর্ড পাওয়া যায়নি।' };
    if (record.status !== 'approved') return { success: false, error: 'শুধুমাত্র অনুমোদিত অ্যাকাউন্টের স্ট্যাটাস পরিবর্তনযোগ্য।' };

    const prevState = record.operationalState || 'running';
    record.operationalState = targetState;
    record.updatedAt = getDhakaTimestamp();

    let messageBangla = '';

    if (targetState === 'limit_reached') {
      record.isLimitReached = true;
      const accumulatedAmt = this.getAccumulatedDemoCommission(record) || record.demoCommission || 0;
      // Transfer accumulated demo commission to Main Wallet if not already transferred
      if (!record.transferredToMain && accumulatedAmt > 0) {
        const amountToCredit = accumulatedAmt;
        const currentMainBalance = this.getWalletBalance(record.userId);
        const newBalance = currentMainBalance + amountToCredit;

        this.data.wallet_transactions.push({
          id: `tx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          userId: record.userId,
          type: 'commission_credit',
          amount: amountToCredit,
          balanceAfter: newBalance,
          status: 'completed',
          description: `লিমিট সমাপ্ত কমিশন মেইন ওয়ালেটে স্থানান্তর - ${record.accountName} (${record.commissionRate}%)`,
          referenceId: record.id,
          createdAt: getDhakaTimestamp(),
        });

        record.transferredToMain = true;
        messageBangla = `অ্যাকাউন্টের লিমিট শেষ হওয়ায় অফ করা হয়েছে (লাল কালার) এবং অর্জিত ৳${amountToCredit} ডেমো ওয়ালেট থেকে সফলভাবে মেইন ওয়ালেটে ক্রেডিট করা হয়েছে! গ্রাহক এখন তা উত্তোলন করতে পারবেন।`;
      } else {
        messageBangla = 'অ্যাকাউন্টের লিমিট শেষ হিসেবে চিহ্নিত করা হয়েছে (লাল কালার)।';
      }
    } else if (targetState === 'running') {
      record.isLimitReached = false;
      messageBangla = 'অ্যাকাউন্টটি পুনরায় চলমান (সবুজ কালার) করা হয়েছে। কমিশন ডেমো ওয়ালেটে জমা হতে থাকবে।';
    } else {
      // 'off'
      messageBangla = 'অ্যাকাউন্টটি সাময়িকভাবে বন্ধ / অফ (লাল কালার) করা হয়েছে।';
    }

    this.logAdminActivity({
      adminId,
      adminName,
      action: 'update_account_operational_state',
      targetEntity: 'records',
      targetId: id,
      reason: reason || messageBangla,
      previousValue: { operationalState: prevState },
      newValue: { operationalState: targetState, isLimitReached: record.isLimitReached, transferredToMain: record.transferredToMain },
    });

    this.persist();
    return { success: true, record, messageBangla };
  }

  rejectAccount(id: string, reason: string, adminId: string, adminName: string): CustomerRecordDb | null {
    const record = this.getRecordById(id);
    if (!record) return null;

    const prev = { status: record.status };
    record.status = 'rejected';
    record.rejectionReason = reason;
    record.updatedAt = getDhakaTimestamp();

    this.logAdminActivity({
      adminId,
      adminName,
      action: 'reject_account',
      targetEntity: 'records',
      targetId: id,
      reason,
      previousValue: prev,
      newValue: { status: 'rejected', rejectionReason: reason },
    });

    this.persist();
    return record;
  }

  // Monthly Earnings Management
  getAllMonthlyEarnings(): MonthlyEarningDb[] {
    return this.data.monthly_earnings;
  }

  getMonthlyEarningsByUserId(userId: string): MonthlyEarningDb[] {
    return this.data.monthly_earnings.filter((e) => e.userId === userId);
  }

  getMonthlyEarningsByAccountId(accountId: string): MonthlyEarningDb[] {
    return this.data.monthly_earnings.filter((e) => e.accountId === accountId);
  }

  getMonthlyEarningById(id: string): MonthlyEarningDb | undefined {
    return this.data.monthly_earnings.find((e) => e.id === id);
  }

  // Check if month already credited for the account
  isMonthCreditedForAccount(accountId: string, month: string): boolean {
    const cleanMonth = month.trim().toLowerCase();
    return this.data.monthly_earnings.some(
      (e) => e.accountId === accountId && e.month.trim().toLowerCase() === cleanMonth && e.status === 'finalized'
    );
  }

  createMonthlyEarning(data: Omit<MonthlyEarningDb, 'id' | 'createdAt' | 'updatedAt'>, adminName?: string): MonthlyEarningDb {
    const id = `earn_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newEarning: MonthlyEarningDb = {
      ...data,
      id,
      createdAt: getDhakaTimestamp(),
      updatedAt: getDhakaTimestamp(),
    };

    this.data.monthly_earnings.push(newEarning);

    if (adminName && data.finalizedBy) {
      this.logAdminActivity({
        adminId: data.finalizedBy,
        adminName,
        action: 'create_monthly_earning',
        targetEntity: 'monthly_earnings',
        targetId: id,
        reason: `${data.month} এর মাসিক আয় রেকর্ড তৈরি (${data.status})`,
        newValue: newEarning,
      });
    }

    this.persist();
    return newEarning;
  }

  updateMonthlyEarning(id: string, updates: Partial<MonthlyEarningDb>, adminId?: string, adminName?: string): MonthlyEarningDb | null {
    const idx = this.data.monthly_earnings.findIndex((e) => e.id === id);
    if (idx === -1) return null;

    const existing = this.data.monthly_earnings[idx];
    const prev = { ...existing };

    // Once finalized and credited, cannot mutate basic numbers without adjustment
    const updated: MonthlyEarningDb = {
      ...existing,
      ...updates,
      id: existing.id,
      accountId: existing.accountId,
      userId: existing.userId,
      createdAt: existing.createdAt,
      updatedAt: getDhakaTimestamp(),
    };

    this.data.monthly_earnings[idx] = updated;

    if (adminId && adminName) {
      this.logAdminActivity({
        adminId,
        adminName,
        action: 'update_monthly_earning',
        targetEntity: 'monthly_earnings',
        targetId: id,
        previousValue: prev,
        newValue: updated,
      });
    }

    this.persist();
    return updated;
  }

  // Finalize monthly earning and credit wallet (with strict duplicate protection)
  finalizeMonthlyEarning(id: string, adminId: string, adminName: string): { success: boolean; earning?: MonthlyEarningDb; error?: string } {
    const earning = this.getMonthlyEarningById(id);
    if (!earning) return { success: false, error: 'মাসিক রেকর্ড পাওয়া যায়নি।' };

    if (earning.status === 'finalized' && earning.isCredited) {
      return { success: false, error: 'এই রেকর্ডটি ইতিমধ্যে চূড়ান্ত ও ওয়ালেটে ক্রেডিট করা হয়েছে।' };
    }

    // Check duplicate credited month for the same account
    const cleanMonth = earning.month.trim().toLowerCase();
    const otherFinalized = this.data.monthly_earnings.find(
      (e) => e.id !== id && e.accountId === earning.accountId && e.month.trim().toLowerCase() === cleanMonth && e.status === 'finalized'
    );
    if (otherFinalized) {
      return {
        success: false,
        error: `এই অ্যাকাউন্টের জন্য ${earning.month} মাসের কমিশন ইতিমধ্যে অন্য একটি রেকর্ডে ফাইনাল করা হয়েছে। ডুপ্লিকেট ক্রেডিট রোধ করা হয়েছে।`,
      };
    }

    earning.status = 'finalized';
    earning.isCredited = true;
    earning.finalizedAt = getDhakaTimestamp();
    earning.finalizedBy = adminId;
    earning.updatedAt = getDhakaTimestamp();

    // Create wallet transaction ledger entry
    const currentBalance = this.getWalletBalance(earning.userId);
    const newBalance = currentBalance + earning.commissionAmount;

    const account = this.getRecordById(earning.accountId);
    const accountName = account ? account.accountName : 'এমএফএস অ্যাকাউন্ট';

    this.data.wallet_transactions.push({
      id: `tx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: earning.userId,
      type: 'commission_credit',
      amount: earning.commissionAmount,
      balanceAfter: newBalance,
      status: 'completed',
      description: `মাসিক কমিশন ক্রেডিট (${earning.month}) - ${accountName} (${earning.commissionPercentage}%)`,
      referenceId: earning.id,
      createdAt: getDhakaTimestamp(),
    });

    this.logAdminActivity({
      adminId,
      adminName,
      action: 'finalize_monthly_earning',
      targetEntity: 'monthly_earnings',
      targetId: earning.id,
      reason: `${earning.month} এর কমিশন ৳${earning.commissionAmount} চূড়ান্ত ও ওয়ালেটে ক্রেডিট করা হয়েছে।`,
      previousValue: { status: 'draft' },
      newValue: { status: 'finalized', isCredited: true, commissionAmount: earning.commissionAmount },
    });

    this.persist();
    return { success: true, earning };
  }

  // Wallet Calculations & Ledger
  getWalletBalance(userId: string): number {
    const summary = this.getWalletSummary(userId);
    return summary.availableBalance;
  }

  getWalletSummary(userId: string) {
    const user = this.getUserById(userId);

    const finalizedEarnings = this.data.monthly_earnings
      .filter((e) => e.userId === userId && e.status === 'finalized')
      .reduce((sum, e) => sum + (e.commissionAmount || 0), 0);

    // Sum of limit-reached commissions that transferred to main wallet
    const limitTransfers = this.data.records
      .filter((r) => r.userId === userId && r.transferredToMain)
      .reduce((sum, r) => sum + (r.demoCommission || 0), 0);

    // Running accounts demo commission
    const runningAccounts = this.data.records.filter(
      (r) => r.userId === userId && r.status === 'approved' && (r.operationalState === 'running' || !r.operationalState) && !r.transferredToMain
    );
    const grossDemoWalletBalance = runningAccounts.reduce((sum, r) => sum + this.getAccumulatedDemoCommission(r), 0);

    // Approved deposits (Security deposit payments: 15,000 or 30,000)
    const deposits = this.data.deposit_requests
      .filter((d) => d.userId === userId && d.status === 'approved')
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    // Approved withdrawals (strictly deducted from commission money)
    const withdrawals = this.data.withdrawal_requests
      .filter((w) => w.userId === userId && w.status === 'approved')
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    const pendingWithdrawals = this.data.withdrawal_requests.filter(
      (w) => w.userId === userId && w.status === 'pending'
    );
    const pendingWithdrawalsAmount = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    const pendingDeposits = this.data.deposit_requests.filter(
      (d) => d.userId === userId && d.status === 'pending'
    );
    const pendingDepositsAmount = pendingDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Security deposit logic:
    // Minimum security deposit target is 30,000 BDT.
    // If customer deposited 15,000 BDT upfront, the remaining 15,000 BDT is deducted at 30% from daily commission earnings.
    const securityDepositTarget = 30000;
    const initialDepositPaid = deposits; // Total approved manual deposit
    const remainingToPayFromInstallment = Math.max(0, securityDepositTarget - initialDepositPaid);

    // Total gross commission accumulated or earned
    const totalGrossCommissions = finalizedEarnings + limitTransfers;

    // Calculate 30% deduction from commission if customer has an installment debt
    let totalDeductedFromCommission = 0;
    let finalizedDeduction = 0;
    let demoDeduction = 0;

    if (remainingToPayFromInstallment > 0) {
      finalizedDeduction = Math.min(
        remainingToPayFromInstallment,
        Math.round(totalGrossCommissions * 0.30 * 100) / 100
      );
      const remainingForDemo = Math.max(0, remainingToPayFromInstallment - finalizedDeduction);
      demoDeduction = Math.min(
        remainingForDemo,
        Math.round(grossDemoWalletBalance * 0.30 * 100) / 100
      );
      totalDeductedFromCommission = finalizedDeduction + demoDeduction;
    }

    const securityDepositPaid = initialDepositPaid + totalDeductedFromCommission;
    const securityDepositRemaining = Math.max(0, securityDepositTarget - securityDepositPaid);

    const depositPlan: 'full' | 'installment' | 'none' =
      securityDepositRemaining === 0 && securityDepositPaid >= 30000
        ? 'full'
        : initialDepositPaid > 0 || securityDepositPaid > 0
        ? 'installment'
        : 'none';

    // Withdrawable Commission Balance:
    // "আর উত্তোলন এর জন্য শুধুমাত্র কমিশনের টাকা উপলব্ধ থাকবে"
    // Security deposits are NOT withdrawable! Only commission money is withdrawable.
    const netMainCommissionTransferred = Math.max(0, totalGrossCommissions - finalizedDeduction);
    const withdrawableCommissionBalance = Math.max(0, netMainCommissionTransferred - withdrawals);

    // Demo wallet net balance (after 30% installment deduction)
    const netDemoWalletBalance = Math.max(0, grossDemoWalletBalance - demoDeduction);

    return {
      availableBalance: withdrawableCommissionBalance, // ONLY commission is available for withdrawal!
      withdrawableCommissionBalance,
      mainWalletBalance: withdrawableCommissionBalance,
      demoWalletBalance: netDemoWalletBalance,
      grossDemoWalletBalance,
      securityDepositPaid,
      securityDepositRemaining,
      securityDepositTarget,
      totalDeductedFromCommission,
      depositPlan,
      totalEarnings: totalGrossCommissions + grossDemoWalletBalance,
      netEarnings: netMainCommissionTransferred + netDemoWalletBalance,
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      pendingWithdrawalsCount: pendingWithdrawals.length,
      pendingWithdrawalsAmount,
      pendingDepositsCount: pendingDeposits.length,
      pendingDepositsAmount,
    };
  }

  getWalletTransactions(userId: string): WalletTransactionDb[] {
    return this.data.wallet_transactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllWalletTransactions(): WalletTransactionDb[] {
    return this.data.wallet_transactions
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Deposit Requests
  getDepositRequests(userId?: string): DepositRequestDb[] {
    if (userId) {
      return this.data.deposit_requests
        .filter((d) => d.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return this.data.deposit_requests
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getDepositRequestById(id: string): DepositRequestDb | undefined {
    return this.data.deposit_requests.find((d) => d.id === id);
  }

  createDepositRequest(data: Omit<DepositRequestDb, 'id' | 'status' | 'createdAt' | 'updatedAt'>): DepositRequestDb {
    const id = `dep_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newReq: DepositRequestDb = {
      ...data,
      id,
      status: 'pending',
      createdAt: getDhakaTimestamp(),
      updatedAt: getDhakaTimestamp(),
    };
    this.data.deposit_requests.push(newReq);
    this.persist();
    return newReq;
  }

  approveDepositRequest(id: string, adminId: string, adminName: string): { success: boolean; request?: DepositRequestDb; error?: string } {
    const req = this.getDepositRequestById(id);
    if (!req) return { success: false, error: 'ডিপোজিট আবেদন পাওয়া যায়নি।' };
    if (req.status !== 'pending') return { success: false, error: 'এই আবেদনটি ইতিমধ্যে মীমাংসিত।' };

    req.status = 'approved';
    req.approvedBy = adminId;
    req.approvedAt = getDhakaTimestamp();
    req.updatedAt = getDhakaTimestamp();

    // Update user's security deposit records
    const user = this.getUserById(req.userId);
    if (user) {
      user.securityDepositPaid = (user.securityDepositPaid || 0) + req.amount;
      user.securityDepositRemaining = Math.max(0, 30000 - user.securityDepositPaid);
      user.depositPlan = user.securityDepositRemaining === 0 ? 'full' : 'installment';
    }

    const summary = this.getWalletSummary(req.userId);

    const isFull = req.amount >= 30000 || (user?.securityDepositRemaining === 0);
    const desc = isFull
      ? `সিকিউরিটি ডিপোজিট (সম্পূর্ণ ৩০,০০০ টাকা পরিশোধিত) - ${req.paymentMethod} (রেফ: ${req.transactionRef})`
      : `সিকিউরিটি ডিপোজিট কিস্তি (১৫,০০০ টাকা পরিশোধিত, বাকি ১৫,০০০ টাকা প্রতিদিনের কমিশন থেকে ৩০% হারে কর্তন হবে) - ${req.paymentMethod} (রেফ: ${req.transactionRef})`;

    this.data.wallet_transactions.push({
      id: `tx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: req.userId,
      type: 'deposit',
      amount: req.amount,
      balanceAfter: summary.withdrawableCommissionBalance,
      status: 'completed',
      description: desc,
      referenceId: req.id,
      createdAt: getDhakaTimestamp(),
    });

    this.logAdminActivity({
      adminId,
      adminName,
      action: 'approve_deposit',
      targetEntity: 'deposit_requests',
      targetId: req.id,
      reason: `সিকিউরিটি ডিপোজিট ৳${req.amount} অনুমোদন করা হয়েছে (${isFull ? 'সম্পূর্ণ' : 'কিস্তি প্ল্যান'})।`,
      previousValue: { status: 'pending' },
      newValue: { status: 'approved', amount: req.amount, depositPlan: user?.depositPlan },
    });

    this.persist();
    return { success: true, request: req };
  }

  rejectDepositRequest(id: string, reason: string, adminId: string, adminName: string): { success: boolean; request?: DepositRequestDb; error?: string } {
    const req = this.getDepositRequestById(id);
    if (!req) return { success: false, error: 'ডিপোজিট আবেদন পাওয়া যায়নি।' };
    if (req.status !== 'pending') return { success: false, error: 'এই আবেদনটি ইতিমধ্যে মীমাংসিত।' };

    req.status = 'rejected';
    req.rejectedReason = reason;
    req.updatedAt = getDhakaTimestamp();

    this.logAdminActivity({
      adminId,
      adminName,
      action: 'reject_deposit',
      targetEntity: 'deposit_requests',
      targetId: req.id,
      reason,
      previousValue: { status: 'pending' },
      newValue: { status: 'rejected', rejectedReason: reason },
    });

    this.persist();
    return { success: true, request: req };
  }

  // Withdrawal Requests
  getWithdrawalRequests(userId?: string): WithdrawalRequestDb[] {
    if (userId) {
      return this.data.withdrawal_requests
        .filter((w) => w.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return this.data.withdrawal_requests
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getWithdrawalRequestById(id: string): WithdrawalRequestDb | undefined {
    return this.data.withdrawal_requests.find((w) => w.id === id);
  }

  createWithdrawalRequest(data: Omit<WithdrawalRequestDb, 'id' | 'status' | 'createdAt' | 'updatedAt'>): { success: boolean; request?: WithdrawalRequestDb; error?: string } {
    const summary = this.getWalletSummary(data.userId);
    // Cannot exceed available balance - pending withdrawals
    const usableBalance = summary.availableBalance - summary.pendingWithdrawalsAmount;
    if (data.amount > usableBalance) {
      return {
        success: false,
        error: `উত্তোলনের পরিমাণ আপনার ব্যবহারের যোগ্য ব্যালেন্সের (৳${usableBalance}) চেয়ে বেশি হতে পারবে না।`,
      };
    }

    const id = `wth_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newReq: WithdrawalRequestDb = {
      ...data,
      id,
      status: 'pending',
      createdAt: getDhakaTimestamp(),
      updatedAt: getDhakaTimestamp(),
    };
    this.data.withdrawal_requests.push(newReq);
    this.persist();
    return { success: true, request: newReq };
  }

  approveWithdrawalRequest(id: string, adminId: string, adminName: string): { success: boolean; request?: WithdrawalRequestDb; error?: string } {
    const req = this.getWithdrawalRequestById(id);
    if (!req) return { success: false, error: 'উত্তোলন আবেদন পাওয়া যায়নি।' };
    if (req.status !== 'pending') return { success: false, error: 'এই আবেদনটি ইতিমধ্যে মীমাংসিত।' };

    const currentBalance = this.getWalletBalance(req.userId);
    if (currentBalance < req.amount) {
      return { success: false, error: 'গ্রাহকের ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। নেগেটিভ ব্যালেন্স প্রতিরোধ করা হয়েছে।' };
    }

    req.status = 'approved';
    req.approvedBy = adminId;
    req.approvedAt = getDhakaTimestamp();
    req.updatedAt = getDhakaTimestamp();

    const newBalance = currentBalance - req.amount;

    this.data.wallet_transactions.push({
      id: `tx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: req.userId,
      type: 'withdrawal',
      amount: req.amount,
      balanceAfter: newBalance,
      status: 'completed',
      description: `অনুমোদিত উত্তোলন - ${req.paymentMethod} (${req.accountNumber})`,
      referenceId: req.id,
      createdAt: getDhakaTimestamp(),
    });

    this.logAdminActivity({
      adminId,
      adminName,
      action: 'approve_withdrawal',
      targetEntity: 'withdrawal_requests',
      targetId: req.id,
      reason: `উত্তোলন ৳${req.amount} অনুমোদন ও ওয়ালেট থেকে কাটা হয়েছে।`,
      previousValue: { status: 'pending' },
      newValue: { status: 'approved', amount: req.amount },
    });

    this.persist();
    return { success: true, request: req };
  }

  rejectWithdrawalRequest(id: string, reason: string, adminId: string, adminName: string): { success: boolean; request?: WithdrawalRequestDb; error?: string } {
    const req = this.getWithdrawalRequestById(id);
    if (!req) return { success: false, error: 'উত্তোলন আবেদন পাওয়া যায়নি।' };
    if (req.status !== 'pending') return { success: false, error: 'এই আবেদনটি ইতিমধ্যে মীমাংসিত।' };

    req.status = 'rejected';
    req.rejectedReason = reason;
    req.updatedAt = getDhakaTimestamp();

    this.logAdminActivity({
      adminId,
      adminName,
      action: 'reject_withdrawal',
      targetEntity: 'withdrawal_requests',
      targetId: req.id,
      reason,
      previousValue: { status: 'pending' },
      newValue: { status: 'rejected', rejectedReason: reason },
    });

    this.persist();
    return { success: true, request: req };
  }

  // Admin Activity Logs
  logAdminActivity(log: Omit<AdminActivityLogDb, 'id' | 'timestamp'>) {
    this.data.admin_activity_logs.push({
      ...log,
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: getDhakaTimestamp(),
    });
  }

  getAdminActivityLogs(limit = 100): AdminActivityLogDb[] {
    return this.data.admin_activity_logs
      .slice(-limit)
      .reverse();
  }

  // Invite Codes
  getInviteCodes(): InviteCodeDb[] {
    return this.data.inviteCodes;
  }

  getInviteCode(code: string): InviteCodeDb | undefined {
    return this.data.inviteCodes.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  }

  useInviteCode(code: string): boolean {
    const invite = this.getInviteCode(code);
    if (!invite) return false;
    if (invite.usedCount >= invite.maxUses) return false;
    if (new Date(invite.expiresAt) < new Date()) return false;

    invite.usedCount += 1;
    this.persist();
    return true;
  }

  createInviteCode(codeData: InviteCodeDb): InviteCodeDb {
    this.data.inviteCodes.push(codeData);
    this.persist();
    return codeData;
  }

  // Official Deposit Accounts Settings
  getDepositSettings(): DepositAccountSettingsDb {
    if (!this.data.deposit_settings) {
      this.data.deposit_settings = {
        bkashNumber: '01912345678',
        nagadNumber: '01812345678',
        rocketNumber: '01712345678-9',
        bankDetails: 'City Bank: 110293847501 (Dhaka)',
      };
      this.persist();
    }
    return this.data.deposit_settings;
  }

  updateDepositSettings(settings: Partial<DepositAccountSettingsDb>, adminId: string, adminName: string): DepositAccountSettingsDb {
    const current = this.getDepositSettings();
    this.data.deposit_settings = {
      ...current,
      ...settings,
    };
    this.logAdminActivity({
      adminId,
      adminName,
      action: 'update_deposit_settings',
      targetEntity: 'settings',
      targetId: 'deposit_accounts',
      reason: 'ডিপোজিট অ্যাকাউন্ট নম্বর পরিবর্তন করা হয়েছে।',
      newValue: this.data.deposit_settings,
    });
    this.persist();
    return this.data.deposit_settings;
  }

  // Live Chat Messages
  getChatMessages(userId?: string): ChatMessageDb[] {
    if (!this.data.chat_messages) {
      this.data.chat_messages = [];
    }
    if (userId) {
      return this.data.chat_messages
        .filter((m) => m.senderId === userId || m.recipientId === userId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    return this.data.chat_messages
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  createChatMessage(data: Omit<ChatMessageDb, 'id' | 'timestamp' | 'isRead'>): ChatMessageDb {
    if (!this.data.chat_messages) {
      this.data.chat_messages = [];
    }
    const newMsg: ChatMessageDb = {
      ...data,
      id: `msg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: getDhakaTimestamp(),
      isRead: false,
    };
    this.data.chat_messages.push(newMsg);
    this.persist();
    return newMsg;
  }
}

export const dbInstance = new JsonDatabase();
