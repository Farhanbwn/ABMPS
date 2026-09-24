import React from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Member } from '../../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  member: Member | null;
  isLoading: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  member,
  isLoading,
}) => {
  if (!member) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Member Record" maxWidth="md">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FDECEC] flex items-center justify-center text-[#C62828]">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-[#171717] font-medium mb-2">
            Are you sure you want to delete this member?
          </p>
          <div className="p-3 bg-[#FAF9F7] rounded-md border border-[#E3E3E3] text-sm mb-3">
            <p className="font-semibold text-[#171717]">{member.nameEnglish || member.nameBengali}</p>
            <p className="text-xs text-[#555555] font-bengali">{member.nameBengali}</p>
            <p className="text-xs text-[#C92812] font-semibold mt-1">Member ID / Serial No: #{member.serialNo}</p>
          </div>
          <p className="text-xs text-[#777777]">
            This member will be moved to the deleted records and hidden from the active member directory.
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
          <span>{isLoading ? 'Deleting Member...' : 'Delete Member'}</span>
        </button>
      </div>
    </Modal>
  );
};
