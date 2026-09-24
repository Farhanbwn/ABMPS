import axios from 'axios';
import { ApiResponse, Member, MembershipRenewal, DashboardStats } from '../types';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to catch 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and let App redirect to login if session expired
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('mms_token');
        localStorage.removeItem('mms_admin');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    const res = await api.post<ApiResponse<{ token: string; admin: any }>>('/auth/login', credentials);
    return res.data;
  },
  logout: async () => {
    const res = await api.post<ApiResponse<void>>('/auth/logout');
    return res.data;
  },
  getCurrentAdmin: async () => {
    const res = await api.get<ApiResponse<{ admin: any }>>('/auth/me');
    return res.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string; confirmPassword?: string }) => {
    const res = await api.post<ApiResponse<void>>('/auth/change-password', data);
    return res.data;
  },
};

// Members API
export const memberService = {
  getMembers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    gender?: string;
    joinYear?: number | string;
    membershipYear?: number | string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const res = await api.get<ApiResponse<Member[]>>('/members', { params });
    return res.data;
  },

  getAllFilteredMembers: async (params: {
    search?: string;
    status?: string;
    gender?: string;
    joinYear?: number | string;
    membershipYear?: number | string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const res = await api.get<ApiResponse<Member[]>>('/members/all', { params });
    return res.data;
  },

  getMemberById: async (id: string) => {
    const res = await api.get<ApiResponse<{ member: Member; renewals: MembershipRenewal[] }>>(`/members/${id}`);
    return res.data;
  },

  getNextSerial: async () => {
    const res = await api.get<ApiResponse<{ nextSerial: number }>>('/members/next-serial');
    return res.data;
  },

  getJoinYears: async () => {
    const res = await api.get<ApiResponse<{ years: number[] }>>('/members/join-years');
    return res.data;
  },

  createMember: async (data: Partial<Member>) => {
    const res = await api.post<ApiResponse<Member>>('/members', data);
    return res.data;
  },

  updateMember: async (id: string, data: Partial<Member>) => {
    const res = await api.put<ApiResponse<Member>>(`/members/${id}`, data);
    return res.data;
  },

  deleteMember: async (id: string) => {
    const res = await api.delete<ApiResponse<{ id: string; serialNo: number; nameEnglish: string }>>(`/members/${id}`);
    return res.data;
  },
};

// Renewals API
export const renewalService = {
  createRenewal: async (data: {
    memberId: string;
    membershipYear: number;
    billId: string;
    renewalDate?: string;
    status?: 'Active' | 'Inactive';
    notes?: string;
  }) => {
    const res = await api.post<ApiResponse<MembershipRenewal>>('/renewals', data);
    return res.data;
  },

  getAllRenewals: async (params: {
    page?: number;
    limit?: number;
    year?: number | string;
    status?: string;
    search?: string;
  }) => {
    const res = await api.get<ApiResponse<MembershipRenewal[]>>('/renewals', { params });
    return res.data;
  },

  getRenewalsByMember: async (memberId: string) => {
    const res = await api.get<ApiResponse<MembershipRenewal[]>>(`/renewals/member/${memberId}`);
    return res.data;
  },

  deleteRenewal: async (id: string) => {
    const res = await api.delete<ApiResponse<MembershipRenewal>>(`/renewals/${id}`);
    return res.data;
  },
};

// Dashboard API
export const dashboardService = {
  getStats: async () => {
    const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return res.data;
  },
};
