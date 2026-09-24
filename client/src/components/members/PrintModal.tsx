import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Member } from '../../types';
import { Printer, Eye, Columns } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  totalFilteredCount: number;
}

export interface ColumnDef {
  key: keyof Member;
  label: string;
  defaultSelected: boolean;
  render?: (m: Member) => string;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'serialNo', label: 'Serial No.', defaultSelected: true },
  { key: 'nameBengali', label: 'Name (Bengali)', defaultSelected: true },
  { key: 'nameEnglish', label: 'Name (English)', defaultSelected: true },
  {
    key: 'dateOfBirth',
    label: 'Date of Birth',
    defaultSelected: true,
    render: (m) => (m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString('en-GB') : '-'),
  },
  { key: 'address', label: 'Address', defaultSelected: false },
  { key: 'mobileNo', label: 'Mobile No.', defaultSelected: true },
  { key: 'gender', label: 'Gender', defaultSelected: true },
  { key: 'joinYear', label: 'Join Year', defaultSelected: true },
  { key: 'membershipStatus', label: 'Status', defaultSelected: true },
  { key: 'activeBillId', label: 'Active Bill ID', defaultSelected: true, render: (m) => m.activeBillId || 'N/A' },
];

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  members,
  totalFilteredCount,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    ALL_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key)
  );
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedColumns(ALL_COLUMNS.map((c) => c.key));
    } else {
      setSelectedColumns(['serialNo', 'nameEnglish']); // keep minimal
    }
  };

  const handleTriggerPrint = () => {
    // Generate clean print window with custom CSS matching orientation and paper layout
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow popups to print member list.');
      return;
    }

const escapeHtml = (text: any): string => {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

    const visibleCols = ALL_COLUMNS.filter((c) => selectedColumns.includes(c.key));
    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const rowsHtml = members
      .map(
        (m) => `
        <tr>
          ${visibleCols
            .map((c) => {
              const rawVal = c.render ? c.render(m) : ((m as any)[c.key] ?? '');
              const safeVal = escapeHtml(rawVal);
              return `<td class="${c.key === 'nameBengali' ? 'bengali-text' : ''}">${safeVal}</td>`;
            })
            .join('')}
        </tr>`
      )
      .join('');

    const headersHtml = visibleCols.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>বর্ধমান মিউনিসিপ্যাল পেনশনার্স সমিতি - Member Directory</title>
          <meta charset="utf-8" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 ${orientation};
              margin: 10mm 10mm;
            }
            body {
              font-family: 'Noto Sans Bengali', 'Inter', Arial, sans-serif;
              color: #171717;
              background-color: #FFFFFF;
              margin: 0;
              padding: 0;
              font-size: 9.5pt;
              line-height: 1.35;
            }
            .bengali-text {
              font-family: 'Noto Sans Bengali', sans-serif;
            }
            .header-container {
              text-align: center;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .header-top {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              margin-bottom: 6px;
            }
            .header-logo {
              width: 44px;
              height: 44px;
              object-fit: contain;
            }
            .org-heading-bn {
              font-size: 16pt;
              font-weight: 700;
              color: #171717;
              margin: 0;
              line-height: 1.2;
            }
            .org-heading-en {
              font-size: 11pt;
              font-weight: 600;
              color: #555555;
              margin: 2px 0 0 0;
              letter-spacing: 0.3px;
            }
            .red-divider {
              width: 100%;
              height: 2px;
              background-color: #C92812;
              margin: 8px 0;
            }
            .meta-bar {
              display: flex;
              justify-content: space-between;
              font-size: 8.5pt;
              color: #555555;
              padding: 2px 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 6px;
              font-size: 9pt;
            }
            th, td {
              border: 1px solid #E3E3E3;
              padding: 5px 7px;
              text-align: left;
            }
            th {
              background-color: #F5F5F5;
              font-weight: 700;
              color: #171717;
              border-bottom: 1px solid #C92812;
            }
            tr:nth-child(even) {
              background-color: #FAF9F7;
            }
            .footer-container {
              margin-top: 14px;
              display: flex;
              justify-content: space-between;
              font-size: 8pt;
              color: #777777;
              border-top: 1px solid #E3E3E3;
              padding-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header-top">
              <img src="/logo.png" class="header-logo" alt="ABMPS Logo" />
              <div>
                <h1 class="org-heading-bn">বর্ধমান মিউনিসিপ্যাল পেনশনার্স সমিতি</h1>
                <p class="org-heading-en">Burdwan Municipal Pensioners Samiti</p>
              </div>
            </div>
            <div class="red-divider"></div>
            <div class="meta-bar">
              <span><strong>Official Member Registry</strong></span>
              <span>Year: ${currentYear}</span>
              <span>Generated: ${todayFormatted}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>${headersHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer-container">
            <div>Total Members: <strong>${members.length}</strong> record(s)</div>
            <div>Burdwan Municipal Pensioners Samiti • Official Administrative Record</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 600);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Member List" maxWidth="2xl">
      <div className="space-y-5">
        {/* Column selection section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#171717] uppercase flex items-center gap-1.5">
              <Columns className="w-3.5 h-3.5 text-[#C92812]" />
              <span>Select Columns to Print</span>
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
            {ALL_COLUMNS.map((col) => {
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

        {/* Print Configuration: Orientation & Paper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1.5">
              Orientation
            </label>
            <div className="flex items-center gap-4 text-xs font-medium text-[#171717]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="orientation"
                  value="portrait"
                  checked={orientation === 'portrait'}
                  onChange={() => setOrientation('portrait')}
                  className="text-[#C92812] focus:ring-[#C92812]"
                />
                <span>Portrait</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="orientation"
                  value="landscape"
                  checked={orientation === 'landscape'}
                  onChange={() => setOrientation('landscape')}
                  className="text-[#C92812] focus:ring-[#C92812]"
                />
                <span>Landscape (Recommended)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1.5">
              Paper Format
            </label>
            <span className="inline-block px-3 py-1 bg-[#F5F5F5] border border-[#E3E3E3] rounded-md text-xs font-medium text-[#171717]">
              A4 Standard
            </span>
          </div>
        </div>

        {/* Live print preview toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C92812] hover:underline"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showPreview ? 'Hide Preview' : 'Show Table Preview'}</span>
          </button>

          {showPreview && (
            <div className="mt-2.5 max-h-56 overflow-auto border border-[#E3E3E3] rounded-lg bg-white p-2">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F5F5] border-b border-[#E3E3E3]">
                    {ALL_COLUMNS.filter((c) => selectedColumns.includes(c.key)).map((c) => (
                      <th key={c.key} className="p-1.5 font-bold text-[#171717]">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.slice(0, 5).map((m) => (
                    <tr key={m._id} className="border-b border-[#E3E3E3]/60 hover:bg-[#FAF9F7]">
                      {ALL_COLUMNS.filter((c) => selectedColumns.includes(c.key)).map((c) => {
                        const val = c.render ? c.render(m) : ((m as any)[c.key] ?? '');
                        return (
                          <td key={c.key} className="p-1.5 text-[#171717]">
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-[#777777] text-center mt-2 italic">
                Showing {Math.min(5, members.length)} of {members.length} members for preview
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E3E3E3]">
          <div className="text-xs text-[#555555]">
            Printing <strong>{members.length}</strong> selected members
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs !py-2 !px-4"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTriggerPrint}
              disabled={selectedColumns.length === 0 || members.length === 0}
              className="btn-primary text-xs !py-2 !px-4 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Member List</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
