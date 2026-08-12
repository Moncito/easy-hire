import { fetchJson, fetchJsonSafe } from "@/lib/client/fetch-json";

export async function createEmployerJob(body: Record<string, unknown>) {
  return fetchJsonSafe<unknown>("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchJobStatus(id: string, status: string) {
  return fetchJsonSafe<unknown>(`/api/jobs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function searchJobs(params: URLSearchParams) {
  return fetchJson<{ jobs: unknown[]; nextCursor: string | null }>(
    `/api/jobs/search?${params.toString()}`
  );
}

export async function submitJobForReview(id: string) {
  return fetchJsonSafe<unknown>(`/api/jobs/${id}/submit`, { method: "POST" });
}
