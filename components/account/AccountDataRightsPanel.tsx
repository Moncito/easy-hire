"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Download, ShieldAlert, TriangleAlert } from "lucide-react";
import { useSignOut } from "@/components/ui/useSignOut";

type Role = "SEEKER" | "EMPLOYER";

type Props = {
  /** Drives which accent (Marigold vs Signal Teal) the non-destructive section uses. */
  role: Role;
  /**
   * Credentials account (true) vs Google-only (false). Decides which re-auth
   * control the delete form renders, mirroring `assertReauthenticated` in
   * lib/account/account-deletion.ts. Resolved server-side by
   * `accountHasPassword` — components can't read Prisma or the session.
   */
  hasPassword: boolean;
};

const DELETE_CONFIRMATION_PHRASE = "DELETE MY ACCOUNT";

function retryWindowLabel(res: Response): string {
  const retryAfter = res.headers.get("Retry-After");
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  if (!Number.isFinite(seconds) || seconds <= 0) return "later";
  if (seconds < 60) return `in ${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `in about ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function exportFilename(res: Response): string {
  const header = res.headers.get("Content-Disposition") ?? "";
  const match = header.match(/filename="([^"]+)"/);
  return match?.[1] ?? "easyhire-data-export.json";
}

export default function AccountDataRightsPanel({ role, hasPassword }: Props) {
  const isEmployer = role === "EMPLOYER";
  const { signOut, overlay } = useSignOut();

  // --- Export state ---
  const [exportLoading, setExportLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);

  // --- Delete state ---
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmationPhrase, setConfirmationPhrase] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const passwordInputId = useId();
  const confirmationInputId = useId();
  const deleteErrorId = useId();
  const deleteHeadingId = useId();

  async function handleExport() {
    setExportError(null);
    setExportStatus("Preparing your data export…");
    setExportLoading(true);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(
            `You've reached the export limit (3 per hour). Try again ${retryWindowLabel(res)}.`
          );
        }
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { error?: string } | null)?.error ?? "Couldn't export your data. Please try again."
        );
      }

      const filename = exportFilename(res);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setExportStatus("Your data export has downloaded.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't export your data. Please try again.";
      setExportError(message);
      setExportStatus(message);
    } finally {
      setExportLoading(false);
    }
  }

  function cancelDelete() {
    setConfirming(false);
    setPassword("");
    setConfirmationPhrase("");
    setDeleteError(null);
    setDeleteStatus("");
  }

  async function handleDeleteSubmit(event: FormEvent) {
    event.preventDefault();
    setDeleteError(null);
    setDeleteLoading(true);
    setDeleteStatus("Deleting your account…");

    try {
      // Send only the credential this account actually uses. The server
      // re-checks the same branch in `assertReauthenticated`, so this is a
      // UX affordance, not the security boundary.
      const body: { password?: string; confirmation?: string } = hasPassword
        ? { password }
        : { confirmation: confirmationPhrase };

      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          res.status === 429
            ? `You've reached the deletion attempt limit. Try again ${retryWindowLabel(res)}.`
            : ((data as { error?: string } | null)?.error ??
              "Couldn't delete your account. Please try again.");
        setDeleteError(message);
        setDeleteStatus(message);
        setDeleteLoading(false);
        return;
      }

      // NextAuth uses JWT sessions with no server-side store — the anonymized
      // account still has a live signed session token until we clear it here.
      setDeleteStatus("Your account has been deleted. Signing you out…");
      signOut();
    } catch {
      const message = "Couldn't delete your account. Please check your connection and try again.";
      setDeleteError(message);
      setDeleteStatus(message);
      setDeleteLoading(false);
    }
  }

  const canSubmitDelete = hasPassword
    ? password.length > 0
    : confirmationPhrase.trim().toUpperCase() === DELETE_CONFIRMATION_PHRASE;

  return (
    <div className="flex flex-col gap-6">
      {/* Export section */}
      <section
        className={`rounded-2xl border p-5 sm:p-6 ${
          isEmployer ? "border-teal/15 bg-teal/[0.04]" : "border-marigold/20 bg-marigold/[0.05]"
        }`}
        aria-labelledby="export-my-data-heading"
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            isEmployer ? "bg-teal/15 text-teal" : "bg-marigold/20 text-[#9A5B12]"
          }`}
        >
          <Download className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 id="export-my-data-heading" className="mt-3 font-display text-lg font-bold text-ink">
          Export my data
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink/60">
          Download a copy of the personal data associated with your account as a JSON file, in line
          with your rights under the Data Privacy Act (RA 10173). You can request this up to 3 times
          per hour.
        </p>

        <div role="status" aria-live="polite" className="sr-only">
          {exportStatus}
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exportLoading}
          aria-busy={exportLoading}
          className={`mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
            isEmployer ? "bg-teal hover:bg-teal/90" : "bg-navy hover:bg-navy/90"
          }`}
        >
          <Download className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          {exportLoading ? "Preparing your export…" : "Download my data"}
        </button>

        {exportError && (
          <p role="alert" className="mt-3 text-sm text-ember">
            {exportError}
          </p>
        )}
        {!exportError && exportStatus && !exportLoading && (
          <p className="mt-3 text-sm text-ink/50">{exportStatus}</p>
        )}
      </section>

      {/* Delete section */}
      <section
        className="rounded-2xl border border-ember/25 bg-ember/[0.04] p-5 sm:p-6"
        aria-labelledby={deleteHeadingId}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember/15 text-ember">
          <TriangleAlert className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 id={deleteHeadingId} className="mt-3 font-display text-lg font-bold text-ink">
          Delete my account
        </h2>

        <div className="mt-2 max-w-2xl space-y-1.5 text-sm leading-relaxed text-ink/65">
          <p>This is permanent and cannot be undone. Deleting your account will:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              {isEmployer
                ? "Anonymize your company's profile (name, description, logo, and links removed) and close any of your active job posts."
                : "Anonymize your profile (name, bio, headline, and contact details removed) and hide it from employers."}
            </li>
            <li>
              Permanently delete your resumes{isEmployer ? " and any company verification documents" : ""}
              {" "}from storage.
            </li>
            <li>
              Keep {isEmployer ? "applications employers have received" : "your submitted applications"}{" "}
              on record for the employer&apos;s hiring history, with your cover note cleared — this
              protects the other party&apos;s records.
            </li>
            <li>Permanently delete your saved jobs, job alerts, and notifications.</li>
            {isEmployer && (
              <li>
                Remove your membership from any other company&apos;s hiring team you belong to. If you are
                the sole owner of a company with other active team members, you&apos;ll need to transfer
                ownership first.
              </li>
            )}
          </ul>
        </div>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Delete my account — begin permanent account deletion"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-ember px-5 py-2.5 text-sm font-semibold text-ember transition hover:bg-ember/10 active:scale-[0.98]"
          >
            <ShieldAlert className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            Delete my account
          </button>
        ) : (
          <form onSubmit={handleDeleteSubmit} className="mt-4 flex max-w-sm flex-col gap-4" noValidate>
            <div role="status" aria-live="polite" className="sr-only">
              {deleteStatus}
            </div>

            {hasPassword ? (
              <div>
                <label htmlFor={passwordInputId} className="mb-1.5 block text-sm font-medium text-ink/80">
                  Enter your current password to confirm
                </label>
                <input
                  id={passwordInputId}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  aria-describedby={deleteError ? deleteErrorId : undefined}
                  className="w-full rounded-xl border border-ember/30 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ember focus:ring-2 focus:ring-ember/20"
                />
              </div>
            ) : (
              <div>
                <label htmlFor={confirmationInputId} className="mb-1.5 block text-sm font-medium text-ink/80">
                  Your account signs in with Google, so type &ldquo;{DELETE_CONFIRMATION_PHRASE}
                  &rdquo; to confirm
                </label>
                <input
                  id={confirmationInputId}
                  type="text"
                  value={confirmationPhrase}
                  onChange={(event) => setConfirmationPhrase(event.target.value)}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={DELETE_CONFIRMATION_PHRASE}
                  aria-describedby={deleteError ? deleteErrorId : undefined}
                  className="w-full rounded-xl border border-ember/30 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ember focus:ring-2 focus:ring-ember/20"
                />
              </div>
            )}

            {deleteError && (
              <p id={deleteErrorId} role="alert" className="text-sm text-ember">
                {deleteError}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!canSubmitDelete || deleteLoading}
                aria-busy={deleteLoading}
                aria-label="Permanently delete my account and all associated data"
                className="inline-flex items-center gap-2 rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ember/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteLoading ? "Deleting…" : "Permanently delete my account"}
              </button>
              <button
                type="button"
                onClick={cancelDelete}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-ink/60 transition hover:bg-ink/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
      {overlay}
    </div>
  );
}
