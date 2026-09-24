import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title }) => {
  const { admin, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-[#E3E3E3] flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md hover:bg-[#F5F5F5] text-[#555555] hover:text-[#171717] focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#171717] leading-tight">{title}</h2>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#777777]">
            <span className="font-bengali font-semibold text-[#C92812]">বর্ধমান মিউনিসিপ্যাল পেনশনার্স সমিতি</span>
            <span>•</span>
            <span>Burdwan Municipal Pensioners Samiti</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#FAF9F7] border border-[#E3E3E3] text-xs font-medium text-[#171717]">
          <User className="w-3.5 h-3.5 text-[#C92812]" />
          <span className="truncate max-w-[150px]">{admin?.username || 'admin@abmps.com'}</span>
        </div>

        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#C62828] hover:bg-[#FDECEC] transition-colors border border-transparent hover:border-[#C62828]/20"
          title="Sign out of ABMPS"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
