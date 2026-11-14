import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Shield, 
  Check, 
  LogOut, 
  Eye, 
  EyeOff, 
  Save, 
  Key,
  BadgeAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { translations } from '../translations';
import { cn } from '../lib/utils';

interface ProfileProps {
  lang: 'en' | 'ar';
  currentUser: User | null;
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({
  lang,
  currentUser,
  users,
  onUpdateUsers,
  onLogout
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // State
  const [name, setName] = useState(currentUser?.name || '');
  const [email] = useState(currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fallback if no logged in user
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
        <UserIcon size={48} className="text-gray-300 mb-4 animate-pulse" />
        <p className="text-gray-500 font-medium">
          {isRtl ? 'يرجى تسجيل الدخول لعرض حسابك.' : 'Please log in to view your profile.'}
        </p>
      </div>
    );
  }

  const triggerToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    const cleanName = name.trim();
    if (!cleanName) {
      triggerToast(isRtl ? 'الاسم لا يمكن أن يكون فارغاً' : 'Name cannot be empty', true);
      return;
    }

    // Password Update Logic
    let updatedPassword = currentUser.password;
    if (newPassword || confirmPassword || currentPassword) {
      // If any password field is touched, they must fill all of them
      if (!currentPassword) {
        triggerToast(isRtl ? 'يرجى إدخال كلمة المرور الحالية لتحديث كلمة المرور' : 'Please enter your current password to change it', true);
        return;
      }

      // Check current password correctness
      // Treat default password 'cropsa2026' as fallback
      const realPassword = currentUser.password || 'cropsa2026';
      if (currentPassword !== realPassword) {
        triggerToast(isRtl ? 'كلمة المرور الحالية غير صحيحة!' : 'Incorrect current password!', true);
        return;
      }

      if (!newPassword) {
        triggerToast(isRtl ? 'يرجى إدخال كلمة المرور الجديدة' : 'Please enter your new password', true);
        return;
      }

      if (newPassword.length < 4) {
        triggerToast(isRtl ? 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل' : 'New password must be at least 4 characters long', true);
        return;
      }

      if (newPassword !== confirmPassword) {
        triggerToast(isRtl ? 'كلمتا المرور الجديدتان غير متطابقتين!' : 'New passwords do not match!', true);
        return;
      }

      updatedPassword = newPassword;
    }

    setIsSaving(true);

    setTimeout(() => {
      // Find and update user in users array
      const updatedUsersList = users.map(u => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            name: cleanName,
            password: updatedPassword,
            avatar: cleanName[0]?.toUpperCase() || '?'
          };
        }
        return u;
      });

      // Notify parent to save in localStorage & sync state
      onUpdateUsers(updatedUsersList);
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      triggerToast(isRtl ? 'تم تحديث الملف الشخصي بنجاح!' : 'Profile updated successfully!', false);
      setIsSaving(false);
    }, 600);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Content Manager': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Content Creator': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Designer': return 'bg-pink-50 text-pink-700 border-pink-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Toast Banner */}
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "fixed top-20 right-4 md:right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border backdrop-blur-md max-w-sm",
            toast.isError 
              ? "bg-red-50/95 text-red-800 border-red-200" 
              : "bg-emerald-50/95 text-emerald-800 border-emerald-200"
          )}
        >
          {toast.isError ? <BadgeAlert size={20} className="text-red-600 shrink-0" /> : <Check size={20} className="text-emerald-600 shrink-0" />}
          <span className="text-sm font-semibold">{toast.text}</span>
        </motion.div>
      )}

      {/* Main Profile Visual Header Card */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl" />

        {/* Big Avatar */}
        <div className="w-24 h-24 rounded-3xl bg-green-50 text-green-700 border-2 border-green-200 flex items-center justify-center font-black text-4xl uppercase shadow-md shrink-0 relative">
          {currentUser.name[0]?.toUpperCase() || 'U'}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-600 rounded-full border-2 border-white flex items-center justify-center text-white">
            <Check size={12} strokeWidth={3} />
          </div>
        </div>

        {/* User Status Details */}
        <div className="flex-1 text-center md:text-left min-w-0 space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900 truncate">{currentUser.name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mt-1 md:mt-0">
              <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg border", getRoleBadgeColor(currentUser.role))}>
                {currentUser.role}
              </span>
              <span className="text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Shield size={12} />
                {isRtl ? 'الصلاحيات:' : 'Perms:'} {currentUser.permissions.join(', ')}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 flex items-center justify-center md:justify-start gap-2">
            <Mail size={16} className="text-gray-400" />
            <span className="font-mono">{currentUser.email}</span>
          </p>
        </div>

        {/* Right Logout/Sign out Button */}
        <div className="shrink-0 pt-4 md:pt-0 w-full md:w-auto">
          <button
            onClick={onLogout}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm flex items-center justify-center gap-2 transition-all border border-red-100 hover:border-red-200 cursor-pointer shadow-sm hover:shadow"
          >
            <LogOut size={16} />
            <span>{isRtl ? 'تسجيل الخروج' : 'Log Out'}</span>
          </button>
        </div>
      </div>

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Section */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
              <UserIcon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{isRtl ? 'البيانات الشخصية' : 'Personal Details'}</h3>
              <p className="text-xs text-gray-500">{isRtl ? 'أدخل اسمك ومعلومات الحساب الأساسية.' : 'Manage your name and core credentials.'}</p>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {isRtl ? 'البريد الإلكتروني (غير قابل للتعديل)' : 'Email Address (Read-only)'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 font-mono text-sm cursor-not-allowed outline-none select-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-200 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                  {isRtl ? 'مقفل' : 'Locked'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {isRtl ? 'الاسم بالكامل' : 'Full Name'}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isRtl ? 'أدخل اسمك بالكامل' : 'Enter your full name'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Key size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{isRtl ? 'أمان كلمة المرور' : 'Password Security'}</h3>
              <p className="text-xs text-gray-500">{isRtl ? 'اترك الحقول فارغة إذا كنت لا تريد التعديل.' : 'Leave password fields empty to keep current password.'}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {isRtl ? 'كلمة المرور الحالية للتأكيد' : 'Verify Current Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type={showCurrentPassword ? "text" : "password"} 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={isRtl ? 'أدخل كلمة المرور الحالية لحفظ أي تغييرات' : 'Current password to verify change'}
                  className="w-full px-10 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={isRtl ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                  className="w-full px-10 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {isRtl ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={isRtl ? 'تأكيد كلمة المرور الجديدة' : 'Re-enter new password'}
                  className="w-full px-10 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar Button spanned */}
        <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full md:w-auto px-8 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-green-900/10 min-w-[160px]"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                <span>{isRtl ? 'حفظ التعديلات' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
