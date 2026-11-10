import React from 'react';

interface OfficialLetterheadProps {
  className?: string;
  showDivider?: boolean;
  variant?: 'screen' | 'print' | 'both';
}

/**
 * Official ABMPS Letterhead Component
 * Displays the official organization branding exactly as per approved letterhead:
 * - Left: Official Logo (logo.png)
 * - Vertical separator line
 * - Line 1: বর্ধমান মিউনিসিপ্যাল পেনশনার্স সমিতি
 * - Line 2: (অনুমোদিত: - অল বেঙ্গল মিউনিসিপ্যাল পেনশনার্স সমিতি) in bold red with underline
 * - Line 3: বর্ধমান পৌরসভা অফিস, জি. টি. রোড, পূর্ব-বর্ধমান
 * - Bottom: Full-width red accent border
 */
export const OfficialLetterhead: React.FC<OfficialLetterheadProps> = ({
  className = '',
  showDivider = true,
}) => {
  return (
    <div className={`w-full select-none ${className}`}>
      <div className="flex items-center justify-center gap-4 sm:gap-6 py-2">
        {/* Left: Organization Logo */}
        <div className="flex-shrink-0">
          <img
            src="/logo.png"
            alt="ABMPS Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xs"
          />
        </div>

        {/* Vertical Divider Line */}
        <div className="w-[1.5px] h-14 sm:h-18 bg-[#171717] flex-shrink-0" />

        {/* Center / Right: Official Organization Headings */}
        <div className="text-center flex-1">
          {/* Main Title */}
          <h1 className="text-xl sm:text-2xl md:text-[25px] font-extrabold text-[#171717] tracking-tight font-bengali leading-tight">
            বর্ধমান মিউনিসিপ্যাল পেনশনার্স সমিতি
          </h1>

          {/* Affiliation / Approval Sub-Title in Red with Underline */}
          <p className="text-xs sm:text-sm md:text-[15px] font-bold text-[#C92812] font-bengali mt-1 leading-normal">
            <span className="underline decoration-[#C92812] decoration-1.5 underline-offset-3">
              (অনুমোদিত: - অল বেঙ্গল মিউনিসিপ্যাল পেনশনার্স সমিতি)
            </span>
          </p>

          {/* Official Registered Address */}
          <p className="text-xs sm:text-sm font-semibold text-[#171717] font-bengali mt-0.5 leading-normal">
            বর্ধমান পৌরসভা অফিস, জি. টি. রোড, পূর্ব-বর্ধমান
          </p>
        </div>
      </div>

      {/* Red Accent Horizontal Divider */}
      {showDivider && (
        <div className="w-full border-b-2 border-[#C92812] mt-2 mb-4" />
      )}
    </div>
  );
};

