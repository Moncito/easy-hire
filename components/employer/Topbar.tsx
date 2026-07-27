type Props = {
  companyName: string;
  verifiedStatus: string;
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-marigold/10 border border-marigold/20 text-[#8a5a10]",
  APPROVED: "bg-teal/8 border border-teal/20 text-teal",
  REJECTED: "bg-ember/8 border border-ember/20 text-ember",
};

export default function Topbar({ companyName, verifiedStatus }: Props) {
  const initials = companyName
    ? companyName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CO";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-ink/5 bg-white/95 px-8 shadow-xs backdrop-blur-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">Employer Account</span>
      <div className="flex items-center gap-4">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[verifiedStatus]}`}>
          {verifiedStatus === "APPROVED" ? "Verified" : verifiedStatus === "PENDING" ? "Pending review" : "Rejected"}
        </span>
        
        <div className="h-4 w-px bg-ink/10" />

        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-xs font-bold text-white transition-transform group-hover:scale-105">
            {initials}
          </div>
          <span className="text-sm font-medium text-ink transition-colors group-hover:text-teal">{companyName}</span>
        </div>
      </div>
    </header>
  );
}