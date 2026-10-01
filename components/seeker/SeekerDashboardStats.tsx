import Link from "next/link";
import { Calendar, FileText, MessageSquare } from "lucide-react";

type Props = {
  activeApplicationCount: number;
  totalApplicationCount: number;
  upcomingInterviewCount: number;
  conversationCount: number;
};

export default function SeekerDashboardStats({
  activeApplicationCount,
  totalApplicationCount,
  upcomingInterviewCount,
  conversationCount,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Link
        href="/seeker/dashboard"
        className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl bg-marigold/[0.05] px-5 py-4 ring-1 ring-marigold/15 shadow-[0_2px_12px_rgba(32,36,43,0.04)] transition hover:ring-marigold/35 hover:shadow-[0_4px_16px_rgba(242,169,59,0.12)]"
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-marigold/10 blur-2xl transition-opacity group-hover:opacity-80"
          aria-hidden="true"
        />
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-marigold text-ink shadow-[0_4px_10px_rgba(242,169,59,0.35)]">
          <FileText className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="relative text-[10px] font-semibold uppercase tracking-widest text-[#8a5a10]/70">
          Active applications
        </span>
        <span className="relative font-data text-3xl font-bold text-ink">{activeApplicationCount}</span>
        <span className="relative text-xs text-ink/45">{totalApplicationCount} total</span>
      </Link>

      <a
        href="#interviews-heading"
        className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl bg-navy/[0.04] px-5 py-4 ring-1 ring-navy/12 shadow-[0_2px_12px_rgba(32,36,43,0.04)] transition hover:ring-navy/30 hover:shadow-[0_4px_16px_rgba(30,58,95,0.12)]"
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-navy/10 blur-2xl transition-opacity group-hover:opacity-80"
          aria-hidden="true"
        />
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-mist shadow-[0_4px_10px_rgba(30,58,95,0.35)]">
          <Calendar className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="relative text-[10px] font-semibold uppercase tracking-widest text-navy/60">
          Upcoming interviews
        </span>
        <span className="relative font-data text-3xl font-bold text-ink">{upcomingInterviewCount}</span>
        <span className="relative text-xs text-ink/45">
          {upcomingInterviewCount > 0 ? "Next up soon" : "None scheduled"}
        </span>
      </a>

      <Link
        href="/seeker/messages"
        className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl bg-teal/[0.05] px-5 py-4 ring-1 ring-teal/15 shadow-[0_2px_12px_rgba(32,36,43,0.04)] transition hover:ring-teal/35 hover:shadow-[0_4px_16px_rgba(31,128,115,0.12)]"
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal/10 blur-2xl transition-opacity group-hover:opacity-80"
          aria-hidden="true"
        />
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-white shadow-[0_4px_10px_rgba(31,128,115,0.35)]">
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="relative text-[10px] font-semibold uppercase tracking-widest text-teal/70">Messages</span>
        <span className="relative font-data text-3xl font-bold text-ink">{conversationCount}</span>
        <span className="relative text-xs text-ink/45">
          {conversationCount === 1 ? "1 thread" : `${conversationCount} threads`}
        </span>
      </Link>
    </div>
  );
}
