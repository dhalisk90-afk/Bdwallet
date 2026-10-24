import {
  AdminActivityLog,
  ChatMessage,
  CustomerRecord,
  DepositAccountSettings,
  DepositRequest,
  InviteCode,
  MonthlyEarning,
  MonthlyEarningStatus,
  SecurityAuditItem,
  User,
  WalletSummary,
  WalletTransaction,
  WithdrawalRequest,
} from './types';

const TOKEN_KEY = 'bd_wallet_auth_token';

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore storage quota
  }
}

export function clearAuthToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore storage quota
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.messageBangla || data.error || 'অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।';
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.errors = data.errors;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  async login(identifier: string, password: string): Promise<{ success: boolean; token: string; user: User; messageBangla: string }> {
    const res = await request<{ success: boolean; token: string; user: User; messageBangla: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setAuthToken(res.token);
    return res;
  },

  async register(data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    accountCapacity?: number;
    telegramUsername?: string;
  }): Promise<{ success: boolean; pendingApproval?: boolean; token?: string; user: User; messageBangla: string }> {
    const res = await request<{ success: boolean; pendingApproval?: boolean; token?: string; user: User; messageBangla: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  async registerWithInvite(data: {
    inviteCode: string;
    name: string;
    phone: string;
    email?: string;
    password: string;
    accountCapacity?: number;
    telegramUsername?: string;
  }): Promise<{ success: boolean; pendingApproval?: boolean; token?: string; user: User; messageBangla: string }> {
    const res = await request<{ success: boolean; pendingApproval?: boolean; token?: string; user: User; messageBangla: string }>('/api/auth/register-with-invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  async getCurrentUser(): Promise<User> {
    const res = await request<{ success: boolean; user: User }>('/api/auth/me');
    return res.user;
  },

  logout(): void {
    clearAuthToken();
  },

  // Customer Records (MFS Accounts)
  async getRecords(): Promise<CustomerRecord[]> {
    const res = await request<{ success: boolean; records: CustomerRecord[] }>('/api/records');
    return res.records;
  },

  async createRecord(payload: any): Promise<{ success: boolean; messageBangla: string; record: CustomerRecord }> {
    return request<{ success: boolean; messageBangla: string; record: CustomerRecord }>('/api/records', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateRecord(id: string, payload: any): Promise<{ success: boolean; messageBangla: string; record: CustomerRecord }> {
    return request<{ success: boolean; messageBangla: string; record: CustomerRecord }>(`/api/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteRecord(id: string): Promise<{ success: boolean; messageBangla: string }> {
    return request<{ success: boolean; messageBangla: string }>(`/api/records/${id}`, {
      method: 'DELETE',
    });
  },

  // Customer Wallet & Requests
  async getWalletSummary(): Promise<WalletSummary> {
    const res = await request<{ success: boolean; summary: WalletSummary }>('/api/wallet/summary');
    return res.summary;
  },

  async getWalletTransactions(): Promise<WalletTransaction[]> {
    const res = await request<{ success: boolean; transactions: WalletTransaction[] }>('/api/wallet/transactions');
    return res.transactions;
  },

  async getDeposits(): Promise<DepositRequest[]> {
    const res = await request<{ success: boolean; deposits: DepositRequest[] }>('/api/deposits');
    return res.deposits;
  },

  async createDeposit(data: { amount: number; paymentMethod: string; senderPhone?: string; transactionRef: string; note?: string }): Promise<{ success: boolean; messageBangla: string; deposit: DepositRequest }> {
    return request<{ success: boolean; messageBangla: string; deposit: DepositRequest }>('/api/deposits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getWithdrawals(): Promise<WithdrawalRequest[]> {
    const res = await request<{ success: boolean; withdrawals: WithdrawalRequest[] }>('/api/withdrawals');
    return res.withdrawals;
  },

  async createWithdrawal(data: { amount: number; paymentMethod: string; accountNumber: string; note?: string }): Promise<{ success: boolean; messageBangla: string; withdrawal: WithdrawalRequest }> {
    return request<{ success: boolean; messageBangla: string; withdrawal: WithdrawalRequest }>('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMonthlyEarnings(): Promise<MonthlyEarning[]> {
    const res = await request<{ success: boolean; earnings: MonthlyEarning[] }>('/api/monthly-earnings');
    return res.earnings;
  },

  // Admin Account Approval
  async getAdminRecords(): Promise<CustomerRecord[]> {
    const res = await request<{ success: boolean; records: CustomerRecord[] }>('/api/admin/records');
    return res.records;
  },

  async approveAccount(
    id: string,
    commissionRate: number,
    monthlyTargetAmount?: number
  ): Promise<{ success: boolean; messageBangla: string; record: CustomerRecord }> {
    return request<{ success: boolean; messageBangla: string; record: CustomerRecord }>(`/api/admin/accounts/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ commissionRate, monthlyTargetAmount }),
    });
  },

  async updateAccountOperationalState(
    id: string,
    operationalState: 'running' | 'limit_reached' | 'off',
    reason?: string
  ): Promise<{ success: boolean; messageBangla: string; record: CustomerRecord }> {
    return request<{ success: boolean; messageBangla: string; record: CustomerRecord }>(`/api/admin/accounts/${id}/operational-state`, {
      method: 'POST',
      body: JSON.stringify({ operationalState, reason }),
    });
  },

  async rejectAccount(id: string, reason: string): Promise<{ success: boolean; messageBangla: string; record: CustomerRecord }> {
    return request<{ success: boolean; messageBangla: string; record: CustomerRecord }>(`/api/admin/accounts/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async updateAdminRecord(id: string, payload: any): Promise<{ success: boolean; messageBangla: string; record: CustomerRecord }> {
    return request<{ success: boolean; messageBangla: string; record: CustomerRecord }>(`/api/admin/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteAdminRecord(id: string): Promise<{ success: boolean; messageBangla: string }> {
    return request<{ success: boolean; messageBangla: string }>(`/api/admin/records/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin Monthly Earnings Manager
  async getAdminMonthlyEarnings(): Promise<MonthlyEarning[]> {
    const res = await request<{ success: boolean; earnings: MonthlyEarning[] }>('/api/admin/monthly-earnings');
    return res.earnings;
  },

  async createAdminMonthlyEarning(payload: {
    accountId: string;
    month: string;
    monthlyAmount: number;
    commissionPercentage: number;
    note?: string;
    status: MonthlyEarningStatus;
  }): Promise<{ success: boolean; messageBangla: string; earning: MonthlyEarning }> {
    return request<{ success: boolean; messageBangla: string; earning: MonthlyEarning }>('/api/admin/monthly-earnings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateAdminMonthlyEarning(id: string, payload: any): Promise<{ success: boolean; messageBangla: string; earning: MonthlyEarning }> {
    return request<{ success: boolean; messageBangla: string; earning: MonthlyEarning }>(`/api/admin/monthly-earnings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async finalizeAdminMonthlyEarning(id: string): Promise<{ success: boolean; messageBangla: string; earning: MonthlyEarning }> {
    return request<{ success: boolean; messageBangla: string; earning: MonthlyEarning }>(`/api/admin/monthly-earnings/${id}/finalize`, {
      method: 'POST',
    });
  },

  async deleteAdminMonthlyEarning(id: string): Promise<{ success: boolean; messageBangla: string }> {
    return request<{ success: boolean; messageBangla: string }>(`/api/admin/monthly-earnings/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin Deposits & Withdrawals
  async getAdminDeposits(): Promise<DepositRequest[]> {
    const res = await request<{ success: boolean; deposits: DepositRequest[] }>('/api/admin/deposits');
    return res.deposits;
  },

  async approveAdminDeposit(id: string): Promise<{ success: boolean; messageBangla: string; deposit: DepositRequest }> {
    return request<{ success: boolean; messageBangla: string; deposit: DepositRequest }>(`/api/admin/deposits/${id}/approve`, {
      method: 'POST',
    });
  },

  async rejectAdminDeposit(id: string, reason: string): Promise<{ success: boolean; messageBangla: string; deposit: DepositRequest }> {
    return request<{ success: boolean; messageBangla: string; deposit: DepositRequest }>(`/api/admin/deposits/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async getAdminWithdrawals(): Promise<WithdrawalRequest[]> {
    const res = await request<{ success: boolean; withdrawals: WithdrawalRequest[] }>('/api/admin/withdrawals');
    return res.withdrawals;
  },

  async approveAdminWithdrawal(id: string): Promise<{ success: boolean; messageBangla: string; withdrawal: WithdrawalRequest }> {
    return request<{ success: boolean; messageBangla: string; withdrawal: WithdrawalRequest }>(`/api/admin/withdrawals/${id}/approve`, {
      method: 'POST',
    });
  },

  async rejectAdminWithdrawal(id: string, reason: string): Promise<{ success: boolean; messageBangla: string; withdrawal: WithdrawalRequest }> {
    return request<{ success: boolean; messageBangla: string; withdrawal: WithdrawalRequest }>(`/api/admin/withdrawals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Admin View Specific Customer Wallet
  async getAdminUserWallet(userId: string): Promise<{
    user: { id: string; name: string; phone: string; email: string };
    summary: WalletSummary;
    transactions: WalletTransaction[];
    accounts: CustomerRecord[];
    earnings: MonthlyEarning[];
  }> {
    return request(`/api/admin/users/${userId}/wallet`);
  },

  // Admin Activity Logs
  async getAdminActivityLogs(): Promise<AdminActivityLog[]> {
    const res = await request<{ success: boolean; logs: AdminActivityLog[] }>('/api/admin/activity-logs');
    return res.logs;
  },

  // Admin Stats & Invite Codes
  async getAdminStats(): Promise<any> {
    const res = await request<{ success: boolean; stats: any }>('/api/admin/stats');
    return res.stats;
  },

  async getAdminInviteCodes(): Promise<InviteCode[]> {
    const res = await request<{ success: boolean; inviteCodes: InviteCode[] }>('/api/admin/invite-codes');
    return res.inviteCodes;
  },

  async createAdminInviteCode(code: string, maxUses: number): Promise<{ success: boolean; messageBangla: string; inviteCode: InviteCode }> {
    return request<{ success: boolean; messageBangla: string; inviteCode: InviteCode }>('/api/admin/invite-codes', {
      method: 'POST',
      body: JSON.stringify({ code, maxUses }),
    });
  },

  // Admin Customer Management
  async getAdminCustomers(): Promise<any[]> {
    const res = await request<{ success: boolean; customers: any[] }>('/api/admin/customers');
    return res.customers;
  },

  async updateCustomerPassword(id: string, newPassword: string): Promise<{ success: boolean; messageBangla: string }> {
    return request<{ success: boolean; messageBangla: string }>(`/api/admin/customers/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  },

  async approveCustomer(id: string): Promise<{ success: boolean; messageBangla: string; customer: any }> {
    return request<{ success: boolean; messageBangla: string; customer: any }>(`/api/admin/customers/${id}/approve`, {
      method: 'POST',
    });
  },

  async rejectCustomer(id: string, reason?: string): Promise<{ success: boolean; messageBangla: string; customer: any }> {
    return request<{ success: boolean; messageBangla: string; customer: any }>(`/api/admin/customers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async deleteCustomer(id: string): Promise<{ success: boolean; messageBangla: string }> {
    return request<{ success: boolean; messageBangla: string }>(`/api/admin/customers/${id}`, {
      method: 'DELETE',
    });
  },

  // Interactive Security Audit API
  async runSecurityAudit(): Promise<{ success: boolean; auditTimestamp: string; allPassed: boolean; auditResults: SecurityAuditItem[] }> {
    return request<{ success: boolean; auditTimestamp: string; allPassed: boolean; auditResults: SecurityAuditItem[] }>('/api/security/audit');
  },

  // Official Deposit Account Settings
  async getDepositSettings(): Promise<DepositAccountSettings> {
    const res = await request<{ success: boolean; settings: DepositAccountSettings }>('/api/settings/deposit-accounts');
    return res.settings;
  },

  async updateDepositSettings(settings: Partial<DepositAccountSettings>): Promise<{ success: boolean; messageBangla: string; settings: DepositAccountSettings }> {
    return request<{ success: boolean; messageBangla: string; settings: DepositAccountSettings }>('/api/admin/settings/deposit-accounts', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Live Chat
  async getChatMessages(userId?: string): Promise<ChatMessage[]> {
    try {
      const endpoint = userId ? `/api/chat/messages?userId=${encodeURIComponent(userId)}` : '/api/chat/messages';
      const res = await request<{ success: boolean; messages: ChatMessage[] }>(endpoint);
      return Array.isArray(res.messages) ? res.messages : [];
    } catch {
      return [];
    }
  },

  async uploadChatMedia(fileData: string, fileName: string, fileType: string): Promise<{ success: boolean; mediaUrl: string; mediaType: 'image' | 'video'; mediaName: string; mediaSize: number; messageBangla: string }> {
    return request<{ success: boolean; mediaUrl: string; mediaType: 'image' | 'video'; mediaName: string; mediaSize: number; messageBangla: string }>('/api/chat/upload', {
      method: 'POST',
      body: JSON.stringify({ fileData, fileName, fileType }),
    });
  },

  async sendChatMessage(
    message: string,
    recipientId?: string,
    mediaData?: { mediaUrl?: string; mediaType?: 'image' | 'video'; mediaName?: string; mediaSize?: number }
  ): Promise<{ success: boolean; messageBangla: string; chatMessage: ChatMessage }> {
    const payload: any = { message, recipientId };
    if (mediaData) {
      if (mediaData.mediaUrl) payload.mediaUrl = mediaData.mediaUrl;
      if (mediaData.mediaType) payload.mediaType = mediaData.mediaType;
      if (mediaData.mediaName) payload.mediaName = mediaData.mediaName;
      if (mediaData.mediaSize) payload.mediaSize = mediaData.mediaSize;
    }

    const res = await request<any>('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const chatMessage = res.chatMessage || res.message;
    return {
      success: true,
      messageBangla: res.messageBangla || 'বার্তা পাঠানো হয়েছে।',
      chatMessage,
    };
  },

  async getChatThreads(): Promise<Array<{ user: any; lastMessage: ChatMessage; unreadCount: number }>> {
    try {
      const res = await request<{ success: boolean; threads: Array<{ user: any; lastMessage: ChatMessage; unreadCount: number }> }>('/api/admin/chat/threads');
      return Array.isArray(res.threads) ? res.threads : [];
    } catch {
      return [];
    }
  },

  // Admin Monthly Account Limit Resets (১ তারিখ রাত ১২:০০ টা)
  async resetAllMonthlyLimits(): Promise<{ success: boolean; messageBangla: string; resetCount: number; month: string }> {
    return request<{ success: boolean; messageBangla: string; resetCount: number; month: string }>('/api/admin/accounts/reset-monthly-limits', {
      method: 'POST',
    });
  },

  async resetAccountMonthlyLimit(id: string): Promise<{ success: boolean; messageBangla: string; record: CustomerRecord }> {
    return request<{ success: boolean; messageBangla: string; record: CustomerRecord }>(`/api/admin/accounts/${id}/reset-limit`, {
      method: 'POST',
    });
  },

  // Admin Database Backup, Snapshots & Data Preservation
  async exportDatabaseBackup(): Promise<any> {
    return request<any>('/api/admin/backup/export');
  },

  async importDatabaseBackup(backupData: any): Promise<{ success: boolean; messageBangla: string }> {
    return request<{ success: boolean; messageBangla: string }>('/api/admin/backup/import', {
      method: 'POST',
      body: JSON.stringify(backupData),
    });
  },

  async createDatabaseSnapshot(reason?: string): Promise<{ success: boolean; messageBangla: string; snapshot: any }> {
    return request<{ success: boolean; messageBangla: string; snapshot: any }>('/api/admin/backup/snapshot', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async getDatabaseSnapshots(): Promise<any[]> {
    const res = await request<{ success: boolean; snapshots: any[] }>('/api/admin/backup/snapshots');
    return res.snapshots || [];
  },

  async restoreDatabaseSnapshot(snapshotId: string): Promise<{ success: boolean; messageBangla: string }> {
    return request<{ success: boolean; messageBangla: string }>(`/api/admin/backup/restore/${encodeURIComponent(snapshotId)}`, {
      method: 'POST',
    });
  },
};
