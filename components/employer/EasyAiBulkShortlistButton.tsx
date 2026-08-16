"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";
import NeoButton from "@/components/employer/pro/NeoButton";

type Props = { jobId: string };

type BulkItem = {
  applicationId: string;
  seekerName: string;
  score: number;
  reasons: string[];
};

/** Suggests a top-N shortlist for a job — never changes application status. */
export default function EasyAiBulkShortlistButton({ jobId }: Props) {
  const { isPro } = useEmployerShell();
  const { run, isLoading } = useEasyAi();
  const [shortlist, setShortlist] = useState<BulkItem[] | null>(null);

  if (!isPro) return null;

  async function handleRun() {
    const res = await run<{ shortlist: BulkItem[] }>("bulk-shortlist", { jobId, limit: 10 });
    // generateBulkShortlist returns { configured, data: BulkShortlistItem[] } OR nested;
    // normalize both shapes from the AI route wrapper.
    const payload = res?.data as { shortlist?: BulkItem[] } | BulkItem[] | null | undefined;
    if (!res?.configured || !payload) return;
    if (Array.isArray(payload)) {
      setShortlist(payload);
    } else if (Array.isArray(payload.shortlist)) {
      setShortlist(payload.shortlist);
    }
  }

  return (
    <div className="space-y-2">
      <NeoButton
        variant="secondary"
        size="sm"
        onClick={handleRun}
        disabled={isLoading("bulk-shortlist")}
        icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />}
      >
        {isLoading("bulk-shortlist") ? "Ranking…" : "Easy AI top 10"}
      </NeoButton>
      {shortlist && shortlist.length > 0 && (
        <div className="rounded-xl border border-ink/8 bg-white/80 p-3 text-xs text-ink/60">
          <ul className="space-y-1.5">
            {shortlist.map((item) => (
              <li key={item.applicationId}>
                <span className="font-data font-semibold text-teal">{item.score}</span>
                {" · "}
                <span className="font-semibold text-ink">{item.seekerName}</span>
                {" — "}
                {item.reasons?.[0] ?? "Strong fit"}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-ink/40">
            Advisory only — move candidates manually after review. Never auto-rejects.
          </p>
        </div>
      )}
    </div>
  );
}
