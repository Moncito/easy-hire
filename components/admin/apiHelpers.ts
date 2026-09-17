/**
 * Shared client-side fetch-response helper for every `components/admin/**\/api.ts`
 * module. Extracted here rather than left duplicated a sixth time
 * (docs/ADMIN-UI-UPGRADE.md §2.2) — `directory/api.ts`, `queue/api.ts`,
 * `audit/api.ts`, `trust/api.ts`, `flags/api.ts`, and `team/api.ts` each
 * defined a byte-for-byte identical copy. Same "one shared thing at the
 * `components/admin/` root" convention as `useDialogFocusTrap.ts`.
 */

/**
 * Reads a JSON `{ error: string }` body off a failed `fetch` response,
 * falling back to `fallback` when the response isn't JSON or carries no
 * `error` field.
 */
export async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // response wasn't JSON — fall through to the generic message
  }
  return fallback;
}
