"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";

export type JobAlertItem = {
  id: string;
  keywords: string;
  category: string | null;
  frequency: string;
  createdAt: string;
};

export default function JobAlertsList({ initialAlerts }: { initialAlerts: JobAlertItem[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function remove(id: string) {
    setRemovingId(id);
    const prev = alerts;
    setAlerts((a) => a.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/seeker/job-alerts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setAlerts(prev);
      toast.error("Couldn't remove this alert");
    } finally {
      setRemovingId(null);
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-navy/8 bg-white p-14 text-center">
        <Bell className="mx-auto h-8 w-8 text-ink/25" aria-hidden="true" />
        <h2 className="mt-4 font-display text-lg font-bold text-ink">No job alerts yet</h2>
        <p className="mt-2 text-sm text-ink/50">
          Search for roles and tap &ldquo;Save search&rdquo; to get notified when matching jobs go live.
        </p>
        <Link
          href="/jobs"
          className="mt-5 inline-flex cursor-pointer rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-marigold/90"
        >
          Browse jobs
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-ink/5 rounded-2xl border border-navy/8 bg-white">
      {alerts.map((alert) => (
        <li key={alert.id} className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{alert.keywords}</p>
            <p className="mt-0.5 text-xs text-ink/45">
              {alert.frequency === "DAILY" ? "Daily" : "Weekly"} digest
              {alert.category ? ` · ${alert.category}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => remove(alert.id)}
            disabled={removingId === alert.id}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:border-ember/30 hover:text-ember disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
