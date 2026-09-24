import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { DashboardStats } from '../types';
import {
  Users,
  UserCheck,
  UserX,
  CheckCircle,
  Clock,
  UserPlus,
  RefreshCw,
  ArrowRight,
  Loader2,
  Calendar,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await dashboardService.getStats();
      setStats(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-[#C92812] animate-spin" />
        <p className="text-sm font-medium text-[#777777]">Loading dashboard statistics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-white rounded-lg border border-[#E3E3E3] text-center">
        <p className="text-sm font-semibold text-[#C62828] mb-3">{error || 'Could not load stats.'}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-[#C92812] text-white text-xs font-semibold rounded-md hover:bg-[#A91F0D] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Members',
      count: stats.totalMembers,
      icon: Users,
      lightBg: 'bg-[#FBE9E6]',
      textColor: 'text-[#C92812]',
    },
    {
      title: 'Active Members',
      count: stats.activeMembers,
      icon: UserCheck,
      lightBg: 'bg-[#E8F5EF]',
      textColor: 'text-[#16845B]',
    },
    {
      title: 'Inactive Members',
      count: stats.inactiveMembers,
      icon: UserX,
      lightBg: 'bg-[#FDECEC]',
      textColor: 'text-[#C62828]',
    },
    {
      title: `Renewed in ${stats.currentYear}`,
      count: stats.renewedThisYear,
      icon: CheckCircle,
      lightBg: 'bg-[#FBE9E6]',
      textColor: 'text-[#C92812]',
    },
    {
      title: `Pending Renewal (${stats.currentYear})`,
      count: stats.pendingRenewal,
      icon: Clock,
      lightBg: 'bg-[#FFF4D6]',
      textColor: 'text-[#C77A00]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white p-6 rounded-xl border border-[#E3E3E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C92812] uppercase tracking-wide">
            <Calendar className="w-3.5 h-3.5" />
            <span>Membership Year: {stats.currentYear}</span>
          </div>
          <h2 className="text-xl font-bold text-[#171717] mt-1 font-bengali">
            বর্ধমান মিউনিসিপ্যাল পেনশনার্স সমিতি — Operations
          </h2>
          <p className="text-xs text-[#555555]">
            Administrative portal overview, real-time member records, and renewal status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/members/add"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#C92812] text-white text-xs font-semibold hover:bg-[#A91F0D] transition-colors shadow-2xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </Link>
          <Link
            to="/renewals"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white border border-[#E3E3E3] text-[#171717] text-xs font-semibold hover:bg-[#F5F5F5] transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-[#C92812]" />
            <span>Renewals</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-[#E3E3E3] shadow-2xs hover:border-[#CCCCCC] transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#555555] uppercase tracking-wide">
                  {card.title}
                </span>
                <div className={`p-2 rounded-md ${card.lightBg}`}>
                  <Icon className={`w-4 h-4 ${card.textColor}`} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[#171717] tracking-tight">
                  {card.count.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tables: Recently Added & Recently Renewed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added Members */}
        <div className="bg-white rounded-xl border border-[#E3E3E3] shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E3E3E3] flex items-center justify-between bg-[#F5F5F5]">
            <div>
              <h3 className="text-sm font-bold text-[#171717]">Recently Registered Members</h3>
              <p className="text-[11px] text-[#555555]">Latest member records added to registry</p>
            </div>
            <Link
              to="/members"
              className="text-xs font-semibold text-[#C92812] hover:text-[#A91F0D] inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#E3E3E3]">
            {stats.recentMembers && stats.recentMembers.length > 0 ? (
              stats.recentMembers.map((m) => (
                <div
                  key={m._id}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#FAF9F7] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#FBE9E6] text-[#C92812] border border-[#C92812]/20">
                      #{m.serialNo}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-dark leading-snug">
                        {m.nameEnglish || m.nameBengali}
                      </p>
                      <p className="text-xs text-[#777777] font-bengali">{m.nameBengali}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        m.membershipStatus === 'Active'
                          ? 'bg-[#E8F5EF] text-[#16845B]'
                          : 'bg-[#FDECEC] text-[#C62828]'
                      }`}
                    >
                      ● {m.membershipStatus}
                    </span>
                    <p className="text-[10px] text-[#777777] mt-0.5">
                      {m.joinYear ? `Joined ${m.joinYear}` : 'Year N/A'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[#777777]">
                No recent members found.
              </div>
            )}
          </div>
        </div>

        {/* Recently Renewed Members */}
        <div className="bg-white rounded-xl border border-[#E3E3E3] shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E3E3E3] flex items-center justify-between bg-[#F5F5F5]">
            <div>
              <h3 className="text-sm font-bold text-[#171717]">Recent Membership Renewals</h3>
              <p className="text-[11px] text-[#555555]">Latest renewal transactions</p>
            </div>
            <Link
              to="/renewals"
              className="text-xs font-semibold text-[#C92812] hover:text-[#A91F0D] inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#E3E3E3]">
            {stats.recentRenewals && stats.recentRenewals.length > 0 ? (
              stats.recentRenewals.map((r) => (
                <div
                  key={r._id}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#FAF9F7] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#FAF9F7] text-[#171717] border border-[#E3E3E3]">
                      #{r.serialNo}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#171717] leading-snug">
                        {r.memberId?.nameEnglish || r.memberId?.nameBengali || `Member #${r.serialNo}`}
                      </p>
                      <p className="text-xs font-mono text-[#777777]">{r.billId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#171717]">Year {r.membershipYear}</span>
                    <p className="text-[10px] text-[#777777]">
                      {new Date(r.renewalDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[#777777]">
                No renewal records found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
