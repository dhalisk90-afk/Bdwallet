import React, { useState, useEffect } from 'react';
import {
  signInWithGoogleDrive,
  signOutGoogleDrive,
  listDriveFiles,
  uploadFileToDrive,
  createDriveFolder,
  deleteDriveFile,
  getDriveAccessToken,
  DriveFileItem,
  auth,
} from '../utils/googleDrive';
import { api } from '../api';
import {
  HardDrive,
  FolderPlus,
  UploadCloud,
  Trash2,
  ExternalLink,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  ShieldCheck,
  Download,
  Database,
  Cloud,
} from 'lucide-react';
import { User as AppUser } from '../types';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // File to upload
  const [uploading, setUploading] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  // Folder creation
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  // Deletion Confirmation Modal State (Mandatory Workspace Guidelines)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const token = getDriveAccessToken();
      const currentAuthUser = auth.currentUser;
      if (token && currentAuthUser) {
        setIsConnected(true);
        setGoogleUser(currentAuthUser);
        loadFiles();
      } else {
        setIsConnected(false);
      }
    }
  }, [isOpen]);

  const loadFiles = async (query?: string) => {
    try {
      setLoadingFiles(true);
      setFeedback(null);
      const res = await listDriveFiles(query);
      setFiles(res.files);
    } catch (err: any) {
      console.error('Failed to load drive files:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Google Drive থেকে ফাইল লোড করা সম্ভব হয়নি।',
      });
      if (err.message?.includes('authentication required')) {
        setIsConnected(false);
      }
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleGoogleConnect = async () => {
    setIsAuthenticating(true);
    setFeedback(null);
    try {
      const res = await signInWithGoogleDrive();
      if (res) {
        setIsConnected(true);
        setGoogleUser(res.user);
        setFeedback({
          type: 'success',
          message: `Google Drive সফলভাবে সংযুক্ত হয়েছে! (${res.user.email})`,
        });
        await loadFiles();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Google সাইন-ইন সম্পন্ন করা যায়নি।',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await signOutGoogleDrive();
      setIsConnected(false);
      setGoogleUser(null);
      setFiles([]);
      setFeedback({
        type: 'success',
        message: 'Google Drive সংযোগ বিচ্ছিন্ন করা হয়েছে।',
      });
    } catch (err: any) {
      console.error('Disconnect error:', err);
    }
  };

  // One-Click Backup BD Wallet data to Google Drive
  const handleBackupToGoogleDrive = async () => {
    setIsBackingUp(true);
    setFeedback(null);
    try {
      let backupPayload: any = {};
      if (currentUser.role === 'admin') {
        const adminBackup = await api.exportDatabaseBackup();
        backupPayload = adminBackup;
      } else {
        const [records, summary, transactions] = await Promise.all([
          api.getRecords(),
          api.getWalletSummary(),
          api.getWalletTransactions(),
        ]);
        backupPayload = {
          exportType: 'customer_wallet_export',
          exportedAt: new Date().toISOString(),
          user: currentUser,
          walletSummary: summary,
          records,
          transactions,
        };
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `BD_Wallet_Backup_${currentUser.role}_${timestamp}.json`;
      const jsonContent = JSON.stringify(backupPayload, null, 2);

      const uploaded = await uploadFileToDrive(fileName, jsonContent, 'application/json');

      setFeedback({
        type: 'success',
        message: `ব্যাকআপ সফলভাবে Google Drive এ আপলোড হয়েছে: ${uploaded.name}`,
      });
      await loadFiles();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Google Drive এ ব্যাকআপ সংরক্ষণ ব্যর্থ হয়েছে।',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Custom File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFeedback(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const content = reader.result as string;
          await uploadFileToDrive(file.name, content, file.type || 'text/plain');
          setFeedback({
            type: 'success',
            message: `'${file.name}' সফলভাবে Google Drive-এ আপলোড হয়েছে!`,
          });
          await loadFiles();
        } catch (uploadErr: any) {
          setFeedback({
            type: 'error',
            message: uploadErr.message || 'আপলোড ব্যর্থ হয়েছে।',
          });
        } finally {
          setUploading(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'ফাইল প্রসেসিং ব্যর্থ হয়েছে।',
      });
      setUploading(false);
    }
  };

  // Create Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    setFeedback(null);
    try {
      await createDriveFolder(newFolderName.trim());
      setFeedback({
        type: 'success',
        message: `'${newFolderName}' ফোল্ডার সফলভাবে তৈরি হয়েছে!`,
      });
      setNewFolderName('');
      await loadFiles();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'ফোল্ডার তৈরি করা যায়নি।',
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Confirm and Delete File (Strict requirement: User Confirmation for Destructive Operations)
  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      setFeedback({
        type: 'success',
        message: `'${fileToDelete.name}' ফাইলটি Google Drive থেকে সফলভাবে মুছে ফেলা হয়েছে।`,
      });
      setFileToDelete(null);
      await loadFiles();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'ফাইল ডিলিট করা সম্ভব হয়নি।',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const filteredFiles = files.filter((f) => {
    if (!searchQuery.trim()) return true;
    return f.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-xs">
              <HardDrive className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">Google Drive ক্লাউড সিঙ্ক</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  Workspace
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                BD Wallet ব্যাকআপ সংরক্ষণ, ফাইল ব্রাউজ ও নিরাপদ ক্লাউড ব্যবস্থাপনা
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 text-xs font-semibold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {!isConnected ? (
            /* Unconnected State: Google Sign-in Card with Official Button */
            <div className="py-8 text-center space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-md">
                <Cloud className="w-9 h-9" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-black text-slate-900">
                  Google Drive কানেক্ট করুন
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  আপনার Google Drive এর সাথে যুক্ত করে BD Wallet এর ব্যাকআপ, লেজার রিপোর্ট এবং স্টেটমেন্ট সরাসরি সংরক্ষণ ও ডাউনলোড করুন।
                </p>
              </div>

              {/* Official Sign in with Google Button Styling */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  disabled={isAuthenticating}
                  className="inline-flex items-center space-x-3 px-6 py-3.5 rounded-2xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-bold text-sm shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    viewBox="0 0 48 48"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>
                    {isAuthenticating ? 'সংযুক্ত হচ্ছে...' : 'Sign in with Google Drive'}
                  </span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center space-x-1 font-bold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>নিরাপত্তা ও গোপনীয়তা:</span>
                </div>
                <p>• টোকেন মেমরিতে সাময়িকভাবে সংরক্ষিত হয় এবং লোকালস্টোরেজে রাখা হয় না।</p>
                <p>• ডাটা মুছে ফেলার আগে আপনার থেকে সরাসরি নিশ্চিতকরণ নেওয়া হবে।</p>
              </div>
            </div>
          ) : (
            /* Connected State: Profile, One-Click Backup, File Upload & List */
            <div className="space-y-4">
              {/* Connected User Profile Banner */}
              <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {googleUser?.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt="Google User"
                      className="w-10 h-10 rounded-full border border-blue-300 shadow-xs object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center">
                      G
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-900">
                        {googleUser?.displayName || 'Google User'}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {googleUser?.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => loadFiles()}
                    disabled={loadingFiles}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                    title="ফাইল রিফ্রেশ করুন"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleDisconnect}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ডিসকানেক্ট
                  </button>
                </div>
              </div>

              {/* Action Strip: One-Click Backup + Upload + New Folder */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. One-Click Backup */}
                <button
                  type="button"
                  onClick={handleBackupToGoogleDrive}
                  disabled={isBackingUp}
                  className="flex items-center justify-center space-x-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-4 h-4 shrink-0" />
                  <span>
                    {isBackingUp ? 'ব্যাকআপ হচ্ছে...' : 'BD Wallet ব্যাকআপ ড্রাইভ এ পাঠান'}
                  </span>
                </button>

                {/* 2. Custom Upload */}
                <label className="flex items-center justify-center space-x-2 p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer">
                  <UploadCloud className="w-4 h-4 shrink-0" />
                  <span>{uploading ? 'আপলোড হচ্ছে...' : 'ফাইল আপলোড করুন'}</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>

                {/* 3. New Folder Form */}
                <form onSubmit={handleCreateFolder} className="flex gap-1">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="নতুন ফোল্ডারের নাম..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingFolder || !newFolderName.trim()}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    title="ফোল্ডার তৈরি করুন"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Google Drive এ ফাইল খুঁজুন..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Files List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Google Drive ফাইল তালিকা ({filteredFiles.length})</span>
                  {loadingFiles && (
                    <span className="text-[11px] text-blue-600 flex items-center">
                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                      লোড হচ্ছে...
                    </span>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {filteredFiles.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400">
                      {loadingFiles ? 'ফাইল লোড হচ্ছে...' : 'কোনো ফাইল পাওয়া যায়নি।'}
                    </div>
                  ) : (
                    filteredFiles.map((f) => {
                      const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
                      const isJson = f.name.endsWith('.json') || f.mimeType.includes('json');

                      return (
                        <div
                          key={f.id}
                          className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                              {isFolder ? (
                                <FolderPlus className="w-4 h-4" />
                              ) : isJson ? (
                                <Database className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-xs truncate">
                                {f.name}
                              </p>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                                <span>
                                  {f.modifiedTime
                                    ? new Date(f.modifiedTime).toLocaleDateString('bn-BD', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : 'N/A'}
                                </span>
                                {f.size && (
                                  <>
                                    <span>•</span>
                                    <span>{(Number(f.size) / 1024).toFixed(1)} KB</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            {f.webViewLink && (
                              <a
                                href={f.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                title="Google Drive-এ দেখুন"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setFileToDelete(f)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                              title="ফাইল মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Google Drive v3 API Verified</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>

      {/* Mandatory Explicit Confirmation Dialog for Destructive Operations */}
      {fileToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-rose-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-black text-slate-900 text-sm sm:text-base">
                Google Drive ফাইল মুছে ফেলতে চান?
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                আপনি কি নিশ্চিত যে <span className="font-bold text-rose-700">'{fileToDelete.name}'</span> ফাইলটি আপনার Google Drive থেকে মুছে ফেলতে চান?
              </p>
              <p className="text-[10px] text-slate-400">
                এই কাজটি সম্পন্ন হলে ফাইলটি স্থায়ীভাবে রিমুভ হবে।
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
