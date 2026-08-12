import { fetchJsonSafe, parseJsonBody } from "@/lib/client/fetch-json";

export async function listSavedSeekers() {
  const res = await fetch("/api/employer/saved-seekers");
  if (!res.ok) return null;
  return parseJsonBody(res) as Promise<{ seekers: unknown[] }>;
}

export async function saveSeeker(seekerId: string) {
  return fetchJsonSafe<unknown>("/api/employer/saved-seekers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seekerId }),
  });
}

export async function unsaveSeeker(seekerId: string) {
  return fetchJsonSafe<unknown>(`/api/employer/saved-seekers/${seekerId}`, {
    method: "DELETE",
  });
}
