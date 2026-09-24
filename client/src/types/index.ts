export type GenderType = 'Male' | 'Female' | 'Other' | null;
export type MembershipStatusType = 'Active' | 'Inactive' | 'Pending';

export interface Admin {
  id: string;
  username: string;
  createdAt: string;
}

export interface Member {
  _id: string;
  serialNo: number;
  nameBengali: string;
  nameEnglish?: string;
  dateOfBirth?: string | null;
  address?: string;
  mobileNo?: string;
  gender?: GenderType;
  joinYear?: number | null;
  membershipStatus: MembershipStatusType;
  activeBillId?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipRenewal {
  _id: string;
  memberId: string | { _id: string; nameEnglish: string; nameBengali: string; serialNo?: number; mobileNo?: string };
  serialNo: number;
  membershipYear: number;
  billId: string;
  renewalDate: string;
  status: MembershipStatusType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface DashboardStats {
  currentYear: number;
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  renewedThisYear: number;
  pendingRenewal: number;
  recentMembers: Array<{
    _id: string;
    serialNo: number;
    nameBengali: string;
    nameEnglish: string;
    membershipStatus: MembershipStatusType;
    joinYear: number;
    createdAt: string;
  }>;
  recentRenewals: Array<{
    _id: string;
    serialNo: number;
    membershipYear: number;
    billId: string;
    renewalDate: string;
    status: MembershipStatusType;
    memberId: {
      _id: string;
      nameEnglish: string;
      nameBengali: string;
      serialNo: number;
    };
  }>;
}
