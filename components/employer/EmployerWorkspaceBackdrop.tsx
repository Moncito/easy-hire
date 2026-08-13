"use client";

/**
 * EasyHire Harbor workspace — bespoke canvas (not a generic SaaS gradient).
 * Navy blueprint grid + teal anchor dots + soft brand washes.
 */
export default function EmployerWorkspaceBackdrop() {
  return (
    <div aria-hidden className="employer-workspace-backdrop pointer-events-none absolute inset-0 overflow-hidden">
      <div className="employer-workspace-backdrop-base absolute inset-0 bg-mist" />

      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="eh-harbor-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M40 0H0V40"
              fill="none"
              stroke="#1E3A5F"
              strokeWidth="0.5"
              strokeOpacity="0.07"
            />
            <circle cx="0" cy="0" r="1.25" fill="#1F8073" fillOpacity="0.12" />
          </pattern>
          <pattern
            id="eh-harbor-diagonal"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="24"
              stroke="#1E3A5F"
              strokeWidth="0.5"
              strokeOpacity="0.025"
            />
          </pattern>
          <radialGradient id="eh-teal-wash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1F8073" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#1F8073" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="eh-navy-wash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.11" />
            <stop offset="100%" stopColor="#1E3A5F" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#eh-harbor-grid)" />
        <rect width="100%" height="100%" fill="url(#eh-harbor-diagonal)" />
      </svg>

      {/* Brand washes — anchored, not a floating blob gradient */}
      <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,#1E3A5F_0%,transparent_68%)] opacity-[0.07]" />
      <div className="absolute -right-16 bottom-0 h-[380px] w-[480px] rounded-full bg-[radial-gradient(circle,#1F8073_0%,transparent_70%)] opacity-[0.08]" />

      {/* Teal structural accent — echoes sidebar active state */}
      <div className="absolute left-0 top-[18%] h-32 w-[3px] rounded-r-full bg-teal/25" />
      <div className="absolute bottom-[22%] right-0 h-24 w-[2px] rounded-l-full bg-navy/15" />

      {/* Film grain */}
      <div className="employer-workspace-grain absolute inset-0 opacity-[0.035]" />
    </div>
  );
}
