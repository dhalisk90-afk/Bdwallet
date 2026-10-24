import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../api';
import { 
  UserPlus, 
  LogIn, 
  Send, 
  ShieldCheck, 
  X, 
  Lock, 
  Phone, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';
import cyberHeroImg from '../assets/images/cyber_wallet_hero_1792763315434.jpg';

interface CleanHomePageProps {
  onLoginSuccess: (user: User) => void;
}

export const CleanHomePage: React.FC<CleanHomePageProps> = ({ onLoginSuccess }) => {
  const [activeModal, setActiveModal] = useState<'login' | 'register' | null>(null);
  
  // Login state
  const [loginTab, setLoginTab] = useState<'customer' | 'admin'>('customer');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAccountCapacity, setRegAccountCapacity] = useState('10');
  const [regTelegramUsername, setRegTelegramUsername] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);
    setLoginLoading(true);

    try {
      const res = await api.login(loginIdentifier.trim(), loginPassword);

      if (loginTab === 'admin' && res.user.role !== 'admin') {
        throw new Error('অনধিকার প্রবেশ! এই অপশন থেকে শুধুমাত্র অনুমোদিত অ্যাডমিন লগইন করতে পারবেন।');
      }

      setLoginSuccess(
        res.user.role === 'admin' 
          ? 'অ্যাডমিন লগইন সফল হয়েছে!' 
          : (res.messageBangla || 'লগইন সফল হয়েছে!')
      );
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 350);
    } catch (err: any) {
      setLoginError(err.message || 'লগইন তথ্য সঠিক নয়। পুনরায় চেষ্টা করুন।');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const capacity = parseInt(regAccountCapacity, 10);
    if (isNaN(capacity) || capacity < 10) {
      setRegError('কমপক্ষে ১০টি একাউন্ট আবশ্যক।');
      return;
    }

    if (!regTelegramUsername.trim()) {
      setRegError('টেলিগ্রাম ইউজার আইডি দেওয়া আবশ্যক।');
      return;
    }

    setRegLoading(true);

    try {
      const res = await api.register({
        name: regName.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        accountCapacity: capacity,
        telegramUsername: regTelegramUsername.trim(),
      });
      setRegistrationSubmitted(true);
      setRegSuccess(res.messageBangla || 'One of our managers will contact you shortly.');
    } catch (err: any) {
      setRegError(err.message || 'নিবন্ধন সম্পন্ন করা যায়নি। পুনরায় চেষ্টা করুন।');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full bg-slate-950 text-white overflow-hidden flex flex-col justify-between font-sans">
      
      {/* Background Image with Cyber Green Glow Animation */}
      <div className="absolute inset-0 z-0">
        <img 
          src={cyberHeroImg} 
          alt="Cyber Wallet Background" 
          className="w-full h-full object-cover object-center filter brightness-90 scale-105 animate-pulse duration-4000"
        />
        {/* Measured dark scrim overlay for WCAG contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/40 backdrop-blur-[1px]" />
        
        {/* Subtle glowing halo animation in background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-ping opacity-35 pointer-events-none" />
      </div>

      {/* Main Compact Content Container (Guaranteed not to overflow screen) */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-4 pt-6 pb-4 flex flex-col items-center justify-between h-full">
        
        {/* Top Header / Branding */}
        <div className="flex flex-col items-center text-center mt-2">
          {/* Glowing Shield Icon */}
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-[#00ff66] mb-2 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>

          {/* BD Wallet Title */}
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center space-x-2">
            <span className="text-[#00ff66] drop-shadow-[0_0_15px_rgba(0,255,102,0.5)]">BD</span>
            <span className="text-white">Wallet</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-emerald-300/80 font-medium tracking-wide mt-0.5">
            সিকিউরড ডিজিটাল ওয়ালেট ও কমিশন সিস্টেম
          </p>
        </div>

        {/* Center Cyber Warrior Illustration / Accent Frame */}
        <div className="relative my-auto py-2">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr from-[#00ff66]/50 via-emerald-500/30 to-transparent shadow-2xl shadow-emerald-500/30 flex items-center justify-center overflow-hidden border border-[#00ff66]/40">
            <img 
              src={cyberHeroImg} 
              alt="Cyber Avatar" 
              className="w-full h-full object-cover rounded-2xl filter contrast-125"
            />
          </div>
        </div>

        {/* Bottom Action Buttons (Reference Design Matching) */}
        <div className="w-full space-y-3 mb-4">
          
          {/* 1. Register Button (Glowing Emerald Pill) */}
          <button
            type="button"
            onClick={() => setActiveModal('register')}
            className="w-full py-3.5 px-6 rounded-full bg-[#00ff66] hover:bg-[#00e65c] text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-[#00ff66]/30 flex items-center justify-center space-x-2.5 transition-all transform active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-5 h-5 stroke-[2.5]" />
            <span>Register</span>
          </button>

          {/* 2. Login Button (Dark Sleek Outlined Pill with Green Border) */}
          <button
            type="button"
            onClick={() => setActiveModal('login')}
            className="w-full py-3.5 px-6 rounded-full bg-slate-950/80 border-2 border-[#00ff66] hover:bg-[#00ff66]/10 text-[#00ff66] font-bold text-base sm:text-lg shadow-md flex items-center justify-center space-x-2.5 transition-all transform active:scale-95 cursor-pointer"
          >
            <LogIn className="w-5 h-5 stroke-[2.5]" />
            <span>Login</span>
          </button>

          {/* Telegram Support Link */}
          <a
            href="https://t.me/Bdwallet247"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-full bg-slate-900/90 border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-[#229ED9] text-white flex items-center justify-center">
              <Send className="w-3.5 h-3.5 -translate-x-0.5 fill-current" />
            </div>
            <span>লাইভ সাপোর্ট ও টেলিগ্রাম চ্যানেল</span>
          </a>
        </div>

      </div>

      {/* ===================== MODAL 1: LOGIN ===================== */}
      {activeModal === 'login' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <LogIn className="w-5 h-5 text-[#00ff66]" />
                <h3 className="text-base sm:text-lg font-bold">
                  {loginTab === 'admin' ? 'এডমিন পোর্টাল লগইন' : 'অ্যাকাউন্ট লগইন'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setLoginError(null);
                  setLoginSuccess(null);
                }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Login Role Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950 p-1.5 gap-1">
              <button
                type="button"
                onClick={() => {
                  setLoginTab('customer');
                  setLoginError(null);
                  setLoginSuccess(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  loginTab === 'customer'
                    ? 'bg-[#00ff66] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                গ্রাহক লগইন
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginTab('admin');
                  setLoginError(null);
                  setLoginSuccess(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  loginTab === 'admin'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                এডমিন লগইন
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {loginTab === 'admin' ? 'এডমিন ইমেইল' : 'মোবাইল নম্বর বা ইমেইল'}
                  </label>
                  <input
                    type={loginTab === 'admin' ? 'email' : 'text'}
                    required
                    placeholder={loginTab === 'admin' ? 'admin@bdwallet.com' : '01XXXXXXXXX'}
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff66]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">পাসওয়ার্ড</label>
                  <div className="relative">
                    <input
                      type={loginShowPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff66]"
                    />
                    <button
                      type="button"
                      onClick={() => setLoginShowPassword(!loginShowPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {loginShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {loginLoading ? 'লগইন হচ্ছে...' : 'লগইন সম্পন্ন করুন'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: REGISTER ===================== */}
      {activeModal === 'register' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#00ff66]" />
                <h3 className="text-base sm:text-lg font-bold">নতুন অ্যাকাউন্ট নিবন্ধন</h3>
              </div>
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setRegError(null);
                  setRegSuccess(null);
                }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {registrationSubmitted ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-500/20 text-[#00ff66] rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-white">One of our managers will contact you shortly. Thank you.</h4>
                  <p className="text-xs text-slate-400">আপনার নিবন্ধন সফলভাবে জমা হয়েছে। অ্যাডমিন অনুমোদনের পর ম্যানেজার যোগাযোগ করবেন।</p>
                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationSubmitted(false);
                      setActiveModal(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#00ff66] text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    ঠিক আছে
                  </button>
                </div>
              ) : (
                <>
                  {regError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">পূর্ণ নাম</label>
                      <input
                        type="text"
                        required
                        placeholder="আপনার নাম লিখুন"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff66]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">মোবাইল নম্বর (১১ ডিজিট)</label>
                      <input
                        type="tel"
                        required
                        placeholder="01XXXXXXXXX"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff66] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">পাসওয়ার্ড</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff66]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">কতগুলো অ্যাকাউন্ট দিতে পারবেন? (কমপক্ষে ১০)</label>
                      <input
                        type="number"
                        min="10"
                        value={regAccountCapacity}
                        onChange={(e) => setRegAccountCapacity(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff66]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">টেলিগ্রাম ইউজার আইডি (@username)</label>
                      <input
                        type="text"
                        required
                        placeholder="@username"
                        value={regTelegramUsername}
                        onChange={(e) => setRegTelegramUsername(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff66]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-3 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {regLoading ? 'জমা হচ্ছে...' : 'নিবন্ধন আবেদন পাঠান'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
