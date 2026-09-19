import Link from "next/link";
import { Sparkles } from "lucide-react";

type Props = {
  completed: number;
  total: number;
  href?: string;
};

export default function SeekerProfileProgressCard({ completed, total, href = "/seeker/profile" }: Props) {
  const deg = total > 0 ? (completed / total) * 360 : 0;
  const isComplete = total > 0 && completed >= total;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-marigold/15">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "radial-gradient(circle at 100% 0%, rgba(242,169,59,0.14), transparent 60%)" }}
        aria-hidden="true"
      />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Profile progress</p>
          {isComplete && <Sparkles className="h-3.5 w-3.5 text-marigold" aria-hidden="true" />}
        </div>
        <div className="flex items-center gap-4">
          <div
            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full shadow-[0_2px_8px_rgba(242,169,59,0.25)]"
            style={{ background: `conic-gradient(var(--color-marigold) ${deg}deg, rgba(32,36,43,0.08) 0deg)` }}
            role="img"
            aria-label={`Profile strength: ${completed} of ${total} sections complete`}
          >
            <span
              aria-hidden="true"
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white font-data text-sm font-bold text-ink"
            >
              {completed}/{total}
            </span>
          </div>
          <p className="text-sm text-ink/55">
            {isComplete
              ? "Your profile is complete — employers see the full picture."
              : "Complete your profile to rank higher in employer searches."}
          </p>
        </div>
        <Link
          href={href}
          className="mt-4 block w-full rounded-xl bg-marigold px-4 py-2.5 text-center text-xs font-bold text-ink shadow-[0_4px_10px_rgba(242,169,59,0.3)] transition hover:bg-marigold/90"
        >
          View profile
        </Link>
      </div>
    </div>
  );
}
