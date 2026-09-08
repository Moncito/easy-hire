"use client";

import { useRef } from "react";
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

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown"]);
const PREV_KEYS = new Set(["ArrowLeft", "ArrowUp"]);

/**
 * Standard ARIA tabs pattern: roving tabindex (0 on the active tab, -1 on
 * the rest) plus arrow-key navigation between tabs. Both Left/Right and
 * Up/Down move focus regardless of the nav's visual orientation — that
 * matches how users try it either way, and is a harmless superset of the
 * APG's per-orientation recommendation. Home/End jump to first/last.
 */
function useTabListKeyDown(onSelect: (id: ProfileBucketId) => void) {
  return (e: React.KeyboardEvent<HTMLElement>) => {
    const ids = PROFILE_BUCKETS.map((b) => b.id);
    const currentId = (e.target as HTMLElement).getAttribute("data-bucket-id");
    const currentIndex = ids.findIndex((id) => id === currentId);
    if (currentIndex === -1) return;

    let targetIndex: number | null = null;
    if (NEXT_KEYS.has(e.key)) {
      targetIndex = (currentIndex + 1) % ids.length;
    } else if (PREV_KEYS.has(e.key)) {
      targetIndex = (currentIndex - 1 + ids.length) % ids.length;
    } else if (e.key === "Home") {
      targetIndex = 0;
    } else if (e.key === "End") {
      targetIndex = ids.length - 1;
    }

    if (targetIndex === null) return;
    e.preventDefault();
    const targetId = ids[targetIndex];
    onSelect(targetId);
    // Move focus to the newly-active tab so keyboard users can keep
    // arrowing through the list without tabbing back in.
    const container = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => {
      const nextEl = container.querySelector<HTMLButtonElement>(
        `[data-bucket-id="${targetId}"]`
      );
      nextEl?.focus();
    });
  };
}

export default function ProfileBucketNav({
  activeId,
  onSelect,
  data,
  variant = "sidebar",
}: Props) {
  const navRef = useRef<HTMLElement>(null);
  const handleKeyDown = useTabListKeyDown(onSelect);

  if (variant === "pills") {
    return (
      <nav
        ref={navRef}
        role="tablist"
        aria-label="Profile sections"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PROFILE_BUCKETS.map((bucket) => {
          const complete = isBucketComplete(bucket.id, data);
          const active = activeId === bucket.id;
          return (
            <button
              key={bucket.id}
              type="button"
              role="tab"
              id={`profile-tab-${variant}-${bucket.id}`}
              aria-selected={active}
              aria-controls="seeker-profile-form"
              data-bucket-id={bucket.id}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(bucket.id)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "border-marigold bg-marigold text-ink shadow-sm"
                  : "border-navy/10 bg-white text-ink/60 hover:border-navy/25"
              }`}
            >
              {complete && (
                <Check className={`h-3 w-3 ${active ? "text-ink" : "text-teal"}`} aria-hidden="true" />
              )}
              {bucket.label}
            </button>
          );
        })}
      </nav>
    );
  }

  // ── Editorial rail (sidebar variant) ──
  // A thin vertical connecting line with small circular dot markers per
  // section: hollow for incomplete, filled teal for complete, filled
  // marigold with a soft glow ring for the active section. No button
  // backgrounds/borders — separation comes from the dot + label state only.
  // Same accessible tab structure as before (role="tab", aria-selected,
  // roving tabindex via useTabListKeyDown), this is a visual restyle only.
  return (
    <nav
      ref={navRef}
      role="tablist"
      aria-label="Profile sections"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      className="relative"
    >
      <p className="mb-4 pl-6 font-data text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">
        Sections
      </p>
      <div className="relative pl-6">
        <div className="absolute left-[9px] top-1.5 bottom-1.5 w-px bg-ink/8" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          {PROFILE_BUCKETS.map((bucket) => {
            const complete = isBucketComplete(bucket.id, data);
            const active = activeId === bucket.id;
            return (
              <button
                key={bucket.id}
                type="button"
                role="tab"
                id={`profile-tab-${variant}-${bucket.id}`}
                aria-selected={active}
                aria-controls="seeker-profile-form"
                data-bucket-id={bucket.id}
                tabIndex={active ? 0 : -1}
                onClick={() => onSelect(bucket.id)}
                className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-md py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mist ${
                  active ? "font-bold text-ink" : "font-medium text-ink/40 hover:text-ink/70"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute -left-6 top-1/2 shrink-0 -translate-y-1/2 rounded-full transition-all ${
                    active
                      ? "h-[13px] w-[13px] bg-marigold shadow-[0_0_0_4px_rgba(242,169,59,0.18)]"
                      : complete
                        ? "h-[11px] w-[11px] bg-teal"
                        : "h-[11px] w-[11px] border-2 border-ink/15 bg-mist"
                  }`}
                />
                <span className="min-w-0 truncate">{bucket.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
