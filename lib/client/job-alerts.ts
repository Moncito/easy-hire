import { fetchJsonSafe } from "@/lib/client/fetch-json";

export async function createJobAlert(body: {
  keywords: string;
  category?: string;
  frequency: string;
}) {
  return fetchJsonSafe<unknown>("/api/seeker/job-alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
