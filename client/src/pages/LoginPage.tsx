import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    try {
      setIsLoading(true);
      await login({ username: username.trim(), password });
      success('Logged in successfully as Administrator.');
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Invalid username or password. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* ABMPS Logo */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-white p-2.5 shadow-sm border border-[#E3E3E3] flex items-center justify-center">
          <img src="/logo.png" alt="ABMPS Logo" className="w-full h-full object-contain" />
        </div>

        {/* Organization Titles */}
        <h1 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-[#171717] font-bengali">
          বর্ধমান মিউনিসিপ্যাল পেনশনার্স সমিতি
        </h1>
        <p className="text-xs sm:text-sm font-medium text-[#555555] mt-1">
          Burdwan Municipal Pensioners Samiti
        </p>

        {/* Thin divider line */}
        <div className="w-16 h-0.5 bg-[#C92812] mx-auto my-3" />

        <p className="text-xs uppercase tracking-wider font-semibold text-[#777777]">
          Admin Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#E3E3E3] rounded-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 bg-[#FDECEC] border border-[#C62828]/20 text-[#C62828] rounded-md text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1.5">
                Username / Email
              </label>
              <div className="relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#777777]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] placeholder-[#777777] focus:outline-none focus:border-[#C92812]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1.5">
                Password
              </label>
              <div className="relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#777777]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] placeholder-[#777777] focus:outline-none focus:border-[#C92812]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#777777] hover:text-[#171717] focus:outline-none transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-[#C92812] hover:bg-[#A91F0D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C92812] disabled:opacity-50 transition-colors"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isLoading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E3E3E3] text-center">
            <p className="text-[11px] text-[#777777]">
              Official administrative portal of Burdwan Municipal Pensioners Samiti.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
