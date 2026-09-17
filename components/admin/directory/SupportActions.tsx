"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Eye, Info, KeyRound, Loader2, MailCheck, Trash2 } from "lucide-react";
import { submitUserSupportAction, startImpersonationSession } from "./api";
import { useDialogFocusTrap } from "@/components/admin/useDialogFocusTrap";
import ModalPortal from "@/components/admin/ui/ModalPortal";
import { IMPERSONATION_REASON_MAX_LENGTH, IMPERSONATION_TICKET_REFERENCE_MAX_LENGTH } from "@/lib/validations/admin";
import type { Role, SerializedAccountDeletionResult } from "./types";

/**
 * Support actions — docs/ADMIN-CONSOLE-PLAN.md §4.3: "send password reset,
 * resend verification, delete", plus §8.2's "view as this user" (Phase 5,
 * now built — this comment previously said impersonation was out of scope
 * here; that was true through Phase 4 and is no longer accurate). Suspend/
 * restore are still absent — see lib/admin/users.ts's module doc comment (no
 * status column yet).
 *
 * `password_reset` / `resend_verification` are low-risk and fire
 * immediately. `delete` is irreversible (the RA 10173 anonymisation path) and
 * gets the SAME typed-confirmation friction as the Phase 1 bulk-reject
 * dialog (components/admin/queue/BulkBar.tsx's `TypedConfirmDialog`) — here
 * the operator must type the account's exact email rather than a count,
 * since there is only ever one item to confirm.
 *
 * `canImpersonate` is resolved server-side by `app/admin/users/[id]/page.tsx`
 * via the real `hasPermission(ctx.access, "impersonate")` export and handed
 * down as a plain boolean — this component never re-derives it (same
 * discipline as `FeatureFlagsManager`'s `canManage`). `targetRole` gates the
 * SAME `Role.ADMIN` refusal the backend enforces (`assertTargetNotAdmin` in
 * lib/admin/impersonation.ts) — surfaced here as a disabled control with a
 * visible reason instead of letting the operator submit and eat a 403.
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

  const confirmed = typedEmail.trim().toLowerCase() === email.toLowerCase();

  useDialogFocusTrap(dialogRef, onCancel);

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-body"
        className="w-full max-w-md rounded-2xl border border-ember/25 bg-white p-6 shadow-lg admin-dark:border-ember/30 admin-dark:bg-admin-dark-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-ember" aria-hidden="true" />
          <div>
            <h2 id="delete-confirm-title" className="font-display text-lg font-bold text-ink admin-dark:text-mist">
              Delete this account?
            </h2>
            <p id="delete-confirm-body" className="mt-1 text-sm text-ink/65 admin-dark:text-mist/65">
              This is <strong className="text-ember">irreversible</strong>. It runs the RA 10173 anonymisation path:
              the account&rsquo;s email and identifying profile fields are permanently anonymised, any company it
              owns is anonymised too, its memberships are removed, and its active job listings are closed. This
              cannot be undone from this console.
            </p>
          </div>
        </div>

        <label htmlFor="delete-typed-email" className="mb-1 mt-2 block text-xs font-semibold text-ink/70 admin-dark:text-mist/70">
          Type <span className="font-data font-bold text-ink admin-dark:text-mist">{email}</span> to confirm
        </label>
        <input
          id="delete-typed-email"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={typedEmail}
          onChange={(e) => setTypedEmail(e.target.value)}
          className="w-full rounded-lg border border-ink/10 px-3 py-2 font-data text-sm outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:focus:border-ember admin-dark:focus:ring-ember/20"
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
            className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:border-white/15 admin-dark:text-mist/65 admin-dark:hover:bg-white/10"
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
    </ModalPortal>
  );
}

type ImpersonationDialogProps = {
  email: string;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (input: { ticketReference: string; reason: string }) => void;
};

/**
 * The consent-and-ticket record §8.2 requires before a session can start.
 * Both fields are mandatory — the confirm button stays disabled until each
 * has non-whitespace content — and length-bounded with the SAME constants
 * `impersonationStartSchema` enforces server-side, imported rather than
 * re-typed. Uses the shared `useDialogFocusTrap` (this is the fourth modal
 * in this admin console's directory area; the third — `AdminProfileEditor`'s
 * revoke dialog — is what finally justified extracting that hook instead of
 * hand-rolling a fourth inline copy here).
 */
function ImpersonationStartDialog({ email, submitting, error, onCancel, onConfirm }: ImpersonationDialogProps) {
  const [ticketReference, setTicketReference] = useState("");
  const [reason, setReason] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onCancel);

  const canSubmit = ticketReference.trim().length > 0 && reason.trim().length > 0 && !submitting;

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="impersonate-start-title"
        aria-describedby="impersonate-start-body"
        className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-lg admin-dark:border-white/10 admin-dark:bg-admin-dark-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-3">
          <Eye className="mt-0.5 h-5 w-5 shrink-0 text-navy admin-dark:text-teal" aria-hidden="true" />
          <div>
            <h2 id="impersonate-start-title" className="font-display text-lg font-bold text-ink admin-dark:text-mist">
              View as {email}?
            </h2>
            <p id="impersonate-start-body" className="mt-1 text-sm text-ink/65 admin-dark:text-mist/65">
              This opens a <strong className="text-ink admin-dark:text-mist">read-only</strong> session showing exactly what this account
              sees — no changes can be made through it. It lasts at most <strong className="text-ink admin-dark:text-mist">1 hour</strong>{" "}
              and ends automatically. <strong className="text-ink admin-dark:text-mist">Every page you view while it&rsquo;s active is
              audited</strong> against the ticket reference and reason below.
            </p>
          </div>
        </div>

        <label htmlFor="impersonate-ticket" className="mb-1 mt-2 block text-xs font-semibold text-ink/70 admin-dark:text-mist/70">
          Support ticket reference
        </label>
        <input
          id="impersonate-ticket"
          type="text"
          autoComplete="off"
          value={ticketReference}
          maxLength={IMPERSONATION_TICKET_REFERENCE_MAX_LENGTH}
          onChange={(e) => setTicketReference(e.target.value)}
          placeholder="e.g. ZENDESK-4821"
          className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:placeholder:text-mist/35"
        />

        <label htmlFor="impersonate-reason" className="mb-1 mt-3 block text-xs font-semibold text-ink/70 admin-dark:text-mist/70">
          Reason
        </label>
        <textarea
          id="impersonate-reason"
          rows={3}
          value={reason}
          maxLength={IMPERSONATION_REASON_MAX_LENGTH}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What are you investigating?"
          className="w-full resize-none rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:placeholder:text-mist/35"
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
            aria-label="Cancel starting a view-as session"
            className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:border-white/15 admin-dark:text-mist/65 admin-dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onConfirm({ ticketReference: ticketReference.trim(), reason: reason.trim() })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Start session
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

export type SupportActionsProps = {
  userId: string;
  email: string;
  emailVerified: boolean;
  targetRole: Role;
  canImpersonate: boolean;
  onDeleted: (result: SerializedAccountDeletionResult) => void;
};

const IMPERSONATE_ADMIN_TARGET_REASON_ID = "impersonate-admin-target-reason";
const IMPERSONATE_NO_PERMISSION_REASON_ID = "impersonate-no-permission-reason";

export default function SupportActions({
  userId,
  email,
  emailVerified,
  targetRole,
  canImpersonate,
  onDeleted,
}: SupportActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"password_reset" | "resend_verification" | "delete" | null>(null);
  const [announce, setAnnounce] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  const [impersonateSubmitting, setImpersonateSubmitting] = useState(false);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  const isAdminTarget = targetRole === "ADMIN";
  const impersonateDisabled = !canImpersonate || isAdminTarget;
  const impersonateDisabledReasonId = isAdminTarget
    ? IMPERSONATE_ADMIN_TARGET_REASON_ID
    : !canImpersonate
      ? IMPERSONATE_NO_PERMISSION_REASON_ID
      : undefined;

  async function handleStartImpersonation(input: { ticketReference: string; reason: string }) {
    setImpersonateSubmitting(true);
    setImpersonateError(null);
    const res = await startImpersonationSession({ targetUserId: userId, ...input });
    setImpersonateSubmitting(false);
    if (!res.ok) {
      setImpersonateError(res.error);
      return;
    }
    setImpersonateDialogOpen(false);
    // §8.2's view-as overlay only ever renders /seeker or /employer reads
    // (lib/admin/impersonation.ts's module doc comment) — ADMIN targets are
    // refused before this point, so `targetRole` here is always one of
    // these two.
    router.push(targetRole === "SEEKER" ? "/seeker/dashboard" : "/employer/dashboard");
  }

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
    // Plain action bar, not a card — buttons that don't need visual
    // isolation of their own, just separation from Activity above (a top
    // divider does that on its own, per the card-density pass: this section
    // is a row of controls, not a body of content to box in).
    <section aria-labelledby="support-actions-heading" className="border-t border-ink/10 pt-5 admin-dark:border-white/10">
      <h2 id="support-actions-heading" className="font-display text-lg font-bold text-ink admin-dark:text-mist">
        Support actions
      </h2>
      <div aria-live="polite" role="status" className="sr-only">
        {announce}
      </div>
      {announce && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ink/60 admin-dark:text-mist/60">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal" aria-hidden="true" />
          {announce}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void handlePasswordReset()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 px-3.5 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:border-white/15 admin-dark:text-mist/70 admin-dark:hover:bg-white/10"
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
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 px-3.5 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:border-white/15 admin-dark:text-mist/70 admin-dark:hover:bg-white/10"
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
          disabled={pending !== null || impersonateDisabled}
          aria-describedby={impersonateDisabledReasonId}
          onClick={() => {
            setImpersonateError(null);
            setImpersonateDialogOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-navy/20 px-3.5 py-2 text-sm font-semibold text-navy hover:bg-navy/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:border-teal/30 admin-dark:text-teal admin-dark:hover:bg-teal/10"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          View as this user…
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => {
            setDeleteError(null);
            setDeleteDialogOpen(true);
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-ember/30 px-3.5 py-2 text-sm font-semibold text-ember hover:bg-ember/5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember admin-dark:bg-ember/[0.05] admin-dark:hover:bg-ember/10 admin-dark:hover:border-ember/40"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete account…
        </button>
      </div>

      {isAdminTarget && (
        <p
          id={IMPERSONATE_ADMIN_TARGET_REASON_ID}
          className="mt-2 flex items-start gap-1.5 text-xs text-ink/50 admin-dark:text-mist/50"
        >
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Admin accounts cannot be viewed as — the view-as overlay only ever covers seeker/employer surfaces.
        </p>
      )}
      {!isAdminTarget && !canImpersonate && (
        <p
          id={IMPERSONATE_NO_PERMISSION_REASON_ID}
          className="mt-2 flex items-start gap-1.5 text-xs text-ink/50 admin-dark:text-mist/50"
        >
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          You do not hold the impersonate permission — this is SUPER_ADMIN-only.
        </p>
      )}

      {deleteDialogOpen && (
        <DeleteConfirmDialog
          email={email}
          submitting={pending === "delete"}
          error={deleteError}
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={() => void handleConfirmDelete()}
        />
      )}

      {impersonateDialogOpen && (
        <ImpersonationStartDialog
          email={email}
          submitting={impersonateSubmitting}
          error={impersonateError}
          onCancel={() => setImpersonateDialogOpen(false)}
          onConfirm={(input) => void handleStartImpersonation(input)}
        />
      )}
    </section>
  );
}
