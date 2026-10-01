"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Clock3, KeyRound } from "lucide-react";
import { Button, Select } from "@/components/employer/system";

type Candidate = { memberId: string; email: string; isSeeker: boolean; ownsCompany: boolean };
export type OwnershipTransferState = {
  pending: { email: string; requestedAt: string; expiresAt: string } | null;
  candidates: Candidate[];
};

const CONFIRMATION_PHRASE = "TRANSFER OWNERSHIP";

function retryWindowLabel(res: Response): string {
  const seconds = Number(res.headers.get("Retry-After"));
  if (!Number.isFinite(seconds) || seconds <= 0) return "later";
  if (seconds < 60) return `in ${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `in about ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/**
 * Owner-only. Offers the company to a teammate; nothing moves until they
 * accept from /hiring (see lib/company-ownership-transfer.ts). Collapsed to
 * one row until opened, so the Team page doesn't lead with a form for a
 * once-in-a-company's-life action.
 */
export default function OwnershipTransferPanel({
  initialState,
  hasPassword,
}: {
  initialState: OwnershipTransferState;
  hasPassword: boolean;
}) {
  const [state, setState] = useState(initialState);
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const headingId = useId();
  const credentialId = useId();
  const errorId = useId();

  const eligible = state.candidates.filter((c) => !c.ownsCompany);
  const ineligible = state.candidates.filter((c) => c.ownsCompany);
  const selected = eligible.find((c) => c.memberId === memberId) ?? null;
  const canSubmit =
    !submitting &&
    selected !== null &&
    (hasPassword ? password.length > 0 : confirmation.trim().toUpperCase() === CONFIRMATION_PHRASE);

  function reset() {
    setOpen(false);
    setMemberId("");
    setPassword("");
    setConfirmation("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setError(null);
    setSubmitting(true);
    setStatus("Sending the ownership offer…");
    try {
      const res = await fetch("/api/employer/team/ownership-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hasPassword ? { memberId, password } : { memberId, confirmation }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          res.status === 429
            ? `Too many attempts. Try again ${retryWindowLabel(res)}.`
            : ((data as { error?: string } | null)?.error ?? "Couldn't send the offer. Please try again.");
        setError(message);
        setStatus(message);
        return;
      }
      setState(data as OwnershipTransferState);
      reset();
      setStatus(`Offer sent to ${selected.email}.`);
    } catch {
      const message = "Couldn't send the offer. Please check your connection and try again.";
      setError(message);
      setStatus(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/employer/team/ownership-transfer", { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { error?: string } | null)?.error ?? "Couldn't withdraw the offer. Please try again.");
        return;
      }
      setState(data as OwnershipTransferState);
      setStatus("Offer withdrawn.");
    } catch {
      setError("Couldn't withdraw the offer. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby={headingId} className="rounded-card border border-eh-line bg-eh-surface p-5 shadow-eh-sm sm:p-6">
      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-[color-mix(in_srgb,var(--eh-navy)_10%,var(--eh-surface))] text-eh-navy">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id={headingId} className="font-heading text-[18px] font-semibold tracking-[-0.01em] text-eh-ink">
              Transfer ownership
            </h2>
            <p className="mt-0.5 max-w-2xl text-ui text-eh-muted">
              Hand this company, its jobs, billing, and hiring team to a teammate. They have to accept
              before anything changes, and you stay on the team as a recruiter.
            </p>
          </div>
        </div>

        {!state.pending && !open && eligible.length > 0 && (
          <Button onClick={() => setOpen(true)} className="self-start">
            Choose a new owner
          </Button>
        )}
      </div>

      {state.pending && (
        <div className="mt-4 flex flex-col gap-3 border-t border-eh-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex min-w-0 items-start gap-2 text-ui text-eh-ink-2">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-eh-teal" aria-hidden="true" />
            <span>
              Waiting for <strong className="font-semibold text-eh-ink">{state.pending.email}</strong> to accept.
              The offer expires{" "}
              <span suppressHydrationWarning>{new Date(state.pending.expiresAt).toLocaleDateString()}</span>.
            </span>
          </p>
          <Button variant="ghost" onClick={handleWithdraw} loading={submitting} className="self-start sm:self-auto">
            {submitting ? "Withdrawing…" : "Withdraw offer"}
          </Button>
        </div>
      )}

      {!state.pending && eligible.length === 0 && (
        <p className="mt-4 border-t border-eh-line pt-4 text-ui text-eh-muted">
          {state.candidates.length === 0
            ? "Only an active teammate can take over. Invite someone to the team first."
            : "None of your teammates can take over right now. Each of them already owns a company, and an account can own only one."}
        </p>
      )}

      {!state.pending && open && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex max-w-md flex-col gap-4 border-t border-eh-line pt-4"
          noValidate
        >
          <div>
            <p className="mb-1.5 text-small font-medium text-eh-ink-2" aria-hidden="true">
              New owner
            </p>
            <Select
              label="New owner"
              value={memberId}
              onChange={setMemberId}
              placeholder="Choose a teammate"
              className="h-10 w-full"
              options={eligible.map((c) => ({
                value: c.memberId,
                label: c.email,
                description: c.isSeeker ? "Job-seeker account" : "Employer account",
              }))}
            />
            {ineligible.length > 0 && (
              <p className="mt-1.5 text-small text-eh-muted">
                Not listed: {ineligible.map((c) => c.email).join(", ")}. They already own a company.
              </p>
            )}
          </div>

          {selected?.isSeeker && (
            <p className="rounded-control border border-[color-mix(in_srgb,var(--eh-marigold)_45%,var(--eh-line))] bg-eh-marigold-tint px-3 py-2.5 text-ui text-eh-ink-2">
              <strong className="font-semibold text-eh-ink">{selected.email}</strong> has a job-seeker account.
              Accepting turns it into an employer account. Their seeker profile and applications are kept,
              but they won&apos;t be able to reach them while it&apos;s an employer account. The offer email
              tells them this too.
            </p>
          )}

          <div>
            <label htmlFor={credentialId} className="mb-1.5 block text-small font-medium text-eh-ink-2">
              {hasPassword ? "Your current password" : `Type “${CONFIRMATION_PHRASE}” to confirm`}
            </label>
            <input
              id={credentialId}
              type={hasPassword ? "password" : "text"}
              value={hasPassword ? password : confirmation}
              onChange={(event) =>
                hasPassword ? setPassword(event.target.value) : setConfirmation(event.target.value)
              }
              autoComplete={hasPassword ? "current-password" : "off"}
              spellCheck={false}
              aria-describedby={error ? errorId : undefined}
              className="h-10 w-full rounded-control border border-eh-line bg-eh-surface px-3 text-ui text-eh-ink outline-none transition-colors duration-150 hover:border-[color-mix(in_srgb,var(--eh-ink)_22%,var(--eh-line))] focus-visible:border-eh-teal"
            />
          </div>

          {error && (
            <p id={errorId} role="alert" className="text-ui text-eh-danger">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary" disabled={!canSubmit} loading={submitting}>
              {submitting ? "Sending…" : "Send ownership offer"}
            </Button>
            <Button variant="ghost" onClick={reset} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {error && !open && (
        <p role="alert" className="mt-3 text-ui text-eh-danger">
          {error}
        </p>
      )}
    </section>
  );
}
