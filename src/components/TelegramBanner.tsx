import React, { useState } from 'react';
import { Smartphone, Download, ExternalLink, Send, Sparkles, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TelegramBannerProps {
  onOpenDownloadModal?: () => void;
  className?: string;
  variant?: 'full' | 'compact';
}

export const TelegramBanner: React.FC<TelegramBannerProps> = ({
  onOpenDownloadModal,
  className = '',
  variant = 'full',
}) => {
  const [lang, setLang] = useState<'bn' | 'en' | 'both'>('both');

  const handleTelegramClick = () => {
    window.open('https://t.me/Bdwallet247', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white shadow-xl shadow-sky-600/20 border border-sky-400/30 ${className}`}
    >
      {/* Decorative Background Elements */}
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-1/4 -top-12 w-48 h-48 bg-sky-300/20 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-8">
        {/* Top Control Bar: Badges + Language Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>
                {lang === 'en'
                  ? 'Official Telegram Channel'
                  : 'অফিসিয়াল টেলিগ্রাম কমিউনিটি'}
              </span>
            </span>

            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>সক্রিয় (Active)</span>
            </span>
          </div>

          {/* Bilingual Language Selector */}
          <div className="flex items-center space-x-1 bg-black/25 backdrop-blur-sm p-1 rounded-xl text-xs font-bold">
            <span className="text-[11px] text-sky-200 px-1">ভাষা:</span>
            <button
              type="button"
              onClick={() => setLang('bn')}
              className={`px-2.5 py-0.5 rounded-lg transition-all ${
                lang === 'bn' ? 'bg-white text-blue-700 shadow-xs' : 'text-sky-100 hover:text-white'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-0.5 rounded-lg transition-all ${
                lang === 'en' ? 'bg-white text-blue-700 shadow-xs' : 'text-sky-100 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('both')}
              className={`px-2.5 py-0.5 rounded-lg transition-all ${
                lang === 'both' ? 'bg-white text-blue-700 shadow-xs' : 'text-sky-100 hover:text-white'
              }`}
            >
              উভয়
            </button>
          </div>
        </div>

        {/* Big Bold Core Message as requested */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            {/* Bengali Headline */}
            {(lang === 'bn' || lang === 'both') && (
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight drop-shadow-sm text-white">
                আপনার মোবাইল ওয়ালেট দিয়ে আয় করুন
              </h1>
            )}

            {/* English Headline */}
            {(lang === 'en' || lang === 'both') && (
              <h2
                className={`${
                  lang === 'both'
                    ? 'text-lg sm:text-xl md:text-2xl font-bold text-sky-100'
                    : 'text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight text-white'
                }`}
              >
                Earn money with your mobile wallet
              </h2>
            )}

            {/* Description */}
            <p className="text-xs sm:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
              {lang === 'en'
                ? 'Connect your personal, agent, or merchant MFS accounts (bKash, Rocket, Nagad). Download our official app via Telegram and earn guaranteed monthly commissions.'
                : 'বিকাশ, রকেট ও নগদ অ্যাকাউন্ট যুক্ত করে প্রতি মাসে নিশ্চিত কমিশন আয় করুন। আমাদের অফিসিয়াল মোবাইল অ্যাপ ডাউনলোড করতে টেলিগ্রামে যোগাযোগ করুন।'}
            </p>

            {/* Telegram User ID Card (Big & Prominent) */}
            <div className="inline-flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-inner">
                <div className="w-8 h-8 rounded-xl bg-white text-sky-600 flex items-center justify-center font-bold shadow-md">
                  <Send className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <div className="text-[10px] text-sky-200 font-bold uppercase tracking-wider">
                    {lang === 'en' ? 'Official Telegram' : 'অফিসিয়াল টেলিগ্রাম'}
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white font-mono tracking-wide">
                    Telegram- @Bdwallet247
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Column */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
            {/* Download Button (Triggers Popup / Direct) */}
            <button
              type="button"
              onClick={onOpenDownloadModal || handleTelegramClick}
              className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-sky-50 text-blue-900 font-black text-sm shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 group"
            >
              <Download className="w-5 h-5 text-sky-600 animate-bounce group-hover:scale-110 transition-transform" />
              <span>
                {lang === 'en'
                  ? 'Download Apps'
                  : 'অ্যাপসটি ডাউনলোড করুন'}
              </span>
            </button>

            {/* Direct Open Telegram Button */}
            <button
              type="button"
              onClick={handleTelegramClick}
              className="w-full py-3 px-5 rounded-2xl bg-sky-500/30 hover:bg-sky-500/40 text-white font-bold text-xs border border-white/30 backdrop-blur-sm transition-all flex items-center justify-center space-x-2 hover:border-white/50"
            >
              <Send className="w-4 h-4 text-sky-200" />
              <span>
                {lang === 'en'
                  ? 'Message on Telegram @Bdwallet247'
                  : 'টেলিগ্রামে বার্তা দিন @Bdwallet247'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 text-sky-200" />
            </button>
          </div>
        </div>

        {/* Feature Highlights Pill Bar */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs text-sky-100">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>বিকাশ • রকেট • নগদ কমিশন</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>দ্বিভাষিক সহায়তা (Bangla & English)</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>২৪/৭ টেলিগ্রাম সাপোর্ট @Bdwallet247</span>
          </div>
        </div>
      </div>
    </div>
  );
};
