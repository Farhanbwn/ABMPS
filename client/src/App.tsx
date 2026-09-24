import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { Loader2 } from 'lucide-react';

// Lazy-loaded route components for optimal chunking
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const MemberListPage = lazy(() => import('./pages/MemberListPage').then((m) => ({ default: m.MemberListPage })));
const AddMemberPage = lazy(() => import('./pages/AddMemberPage').then((m) => ({ default: m.AddMemberPage })));
const EditMemberPage = lazy(() => import('./pages/EditMemberPage').then((m) => ({ default: m.EditMemberPage })));
const MemberDetailsPage = lazy(() => import('./pages/MemberDetailsPage').then((m) => ({ default: m.MemberDetailsPage })));
const RenewalsPage = lazy(() => import('./pages/RenewalsPage').then((m) => ({ default: m.RenewalsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

// Route Loading Spinner
const PageLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
    <Loader2 className="w-8 h-8 text-[#C92812] animate-spin" />
    <span className="text-xs font-semibold text-[#555555]">Loading portal module...</span>
  </div>
);

// Login route guard: if already logged in, redirect to dashboard
const LoginRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginRoute />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="members" element={<MemberListPage />} />
                <Route path="members/add" element={<AddMemberPage />} />
                <Route path="members/:id" element={<MemberDetailsPage />} />
                <Route path="members/:id/edit" element={<EditMemberPage />} />
                <Route path="renewals" element={<RenewalsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
