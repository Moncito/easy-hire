import { Bookmark, ChevronRight, FileText, Link2, Sparkles, type LucideIcon } from "lucide-react";
import type { ProfileBucketId } from "@/components/seeker/profile-buckets";

type Action = {
  label: string;
  hint: string;
  bucket: ProfileBucketId;
  icon: LucideIcon;
  tone: "marigold" | "navy" | "teal";
};

const ACTIONS: Action[] = [
  { label: "Update your resume", hint: "Upload or manage your latest CV", bucket: "resume", icon: FileText, tone: "marigold" },
  { label: "Add skills", hint: "Showcase what you're good at", bucket: "skills", icon: Sparkles, tone: "teal" },
  { label: "Set career preferences", hint: "Availability, timezone, salary", bucket: "next-role", icon: Bookmark, tone: "navy" },
  { label: "Manage links", hint: "Portfolio, LinkedIn, certifications", bucket: "credentials", icon: Link2, tone: "navy" },
];

const TONE_CLASSES: Record<Action["tone"], string> = {
  marigold: "bg-marigold/15 text-[#8a5a10]",
  navy: "bg-navy/10 text-navy",
  teal: "bg-teal/10 text-teal",
};

type Props = {
  onSelectBucket: (bucket: ProfileBucketId) => void;
};

export default function ProfileQuickActionsCard({ onSelectBucket }: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-ink/8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/40">Quick actions</p>
      <ul className="space-y-1">
        {ACTIONS.map(({ label, hint, bucket, icon: Icon, tone }) => (
          <li key={bucket}>
            <button
              type="button"
              onClick={() => onSelectBucket(bucket)}
              className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-ink/[0.03]"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{label}</span>
                <span className="block truncate text-xs text-ink/40">{hint}</span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-ink/25 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-marigold"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
