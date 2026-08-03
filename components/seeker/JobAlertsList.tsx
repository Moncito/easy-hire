"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Plus, Search, Trash2 } from "lucide-react";
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
  const [query, setQuery] = useState("");

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

  const visible = alerts.filter((a) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      a.keywords.toLowerCase().includes(q) ||
      (a.category?.toLowerCase().includes(q) ?? false)
    );
  });

  const countLabel =
    alerts.length === 1 ? "1 Active Alert" : `${alerts.length} Active Alerts`;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Job alerts</h1>
          {alerts.length > 0 && (
            <span className="rounded-full bg-ink/[0.06] px-3 py-1 text-xs font-semibold text-ink/55">
              {countLabel}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-ink/50">
          Saved searches that notify you when a matching VA role goes live.
        </p>
      </div>

      {alerts.length > 0 && (
        <label className="relative block max-w-md">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alerts..."
            className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-navy/25 focus:ring-2 focus:ring-navy/10"
          />
        </label>
      )}

      {alerts.length === 0 ? (
        <div className="py-16 text-center animate-slide-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink/[0.04]">
            <Bell className="h-8 w-8 text-ink/20" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-display text-lg font-bold text-ink">No job alerts yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink/50">
            Search for roles and tap &ldquo;Save search&rdquo; to get notified when matching jobs
            go live.
          </p>
          <Link
            href="/jobs"
            className="mt-6 inline-flex cursor-pointer rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-marigold/90"
          >
            Browse jobs
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-ink/8 animate-slide-up">
            {visible.map((alert, idx) => (
              <li
                key={alert.id}
                className="flex flex-col gap-4 py-5 transition-colors hover:bg-ink/[0.02] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-marigold/12">
                    <Bell className="h-5 w-5 text-marigold" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold text-ink sm:text-lg">
                      &ldquo;{alert.keywords}&rdquo;
                    </p>
                    <p className="mt-1 text-sm text-ink/45">
                      {alert.category ? `${alert.category} · ` : ""}
                      {alert.frequency === "DAILY" ? "Daily" : "Weekly"} digest
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink/45">
                    {alert.frequency === "DAILY" ? "Daily" : "Weekly"}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(alert.id)}
                    disabled={removingId === alert.id}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink/12 px-3.5 py-1.5 text-xs font-semibold text-ink/55 transition hover:border-ember/30 hover:text-ember disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {visible.length === 0 && (
            <p className="py-6 text-center text-sm text-ink/45">No alerts match your search.</p>
          )}

          <Link
            href="/jobs"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink/60 transition hover:border-navy/30 hover:text-navy"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create new alert
          </Link>
        </>
      )}
    </div>
  );
}
