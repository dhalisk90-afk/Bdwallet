import React, { useState } from 'react';
import { api } from '../api';
import { User } from '../types';
import { Shield, Lock, Phone, UserCheck, KeyRound, Ticket, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TelegramBanner } from './TelegramBanner';
import { AppDownloadModal } from './AppDownloadModal';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login Form State
  const [identifier, setIdentifier] = useState('01711000001');
  const [password, setPassword] = useState('User@123');

  // Controlled Onboarding Register Form State
  const [inviteCode, setInviteCode] = useState('BDW-INVITE-2026');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Telegram App Download Popup Modal State
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.login(identifier, password);
      setSuccessMsg(res.messageBangla);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 300);
    } catch (err: any) {
      setErrorMsg(err.message || 'লগইন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Handle Controlled Registration with Invite Code
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.registerWithInvite({
        inviteCode,
        name: regName,
        phone: regPhone,
        password: regPassword,
      });
      setSuccessMsg(res.messageBangla);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 300);
    } catch (err: any) {
      setErrorMsg(err.message || 'নিবন্ধন সম্পন্ন করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  // Quick switch test accounts
  const setTestAccount = (userType: 'cust1' | 'cust2' | 'admin') => {
    setTab('login');
    setErrorMsg(null);
    if (userType === 'cust1') {
      setIdentifier('01711000001');
      setPassword('User@123');
    } else if (userType === 'cust2') {
      setIdentifier('01811000002');
      setPassword('User@123');
    } else {
      setIdentifier('admin@bdwallet.local');
      setPassword('Admin@123');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="w-full max-w-3xl space-y-8">
        {/* BIG TELEGRAM BANNER AS REQUESTED */}
        <TelegramBanner
          onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
          className="w-full"
        />

        {/* Header Hero Banner */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/20 mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            BD Wallet এ স্বাগতম
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
            বিকাশ, রকেট ও নগদ অ্যাকাউন্ট রেকর্ড পরিচালনার জন্য নিরাপদ ও প্রাতিষ্ঠানিক প্ল্যাটফর্ম
          </p>
        </div>

        {/* Test Accounts Quick-Fill Panel */}
        <div className="mb-6 bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900 flex items-center">
              <UserCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              টেস্টিং অ্যাকাউন্ট নির্বাচক (এক ক্লিকে লগইন)
            </span>
            <span className="text-[11px] text-slate-500 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              অ্যাক্সেস কন্ট্রোল টেস্ট
            </span>
          </div>
          <p className="text-[12px] text-slate-500 mb-3">
            গ্রাহক ১ ও গ্রাহক ২-এর মধ্যকার ডাটা আইসোলেশন এবং অ্যাডমিন সুবিধার নিরাপত্তা তাৎক্ষণিক যাচাই করতে ক্লিক করুন:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTestAccount('cust1')}
              className={`p-2 rounded-xl border text-left transition-all ${
                identifier === '01711000001'
                  ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-900">👤 গ্রাহক ১ (কামাল)</div>
              <div className="text-[11px] text-slate-500 font-mono">01711000001</div>
              <div className="text-[10px] text-emerald-600 font-medium">বিকাশ + রকেট রেকর্ড</div>
            </button>

            <button
              type="button"
              onClick={() => setTestAccount('cust2')}
              className={`p-2 rounded-xl border text-left transition-all ${
                identifier === '01811000002'
                  ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-900">👤 গ্রাহক ২ (ফারহানা)</div>
              <div className="text-[11px] text-slate-500 font-mono">01811000002</div>
              <div className="text-[10px] text-amber-600 font-medium">নগদ মার্চেন্ট রেকর্ড</div>
            </button>

            <button
              type="button"
              onClick={() => setTestAccount('admin')}
              className={`p-2 rounded-xl border text-left transition-all ${
                identifier === 'admin@bdwallet.local'
                  ? 'border-purple-500 bg-purple-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-purple-900">🛡️ সুপার অ্যাডমিন</div>
              <div className="text-[11px] text-slate-500 font-mono">admin@bdwallet...</div>
              <div className="text-[10px] text-purple-600 font-medium">সকল রেকর্ড ও অডিট</div>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-colors border-b-2 ${
                tab === 'login'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              লগইন করুন (Customer / Admin)
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-colors border-b-2 ${
                tab === 'register'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              আমন্ত্রণ কোড দিয়ে যোগ দিন
            </button>
          </div>

          <div className="p-6">
            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-2 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Tab */}
            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    মোবাইল নাম্বার অথবা ইমেইল
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="যেমন: 01711000001 বা admin@bdwallet.local"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      পাসওয়ার্ড
                    </label>
                    <span className="text-[11px] text-slate-400">টেস্ট পাসওয়ার্ড: User@123 / Admin@123</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="আপনার অ্যাকাউন্টের পাসওয়ার্ড"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading ? 'যাচাই করা হচ্ছে...' : 'নিরাপদে প্রবেশ করুন'}
                </button>
              </form>
            ) : (
              /* Controlled Registration with Invite Code */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                  <Ticket className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">নিয়ন্ত্রিত অনবোর্ডিং:</span> স্প্যাম ও অনিরাপদ অ্যাক্সেস রোধে শুধুমাত্র অ্যাডমিন অনুমোদিত আমন্ত্রণ কোড ব্যবহার করে অ্যাকাউন্ট তৈরি করা যায়।
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    আমন্ত্রণ কোড (Invite Code)
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="যেমন: BDW-INVITE-2026"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    ডিফল্ট টেস্ট কোড: <code className="text-emerald-700 font-bold">BDW-INVITE-2026</code>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    আপনার পূর্ণ নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="যেমন: সাকিব আল হাসান"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ব্যক্তিগত মোবাইল নাম্বার (১১ ডিজিট)
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="যেমন: 01912345678"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="সুরক্ষিত পাসওয়ার্ড লিখুন"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading ? 'যাচাই হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
                </button>
              </form>
            )}
          </div>

          {/* Security Banner Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-start space-x-2.5 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-semibold text-slate-800">কঠোর নিরাপত্তা অঙ্গীকার:</span> BD Wallet শুধুমাত্র আপনার ব্যবসায়িক ও ব্যক্তিগত এমএফএস অ্যাকাউন্টের রেকর্ড রাখে। আমরা কখনো পিন (PIN), ওটিপি (OTP) বা আর্থিক লেনদেন কোড চাই না বা ডাটাবেজে রাখি না।
            </p>
          </div>
        </div>

        {/* App Download Popup SMS Modal */}
        <AppDownloadModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          actionSource="general"
        />
      </div>
    </div>
  );
};
