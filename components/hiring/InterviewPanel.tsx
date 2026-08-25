"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, Clock3, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

type Interview = { id: string; scheduledAt: string; format: string; status: string };

export default function InterviewPanel({ companyId, jobId, applicationId, memberId, canSchedule }: { companyId: string; jobId: string; applicationId: string; memberId: string; canSchedule: boolean }) {
  const [items, setItems] = useState<Interview[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/hiring/${companyId}/jobs/${jobId}/applications/${applicationId}/interviews`);
      if (!response.ok) throw new Error("Could not load interviews.");
      setItems(await response.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load interviews.");
    } finally { setLoading(false); }
  }, [applicationId, companyId, jobId]);

  useEffect(() => { void load(); }, [load]);

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
      const response = await fetch(`/api/hiring/${companyId}/jobs/${jobId}/applications/${applicationId}/interviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduledAt: when, durationMins: 30, format: "VIDEO", memberIds: [memberId] }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not schedule interview.");
      setDate(""); setTime("");
      toast.success("Interview scheduled");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not schedule interview.");
      await load();
    } finally { setScheduling(false); }
  }

  const today = new Date().toISOString().slice(0, 10);
  return <section className="mt-7 border-t border-ink/7 pt-5"><div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-teal" /><h2 className="font-display text-xl font-bold text-ink">Interviews</h2></div>{canSchedule && <div className="mt-3"><p className="mb-2 text-xs text-ink/45">Choose a date and time in your local timezone.</p><div className="flex flex-wrap gap-2"><label className="relative"><span className="sr-only">Interview date</span><input type="date" value={date} min={today} onChange={(event) => setDate(event.target.value)} disabled={scheduling} className="rounded-xl border border-ink/12 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-teal focus:ring-3 focus:ring-teal/10 disabled:opacity-60" /></label><label className="relative"><span className="sr-only">Interview time</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} disabled={scheduling} className="rounded-xl border border-ink/12 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-teal focus:ring-3 focus:ring-teal/10 disabled:opacity-60" /></label><button type="button" onClick={() => void schedule()} disabled={!date || !time || scheduling} className="inline-flex items-center gap-2 rounded-xl bg-marigold px-3.5 py-2 text-sm font-bold text-ink transition hover:bg-[#f7b94e] disabled:cursor-not-allowed disabled:opacity-55">{scheduling ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}{scheduling ? "Scheduling…" : "Schedule interview"}</button></div></div>}<div className="mt-4 space-y-2">{loading ? <p className="text-sm text-ink/45">Loading interviews…</p> : items.length ? items.map((item) => <div key={item.id} className="flex justify-between gap-3 bg-white/60 px-3 py-2 text-sm"><span>{new Date(item.scheduledAt).toLocaleString()} · {item.format.toLowerCase()}</span><span className="font-semibold text-teal">{item.status.toLowerCase()}</span></div>) : <p className="text-sm text-ink/50">No interviews scheduled.</p>}</div></section>;
}
