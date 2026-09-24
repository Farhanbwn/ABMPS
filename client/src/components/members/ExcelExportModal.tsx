import React, { useState } from 'react';
import writeXlsxFile from 'write-excel-file/browser';
import { Modal } from '../common/Modal';
import { Member } from '../../types';
import { memberService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Download, Loader2 } from 'lucide-react';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilteredMembers: Member[];
  currentFilters?: any;
}

interface ExportColumnDef {
  key: keyof Member;
  label: string;
  defaultSelected: boolean;
  format?: (m: Member) => any;
}

const EXCEL_COLUMNS: ExportColumnDef[] = [
  { key: 'serialNo', label: 'Serial No.', defaultSelected: true },
  { key: 'nameBengali', label: 'Name (Bengali)', defaultSelected: true },
  { key: 'nameEnglish', label: 'Name (English)', defaultSelected: true },
  {
    key: 'dateOfBirth',
    label: 'Date of Birth',
    defaultSelected: true,
    format: (m) => (m.dateOfBirth ? new Date(m.dateOfBirth).toISOString().split('T')[0] : ''),
  },
  { key: 'address', label: 'Address', defaultSelected: true },
  { key: 'mobileNo', label: 'Mobile No.', defaultSelected: true },
  { key: 'gender', label: 'Gender', defaultSelected: true },
  { key: 'joinYear', label: 'Join Year', defaultSelected: true },
  { key: 'membershipStatus', label: 'Membership Status', defaultSelected: true },
  { key: 'activeBillId', label: 'Active Bill ID', defaultSelected: true, format: (m) => m.activeBillId || 'N/A' },
];

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  currentFilteredMembers,
  currentFilters,
}) => {
  const { success, error } = useToast();
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXCEL_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key)
  );
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedColumns(EXCEL_COLUMNS.map((c) => c.key));
    } else {
      setSelectedColumns(['serialNo', 'nameEnglish']);
    }
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      error('Please select at least one column to export.');
      return;
    }

    try {
      setIsExporting(true);
      let dataToExport: Member[] = [];

      if (exportScope === 'current') {
        dataToExport = currentFilteredMembers;
      } else {
        // Fetch all members from database without page limits
        const res = await memberService.getAllFilteredMembers({
          // Clear filters for all
        });
        dataToExport = res.data;
      }

      if (!dataToExport || dataToExport.length === 0) {
        error('No member records found to export.');
        return;
      }

      const activeCols = EXCEL_COLUMNS.filter((c) => selectedColumns.includes(c.key));

      // Build structured rows for write-excel-file
      const headerRow = activeCols.map((col) => ({
        value: col.label,
        fontWeight: 'bold' as const,
      }));

      const dataRows = dataToExport.map((member) => {
        return activeCols.map((col) => {
          let val = col.format ? col.format(member) : (member as any)[col.key] ?? '';
          if (typeof val === 'number') {
            return { type: Number, value: val };
          }
          return { type: String, value: String(val ?? '') };
        });
      });

      // Generate filename with current date: Members_YYYY-MM-DD.xlsx
      const today = new Date().toISOString().split('T')[0];
      const filename = `Members_${today}.xlsx`;

      await writeXlsxFile([headerRow, ...dataRows], {
        fileName: filename,
      });

      success('Excel exported successfully.');
      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      error('Failed to export Excel file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Members to Excel" maxWidth="xl">
      <div className="space-y-5">
        {/* Export Scope Selector */}
        <div>
          <label className="block text-xs font-bold text-[#171717] uppercase mb-2">
            Records to Export
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                exportScope === 'current'
                  ? 'border-[#C92812] bg-[#FBE9E6]/50'
                  : 'border-[#E3E3E3] bg-white hover:bg-[#FAF9F7]'
              }`}
            >
              <input
                type="radio"
                name="exportScope"
                value="current"
                checked={exportScope === 'current'}
                onChange={() => setExportScope('current')}
                className="mt-0.5 text-[#C92812] focus:ring-[#C92812]"
              />
              <div>
                <p className="text-xs font-bold text-[#171717]">Current Results</p>
                <p className="text-[11px] text-[#555555]">
                  Export members matching current search and filters ({currentFilteredMembers.length} records)
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                exportScope === 'all'
                  ? 'border-[#C92812] bg-[#FBE9E6]/50'
                  : 'border-[#E3E3E3] bg-white hover:bg-[#FAF9F7]'
              }`}
            >
              <input
                type="radio"
                name="exportScope"
                value="all"
                checked={exportScope === 'all'}
                onChange={() => setExportScope('all')}
                className="mt-0.5 text-[#C92812] focus:ring-[#C92812]"
              />
              <div>
                <p className="text-xs font-bold text-[#171717]">All Members</p>
                <p className="text-[11px] text-[#555555]">
                  Export complete active directory database without filters
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Column Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#171717] uppercase">
              Select Columns to Export
            </label>
            <div className="space-x-2 text-xs">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-[#C92812] hover:underline font-semibold"
              >
                Select All
              </button>
              <span className="text-[#E3E3E3]">|</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-[#777777] hover:underline font-medium"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-[#FAF9F7] rounded-lg border border-[#E3E3E3]">
            {EXCEL_COLUMNS.map((col) => {
              const isChecked = selectedColumns.includes(col.key);
              return (
                <label
                  key={col.key}
                  className="flex items-center gap-2.5 text-xs text-[#171717] font-medium cursor-pointer hover:text-[#C92812] transition-colors select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColumn(col.key)}
                    className="w-4 h-4 rounded text-[#C92812] focus:ring-[#C92812] border-[#E3E3E3]"
                  />
                  <span>{col.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E3E3E3]">
          <p className="text-xs text-[#555555]">
            Format: <strong>.xlsx</strong> (UTF-8 Bengali Unicode compatible)
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="btn-secondary text-xs !py-2 !px-4"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || selectedColumns.length === 0}
              className="btn-primary text-xs !py-2 !px-4 shadow-xs"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExporting ? 'Exporting...' : 'Export to Excel'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
