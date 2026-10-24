import React, { useState } from 'react';
import { Smartphone, Download, ExternalLink, X, Send, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedOnWeb?: () => void;
  actionSource?: 'add_personal' | 'add_agent' | 'add_merchant' | 'general' | 'banner';
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
  onProceedOnWeb,
  actionSource = 'general',
}) => {
  const [lang, setLang] = useState<'bn' | 'en' | 'both'>('both');

  if (!isOpen) return null;

  const handleDownloadClick = () => {
    // Direct link to Telegram user ID @Bdwallet247
    window.open('https://t.me/Bdwallet247', '_blank', 'noopener,noreferrer');
  };

  const getSourceTitle = () => {
    switch (actionSource) {
      case 'add_personal':
        return {
          bn: 'পার্সোনাল অ্যাকাউন্ট যোগ করার নোটিফিকেশন',
          en: 'Personal Account Notice',
        };
      case 'add_agent':
        return {
          bn: 'এজেন্ট অ্যাকাউন্ট যোগ করার নোটিফিকেশন',
          en: 'Agent Account Notice',
        };
      case 'add_merchant':
        return {
          bn: 'মার্চেন্ট অ্যাকাউন্ট যোগ করার নোটিফিকেশন',
          en: 'Merchant Account Notice',
        };
      default:
        return {
          bn: 'অ্যাকাউন্ট যোগ করার গুরুত্বপূর্ণ নোটিশ',
          en: 'Important Account Notice',
        };
    }
  };

  const sourceTitle = getSourceTitle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden text-slate-800">
        {/* Top Decorative Header with Telegram styling */}
        <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="বন্ধ করুন (Close)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Language Toggle Bar */}
          <div className="flex items-center space-x-1.5 mb-3">
            <span className="text-[11px] font-semibold text-sky-100 mr-1">ভাষা / Language:</span>
            <div className="inline-flex bg-black/20 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'bn' ? 'bg-white text-blue-700 shadow-xs' : 'text-sky-100 hover:text-white'
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'en' ? 'bg-white text-blue-700 shadow-xs' : 'text-sky-100 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('both')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'both' ? 'bg-white text-blue-700 shadow-xs' : 'text-sky-100 hover:text-white'
                }`}
              >
                উভয় (Both)
              </button>
            </div>
          </div>

          {/* Badge & Icon */}
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 rounded-2xl bg-white text-sky-600 flex items-center justify-center shadow-lg shadow-black/10 shrink-0">
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold mb-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? sourceTitle.en : sourceTitle.bn}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                BD Wallet Apps
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body: SMS & App Prompt */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Requested Message in Bangla / English */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-sky-50 to-blue-50 border border-sky-200 shadow-inner">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-md shadow-sky-600/30">
                SMS
              </div>
              <div className="space-y-2">
                {/* Bangla Text */}
                {(lang === 'bn' || lang === 'both') && (
                  <div>
                    <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      “আপনার অ্যাকাউন্ট যোগ করার জন্য দয়া করে আমাদের অ্যাপসটি ডাউনলোড করুন”
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      মোবাইল ফাইন্যান্সিয়াল সার্ভিস (বিকাশ, রকেট, নগদ) অ্যাকাউন্ট নিরাপদভাবে যুক্ত ও প্রতি মাসে আয় করতে আমাদের অফিসিয়াল অ্যাপসটি টেলিগ্রাম থেকে ডাউনলোড করুন।
                    </p>
                  </div>
                )}

                {/* English Text */}
                {(lang === 'en' || lang === 'both') && (
                  <div className={lang === 'both' ? 'pt-2 border-t border-sky-200/60' : ''}>
                    <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      “Please download our app to add your account”
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      To securely add your mobile wallet and earn monthly commissions, please download our official app via Telegram.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Telegram ID Card */}
          <div className="bg-slate-900 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-sky-300 font-semibold uppercase tracking-wider">
                  অফিসিয়াল টেলিগ্রাম ইউজার আইডি
                </p>
                <p className="text-lg font-black text-white font-mono tracking-wide">
                  Telegram- @Bdwallet247
                </p>
              </div>
            </div>
            <a
              href="https://t.me/Bdwallet247"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition-all shadow-md"
            >
              <span>@Bdwallet247</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* BIG DOWNLOAD BUTTON (Takes user directly to Telegram @Bdwallet247) */}
            <button
              type="button"
              onClick={handleDownloadClick}
              className="w-full py-4 px-6 rounded-2xl text-base font-black text-white bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-xl shadow-sky-500/25 hover:shadow-2xl hover:shadow-sky-500/35 hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-3 group"
            >
              <Download className="w-6 h-6 animate-bounce" />
              <div className="text-left">
                <div className="flex items-center space-x-1.5">
                  <span>
                    {lang === 'en'
                      ? 'DOWNLOAD APP (Telegram @Bdwallet247)'
                      : 'অ্যাপসটি ডাউনলোড করুন (Telegram @Bdwallet247)'}
                  </span>
                  <ExternalLink className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[11px] font-medium text-sky-100">
                  {lang === 'en'
                    ? 'Click to open Telegram and download the application'
                    : 'ক্লিক করলেই সরাসরি টেলিগ্রাম অ্যাপসে নিয়ে যাবে'}
                </div>
              </div>
            </button>

            {/* Optional Web Continue button if user wants to continue on web */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                {lang === 'en' ? 'Close' : 'বন্ধ করুন (Close)'}
              </button>

              {onProceedOnWeb && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onProceedOnWeb();
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-1"
                >
                  <span>{lang === 'en' ? 'Continue on Web version' : 'ওয়েবে অ্যাকাউন্ট যোগ করতে থাকুন'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
            অফিসিয়াল ও ভেরিফাইড টেলিগ্রাম সাপোর্ট
          </span>
          <span className="font-mono text-slate-400">@Bdwallet247</span>
        </div>
      </div>
    </div>
  );
};
