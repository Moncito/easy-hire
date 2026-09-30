"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { saveSeeker, unsaveSeeker } from "@/lib/client/saved-seekers";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

type Props = {
  seekerId: string;
  saved: boolean;
  onToggle?: (seekerId: string, nextSaved: boolean) => void;
};

export default function SaveSeekerButton({ seekerId, saved, onToggle }: Props) {
  const { isPro } = useEmployerShell();
  const [localSaved, setLocalSaved] = useState(saved);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    const next = !localSaved;
    setLocalSaved(next);
    onToggle?.(seekerId, next);
    setPending(true);

    try {
      const res = next ? await saveSeeker(seekerId) : await unsaveSeeker(seekerId);

      if (!res.ok) throw new Error("Failed");
    } catch {
      setLocalSaved(!next);
      onToggle?.(seekerId, !next);
      toast.error("Couldn't update saved candidates");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={localSaved}
      className={`inline-flex cursor-pointer items-center gap-1.5 border transition-colors disabled:opacity-60 ${
        isPro ? "h-8 rounded-control px-3 text-ui font-medium" : "rounded-xl px-3.5 py-2 text-xs font-semibold"
      } ${
        localSaved
          ? isPro
            ? "border-[color-mix(in_srgb,var(--eh-marigold)_55%,var(--eh-line))] bg-eh-marigold-tint text-eh-marigold-ink"
            : "border-teal/30 bg-teal/8 text-teal"
          : isPro
            ? "border-eh-line bg-eh-surface text-eh-ink hover:bg-eh-surface-2"
            : "border-ink/10 text-ink/70 hover:border-teal/30"
      }`}
    >
      {localSaved ? (
        <BookmarkCheck className={isPro ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden="true" />
      ) : (
        <Bookmark className={isPro ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden="true" />
      )}
      {localSaved ? "Saved" : "Save"}
    </button>
  );
}
