"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, CircleX, Clock3, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

type Interview = { id: string; scheduledAt: string; format: string; status: string };

const statusTone: Record<string, string> = {
  SCHEDULED: "text-teal",
  COMPLETED: "text-navy",
  CANCELLED: "text-ink/35",
};

export default function InterviewPanel({
  companyId,
  jobId,
  applicationId,
  memberId,
  canSchedule,
}: {
  companyId: string;
  jobId: string;
  applicationId: string;
  memberId: string;
  canSchedule: boolean;
}) {
  const [items, setItems] = useState<Interview[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/hiring/${companyId}/jobs/${jobId}/applications/${applicationId}/interviews`);
      if (!response.ok) throw new Error("Could not load interviews.");
      setItems(await response.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load interviews.");
    } finally {
      setLoading(false);
    }
  }, [applicationId, companyId, jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-dismiss an armed "Confirm cancel?" state after a few seconds so a stray
  // click elsewhere doesn't leave a destructive action sitting primed.
  useEffect(() => {
    if (!confirmingId) return;
    const timeout = setTimeout(() => setConfirmingId(null), 5000);
    return () => clearTimeout(timeout);
  }, [confirmingId]);

  async function schedule() {
    if (!date || !time || scheduling) return;
    const when = `${date}T${time}`;
    const selectedTime = new Date(when);
    if (Number.isNaN(selectedTime.valueOf()) || selectedTime <= new Date()) {
      toast.error("Choose a future interview time.");
      return;
    }
    setScheduling(true);
    try {
      const response = await fetch(`/api/hiring/${companyId}/jobs/${jobId}/applications/${applicationId}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: when, durationMins: 30, format: "VIDEO", memberIds: [memberId] }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not schedule interview.");
      setDate("");
      setTime("");
      toast.success("Interview scheduled");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not schedule interview.");
      await load();
    } finally {
      setScheduling(false);
    }
  }

  async function confirmCancel(interviewId: string) {
    setConfirmingId(null);
    setCancellingId(interviewId);
    try {
      const response = await fetch(
        `/api/hiring/${companyId}/jobs/${jobId}/applications/${applicationId}/interviews/${interviewId}`,
        { method: "PATCH" }
      );
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not cancel interview.");
      toast.success("Interview cancelled");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel interview.");
    } finally {
      setCancellingId(null);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="mt-7 border-t border-ink/7 pt-5">
      <div className="flex items-center gap-2">
        <Clock3 className="h-5 w-5 text-teal" />
        <h2 className="font-display text-xl font-bold text-ink">Interviews</h2>
      </div>

      {canSchedule && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-ink/45">Choose a date and time in your local timezone.</p>
          <div className="flex flex-wrap gap-2">
            <label className="relative">
              <span className="sr-only">Interview date</span>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(event) => setDate(event.target.value)}
                disabled={scheduling}
                className="cursor-pointer rounded-xl border border-ink/12 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-teal focus:ring-3 focus:ring-teal/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Interview time</span>
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                disabled={scheduling}
                className="cursor-pointer rounded-xl border border-ink/12 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-teal focus:ring-3 focus:ring-teal/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <button
              type="button"
              onClick={() => void schedule()}
              disabled={!date || !time || scheduling}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-marigold px-3.5 py-2 text-sm font-bold text-ink transition hover:bg-[#f7b94e] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {scheduling ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
              {scheduling ? "Scheduling…" : "Schedule interview"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-ink/45">Loading interviews…</p>
        ) : items.length ? (
          items.map((item) => {
            const cancelled = item.status === "CANCELLED";
            const isConfirming = confirmingId === item.id;
            const isCancelling = cancellingId === item.id;
            return (
              <div
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${cancelled ? "bg-ink/[0.03]" : "bg-white/60"}`}
              >
                <span className={cancelled ? "text-ink/40 line-through decoration-ink/25" : "text-ink"}>
                  {new Date(item.scheduledAt).toLocaleString()} · {item.format.toLowerCase()}
                </span>
                <span className="flex items-center gap-2">
                  <span className={`font-semibold ${statusTone[item.status] ?? "text-ink/50"}`}>{item.status.toLowerCase()}</span>
                  {canSchedule && item.status === "SCHEDULED" && (
                    isConfirming ? (
                      <span className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void confirmCancel(item.id)}
                          disabled={isCancelling}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-ember px-2.5 py-1 text-xs font-bold text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCancelling ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <CircleX className="h-3 w-3" />}
                          Confirm cancel?
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          disabled={isCancelling}
                          className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-ink/50 transition hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed"
                        >
                          Never mind
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(item.id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-ink/45 transition hover:bg-ember/8 hover:text-ember"
                        aria-label="Cancel this interview"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                    )
                  )}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-ink/50">No interviews scheduled.</p>
        )}
      </div>
    </section>
  );
}
