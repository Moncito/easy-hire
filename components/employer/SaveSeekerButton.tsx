"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

type Props = {
  seekerId: string;
  saved: boolean;
  onToggle?: (seekerId: string, nextSaved: boolean) => void;
};

export default function SaveSeekerButton({ seekerId, saved, onToggle }: Props) {
  const [localSaved, setLocalSaved] = useState(saved);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    const next = !localSaved;
    setLocalSaved(next);
    onToggle?.(seekerId, next);
    setPending(true);

    try {
      const res = next
        ? await fetch("/api/employer/saved-seekers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seekerId }),
          })
        : await fetch(`/api/employer/saved-seekers/${seekerId}`, { method: "DELETE" });

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
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
        localSaved ? "border-teal/30 bg-teal/8 text-teal" : "border-ink/10 text-ink/70 hover:border-teal/30"
      }`}
    >
      {localSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      {localSaved ? "Saved" : "Save"}
    </button>
  );
}
