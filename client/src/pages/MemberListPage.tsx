import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

export const MemberListPage: React.FC = () => {
  const { success, error } = useToast();

  // Members & Pagination state
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('All');
  const [gender, setGender] = useState<string>('All');
  const [joinYear, setJoinYear] = useState<string>('');
  const [membershipYear, setMembershipYear] = useState<string>('');
  const [availableJoinYears, setAvailableJoinYears] = useState<number[]>([]);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('serialNo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberToRenew, setMemberToRenew] = useState<Member | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load distinct join years for filter
  useEffect(() => {
    memberService
      .getJoinYears()
      .then((res) => setAvailableJoinYears(res.data.years || []))
      .catch((err) => console.error('Failed to load join years:', err));
  }, []);

  // Fetch members from server
  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await memberService.getMembers({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        status: status === 'All' ? undefined : status,
        gender: gender === 'All' ? undefined : gender,
        joinYear: joinYear ? Number(joinYear) : undefined,
        membershipYear: membershipYear ? Number(membershipYear) : undefined,
        sortBy,
        sortOrder,
      });

      setMembers(res.data);
      if (res.pagination) {
        setPagination(res.pagination);
      }
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
    setStatus('All');
    setGender('All');
    setJoinYear('');
    setMembershipYear('');
    setPagination((prev) => ({ ...prev, page: 1 }));
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
    Boolean(search) || status !== 'All' || gender !== 'All' || Boolean(joinYear) || Boolean(membershipYear);

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

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#C62828] hover:underline ml-auto"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          member.membershipStatus === 'Active'
                            ? 'bg-[#E8F5EF] text-[#16845B]'
                            : member.membershipStatus === 'Pending'
                            ? 'bg-[#FFF4D6] text-[#C77A00]'
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
                          title="View Profile"
                          className="p-1.5 rounded-md text-[#555555] hover:text-[#C92812] hover:bg-[#FAF9F7] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/members/${member._id}/edit`}
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
        }}
      />
    </div>
  );
};
