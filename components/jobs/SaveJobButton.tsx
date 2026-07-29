"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

type Props = {
  jobId: string;
  saved: boolean;
  onToggle?: (jobId: string, nextSaved: boolean) => void;
  className?: string;
};

export default function SaveJobButton({ jobId, saved, onToggle, className = "" }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [localSaved, setLocalSaved] = useState(saved);

  if (status === "loading") return null;
  if (session?.user?.role === "EMPLOYER") return null;

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push(`/login?callbackUrl=/jobs/${jobId}`);
      return;
    }

    if (pending) return;

    const next = !localSaved;
    setLocalSaved(next);
    onToggle?.(jobId, next);
    setPending(true);

    try {
      const res = await fetch(`/api/seeker/jobs/${jobId}/save`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      if (next) toast.success("Saved to your shortlist");
    } catch {
      setLocalSaved(!next);
      onToggle?.(jobId, !next);
      toast.error("Couldn't update saved jobs — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={localSaved ? "Remove from saved jobs" : "Save job"}
      aria-pressed={localSaved}
      className={`cursor-pointer rounded-full p-2 text-ink/35 transition-colors hover:bg-marigold/10 hover:text-marigold disabled:opacity-60 ${
        localSaved ? "text-marigold" : ""
      } ${className}`}
    >
      {localSaved ? <BookmarkCheck className="h-4.5 w-4.5" /> : <Bookmark className="h-4.5 w-4.5" />}
    </button>
  );
}
