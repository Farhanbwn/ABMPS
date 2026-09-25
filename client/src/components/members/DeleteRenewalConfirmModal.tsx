import React from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Member, MembershipRenewal } from '../../types';

interface DeleteRenewalConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  renewal: MembershipRenewal | null;
  member: Member | null;
  isLoading: boolean;
}

export const DeleteRenewalConfirmModal: React.FC<DeleteRenewalConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  renewal,
  member,
  isLoading,
}) => {
  if (!renewal || !member) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Renewal Record" maxWidth="md">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FDECEC] flex items-center justify-center text-[#C62828]">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-[#171717] font-medium mb-2">
            Are you sure you want to delete this renewal record?
          </p>
          <div className="p-3 bg-[#FAF9F7] rounded-md border border-[#E3E3E3] text-sm mb-3 space-y-1">
            <p className="font-semibold text-[#171717]">{member.nameEnglish || member.nameBengali}</p>
            <div className="flex items-center gap-3 text-xs text-[#555555]">
              <span>Membership Year: <strong className="text-[#171717] font-mono">{renewal.membershipYear}</strong></span>
              <span>•</span>
              <span>Bill ID: <strong className="text-[#C92812] font-mono">{renewal.billId}</strong></span>
            </div>
            <p className="text-xs text-[#555555]">
              Renewal Date:{' '}
              {new Date(renewal.renewalDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <p className="text-xs text-[#777777]">
            This action will permanently remove this renewal entry. If this was the member&apos;s latest renewal, their active billing ID will automatically synchronize with their previous renewal.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#E3E3E3] pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="btn-secondary text-xs !py-2 !px-4"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="btn-danger text-xs !py-2 !px-4"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isLoading ? 'Deleting Record...' : 'Delete Renewal'}</span>
        </button>
      </div>
    </Modal>
  );
};
