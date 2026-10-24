/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api, getAuthToken } from './api';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { CustomerDashboard } from './components/CustomerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { CleanHomePage } from './components/CleanHomePage';
import { ShieldCheck, Lock, Heart, Globe, Wallet } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
  const [isSecurityAuditOpen, setIsSecurityAuditOpen] = useState(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);

  // Initialize session on load
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const user = await api.getCurrentUser();
          setCurrentUser(user);
          if (user.role === 'admin') {
            setActiveTab('admin');
          }
        } catch (err) {
          console.warn('Session expired or invalid, please login again.');
          api.logout();
          setCurrentUser(null);
        }
      }
      setIsLoadingAuth(false);
    };

    initAuth();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('customer');
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setActiveTab('customer');
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 animate-bounce shadow-lg shadow-emerald-600/20">
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">BD Wallet লোড হচ্ছে...</p>
          <p className="text-xs text-slate-500 mt-1">সুরক্ষিত সেশন যাচাইকরণ প্রক্রিয়াধীন</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <CleanHomePage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-emerald-500 selection:text-white w-full overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSecurityAudit={() => setIsSecurityAuditOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-x-hidden">
        {activeTab === 'admin' && currentUser.role === 'admin' ? (
          <AdminDashboard currentUser={currentUser} />
        ) : (
          <CustomerDashboard currentUser={currentUser} />
        )}
      </main>

      {/* Google Drive Workspace Modal */}
      <GoogleDriveModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        currentUser={currentUser}
      />

      {/* Security Audit Modal */}
      <SecurityAuditModal
        isOpen={isSecurityAuditOpen}
        onClose={() => setIsSecurityAuditOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
              ৳
            </div>
            <span className="font-bold text-slate-700">BD Wallet (বিডি ওয়ালেট)</span>
            <span>•</span>
            <span>টাইমজোন: Asia/Dhaka (BST)</span>
            <span>•</span>
            <span>মুদ্রা: বাংলাদেশী টাকা (৳)</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center text-slate-600">
              <Lock className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              জিরো-নলেজ পিন পলিসি
            </span>
            <button
              onClick={() => setIsSecurityAuditOpen(true)}
              className="text-emerald-700 hover:underline font-semibold flex items-center"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              লাইভ অডিট রিপোর্ট
            </button>
            <span className="text-slate-400">বাজেট: $০ (১০০% উন্মুক্ত ও ওপেন-সোর্স)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
