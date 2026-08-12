export class ClientApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

export async function parseJsonBody(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export type FetchJsonResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number; data?: unknown };

export async function fetchJsonSafe<T>(
  url: string,
  init?: RequestInit
): Promise<FetchJsonResult<T>> {
  const res = await fetch(url, init);
  const data = (await parseJsonBody(res)) as T;
  if (!res.ok) {
    return {
      ok: false,
      error: (data as { error?: string })?.error ?? res.statusText,
      status: res.status,
      data,
    };
  }
  return { ok: true, data, status: res.status };
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const result = await fetchJsonSafe<T>(url, init);
  if (!result.ok) {
    throw new ClientApiError(result.error, result.status, result.data);
  }
  return result.data;
}

export const noStore: RequestInit = { cache: "no-store" };
