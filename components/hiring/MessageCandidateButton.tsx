"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

type Props = { companyId: string; jobId: string; seekerId: string };

export default function MessageCandidateButton({ companyId, jobId, seekerId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch(`/api/hiring/${companyId}/conversations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seekerId, jobId }) });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || "Could not start conversation."); return; }
      router.push(`/hiring/${companyId}/messages?c=${result.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={() => void start()} disabled={loading} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-xs font-bold text-ink transition hover:border-teal/30 disabled:opacity-60">
      <MessageSquare className="h-3.5 w-3.5" />
      {loading ? "Opening…" : "Message candidate"}
    </button>
  );
}
