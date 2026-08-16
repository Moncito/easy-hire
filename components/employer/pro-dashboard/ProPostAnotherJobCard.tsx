import Link from "next/link";
import { Plus } from "lucide-react";

export default function ProPostAnotherJobCard() {
  return (
    <Link
      href="/employer/jobs/new"
      className="pro-card group flex h-full min-h-[280px] flex-col items-center justify-center border-dashed p-6 text-center transition hover:border-ink/20 hover:shadow-md"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-marigold text-ink transition group-hover:bg-marigold/90">
        <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-bold text-ink">Post another role</p>
      <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-ink/45">
        Pro has no live-job cap. More listings mean more VAs find you.
      </p>
    </Link>
  );
}
