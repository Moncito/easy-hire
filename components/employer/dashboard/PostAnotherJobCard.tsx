import Link from "next/link";
import { Plus } from "lucide-react";

export default function PostAnotherJobCard() {
  return (
    <Link
      href="/employer/jobs/new"
      className="group flex h-full min-h-[248px] flex-col items-center justify-center rounded-2xl border border-dashed border-teal/25 bg-teal/[0.03] p-6 text-center transition hover:border-teal/40 hover:bg-teal/[0.06] hover:shadow-sm"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal transition group-hover:bg-teal/15">
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <p className="mt-3 text-sm font-semibold text-ink group-hover:text-teal">Post another job</p>
      <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-ink/45">
        More listings help candidates discover your company and increase applicant volume.
      </p>
    </Link>
  );
}
