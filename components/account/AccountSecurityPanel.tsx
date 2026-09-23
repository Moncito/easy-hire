"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { KeyRound, Mail } from "lucide-react";

type Role = "SEEKER" | "EMPLOYER";

type Props = {
  /** Drives which accent (Marigold vs Signal Teal) this card uses — same pattern as AccountDataRightsPanel. */
  role: Role;
  /**
   * Credentials account (true) vs Google-only (false). Resolved server-side
   * by `accountHasPassword`, passed down the same way the settings pages
   * already pass it to AccountDataRightsPanel — this component can't read
   * Prisma or the session itself.
   */
  hasPassword: boolean;
};

/** Same `Retry-After` → human label approach as AccountDataRightsPanel's retryWindowLabel. Kept local rather than shared/exported since this is UI-only glue, not business logic. */
function retryWindowLabel(res: Response): string {
  const retryAfter = res.headers.get("Retry-After");
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  if (!Number.isFinite(seconds) || seconds <= 0) return "later";
  if (seconds < 60) return `in ${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `in about ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/**
 * Client-side pre-check only, mirroring the shape of the server's
 * `passwordSchema` (lib/validations/sign-up.ts) so obviously-invalid
 * attempts get instant feedback instead of a round trip. The server
 * re-validates independently — this is a UX affordance, not the boundary.
 */
function newPasswordIssue(value: string): string | null {
  if (value.length < 8) return "New password must be at least 8 characters.";
  if (value.length > 72) return "New password must be at most 72 characters.";
  if (!/[A-Z]/.test(value)) return "New password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(value)) return "New password must contain at least one number.";
  return null;
}

export default function AccountSecurityPanel({ role, hasPassword }: Props) {
  const isEmployer = role === "EMPLOYER";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [sentResetEmail, setSentResetEmail] = useState(false);

  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const errorId = useId();
  const headingId = useId();

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }
    const issue = newPasswordIssue(newPassword);
    if (issue) {
      setError(issue);
      return;
    }

    setSubmitting(true);
    setStatus("Changing your password…");
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          res.status === 401
            ? "Your current password is incorrect."
            : res.status === 429
              ? `You've reached the password-change limit (5 per hour). Try again ${retryWindowLabel(res)}.`
              : ((body as { error?: string } | null)?.error ??
                "Couldn't change your password. Please try again.");
        setError(message);
        setStatus(message);
        return;
      }

      setStatus("Your password has been changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      const message = "Couldn't change your password. Please check your connection and try again.";
      setError(message);
      setStatus(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetPassword() {
    setError(null);
    setSubmitting(true);
    setStatus("Sending you a password setup email…");
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          res.status === 429
            ? `You've reached the request limit (5 per hour). Try again ${retryWindowLabel(res)}.`
            : ((body as { error?: string } | null)?.error ??
              "Couldn't send the email. Please try again.");
        setError(message);
        setStatus(message);
        return;
      }

      setSentResetEmail(true);
      setStatus("Check your email to finish setting a password.");
    } catch {
      const message = "Couldn't send the email. Please check your connection and try again.";
      setError(message);
      setStatus(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 ${
        isEmployer ? "border-teal/15 bg-teal/[0.04]" : "border-marigold/20 bg-marigold/[0.05]"
      }`}
      aria-labelledby={headingId}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          isEmployer ? "bg-teal/15 text-teal" : "bg-marigold/20 text-[#9A5B12]"
        }`}
      >
        <KeyRound className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      </div>
      <h2 id={headingId} className="mt-3 font-display text-lg font-bold text-ink">
        Security
      </h2>

      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>

      {hasPassword ? (
        <>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink/60">
            Changing your password does not sign out other devices — anywhere you&apos;re
            already signed in stays signed in.
          </p>

          <form onSubmit={handleChangePassword} className="mt-4 flex max-w-sm flex-col gap-4" noValidate>
            <div>
              <label htmlFor={currentPasswordId} className="mb-1.5 block text-sm font-medium text-ink/80">
                Current password
              </label>
              <input
                id={currentPasswordId}
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                className={`w-full rounded-xl border border-ink/12 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:ring-2 ${
                  isEmployer ? "focus:border-teal focus:ring-teal/20" : "focus:border-marigold focus:ring-marigold/20"
                }`}
              />
            </div>

            <div>
              <label htmlFor={newPasswordId} className="mb-1.5 block text-sm font-medium text-ink/80">
                New password
              </label>
              <input
                id={newPasswordId}
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                required
                aria-describedby={`${newPasswordId}-hint`}
                className={`w-full rounded-xl border border-ink/12 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:ring-2 ${
                  isEmployer ? "focus:border-teal focus:ring-teal/20" : "focus:border-marigold focus:ring-marigold/20"
                }`}
              />
              <p id={`${newPasswordId}-hint`} className="mt-1.5 text-xs text-ink/45">
                At least 8 characters, with one uppercase letter and one number.
              </p>
            </div>

            <div>
              <label htmlFor={confirmPasswordId} className="mb-1.5 block text-sm font-medium text-ink/80">
                Confirm new password
              </label>
              <input
                id={confirmPasswordId}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                aria-describedby={error ? errorId : undefined}
                className={`w-full rounded-xl border border-ink/12 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:ring-2 ${
                  isEmployer ? "focus:border-teal focus:ring-teal/20" : "focus:border-marigold focus:ring-marigold/20"
                }`}
              />
            </div>

            {error && (
              <p id={errorId} role="alert" className="text-sm text-ember">
                {error}
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                  isEmployer ? "bg-teal hover:bg-teal/90" : "bg-navy hover:bg-navy/90"
                }`}
              >
                {submitting ? "Changing password…" : "Change password"}
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink/60">
            Your account signs in with Google, so there&apos;s no password to change directly.
            You can set one so you can also sign in with your email address — we&apos;ll email
            you a link to finish. Changing your password later won&apos;t sign out other devices.
          </p>

          {error && (
            <p role="alert" className="mt-3 max-w-2xl text-sm text-ember">
              {error}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSetPassword}
              disabled={submitting}
              aria-busy={submitting}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                isEmployer ? "bg-teal hover:bg-teal/90" : "bg-navy hover:bg-navy/90"
              }`}
            >
              <Mail className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              {submitting ? "Sending…" : "Set a password"}
            </button>
            {sentResetEmail && !error && (
              <p className="text-sm font-medium text-ink/60">
                Check your email to finish setting a password.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
