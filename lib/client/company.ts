import { fetchJsonSafe, parseJsonBody } from "@/lib/client/fetch-json";

export async function updateCompany(body: Record<string, unknown>) {
  const res = await fetch("/api/company", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJsonBody(res);
  return { ok: res.ok, data: data as { error?: string } };
}

export async function createVerificationDocument(body: {
  fileUrl: string;
  fileName: string;
  docType: string;
}) {
  return fetchJsonSafe<Record<string, unknown>>("/api/company/verification-documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteVerificationDocument(id: string) {
  return fetchJsonSafe<unknown>(`/api/company/verification-documents/${id}`, {
    method: "DELETE",
  });
}

export async function requestVerificationReview() {
  return fetchJsonSafe<unknown>("/api/company/verification/request-review", {
    method: "POST",
  });
}
