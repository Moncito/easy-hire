import { fetchJsonSafe, parseJsonBody } from "@/lib/client/fetch-json";

export async function updateSeekerProfile(body: Record<string, unknown>) {
  const res = await fetch("/api/profile/seeker", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJsonBody(res);
  return { ok: res.ok, data: data as { error?: string } };
}

export async function updateEmployerProfile(body: Record<string, unknown>) {
  const res = await fetch("/api/profile/employer", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJsonBody(res);
  return { ok: res.ok, data: data as { error?: string } };
}

export async function registerAccount(body: Record<string, unknown>) {
  return fetchJsonSafe<unknown>("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
