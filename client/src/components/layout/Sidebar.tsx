import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, RefreshCw, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout, admin } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Renewals', path: '/renewals', icon: RefreshCw },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container - White institutional background */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white text-[#555555] border-r border-[#E3E3E3] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-20 flex items-center justify-between px-5 border-b border-[#E3E3E3] bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg p-1 bg-white border border-[#E3E3E3] flex items-center justify-center flex-shrink-0 shadow-2xs">
                <img src="/logo.png" alt="ABMPS Logo" className="w-full h-full object-contain" />
              </div>
              <div className="leading-tight">
                <h1 className="text-xs font-bold text-[#171717] font-bengali tracking-tight">
                  বর্ধমান মিউনিসিপ্যাল পেনশনার্স সমিতি
                </h1>
                <p className="text-[10px] text-[#777777] font-medium mt-0.5">
                  Burdwan Municipal Pensioners Samiti
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-md hover:bg-[#F5F5F5] text-[#777777] hover:text-[#171717]"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#FBE9E6] text-[#C92812] font-semibold border-l-4 border-[#C92812]'
                        : 'text-[#555555] hover:bg-[#FAF9F7] hover:text-[#171717]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin info and Logout */}
        <div className="p-4 border-t border-[#E3E3E3] bg-[#FAF9F7]">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-2 bg-white rounded-md border border-[#E3E3E3]">
            <div className="w-7 h-7 rounded-full bg-[#FBE9E6] p-0.5 flex items-center justify-center border border-[#C92812]/30 flex-shrink-0">
              <img src="/logo.png" alt="Admin" className="w-full h-full object-contain" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-[#171717] truncate">{admin?.username || 'admin@abmps.com'}</p>
              <p className="text-[10px] text-[#777777]">Administrator</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-[#C62828] hover:bg-[#FDECEC] transition-colors border border-transparent hover:border-[#C62828]/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
