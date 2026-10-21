import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { memberService } from '../services/api';
import { Member, PaginationMeta } from '../types';
import { useToast } from '../context/ToastContext';
import { PrintModal } from '../components/members/PrintModal';
import { ExcelExportModal } from '../components/members/ExcelExportModal';
import { DeleteConfirmModal } from '../components/members/DeleteConfirmModal';
import { RenewalModal } from '../components/members/RenewalModal';
import {
  Search,
  UserPlus,
  Printer,
  FileSpreadsheet,
  ArrowUpDown,
  Eye,
  Edit,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FilterX,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// In-memory cache for instant zero-flicker restoration on back-navigation
interface CachedMembersState {
  cacheKey: string;
  members: Member[];
  pagination: PaginationMeta;
}

let memoryMembersCache: CachedMembersState | null = null;

const buildCacheKey = (params: Record<string, any>) => {
  return JSON.stringify(params);
};

export const MemberListPage: React.FC = () => {
  const { success, error } = useToast();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL searchParams so back-navigation restores exact search
  const initialSearch = searchParams.get('search') || '';
  const initialStatus = searchParams.get('status') || 'All';
  const initialGender = searchParams.get('gender') || 'All';
  const initialJoinYear = searchParams.get('joinYear') || '';
  const initialMembershipYear = searchParams.get('membershipYear') || '';
  const initialPaidYears = searchParams.get('paidYears') || '';
  const initialUnpaidYears = searchParams.get('unpaidYears') || '';
  const initialPage = Number(searchParams.get('page')) || 1;
  const initialSortBy = searchParams.get('sortBy') || 'serialNo';
  const initialSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

  // Compute key to check memory cache
  const initialQueryKey = buildCacheKey({
    search: initialSearch,
    status: initialStatus === 'All' ? undefined : initialStatus,
    gender: initialGender === 'All' ? undefined : initialGender,
    joinYear: initialJoinYear || undefined,
    membershipYear: initialMembershipYear || undefined,
    paidYears: initialPaidYears || undefined,
    unpaidYears: initialUnpaidYears || undefined,
    page: initialPage,
    sortBy: initialSortBy,
    sortOrder: initialSortOrder,
  });

  const hasValidCache = Boolean(memoryMembersCache && memoryMembersCache.cacheKey === initialQueryKey);

  // Members & Pagination state (instant from memory cache if returning from profile)
  const [members, setMembers] = useState<Member[]>(hasValidCache ? memoryMembersCache!.members : []);
  const [pagination, setPagination] = useState<PaginationMeta>(
    hasValidCache
      ? memoryMembersCache!.pagination
      : {
          page: initialPage,
          limit: 25,
          total: 0,
          totalPages: 1,
        }
  );
  const [isLoading, setIsLoading] = useState<boolean>(!hasValidCache);

  // Filters state
  const [search, setSearch] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [status, setStatus] = useState<string>(initialStatus);
  const [gender, setGender] = useState<string>(initialGender);
  const [joinYear, setJoinYear] = useState<string>(initialJoinYear);
  const [membershipYear, setMembershipYear] = useState<string>(initialMembershipYear);
  const [availableJoinYears, setAvailableJoinYears] = useState<number[]>([]);
  const [paidYears, setPaidYears] = useState<string>(initialPaidYears);
  const [debouncedPaidYears, setDebouncedPaidYears] = useState<string>(initialPaidYears);
  const [unpaidYears, setUnpaidYears] = useState<string>(initialUnpaidYears);
  const [debouncedUnpaidYears, setDebouncedUnpaidYears] = useState<string>(initialUnpaidYears);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(
    Boolean(initialPaidYears || initialUnpaidYears)
  );

  // Sorting state
  const [sortBy, setSortBy] = useState<string>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);

  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberToRenew, setMemberToRenew] = useState<Member | null>(null);

  // Flags to avoid resetting page=1 on initial mount when returning to page > 1
  const isSearchMount = useRef(true);
  const isPaidYearsMount = useRef(true);
  const isUnpaidYearsMount = useRef(true);

  // Debounce search input
  useEffect(() => {
    if (isSearchMount.current) {
      isSearchMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce paidYears input
  useEffect(() => {
    if (isPaidYearsMount.current) {
      isPaidYearsMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedPaidYears(paidYears);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [paidYears]);

  // Debounce unpaidYears input
  useEffect(() => {
    if (isUnpaidYearsMount.current) {
      isUnpaidYearsMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedUnpaidYears(unpaidYears);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [unpaidYears]);

  // Synchronize filter & search state with browser URL search parameters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (status && status !== 'All') params.status = status;
    if (gender && gender !== 'All') params.gender = gender;
    if (joinYear) params.joinYear = joinYear;
    if (membershipYear) params.membershipYear = membershipYear;
    if (debouncedPaidYears) params.paidYears = debouncedPaidYears;
    if (debouncedUnpaidYears) params.unpaidYears = debouncedUnpaidYears;
    if (pagination.page > 1) params.page = String(pagination.page);
    if (sortBy !== 'serialNo') params.sortBy = sortBy;
    if (sortOrder !== 'asc') params.sortOrder = sortOrder;

    setSearchParams(params, { replace: true });
  }, [
    debouncedSearch,
    status,
    gender,
    joinYear,
    membershipYear,
    debouncedPaidYears,
    debouncedUnpaidYears,
    pagination.page,
    sortBy,
    sortOrder,
    setSearchParams,
  ]);

  // Sync state if browser back/forward button changes URL
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlStatus = searchParams.get('status') || 'All';
    const urlGender = searchParams.get('gender') || 'All';
    const urlJoinYear = searchParams.get('joinYear') || '';
    const urlMembershipYear = searchParams.get('membershipYear') || '';
    const urlPaidYears = searchParams.get('paidYears') || '';
    const urlUnpaidYears = searchParams.get('unpaidYears') || '';
    const urlPage = Number(searchParams.get('page')) || 1;
    const urlSortBy = searchParams.get('sortBy') || 'serialNo';
    const urlSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

    setSearch((prev) => (prev !== urlSearch ? urlSearch : prev));
    setDebouncedSearch((prev) => (prev !== urlSearch ? urlSearch : prev));
    setStatus((prev) => (prev !== urlStatus ? urlStatus : prev));
    setGender((prev) => (prev !== urlGender ? urlGender : prev));
    setJoinYear((prev) => (prev !== urlJoinYear ? urlJoinYear : prev));
    setMembershipYear((prev) => (prev !== urlMembershipYear ? urlMembershipYear : prev));
    setPaidYears((prev) => (prev !== urlPaidYears ? urlPaidYears : prev));
    setDebouncedPaidYears((prev) => (prev !== urlPaidYears ? urlPaidYears : prev));
    setUnpaidYears((prev) => (prev !== urlUnpaidYears ? urlUnpaidYears : prev));
    setDebouncedUnpaidYears((prev) => (prev !== urlUnpaidYears ? urlUnpaidYears : prev));
    setPagination((prev) => (prev.page !== urlPage ? { ...prev, page: urlPage } : prev));
    setSortBy((prev) => (prev !== urlSortBy ? urlSortBy : prev));
    setSortOrder((prev) => (prev !== urlSortOrder ? urlSortOrder : prev));
    if (urlPaidYears || urlUnpaidYears) {
      setShowAdvancedFilters(true);
    }
  }, [searchParams]);

  // Helper to parse clean 4-digit years array
  const parseValidYears = (input: string): number[] | undefined => {
    if (!input || !input.trim()) return undefined;
    const years = input
      .split(',')
      .map((y) => Number(y.trim()))
      .filter((n) => !isNaN(n) && n >= 1900 && n <= 2100);
    return years.length > 0 ? years : undefined;
  };

  // Load distinct join years for filter
  useEffect(() => {
    memberService
      .getJoinYears()
      .then((res) => setAvailableJoinYears(res.data.years || []))
      .catch((err) => console.error('Failed to load join years:', err));
  }, []);

  // Fetch members from server
  const fetchMembers = useCallback(async () => {
    const queryKey = buildCacheKey({
      search: debouncedSearch,
      status: status === 'All' ? undefined : status,
      gender: gender === 'All' ? undefined : gender,
      joinYear: joinYear || undefined,
      membershipYear: membershipYear || undefined,
      paidYears: debouncedPaidYears || undefined,
      unpaidYears: debouncedUnpaidYears || undefined,
      page: pagination.page,
      sortBy,
      sortOrder,
    });

    // If cache already has data for this exact query, don't show full-screen loader flicker
    if (memoryMembersCache && memoryMembersCache.cacheKey === queryKey && members.length > 0) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await memberService.getMembers({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        status: status === 'All' ? undefined : status,
        gender: gender === 'All' ? undefined : gender,
        joinYear: joinYear ? Number(joinYear) : undefined,
        membershipYear: membershipYear ? Number(membershipYear) : undefined,
        paidYears: parseValidYears(debouncedPaidYears),
        unpaidYears: parseValidYears(debouncedUnpaidYears),
        unpaidMatchMode: 'all',
        sortBy,
        sortOrder,
      });

      setMembers(res.data);
      if (res.pagination) {
        setPagination(res.pagination);
      }
      // Update memory cache
      memoryMembersCache = {
        cacheKey: queryKey,
        members: res.data,
        pagination: res.pagination || pagination,
      };
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch members.');
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    status,
    gender,
    joinYear,
    membershipYear,
    debouncedPaidYears,
    debouncedUnpaidYears,
    sortBy,
    sortOrder,
    error,
  ]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Handle Sort Toggle
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('All');
    setGender('All');
    setJoinYear('');
    setMembershipYear('');
    setPaidYears('');
    setDebouncedPaidYears('');
    setUnpaidYears('');
    setDebouncedUnpaidYears('');
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchParams({}, { replace: true });
    memoryMembersCache = null;
  };

  // Soft delete execution
  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      setIsDeleting(true);
      await memberService.deleteMember(memberToDelete._id);
      success(`Member #${memberToDelete.serialNo} deleted successfully.`);
      setMemberToDelete(null);
      fetchMembers();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete member.');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters =
    Boolean(search) || status !== 'All' || gender !== 'All' || Boolean(joinYear) || Boolean(membershipYear) || Boolean(paidYears) || Boolean(unpaidYears);

  return (
    <div className="space-y-5">
      {/* Top Header Controls: Search, Filters, and Actions */}
      <div className="bg-white p-5 rounded-xl border border-[#E3E3E3] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#777777]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Serial, English/Bengali Name, Mobile, Bill ID..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#E3E3E3] rounded-lg text-[#171717] placeholder-[#777777] focus:outline-none focus:border-[#C92812]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="btn-secondary text-xs !py-2 !px-3"
            >
              <Printer className="w-4 h-4 text-[#C92812]" />
              <span>Print</span>
            </button>

            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="btn-secondary text-xs !py-2 !px-3"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#16845B]" />
              <span>Export Excel</span>
            </button>

            <Link
              to="/members/add"
              className="btn-primary text-xs !py-2 !px-3.5 shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </Link>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#E3E3E3]">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-[#555555]">Status:</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="text-xs bg-[#F5F5F5] border border-[#E3E3E3] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#C92812] text-[#171717] font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
              <option value="Died">Died</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-[#555555]">Gender:</label>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="text-xs bg-[#F5F5F5] border border-[#E3E3E3] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#C92812] text-[#171717] font-medium"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Join Year Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-[#555555]">Join Year:</label>
            <select
              value={joinYear}
              onChange={(e) => {
                setJoinYear(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="text-xs bg-[#F5F5F5] border border-[#E3E3E3] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#C92812] text-[#171717] font-medium"
            >
              <option value="">All Join Years</option>
              {availableJoinYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Membership Renewed Year Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-[#555555]">Renewal Year:</label>
            <input
              type="number"
              placeholder="e.g. 2026"
              value={membershipYear}
              onChange={(e) => {
                setMembershipYear(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-24 text-xs bg-[#F5F5F5] border border-[#E3E3E3] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#C92812] text-[#171717] font-medium"
            />
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#171717] hover:text-[#C92812] transition-colors ml-2"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Advanced Filters</span>
            {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#C62828] hover:underline ml-2"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Advanced Filters Section */}
        {showAdvancedFilters && (
          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-[#E3E3E3] bg-[#FAF9F7] p-3 rounded-md">
            {/* Paid Years */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-[#171717] w-20 shrink-0">Paid Years:</label>
              <input
                type="text"
                placeholder="e.g. 2023, 2024"
                value={paidYears}
                onChange={(e) => setPaidYears(e.target.value)}
                className="w-36 text-xs bg-white border border-[#E3E3E3] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#16845B] text-[#171717]"
              />
              <span className="text-[10px] text-[#777777] hidden sm:block">Paid ALL these years</span>
            </div>

            {/* Unpaid Years */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-[#171717] w-24 shrink-0">Unpaid Years:</label>
              <input
                type="text"
                placeholder="e.g. 2024, 2025"
                value={unpaidYears}
                onChange={(e) => setUnpaidYears(e.target.value)}
                className="w-36 text-xs bg-white border border-[#E3E3E3] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#C92812] text-[#171717]"
              />
              <span className="text-[10px] text-[#777777] hidden sm:block">Missed ALL these years</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Members Table */}
      <div className="bg-white rounded-xl border border-[#E3E3E3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F5F5F5] border-b border-[#E3E3E3] text-xs font-bold text-[#171717] uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort('serialNo')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-[#E3E3E3]/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Serial No.</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#777777]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('nameEnglish')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-[#E3E3E3]/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Member Name</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#777777]" />
                  </div>
                </th>
                <th className="px-4 py-3.5 text-[#171717]">Mobile No.</th>
                <th className="px-4 py-3.5 text-[#171717]">Gender</th>
                <th
                  onClick={() => handleSort('joinYear')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-[#E3E3E3]/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Join Year</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#777777]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('membershipStatus')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-[#E3E3E3]/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#777777]" />
                  </div>
                </th>
                <th className="px-4 py-3.5 text-[#171717]">Active Bill ID</th>
                <th className="px-4 py-3.5 text-right text-[#171717]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E3E3] text-[#171717]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#777777]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-7 h-7 text-[#C92812] animate-spin" />
                      <span className="text-xs font-medium">Loading member directory...</span>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="text-sm font-bold text-[#171717]">No Members Found</p>
                      <p className="text-xs text-[#555555]">
                        There are currently no members matching your search or filters.
                      </p>
                      {hasActiveFilters ? (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 btn-secondary text-xs !py-1.5 !px-3"
                        >
                          Clear all filters
                        </button>
                      ) : (
                        <Link
                          to="/members/add"
                          className="mt-2 btn-primary text-xs !py-1.5 !px-3.5 shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add First Member</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member._id}
                    className="hover:bg-[#FAF9F7] transition-colors group bg-white"
                  >
                    {/* Serial No */}
                    <td className="px-4 py-3.5 font-mono font-bold text-[#C92812]">
                      #{member.serialNo}
                    </td>

                    {/* Member Name (English + Bengali) */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#171717] text-sm">
                        <Link
                          to={`/members/${member._id}`}
                          state={{ from: location.pathname + location.search }}
                          className="hover:text-[#C92812] transition-colors"
                        >
                          {member.nameEnglish || member.nameBengali}
                        </Link>
                      </div>
                      <div className="text-xs text-[#555555] font-bengali">
                        {member.nameBengali}
                      </div>
                    </td>

                    {/* Mobile No */}
                    <td className="px-4 py-3.5 font-mono text-xs text-[#171717]">
                      {member.mobileNo || <span className="text-[#777777] italic">-</span>}
                    </td>

                    {/* Gender */}
                    <td className="px-4 py-3.5 text-xs text-[#555555] font-medium">
                      {member.gender || '-'}
                    </td>

                    {/* Join Year */}
                    <td className="px-4 py-3.5 text-xs text-[#171717] font-medium">
                      {member.joinYear || '-'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${member.membershipStatus === 'Active'
                            ? 'bg-[#E8F5EF] text-[#16845B]'
                            : member.membershipStatus === 'Pending'
                              ? 'bg-[#FFF4D6] text-[#C77A00]'
                              : member.membershipStatus === 'Died'
                                ? 'bg-[#E3E3E3] text-[#555555]'
                                : 'bg-[#FDECEC] text-[#C62828]'
                          }`}
                      >
                        <span className="text-[10px]">●</span>
                        <span>{member.membershipStatus || 'Inactive'}</span>
                      </span>
                    </td>

                    {/* Active Bill ID */}
                    <td className="px-4 py-3.5 font-mono text-xs text-[#171717]">
                      {member.activeBillId || (
                        <span className="text-[#777777] italic">None</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/members/${member._id}`}
                          state={{ from: location.pathname + location.search }}
                          title="View Profile"
                          className="p-1.5 rounded-md text-[#555555] hover:text-[#C92812] hover:bg-[#FAF9F7] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/members/${member._id}/edit`}
                          state={{ from: location.pathname + location.search }}
                          title="Edit Member"
                          className="p-1.5 rounded-md text-[#555555] hover:text-[#C92812] hover:bg-[#FAF9F7] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setMemberToRenew(member)}
                          title="Renew Membership"
                          className="p-1.5 rounded-md text-[#555555] hover:text-[#16845B] hover:bg-[#E8F5EF] transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setMemberToDelete(member)}
                          title="Delete Member"
                          className="p-1.5 rounded-md text-[#555555] hover:text-[#C62828] hover:bg-[#FDECEC] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Footer */}
        <div className="p-4 bg-white border-t border-[#E3E3E3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#555555]">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pagination.limit}
              onChange={(e) =>
                setPagination((prev) => ({
                  ...prev,
                  limit: Number(e.target.value),
                  page: 1,
                }))
              }
              className="bg-[#F5F5F5] border border-[#E3E3E3] rounded-md px-2 py-1 text-[#171717] font-medium focus:outline-none focus:border-[#C92812]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Showing {members.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1.5 rounded-md border border-[#E3E3E3] bg-white text-[#171717] hover:bg-[#F5F5F5] disabled:opacity-40 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[#171717] px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(prev.totalPages, prev.page + 1),
                }))
              }
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-1.5 rounded-md border border-[#E3E3E3] bg-white text-[#171717] hover:bg-[#F5F5F5] disabled:opacity-40 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(memberToDelete)}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleDeleteMember}
        member={memberToDelete}
        isLoading={isDeleting}
      />

      {/* Quick Renewal Modal */}
      <RenewalModal
        isOpen={Boolean(memberToRenew)}
        onClose={() => setMemberToRenew(null)}
        onSuccess={fetchMembers}
        member={memberToRenew}
      />

      {/* Print Configuration Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        members={members}
        totalFilteredCount={pagination.total}
      />

      {/* Excel Export Configuration Modal */}
      <ExcelExportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        currentFilteredMembers={members}
        currentFilters={{
          search: debouncedSearch,
          status,
          gender,
          joinYear,
          membershipYear,
          paidYears,
          unpaidYears,
        }}
      />
    </div>
  );
};
