import { fetchJson, fetchJsonSafe, parseJsonBody } from "@/lib/client/fetch-json";

export async function getApplicationForJob(jobId: string) {
  const res = await fetch(`/api/applications?jobId=${jobId}`);
  return parseJsonBody(res) as Promise<{ application?: unknown }>;
}

export async function listSeekerApplications() {
  const res = await fetch("/api/applications/list");
  if (!res.ok) return null;
  return parseJsonBody(res);
}

export async function getSeekerProfileForApply() {
  const res = await fetch("/api/profile/seeker");
  if (!res.ok) return null;
  return parseJsonBody(res) as Promise<{ resumeUrl?: string | null }>;
}

export async function submitApplication(body: {
  jobId: string;
  coverNote: string | null;
  answers: { questionId: string; answerText: string }[];
}) {
  const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJsonBody(res);
  return { ok: res.ok, status: res.status, data: data as { error?: string } };
}

export async function withdrawApplication(id: string) {
  const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
  const data = await parseJsonBody(res);
  return { ok: res.ok, status: res.status, data: data as { error?: string; jobId?: string } };
}

export async function patchApplication(id: string, body: Record<string, unknown>) {
  return fetchJson<Record<string, unknown>>(`/api/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function listSavedJobIds() {
  const res = await fetch("/api/seeker/jobs/saved");
  if (!res.ok) return null;
  return parseJsonBody(res);
}
