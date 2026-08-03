import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Props = {
  strength: number;
  strengthTotal: number;
  applicationCount: number;
  conversationCount: number;
};

export default function SeekerDashboardStats({
  strength,
  strengthTotal,
  applicationCount,
  conversationCount,
}: Props) {
  const pct = Math.round((strength / strengthTotal) * 100);

  return (
    <div className="flex flex-wrap divide-y divide-ink/8 overflow-hidden rounded-2xl bg-ink/[0.03] ring-1 ring-ink/8 sm:divide-x sm:divide-y-0">
      {/* Profile strength */}
      <Link
        href="/seeker/profile"
        className="group flex min-w-[140px] flex-1 flex-col gap-2 px-5 py-4 transition hover:bg-ink/[0.04]"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
          Profile strength
        </span>
        <div className="flex items-baseline gap-1">
          <span className="font-data text-2xl font-bold text-ink">{strength}</span>
          <span className="font-data text-sm text-ink/40">/{strengthTotal}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-marigold transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Link>

      {/* Browse jobs */}
      <Link
        href="/jobs"
        className="group flex min-w-[140px] flex-1 items-center justify-between gap-3 px-5 py-4 transition hover:bg-ink/[0.04]"
      >
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
            Browse jobs
          </span>
          <p className="mt-1 text-sm font-semibold text-ink">Find your next VA role</p>
        </div>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-ink/25 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-marigold"
          aria-hidden="true"
        />
      </Link>

      {/* Applications */}
      <div className="flex min-w-[120px] flex-1 flex-col gap-2 px-5 py-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
          Applications
        </span>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-marigold" aria-hidden="true" />
          <span className="font-data text-sm font-semibold text-ink">
            {applicationCount}{" "}
            <span className="font-body font-normal text-ink/60">
              {applicationCount === 1 ? "Application" : "Applications"}
            </span>
          </span>
        </div>
      </div>

      {/* Messages */}
      <Link
        href="/seeker/messages"
        className="group flex min-w-[120px] flex-1 flex-col gap-2 px-5 py-4 transition hover:bg-ink/[0.04]"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
          Messages
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
              conversationCount > 0 ? "bg-teal" : "bg-ink/20"
            }`}
            aria-hidden="true"
          />
          <span className="font-data text-sm font-semibold text-ink">
            {conversationCount}{" "}
            <span className="font-body font-normal text-ink/60">
              {conversationCount === 1 ? "Thread" : "Threads"}
            </span>
          </span>
        </div>
      </Link>
    </div>
  );
}
