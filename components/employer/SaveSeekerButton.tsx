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
      className={`inline-flex cursor-pointer items-center gap-1.5 border px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
        isPro ? "rounded-full" : "rounded-xl"
      } ${
        localSaved
          ? isPro
            ? "border-marigold/40 bg-marigold/15 text-[#9A5B12]"
            : "border-teal/30 bg-teal/8 text-teal"
          : isPro
            ? "border-ink/10 text-ink/70 hover:border-ink/20 hover:bg-ink/[0.02]"
            : "border-ink/10 text-ink/70 hover:border-teal/30"
      }`}
    >
      {localSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      {localSaved ? "Saved" : "Save"}
    </button>
  );
}
