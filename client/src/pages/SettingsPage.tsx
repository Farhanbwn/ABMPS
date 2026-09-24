import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Database, Server, Info } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { admin } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-[#E3E3E3] shadow-xs">
        <h1 className="text-xl font-bold text-[#171717]">System & Admin Settings</h1>
        <p className="text-xs text-[#555555] mt-1">
          Review security configuration, system status, and administrator profile.
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

      {/* Guidelines Box */}
      <div className="p-5 bg-[#FBE9E6] border border-[#C92812]/20 rounded-xl flex items-start gap-3.5">
        <Info className="w-5 h-5 text-[#C92812] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#171717] leading-relaxed">
          <p className="font-bold text-[#C92812] mb-1">Administrative Protocol Note</p>
          <p className="text-[#555555]">
            Member Serial Numbers are uniquely indexed across the organization. Member deletions are stored as soft deletes to preserve audit integrity. Password modifications and administrative credentials can be updated via server environment variables or database migration scripts.
          </p>
        </div>
      </div>
    </div>
  );
};
