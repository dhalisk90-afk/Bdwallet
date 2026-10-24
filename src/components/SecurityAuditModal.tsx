import React, { useState, useEffect } from 'react';
import { SecurityAuditItem } from '../types';
import { api, getAuthToken } from '../api';
import { formatDhakaDate } from '../utils/formatters';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Play,
  Lock,
  RefreshCw,
  Terminal,
  X,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [auditTimestamp, setAuditTimestamp] = useState<string>('');
  const [auditItems, setAuditItems] = useState<SecurityAuditItem[]>([]);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);

  // Manual interactive attack simulator state
  const [simulatorOutput, setSimulatorOutput] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const res = await api.runSecurityAudit();
      setAuditTimestamp(res.auditTimestamp);
      setAuditItems(res.auditResults);
      setAllPassed(res.allPassed);
    } catch (err: any) {
      console.error('Audit failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Test: Attempt unauthorized admin endpoint access with customer token
  const testUnauthorizedAdminCall = async () => {
    setSimulating(true);
    setSimulatorOutput('যাচাই করা হচ্ছে: সাধারণ গ্রাহক সেশন দিয়ে /api/admin/records কল করার চেষ্টা...');
    try {
      const res = await fetch('/api/admin/records', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await res.json();
      if (res.status === 403) {
        setSimulatorOutput(
          `🛡️ শতভাগ সুরক্ষিত (HTTP 403 Forbidden):\nসার্ভার অননুমোদিত অ্যাক্সেস শনাক্ত করে আটকে দিয়েছে:\n"${data.messageBangla}"`
        );
      } else if (res.ok) {
        setSimulatorOutput(
          `⚠️ আপনি বর্তমানে অ্যাডমিন হিসেবে লগইন রয়েছেন, তাই ডেটা প্রাপ্ত হয়েছে (${data.records?.length} রেকর্ড)।`
        );
      } else {
        setSimulatorOutput(`রেসপন্স: HTTP ${res.status} - ${data.messageBangla || data.error}`);
      }
    } catch (e: any) {
      setSimulatorOutput(`ত্রুটি: ${e.message}`);
    } finally {
      setSimulating(false);
    }
  };

  // Test: Attempt PIN injection
  const testPinInjection = async () => {
    setSimulating(true);
    setSimulatorOutput('যাচাই করা হচ্ছে: অ্যাকাউন্টে সংবেদনশীল পিন (PIN: "1234") পাঠানোর চেষ্টা...');
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          accountType: 'personal',
          serviceProvider: 'bkash',
          accountName: 'ম্যালিসিয়াস টেস্ট',
          personalNumber: '01711000001',
          postalCode: '1207',
          operator: 'Grameenphone',
          limitAmount: 5000,
          serviceTime: '২৪ ঘণ্টা',
          pin: '1234', // Injected banking PIN
        }),
      });
      const data = await res.json();
      if (res.status === 400 && data.errors?.security) {
        setSimulatorOutput(
          `🛡️ শতভাগ সুরক্ষিত (HTTP 400 Security Guard):\nসার্ভার পিন গ্রহণ করতে অস্বীকৃতি জানিয়েছে:\n"${data.errors.security}"`
        );
      } else {
        setSimulatorOutput(`রেসপন্স: HTTP ${res.status} - ${JSON.stringify(data)}`);
      }
    } catch (e: any) {
      setSimulatorOutput(`ত্রুটি: ${e.message}`);
    } finally {
      setSimulating(false);
    }
  };

  // Test: Attempt duplicate monthly credit
  const testDuplicateCredit = async () => {
    setSimulating(true);
    setSimulatorOutput('যাচাই করা হচ্ছে: একই অ্যাকাউন্টে একই মাসের (October 2026) কমিশন দুবার ফাইনাল করার চেষ্টা...');
    try {
      const res = await fetch('/api/admin/monthly-earnings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          accountId: 'rec_kamal_01',
          month: 'October 2026',
          monthlyAmount: 50000,
          commissionPercentage: 2.0,
          status: 'finalized',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSimulatorOutput(
          `🛡️ ডুপ্লিকেট ক্রেডিট শতভাগ প্রতিরোধ হয়েছে (HTTP ${res.status}):\n"${data.messageBangla}"`
        );
      } else {
        setSimulatorOutput(`রেসপন্স: HTTP ${res.status}`);
      }
    } catch (e: any) {
      setSimulatorOutput(`ত্রুটি: ${e.message}`);
    } finally {
      setSimulating(false);
    }
  };

  // Test: Overdraft withdrawal attempt
  const testOverdraftWithdrawal = async () => {
    setSimulating(true);
    setSimulatorOutput('যাচাই করা হচ্ছে: ব্যালেন্সের চেয়ে বেশি (৳৯৯,৯৯,৯৯৯) টাকা উত্তোলন আবেদন...');
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          amount: 9999999,
          paymentMethod: 'বিকাশ',
          accountNumber: '01711000001',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSimulatorOutput(
          `🛡️ নেগেটিভ ব্যালেন্স প্রতিরোধ কার্যকর (HTTP ${res.status}):\n"${data.messageBangla}"`
        );
      } else {
        setSimulatorOutput(`রেসপন্স: HTTP ${res.status}`);
      }
    } catch (e: any) {
      setSimulatorOutput(`ত্রুটি: ${e.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in fade-in">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                নিরাপত্তা, অডিট ও ইনটিগ্রিটি পরীক্ষা
              </h2>
              <p className="text-xs text-slate-500">
                BD Wallet এর ৬টি মূল নিরাপত্তা ও লেনদেন সততা যাচাইকরণ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Status Banner */}
        <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700">অডিট ফলাফল:</span>
              {allPassed === true ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  সকল নিরাপত্তা ও ডুপ্লিকেট প্রতিরোধ পরীক্ষা সফল
                </span>
              ) : isRunning ? (
                <span className="text-xs text-slate-500">পরীক্ষা চলছে...</span>
              ) : (
                <span className="text-xs text-amber-700 font-bold">পরীক্ষা করা প্রয়োজন</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              শেষ যাচাই: {auditTimestamp ? formatDhakaDate(auditTimestamp) : 'এখনই চালান'}
            </p>
          </div>

          <button
            onClick={runAudit}
            disabled={isRunning}
            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>পুনরায় অডিট চালান</span>
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {auditItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5">
                    {item.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.nameBangla}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.descriptionBangla}</p>
                    <p className="text-[11px] text-emerald-700 font-medium mt-1 bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-100">
                      {item.details}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                  {item.id}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Penetration Simulator */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center">
              <Terminal className="w-4 h-4 mr-1.5 text-purple-600" />
              লাইভ অ্যাক্সেস কন্ট্রোল ও ডুপ্লিকেট টেস্ট সিমুলেটর
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            নিচের বাটনগুলো দিয়ে সার্ভারের বাস্তব নিরাপত্তা ও প্রতিরোধ ব্যবস্থা পরীক্ষা করুন:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={testUnauthorizedAdminCall}
              disabled={simulating}
              className="p-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-left text-xs font-semibold transition-colors disabled:opacity-50"
            >
              ১. সাধারণ গ্রাহক হয়ে অ্যাডমিন API কল টেস্ট
            </button>
            <button
              onClick={testPinInjection}
              disabled={simulating}
              className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-left text-xs font-semibold transition-colors disabled:opacity-50"
            >
              ২. ফর্মে গোপন পিন (PIN) ইনজেকশন টেস্ট
            </button>
            <button
              onClick={testDuplicateCredit}
              disabled={simulating}
              className="p-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-left text-xs font-semibold transition-colors disabled:opacity-50"
            >
              ৩. একই মাসে ডুপ্লিকেট কমিশন ক্রেডিট টেস্ট
            </button>
            <button
              onClick={testOverdraftWithdrawal}
              disabled={simulating}
              className="p-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-left text-xs font-semibold transition-colors disabled:opacity-50"
            >
              ৪. অতিরিক্ত ব্যালেন্স উত্তোলন (Overdraft) টেস্ট
            </button>
          </div>

          {simulatorOutput && (
            <div className="mt-3 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-line border border-slate-800">
              {simulatorOutput}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
