"use client";

import { Check } from "lucide-react";
import {
  PROFILE_BUCKETS,
  type ProfileBucketId,
  isBucketComplete,
} from "@/components/seeker/profile-buckets";
import type { EmployerPreviewData } from "@/components/seeker/SeekerEmployerPreview";

type Props = {
  activeId: ProfileBucketId;
  onSelect: (id: ProfileBucketId) => void;
  data: EmployerPreviewData & { resumeUrl: string | null; photoUrl: string | null };
  variant?: "sidebar" | "pills";
};

export default function ProfileBucketNav({
  activeId,
  onSelect,
  data,
  variant = "sidebar",
}: Props) {
  if (variant === "pills") {
    return (
      <nav
        aria-label="Profile sections"
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PROFILE_BUCKETS.map((bucket) => {
          const complete = isBucketComplete(bucket.id, data);
          const active = activeId === bucket.id;
          return (
            <button
              key={bucket.id}
              type="button"
              onClick={() => onSelect(bucket.id)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "border-marigold/40 bg-marigold/15 text-[#8a5a10]"
                  : "border-navy/10 bg-white text-ink/60 hover:border-navy/25"
              }`}
            >
              {complete && <Check className="h-3 w-3 text-teal" aria-hidden="true" />}
              {bucket.label}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Profile sections" className="space-y-1">
      <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-wider text-navy/50">
        Profile sections
      </p>
      {PROFILE_BUCKETS.map((bucket) => {
        const complete = isBucketComplete(bucket.id, data);
        const active = activeId === bucket.id;
        return (
          <button
            key={bucket.id}
            type="button"
            onClick={() => onSelect(bucket.id)}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
              active
                ? "bg-marigold/12 font-semibold text-ink"
                : "font-medium text-ink/60 hover:bg-ink/4 hover:text-ink"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                complete
                  ? "border-teal/30 bg-teal/10 text-teal"
                  : "border-ink/15 bg-white text-ink/30"
              }`}
            >
              {complete ? <Check className="h-3 w-3" /> : "·"}
            </span>
            <span className="min-w-0 truncate">{bucket.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
