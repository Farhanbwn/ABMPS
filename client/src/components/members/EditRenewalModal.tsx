import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Member, MembershipRenewal, MembershipStatusType } from '../../types';
import { renewalService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader2, Edit3 } from 'lucide-react';

interface EditRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  renewal: MembershipRenewal | null;
  member: Member | null;
}

export const EditRenewalModal: React.FC<EditRenewalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  renewal,
  member,
}) => {
  const { success, error } = useToast();

  const [membershipYear, setMembershipYear] = useState<number>(new Date().getFullYear());
  const [billId, setBillId] = useState<string>('');
  const [renewalDate, setRenewalDate] = useState<string>('');
  const [status, setStatus] = useState<MembershipStatusType>('Active');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (renewal && isOpen) {
      setMembershipYear(renewal.membershipYear);
      setBillId(renewal.billId || '');
      const formattedDate = renewal.renewalDate
        ? new Date(renewal.renewalDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setRenewalDate(formattedDate);
      setStatus(renewal.status || 'Active');
      setNotes(renewal.notes || '');
    }
  }, [renewal, isOpen]);

  if (!renewal || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!billId.trim()) {
      error('Please enter a valid Bill ID for this renewal.');
      return;
    }

    try {
      setIsSubmitting(true);
      await renewalService.updateRenewal(renewal._id, {
        membershipYear,
        billId: billId.trim(),
        renewalDate,
        status,
        notes: notes.trim(),
      });

      success('Renewal record updated successfully.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update renewal record.';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Membership Renewal Record" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Member preview card */}
        <div className="bg-[#FAF9F7] p-3.5 rounded-lg border border-[#E3E3E3]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-[#555555] uppercase font-semibold">Member</p>
              <h4 className="text-base font-bold text-[#171717]">{member.nameEnglish || member.nameBengali}</h4>
              <p className="text-xs text-[#555555] font-bengali">{member.nameBengali}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#555555] font-semibold uppercase">Member ID</span>
              <p className="text-sm font-bold text-[#C92812] font-mono">#{member.serialNo}</p>
            </div>
          </div>
        </div>

        {/* Membership Year */}
        <div>
          <label className="block text-xs font-semibold text-[#171717] uppercase mb-1">
            Membership Year *
          </label>
          <input
            type="number"
            min="1900"
            max="2100"
            required
            value={membershipYear}
            onChange={(e) => setMembershipYear(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md font-mono text-[#171717] focus:outline-none focus:border-[#C92812]"
          />
        </div>

        {/* Bill ID */}
        <div>
          <label className="block text-xs font-semibold text-[#171717] uppercase mb-1">
            Bill ID *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. BILL-2026-105"
            value={billId}
            onChange={(e) => setBillId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md font-mono text-[#171717] focus:outline-none focus:border-[#C92812]"
          />
        </div>

        {/* Renewal Date */}
        <div>
          <label className="block text-xs font-semibold text-[#171717] uppercase mb-1">
            Renewal Date *
          </label>
          <input
            type="date"
            required
            value={renewalDate}
            onChange={(e) => setRenewalDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812]"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-[#171717] uppercase mb-1">
            Membership Status *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MembershipStatusType)}
            className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812]"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#171717] uppercase mb-1">
            Notes / Remarks (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional renewal comments"
            className="w-full px-3 py-2 text-sm bg-white border border-[#E3E3E3] rounded-md text-[#171717] focus:outline-none focus:border-[#C92812] resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E3E3E3]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary text-xs !py-2 !px-4"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary text-xs !py-2 !px-4 shadow-xs"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Edit3 className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
