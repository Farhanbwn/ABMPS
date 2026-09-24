import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path === '/members') return 'Member Management';
    if (path === '/members/add') return 'Add New Member';
    if (path.includes('/edit')) return 'Edit Member Information';
    if (path.startsWith('/members/')) return 'Member Profile & History';
    if (path.startsWith('/renewals')) return 'Membership Renewals';
    if (path.startsWith('/settings')) return 'System Settings';
    return 'Admin Portal';
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col flex-1">
        <Header onMenuToggle={() => setSidebarOpen(true)} title={getPageTitle()} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
