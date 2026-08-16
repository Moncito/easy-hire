"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { startConversation as startConversationApi } from "@/lib/client/conversations";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

export default function MessageSeekerButton({ seekerId, jobId }: { seekerId: string; jobId?: string }) {
  const { isPro } = useEmployerShell();
  const [loading, setLoading] = useState(false);

  async function handleStartConversation() {
    setLoading(true);
    try {
      const result = await startConversationApi(seekerId, jobId);

      if (!result.ok) {
        toast.error((result.data as { error?: string }).error || result.error || "Could not start conversation");
        return;
      }

      window.location.href = `/employer/messages?c=${(result.data as { id: string }).id}`;
    } catch {
      toast.error("Could not start conversation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleStartConversation}
      disabled={loading}
      className={`inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
        isPro
          ? "rounded-full bg-marigold text-ink shadow-sm shadow-marigold/20 hover:bg-marigold/90"
          : "rounded-xl bg-teal text-white shadow-xs hover:bg-teal/95"
      }`}
    >
      <MessageSquare className="h-3.5 w-3.5" />
      {loading ? "Opening..." : "Message"}
    </button>
  );
}
