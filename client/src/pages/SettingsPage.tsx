import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';
import { Shield, Database, Info, KeyRound, Eye, EyeOff, Loader2, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { admin } = useAuth();
  const { success, error } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      error('Please complete all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('New password and confirm password do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      success('Admin password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update password. Please check your current password.';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-[#E3E3E3] shadow-xs">
        <h1 className="text-xl font-bold text-[#171717]">System & Admin Settings</h1>
        <p className="text-xs text-[#555555] mt-1">
          Review security configuration, system status, administrator profile, and change account credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Administrator Profile Card */}
        <div className="bg-white p-6 rounded-xl border border-[#E3E3E3] shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-[#E3E3E3] pb-4">
            <div className="p-2.5 rounded-lg bg-[#FBE9E6] text-[#C92812]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#171717]">Administrator Account</h2>
              <p className="text-xs text-[#555555]">Active authenticated session</p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-[#E3E3E3]/60">
              <span className="text-[#555555]">Username</span>
              <span className="font-semibold text-[#171717]">{admin?.username || 'admin@abmps.com'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E3E3E3]/60">
              <span className="text-[#555555]">Role</span>
              <span className="font-semibold text-[#C92812]">Master Administrator</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E3E3E3]/60">
              <span className="text-[#555555]">Authentication Mode</span>
              <span className="font-mono text-[#171717]">JWT + bcrypt</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#555555]">Account Registered</span>
              <span className="text-[#777777]">
                {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-GB') : 'System Initialized'}
              </span>
            </div>
          </div>
        </div>

        {/* System & Architecture Info */}
        <div className="bg-white p-6 rounded-xl border border-[#E3E3E3] shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-[#E3E3E3] pb-4">
            <div className="p-2.5 rounded-lg bg-[#E8F5EF] text-[#16845B]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#171717]">System Infrastructure</h2>
              <p className="text-xs text-[#555555]">Database & services overview</p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-[#E3E3E3]/60">
              <span className="text-[#555555]">Database Engine</span>
              <span className="font-semibold text-[#171717]">MongoDB Atlas (Mongoose ODM)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E3E3E3]/60">
              <span className="text-[#555555]">Backend Service</span>
              <span className="font-semibold text-[#171717]">Express.js (Node.js + TS)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E3E3E3]/60">
              <span className="text-[#555555]">Frontend Framework</span>
              <span className="font-semibold text-[#171717]">React + Vite + TypeScript</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#555555]">Supported Scripts</span>
              <span className="font-semibold text-[#171717]">English & Bengali (বাংলা)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white p-6 rounded-xl border border-[#E3E3E3] shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-[#E3E3E3] pb-4">
          <div className="p-2.5 rounded-lg bg-[#FBE9E6] text-[#C92812]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#171717]">Change Admin Password</h2>
            <p className="text-xs text-[#555555]">Update credentials for administrator login</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] placeholder-[#777777] focus:outline-none focus:border-[#C92812]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#777777] hover:text-[#171717]"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
              New Password * (minimum 6 characters)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] placeholder-[#777777] focus:outline-none focus:border-[#C92812]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#777777] hover:text-[#171717]"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-[#171717] uppercase mb-1.5">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] placeholder-[#777777] focus:outline-none focus:border-[#C92812]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#777777] hover:text-[#171717]"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs !py-2 !px-4 shadow-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Updating Password...' : 'Save New Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Guidelines Box */}
      <div className="p-5 bg-[#FBE9E6] border border-[#C92812]/20 rounded-xl flex items-start gap-3.5">
        <Info className="w-5 h-5 text-[#C92812] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#171717] leading-relaxed">
          <p className="font-bold text-[#C92812] mb-1">Administrative Protocol Note</p>
          <p className="text-[#555555]">
            Member Serial Numbers are uniquely indexed across the organization. Member deletions are stored as soft deletes to preserve audit integrity. Password modifications are immediately encrypted with bcrypt and applied to future login sessions.
          </p>
        </div>
      </div>
    </div>
  );
};
