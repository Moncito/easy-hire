"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { startConversation as startConversationApi } from "@/lib/client/conversations";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

export default function MessageSeekerButton({ seekerId, jobId }: { seekerId: string; jobId?: string }) {
  const { isPro } = useEmployerShell();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStartConversation() {
    setLoading(true);
    try {
      const result = await startConversationApi(seekerId, jobId);

      if (!result.ok) {
        toast.error((result.data as { error?: string }).error || result.error || "Could not start conversation");
        return;
      }

      router.push(`/employer/messages?c=${(result.data as { id: string }).id}`);
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
      aria-busy={loading || undefined}
      className={`inline-flex cursor-pointer items-center gap-1.5 transition-colors disabled:opacity-60 ${
        isPro
          ? "h-8 rounded-control border border-eh-marigold bg-eh-marigold px-3 text-ui font-semibold text-[#241500] hover:border-eh-marigold-strong hover:bg-eh-marigold-strong"
          : "rounded-xl bg-teal px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal/95"
      }`}
    >
      <MessageSquare className={isPro ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden="true" />
      {loading ? "Opening..." : "Message"}
    </button>
  );
}
