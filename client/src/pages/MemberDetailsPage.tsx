import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { memberService, renewalService } from '../services/api';
import { Member, MembershipRenewal } from '../types';
import { useToast } from '../context/ToastContext';
import { RenewalModal } from '../components/members/RenewalModal';
import { EditRenewalModal } from '../components/members/EditRenewalModal';
import { DeleteRenewalConfirmModal } from '../components/members/DeleteRenewalConfirmModal';
import {
  ArrowLeft,
  Edit,
  Edit2,
  Trash2,
  RefreshCw,
  Printer,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const MemberDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [member, setMember] = useState<Member | null>(null);
  const [renewals, setRenewals] = useState<MembershipRenewal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState<boolean>(false);
  const [selectedRenewalForEdit, setSelectedRenewalForEdit] = useState<MembershipRenewal | null>(null);
  const [selectedRenewalForDelete, setSelectedRenewalForDelete] = useState<MembershipRenewal | null>(null);
  const [isDeletingRenewal, setIsDeletingRenewal] = useState<boolean>(false);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await memberService.getMemberById(id);
      setMember(res.data.member);
      setRenewals(res.data.renewals || []);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load member profile');
      navigate('/members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handlePrintProfile = () => {
    window.print();
  };

  const handleDeleteRenewalConfirm = async () => {
    if (!selectedRenewalForDelete) return;
    try {
      setIsDeletingRenewal(true);
      await renewalService.deleteRenewal(selectedRenewalForDelete._id);
      success('Renewal record deleted successfully.');
      setSelectedRenewalForDelete(null);
      await fetchDetails();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete renewal record.');
    } finally {
      setIsDeletingRenewal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-dark-muted">Loading member profile...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-border">
        <p className="text-sm text-danger font-semibold">Member profile not found.</p>
        <Link to="/members" className="mt-3 inline-block text-xs font-semibold text-primary underline">
          Back to Members
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/members"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#171717] hover:text-[#C92812] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Member Directory</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrintProfile}
            className="btn-secondary text-xs !py-1.5 !px-3"
          >
            <Printer className="w-4 h-4 text-[#C92812]" />
            <span>Print Profile</span>
          </button>
          <Link
            to={`/members/${member._id}/edit`}
            className="btn-secondary text-xs !py-1.5 !px-3"
          >
            <Edit className="w-4 h-4 text-[#555555]" />
            <span>Edit Member</span>
          </Link>
          <button
            onClick={() => setIsRenewalModalOpen(true)}
            className="btn-primary text-xs !py-1.5 !px-3.5 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Renew Membership</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-xl border border-[#E3E3E3] shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#C92812] text-white font-extrabold text-2xl flex items-center justify-center shadow-xs">
              {(member.nameEnglish || member.nameBengali || 'M').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#FBE9E6] text-[#C92812]">
                  Member #{member.serialNo}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    member.membershipStatus === 'Active'
                      ? 'bg-[#E8F5EF] text-[#16845B]'
                      : 'bg-[#FDECEC] text-[#C62828]'
                  }`}
                >
                  <span className="text-[10px]">●</span>
                  <span>{member.membershipStatus || 'Inactive'}</span>
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#171717] mt-1">
                {member.nameEnglish || member.nameBengali}
              </h1>
              <p className="text-base font-semibold text-[#555555] font-bengali">
                {member.nameBengali}
              </p>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E3E3E3]">
            <span className="text-xs font-semibold text-[#555555] uppercase">Active Bill ID</span>
            <p className="text-base font-mono font-bold text-[#171717] mt-0.5">
              {member.activeBillId || 'N/A'}
            </p>
            <p className="text-xs text-[#777777] mt-1">Joined Organization: {member.joinYear || 'N/A'}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-[#E3E3E3]">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#C92812] uppercase tracking-wider">
              Personal Information
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-[#E3E3E3]/60">
                <span className="text-[#555555] font-medium">English Name</span>
                <span className="font-semibold text-[#171717]">{member.nameEnglish || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E3E3E3]/60">
                <span className="text-[#555555] font-medium">Bengali Name</span>
                <span className="font-semibold text-[#171717] font-bengali">{member.nameBengali}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E3E3E3]/60">
                <span className="text-[#555555] font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#555555]" />
                  <span>Date of Birth</span>
                </span>
                <span className="font-semibold text-[#171717]">
                  {member.dateOfBirth
                    ? new Date(member.dateOfBirth).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E3E3E3]/60">
                <span className="text-[#555555] font-medium">Gender</span>
                <span className="font-semibold text-[#171717]">{member.gender || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E3E3E3]/60">
                <span className="text-[#555555] font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#555555]" />
                  <span>Mobile Number</span>
                </span>
                <span className="font-mono font-semibold text-[#171717]">{member.mobileNo || '-'}</span>
              </div>
              <div className="py-1.5">
                <span className="text-[#555555] font-medium flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#555555]" />
                  <span>Residential Address</span>
                </span>
                <p className="text-[#171717] font-medium pl-5">{member.address || '-'}</p>
              </div>
            </div>
          </div>

          {/* Membership & System Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#C92812] uppercase tracking-wider">
              Membership Information
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-[#E3E3E3]/60">
                <span className="text-[#555555] font-medium">Serial No. (Member ID)</span>
                <span className="font-mono font-bold text-[#C92812]">#{member.serialNo}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E3E3E3]/60">
                <span className="text-[#555555] font-medium">Year of Joining</span>
                <span className="font-semibold text-[#171717]">{member.joinYear || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E3E3E3]/60">
                <span className="text-[#555555] font-medium">Current Status</span>
                <span className="font-semibold text-[#171717]">{member.membershipStatus}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E3E3E3]/60">
                <span className="text-[#555555] font-medium">Active Bill ID</span>
                <span className="font-mono font-semibold text-[#171717]">
                  {member.activeBillId || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E3E3E3]/60">
                <span className="text-[#555555] font-medium">Total Renewals Recorded</span>
                <span className="font-semibold text-[#171717]">{renewals.length}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#555555] font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#555555]" />
                  <span>Registration Timestamp</span>
                </span>
                <span className="text-[#777777] text-xs">
                  {new Date(member.createdAt).toLocaleString('en-GB')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Renewal History Section */}
      <div className="bg-white rounded-xl border border-[#E3E3E3] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E3E3E3] flex items-center justify-between bg-[#F5F5F5]">
          <div>
            <h2 className="text-base font-bold text-[#171717] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C92812]" />
              <span>Membership Renewal History</span>
            </h2>
            <p className="text-xs text-[#555555]">
              Complete historical renewal records and past active bill identifiers for Member #{member.serialNo}
            </p>
          </div>
          <button
            onClick={() => setIsRenewalModalOpen(true)}
            className="no-print btn-primary text-xs !py-1.5 !px-3"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Add Renewal</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F5F5F5] border-b border-[#E3E3E3] text-xs font-bold text-[#171717] uppercase tracking-wider">
                <th className="px-5 py-3">Membership Year</th>
                <th className="px-5 py-3">Bill ID</th>
                <th className="px-5 py-3">Renewal Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Notes</th>
                <th className="px-5 py-3 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E3E3] text-[#171717]">
              {renewals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#777777]">
                    No historical renewals recorded for this member yet.
                  </td>
                </tr>
              ) : (
                renewals.map((r) => (
                  <tr key={r._id} className="hover:bg-[#FAF9F7] transition-colors bg-white">
                    <td className="px-5 py-3.5 font-bold text-[#171717] font-mono">
                      {r.membershipYear}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-[#C92812]">
                      {r.billId}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#555555]">
                      {new Date(r.renewalDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.status === 'Active'
                            ? 'bg-[#E8F5EF] text-[#16845B]'
                            : 'bg-[#FDECEC] text-[#C62828]'
                        }`}
                      >
                        <span className="text-[10px]">●</span>
                        <span>{r.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#555555] max-w-xs truncate">
                      {r.notes || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right no-print">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRenewalForEdit(r)}
                          className="p-1.5 rounded-md text-[#555555] hover:text-[#171717] hover:bg-[#F5F5F5] border border-transparent hover:border-[#E3E3E3] transition-colors"
                          title="Edit Renewal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRenewalForDelete(r)}
                          className="p-1.5 rounded-md text-[#C62828] hover:text-[#900000] hover:bg-[#FDECEC] border border-transparent hover:border-[#C62828]/20 transition-colors"
                          title="Delete Renewal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Modal */}
      <RenewalModal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        onSuccess={fetchDetails}
        member={member}
      />

      {/* Edit Renewal Modal */}
      <EditRenewalModal
        isOpen={Boolean(selectedRenewalForEdit)}
        onClose={() => setSelectedRenewalForEdit(null)}
        onSuccess={fetchDetails}
        renewal={selectedRenewalForEdit}
        member={member}
      />

      {/* Delete Renewal Modal */}
      <DeleteRenewalConfirmModal
        isOpen={Boolean(selectedRenewalForDelete)}
        onClose={() => setSelectedRenewalForDelete(null)}
        onConfirm={handleDeleteRenewalConfirm}
        renewal={selectedRenewalForDelete}
        member={member}
        isLoading={isDeletingRenewal}
      />
    </div>
  );
};
