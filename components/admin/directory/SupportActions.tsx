"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, MailCheck, Trash2 } from "lucide-react";
import { submitUserSupportAction } from "./api";
import type { SerializedAccountDeletionResult } from "./types";

/**
 * Support actions — docs/ADMIN-CONSOLE-PLAN.md §4.3: "send password reset,
 * resend verification, delete." Suspend/restore and impersonate are
 * deliberately absent here — see lib/admin/users.ts's module doc comment
 * (no status column yet; impersonation is Phase 5) and the task brief.
 *
 * `password_reset` / `resend_verification` are low-risk and fire
 * immediately. `delete` is irreversible (the RA 10173 anonymisation path) and
 * gets the SAME typed-confirmation friction as the Phase 1 bulk-reject
 * dialog (components/admin/queue/BulkBar.tsx's `TypedConfirmDialog`) — here
 * the operator must type the account's exact email rather than a count,
 * since there is only ever one item to confirm.
 */

type DeleteDialogProps = {
  email: string;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteConfirmDialog({ email, submitting, error, onCancel, onConfirm }: DeleteDialogProps) {
  const [typedEmail, setTypedEmail] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const triggerElementRef = useRef<Element | null>(null);

  const confirmed = typedEmail.trim().toLowerCase() === email.toLowerCase();

  useEffect(() => {
    triggerElementRef.current = document.activeElement;
    firstFieldRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (triggerElementRef.current instanceof HTMLElement) {
        triggerElementRef.current.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-body"
        className="w-full max-w-md rounded-2xl border border-ember/25 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-ember" aria-hidden="true" />
          <div>
            <h2 id="delete-confirm-title" className="font-display text-lg font-bold text-ink">
              Delete this account?
            </h2>
            <p id="delete-confirm-body" className="mt-1 text-sm text-ink/65">
              This is <strong className="text-ember">irreversible</strong>. It runs the RA 10173 anonymisation path:
              the account&rsquo;s email and identifying profile fields are permanently anonymised, any company it
              owns is anonymised too, its memberships are removed, and its active job listings are closed. This
              cannot be undone from this console.
            </p>
          </div>
        </div>

        <label htmlFor="delete-typed-email" className="mb-1 mt-2 block text-xs font-semibold text-ink/70">
          Type <span className="font-data font-bold text-ink">{email}</span> to confirm
        </label>
        <input
          ref={firstFieldRef}
          id="delete-typed-email"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={typedEmail}
          onChange={(e) => setTypedEmail(e.target.value)}
          className="w-full rounded-lg border border-ink/10 px-3 py-2 font-data text-sm outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
        />

        {error && (
          <p role="alert" className="mt-2 text-xs text-ember">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel account deletion"
            className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!confirmed || submitting}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}

export type SupportActionsProps = {
  userId: string;
  email: string;
  emailVerified: boolean;
  onDeleted: (result: SerializedAccountDeletionResult) => void;
};

export default function SupportActions({ userId, email, emailVerified, onDeleted }: SupportActionsProps) {
  const [pending, setPending] = useState<"password_reset" | "resend_verification" | "delete" | null>(null);
  const [announce, setAnnounce] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handlePasswordReset() {
    setPending("password_reset");
    const res = await submitUserSupportAction(userId, "password_reset");
    setPending(null);
    setAnnounce(res.ok ? "Password reset email sent." : `Could not send the password reset: ${res.error}`);
  }

  async function handleResendVerification() {
    setPending("resend_verification");
    const res = await submitUserSupportAction(userId, "resend_verification");
    setPending(null);
    if (!res.ok) {
      setAnnounce(`Could not resend verification: ${res.error}`);
      return;
    }
    setAnnounce(
      res.result.action === "resend_verification" && res.result.status === "already_verified"
        ? "This account is already verified — no email was sent."
        : "Verification email sent."
    );
  }

  async function handleConfirmDelete() {
    setPending("delete");
    setDeleteError(null);
    const res = await submitUserSupportAction(userId, "delete");
    setPending(null);
    if (!res.ok) {
      setDeleteError(res.error);
      return;
    }
    setDeleteDialogOpen(false);
    if (res.result.action === "delete") {
      setAnnounce("Account deleted and anonymised.");
      onDeleted(res.result.result);
    }
  }

  return (
    <section aria-labelledby="support-actions-heading" className="rounded-2xl border border-ink/5 bg-white p-5">
      <h2 id="support-actions-heading" className="font-display text-lg font-bold text-ink">
        Support actions
      </h2>
      <div aria-live="polite" role="status" className="sr-only">
        {announce}
      </div>
      {announce && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ink/60">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal" aria-hidden="true" />
          {announce}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void handlePasswordReset()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 px-3.5 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        >
          {pending === "password_reset" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          )}
          Send password reset
        </button>
        <button
          type="button"
          disabled={pending !== null || emailVerified}
          onClick={() => void handleResendVerification()}
          title={emailVerified ? "This account is already verified" : undefined}
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 px-3.5 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        >
          {pending === "resend_verification" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <MailCheck className="h-4 w-4" aria-hidden="true" />
          )}
          Resend verification
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => {
            setDeleteError(null);
            setDeleteDialogOpen(true);
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-ember/30 px-3.5 py-2 text-sm font-semibold text-ember hover:bg-ember/5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete account…
        </button>
      </div>

      {deleteDialogOpen && (
        <DeleteConfirmDialog
          email={email}
          submitting={pending === "delete"}
          error={deleteError}
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={() => void handleConfirmDelete()}
        />
      )}
    </section>
  );
}
