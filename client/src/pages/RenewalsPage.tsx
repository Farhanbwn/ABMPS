import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { renewalService } from '../services/api';
import { MembershipRenewal, PaginationMeta } from '../types';
import { useToast } from '../context/ToastContext';
import {
  Search,
  FilterX,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export const RenewalsPage: React.FC = () => {
  const { error } = useToast();
  const currentYear = new Date().getFullYear();

  const [renewals, setRenewals] = useState<MembershipRenewal[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [status, setStatus] = useState<string>('All');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchRenewals = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await renewalService.getAllRenewals({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        year: year ? Number(year) : undefined,
        status: status === 'All' ? undefined : status,
      });

      setRenewals(res.data);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch renewals.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, year, status, error]);

  useEffect(() => {
    fetchRenewals();
  }, [fetchRenewals]);

  const handleResetFilters = () => {
    setSearch('');
    setYear('');
    setStatus('All');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const yearsList = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-5">
      {/* Top Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-[#E3E3E3] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-[#171717] flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#C92812]" />
              <span>Organization Membership Renewals</span>
            </h1>
            <p className="text-xs text-[#555555]">
              Audit and track all historical and current annual membership renewal records.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#777777]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Bill ID or Member Serial..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E3E3E3] rounded-lg text-[#171717] placeholder-[#777777] focus:outline-none focus:border-[#C92812]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#E3E3E3]">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-[#555555] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Renewal Year:</span>
            </label>
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="text-xs bg-[#F5F5F5] border border-[#E3E3E3] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#C92812] text-[#171717] font-medium"
            >
              <option value="">All Renewal Years</option>
              {yearsList.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

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

          {(Boolean(search) || Boolean(year) || status !== 'All') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#C62828] hover:underline ml-auto"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Renewals Table */}
      <div className="bg-white rounded-xl border border-[#E3E3E3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F5F5F5] border-b border-[#E3E3E3] text-xs font-bold text-[#171717] uppercase tracking-wider">
                <th className="px-4 py-3.5">Member</th>
                <th className="px-4 py-3.5">Membership Year</th>
                <th className="px-4 py-3.5">Bill ID</th>
                <th className="px-4 py-3.5">Renewal Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Notes</th>
                <th className="px-4 py-3.5 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E3E3] text-[#171717]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#777777]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-7 h-7 text-[#C92812] animate-spin" />
                      <span className="text-xs font-medium">Loading renewal records...</span>
                    </div>
                  </td>
                </tr>
              ) : renewals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#777777]">
                    <p className="text-sm font-semibold text-[#171717]">No Renewal Records Found</p>
                    <p className="text-xs mt-1">Try adjusting your search criteria or year filter.</p>
                  </td>
                </tr>
              ) : (
                renewals.map((r) => {
                  const memberObj = typeof r.memberId === 'object' ? r.memberId : null;
                  const memberIdStr = memberObj?._id || (r.memberId as string);

                  return (
                    <tr key={r._id} className="hover:bg-[#FAF9F7] transition-colors bg-white">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#FBE9E6] text-[#C92812]">
                            #{r.serialNo}
                          </span>
                          <div>
                            <p className="font-semibold text-[#171717] text-sm">
                              {memberObj?.nameEnglish || `Member #${r.serialNo}`}
                            </p>
                            {memberObj?.nameBengali && (
                              <p className="text-xs text-[#555555] font-bengali">
                                {memberObj.nameBengali}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold font-mono text-[#171717]">
                        {r.membershipYear}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-semibold text-[#C92812]">
                        {r.billId}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-[#555555]">
                        {new Date(r.renewalDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            r.status === 'Active'
                              ? 'bg-[#E8F5EF] text-[#16845B]'
                              : 'bg-[#FDECEC] text-[#C62828]'
                          }`}
                        >
                          <span className="text-[10px]">●</span>
                          <span>{r.status}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-[#555555] max-w-xs truncate">
                        {r.notes || '-'}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {memberIdStr && (
                          <Link
                            to={`/members/${memberIdStr}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#C92812] hover:text-[#A91F0D]"
                            title="View Member Profile"
                          >
                            <span>Profile</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
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
              Showing {renewals.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1.5 rounded-md border border-[#E3E3E3] bg-white text-[#171717] hover:bg-[#F5F5F5] disabled:opacity-40 transition-colors"
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
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
