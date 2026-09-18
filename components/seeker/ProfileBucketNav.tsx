"use client";

import { useRef } from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import {
  PROFILE_BUCKETS,
  type ProfileBucketId,
  isBucketComplete,
} from "@/components/seeker/profile-buckets";
import type { EmployerPreviewData } from "@/components/seeker/SeekerEmployerPreview";
import type { IdVerificationStatus } from "@/components/seeker/ProfileHeaderCard";

type Props = {
  activeId: ProfileBucketId;
  onSelect: (id: ProfileBucketId) => void;
  data: EmployerPreviewData & { resumeUrl: string | null; photoUrl: string | null };
  variant?: "sidebar" | "pills";
  identityStatus?: IdVerificationStatus | null;
};

const IDENTITY_DOT_CLASSES: Record<"APPROVED" | "REJECTED" | "OTHER", string> = {
  APPROVED: "bg-teal",
  REJECTED: "bg-ember",
  OTHER: "bg-white ring-1 ring-inset ring-ink/20",
};

function identityDotClass(status: IdVerificationStatus | null | undefined) {
  if (status === "APPROVED") return IDENTITY_DOT_CLASSES.APPROVED;
  if (status === "REJECTED") return IDENTITY_DOT_CLASSES.REJECTED;
  return IDENTITY_DOT_CLASSES.OTHER;
}

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
  identityStatus = null,
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

  // ── Icon rail (sidebar variant) ──
  // Two labeled sections (PROFILE, SETTINGS) of icon+label rows. Each row's
  // icon sits in a small rounded tile whose fill communicates state: filled
  // marigold when active, teal-tinted when complete-but-inactive, neutral
  // when incomplete-and-inactive — same tone-tile pattern as
  // ProfileQuickActionsCard. Same accessible tab structure as before
  // (role="tab", aria-selected, roving tabindex via useTabListKeyDown) for
  // the real buckets; the Identity verification row appended after SETTINGS
  // is a plain nav link, not part of the tablist.
  const profileBuckets = PROFILE_BUCKETS.filter((b) => b.group === "profile");
  const settingsBuckets = PROFILE_BUCKETS.filter((b) => b.group === "settings");

  function renderBucketRow(bucket: (typeof PROFILE_BUCKETS)[number]) {
    const complete = isBucketComplete(bucket.id, data);
    const active = activeId === bucket.id;
    const Icon = bucket.icon;
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
        className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mist ${
          active ? "bg-marigold/10 font-bold text-ink" : "font-medium text-ink/50 hover:bg-ink/[0.03] hover:text-ink/80"
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            active ? "bg-marigold text-ink" : complete ? "bg-teal/10 text-teal" : "bg-ink/5 text-ink/40"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 truncate">{bucket.label}</span>
      </button>
    );
  }

  return (
    <nav
      ref={navRef}
      role="tablist"
      aria-label="Profile sections"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      className="relative"
    >
      <p className="mb-2 pl-2 font-data text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">
        Profile
      </p>
      <div className="flex flex-col gap-1">{profileBuckets.map(renderBucketRow)}</div>

      <p className="mb-2 mt-5 pl-2 font-data text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">
        Settings
      </p>
      <div className="flex flex-col gap-1">
        {settingsBuckets.map(renderBucketRow)}

        <Link
          href="/seeker/profile/identity"
          className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-medium text-ink/50 transition-colors hover:bg-ink/[0.03] hover:text-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mist"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/40"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 truncate">Identity verification</span>
          <span
            aria-hidden="true"
            className={`h-2 w-2 shrink-0 rounded-full ${identityDotClass(identityStatus)}`}
          />
        </Link>
      </div>
    </nav>
  );
}
