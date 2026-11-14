import { Member, MembershipRenewal } from '../types';

/**
 * Escapes HTML characters to prevent XSS during print document generation.
 */
function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates and triggers the official printed / downloadable profile document for any member.
 * Formatted with the official ABMPS letterhead, biographical details, renewal history,
 * and administrative verification signatures.
 */
export function printMemberProfile(member: Member, renewals: MembershipRenewal[] = []): void {
  // Opening with window.open('', '_blank') without dimensional specs ensures the browser opens in a full TAB instead of a small window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // If popups are blocked, alert the user and trigger direct window.print()
    alert('Pop-up blocked. Please allow popups or use your browser print (Ctrl+P).');
    window.print();
    return;
  }

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const dobFormatted = member.dateOfBirth
    ? new Date(member.dateOfBirth).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Not Recorded';

  const regDateFormatted = member.createdAt
    ? new Date(member.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  // Renewal rows HTML
  const renewalRowsHtml =
    renewals.length === 0
      ? `<tr><td colspan="5" class="empty-renewals">কোনো পুনর্নবীকরণ নথিভুক্ত নেই (No renewal records recorded yet)</td></tr>`
      : renewals
          .map(
            (r) => `
        <tr>
          <td class="font-mono font-bold text-center">${escapeHtml(r.membershipYear)}</td>
          <td class="font-mono font-bold text-primary">${escapeHtml(r.billId || '-')}</td>
          <td>${new Date(r.renewalDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}</td>
          <td class="text-center"><span class="badge ${r.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${escapeHtml(r.status)}</span></td>
          <td class="text-muted">${escapeHtml(r.notes || '-')}</td>
        </tr>
      `
          )
          .join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <title>ABMPS-Member-Profile-${escapeHtml(member.serialNo)}.pdf</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 14mm 10mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Inter', 'Noto Sans Bengali', -apple-system, sans-serif;
      color: #171717;
      background: #525659;
      margin: 0;
      padding: 24px 16px;
      font-size: 9.5pt;
      line-height: 1.4;
      min-height: 100vh;
    }
    .profile-sheet {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 12mm 15mm;
      box-shadow: 0 4px 24px rgba(0,0,0,0.25);
      border-radius: 4px;
    }
    .tab-toolbar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1E232A;
      color: #FFFFFF;
      padding: 10px 18px;
      border-radius: 6px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      font-size: 9.5pt;
    }
    .toolbar-info {
      font-weight: 500;
      color: #E3E3E3;
    }
    .toolbar-btns {
      display: flex;
      gap: 10px;
    }
    .btn-print {
      background: #C92812;
      color: #FFFFFF;
      border: none;
      padding: 6px 14px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      font-size: 9pt;
      transition: background 0.15s;
    }
    .btn-print:hover {
      background: #A91F0D;
    }
    .btn-close {
      background: #3A3F47;
      color: #FFFFFF;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      font-size: 9pt;
      transition: background 0.15s;
    }
    .btn-close:hover {
      background: #4F5560;
    }

    @media print {
      body {
        background: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .profile-sheet {
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
        margin: 0 !important;
      }
      .no-print {
        display: none !important;
      }
    }

    /* Official Letterhead Styling matching physical letterhead */
    .letterhead-container {
      width: 100%;
      margin-bottom: 10px;
    }
    .letterhead-top {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding-bottom: 4px;
    }
    .letterhead-logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .letterhead-divider-vertical {
      width: 2px;
      height: 66px;
      background-color: #171717;
      flex-shrink: 0;
    }
    .letterhead-text {
      text-align: center;
      flex: 1;
    }
    .letterhead-title {
      font-family: 'Noto Sans Bengali', sans-serif;
      font-size: 21pt;
      font-weight: 800;
      color: #171717;
      margin: 0;
      line-height: 1.15;
      letter-spacing: -0.2px;
    }
    .letterhead-subtitle {
      font-family: 'Noto Sans Bengali', sans-serif;
      font-size: 11pt;
      font-weight: 700;
      color: #C92812;
      margin-top: 3px;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .letterhead-address {
      font-family: 'Noto Sans Bengali', sans-serif;
      font-size: 9.5pt;
      font-weight: 600;
      color: #171717;
      margin-top: 2px;
    }
    .letterhead-divider-horizontal {
      width: 100%;
      border-bottom: 2.5px solid #C92812;
      margin-top: 8px;
      margin-bottom: 12px;
    }

    /* Record Heading / Meta Bar */
    .record-meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #FAF9F7;
      border: 1px solid #E3E3E3;
      border-radius: 4px;
      padding: 6px 12px;
      margin-bottom: 12px;
      font-size: 9pt;
    }
    .record-title {
      font-weight: 700;
      color: #C92812;
      font-size: 10pt;
      letter-spacing: 0.2px;
    }
    .record-date {
      color: #555555;
    }

    /* Profile Card & Tables */
    .section-title {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #C92812;
      border-bottom: 1.5px solid #E3E3E3;
      padding-bottom: 4px;
      margin-top: 10px;
      margin-bottom: 8px;
    }
    table.info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 9pt;
    }
    table.info-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #EFEFEF;
      vertical-align: top;
    }
    table.info-table td.label-col {
      width: 25%;
      font-weight: 600;
      color: #555555;
      background: #FAFAFA;
      border-right: 1px solid #EFEFEF;
    }
    table.info-table td.value-col {
      width: 25%;
      font-weight: 500;
      color: #171717;
    }

    /* Renewal Table */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-top: 6px;
      margin-bottom: 16px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #E3E3E3;
      padding: 5px 8px;
      text-align: left;
    }
    table.data-table th {
      background: #F5F5F5;
      font-weight: 700;
      color: #171717;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.3px;
    }
    .empty-renewals {
      text-align: center;
      color: #777777;
      padding: 12px;
      font-style: italic;
    }

    /* Helper Utilities */
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .font-bold { font-weight: 700; }
    .text-center { text-align: center; }
    .text-primary { color: #C92812; }
    .text-muted { color: #666666; font-size: 8pt; }
    .badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 9999px;
      font-size: 7.5pt;
      font-weight: 600;
    }
    .badge-active { background: #E8F5EF; color: #16845B; border: 1px solid #16845B/30; }
    .badge-inactive { background: #FDECEC; color: #C62828; border: 1px solid #C62828/30; }

    /* Print Footer */
    .print-footer {
      margin-top: 25px;
      padding-top: 6px;
      border-top: 1px solid #E3E3E3;
      font-size: 7.5pt;
      color: #777777;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <!-- Floating action toolbar inside the tab view -->
  <div class="no-print tab-toolbar">
    <div class="toolbar-info">
      📄 <strong>Member Profile Document</strong> • #${escapeHtml(member.serialNo)} (${escapeHtml(member.nameEnglish || member.nameBengali)})
    </div>
    <div class="toolbar-btns">
      <button onclick="window.print()" class="btn-print" title="Save as PDF or Print">
        🖨️ Print / Save as PDF
      </button>
      <button onclick="window.close()" class="btn-close" title="Close this tab">
        ✕ Close Tab
      </button>
    </div>
  </div>

  <div class="profile-sheet">
    <!-- Official Letterhead Header -->
    <div class="letterhead-container">
      <div class="letterhead-top">
        <img src="/logo.png" class="letterhead-logo" alt="ABMPS Logo" />
        <div class="letterhead-divider-vertical"></div>
        <div class="letterhead-text">
          <h1 class="letterhead-title">বর্ধমান মিউনিসিপ্যাল পেনশনার্স সমিতি</h1>
          <div class="letterhead-subtitle">
            <u>(অনুমোদিত: - অল বেঙ্গল মিউনিসিপ্যাল পেনশনার্স সমিতি)</u>
          </div>
          <div class="letterhead-address">
            বর্ধমান পৌরসভা অফিস, জি. টি. রোড, পূর্ব-বর্ধমান
          </div>
        </div>
      </div>
      <div class="letterhead-divider-horizontal"></div>
    </div>

    <!-- Official Meta Bar -->
    <div class="record-meta-bar">
      <div class="record-title">সদস্য পরিচয় ও নথিপত্র বিবরণী / MEMBER PROFILE RECORD</div>
      <div class="record-date">Printed On: <strong>${todayFormatted}</strong></div>
    </div>

    <!-- Personal & Biographical Details -->
    <div class="section-title">ব্যক্তিগত ও পরিচিতি সংক্রান্ত তথ্য (Personal Information)</div>
    <table class="info-table">
      <tr>
        <td class="label-col">Member Serial No:</td>
        <td class="value-col font-mono font-bold text-primary">#${escapeHtml(member.serialNo)}</td>
        <td class="label-col">Active Bill ID:</td>
        <td class="value-col font-mono font-bold">${escapeHtml(member.activeBillId || 'N/A')}</td>
      </tr>
      <tr>
        <td class="label-col">Name (English):</td>
        <td class="value-col font-bold">${escapeHtml(member.nameEnglish || '-')}</td>
        <td class="label-col">নাম (বাংলায়):</td>
        <td class="value-col font-bold" style="font-family: 'Noto Sans Bengali', sans-serif; font-size: 10pt;">${escapeHtml(member.nameBengali)}</td>
      </tr>
      <tr>
        <td class="label-col">Date of Birth:</td>
        <td class="value-col">${escapeHtml(dobFormatted)}</td>
        <td class="label-col">Gender (লিঙ্গ):</td>
        <td class="value-col">${escapeHtml(member.gender || '-')}</td>
      </tr>
      <tr>
        <td class="label-col">Mobile Number:</td>
        <td class="value-col font-mono font-bold">${escapeHtml(member.mobileNo || '-')}</td>
        <td class="label-col">Joining Year:</td>
        <td class="value-col font-mono">${escapeHtml(member.joinYear || 'N/A')}</td>
      </tr>
      <tr>
        <td class="label-col">Membership Status:</td>
        <td class="value-col font-bold">${escapeHtml(member.membershipStatus || 'Inactive')}</td>
        <td class="label-col">Enrolled Since:</td>
        <td class="value-col text-muted">${escapeHtml(regDateFormatted)}</td>
      </tr>
      <tr>
        <td class="label-col">Residential Address:</td>
        <td class="value-col" colspan="3" style="font-family: 'Noto Sans Bengali', sans-serif;">${escapeHtml(member.address || '-')}</td>
      </tr>
    </table>

    <!-- Membership Renewal History -->
    <div class="section-title">বার্ষিক সদস্যপদ পুনর্নবীকরণ বিবরণী (Renewal History)</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 15%; text-align: center;">Renewal Year</th>
          <th style="width: 25%;">Bill / Receipt ID</th>
          <th style="width: 20%;">Payment Date</th>
          <th style="width: 15%; text-align: center;">Status</th>
          <th style="width: 25%;">Remarks / Notes</th>
        </tr>
      </thead>
      <tbody>
        ${renewalRowsHtml}
      </tbody>
    </table>

    <!-- Official Document Footer -->
    <div class="print-footer">
      <div>বর্ধমান মিউনিসিপ্যাল পেনশনার্স সমিতি • প্রশাসনিক নথি</div>
      <div>Burdwan Municipal Pensioners Samiti • Official Record</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.focus();
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

