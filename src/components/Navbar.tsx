import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ShieldCheck, LogOut, UserCheck, Clock, Wallet, LayoutDashboard, HardDrive } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenSecurityAudit: () => void;
  onOpenGoogleDrive?: () => void;
  activeTab: 'customer' | 'admin';
  setActiveTab: (tab: 'customer' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenSecurityAudit,
  onOpenGoogleDrive,
  activeTab,
  setActiveTab,
}) => {
  const [dhakaTime, setDhakaTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('bn-BD', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now);
        setDhakaTime(formatted);
      } catch {
        setDhakaTime(new Date().toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="font-bold text-xl text-slate-900 tracking-tight">BD Wallet</span>
                {currentUser?.role !== 'admin' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    বাংলাদেশ
                  </span>
                )}
                {currentUser?.role === 'admin' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    অ্যাডমিন
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {currentUser?.role === 'admin' ? 'সিস্টেম কন্ট্রোল সেন্টার' : 'মোবাইল ফাইন্যান্সিয়াল সার্ভিস রেকর্ড হাব (বিকাশ • রকেট • নগদ)'}
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Google Drive Workspace Button */}
            {currentUser && onOpenGoogleDrive && (
              <button
                onClick={onOpenGoogleDrive}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all shadow-xs cursor-pointer active:scale-98"
                title="Google Drive ব্যাকআপ ও ফাইলস"
              >
                <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="hidden sm:inline">Google Drive</span>
              </button>
            )}

            {currentUser && currentUser.role === 'customer' ? (
              /* Customer Navbar: Logout */
              <button
                onClick={onLogout}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors shadow-xs cursor-pointer"
                title="লগ আউট করুন"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>লগ আউট</span>
              </button>
            ) : currentUser && currentUser.role === 'admin' ? (
              /* Admin Navbar: Time, profile badge, and logout */
              <>
                <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>ঢাকা BST:</span>
                  <span className="font-bold text-slate-800">{dhakaTime || '১০:৩০ AM'}</span>
                </div>

                <div className="flex items-center space-x-2 pl-1">
                  <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-800 font-bold text-sm">
                    🛡️
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{currentUser.name}</p>
                    <span className="text-[10px] text-purple-600 font-bold">সুপার অ্যাডমিন</span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="লগআউট করুন"
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>লগ আউট</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
