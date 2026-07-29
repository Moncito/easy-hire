"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function MessageSeekerButton({ seekerId, jobId }: { seekerId: string; jobId?: string }) {
  const [loading, setLoading] = useState(false);

  async function startConversation() {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seekerId, jobId }),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error((result as { error?: string }).error || "Could not start conversation");
        return;
      }

      window.location.href = `/employer/messages?c=${(result as { id: string }).id}`;
    } catch {
      toast.error("Could not start conversation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={startConversation}
      disabled={loading}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-teal px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-teal/95 disabled:opacity-60"
    >
      <MessageSquare className="h-3.5 w-3.5" />
      {loading ? "Opening..." : "Message"}
    </button>
  );
}
