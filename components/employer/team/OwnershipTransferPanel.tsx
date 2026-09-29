"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Clock3, KeyRound } from "lucide-react";
import EmployerFormSelect from "@/components/employer/ui/EmployerFormSelect";

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
    <section aria-labelledby={headingId} className="rounded-[20px] border border-ink/8 bg-white px-5 py-5 sm:px-6">
      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy/[0.07] text-navy">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id={headingId} className="font-display text-lg font-bold text-ink">
              Transfer ownership
            </h2>
            <p className="mt-0.5 max-w-2xl text-sm leading-relaxed text-ink/55">
              Hand this company, its jobs, billing, and hiring team to a teammate. They have to accept
              before anything changes, and you stay on the team as a recruiter.
            </p>
          </div>
        </div>

        {!state.pending && !open && eligible.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/75 transition hover:bg-ink/[0.04] active:scale-[0.98]"
          >
            Choose a new owner
          </button>
        )}
      </div>

      {state.pending && (
        <div className="mt-4 flex flex-col gap-3 border-t border-ink/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex min-w-0 items-start gap-2 text-sm text-ink/70">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
            <span>
              Waiting for <strong className="font-semibold text-ink">{state.pending.email}</strong> to accept.
              The offer expires{" "}
              <span suppressHydrationWarning>{new Date(state.pending.expiresAt).toLocaleDateString()}</span>.
            </span>
          </p>
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={submitting}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl px-4 py-2 text-sm font-semibold text-ink/60 transition hover:bg-ink/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            {submitting ? "Withdrawing…" : "Withdraw offer"}
          </button>
        </div>
      )}

      {!state.pending && eligible.length === 0 && (
        <p className="mt-4 border-t border-ink/[0.06] pt-4 text-sm text-ink/55">
          {state.candidates.length === 0
            ? "Only an active teammate can take over. Invite someone to the team first."
            : "None of your teammates can take over right now. Each of them already owns a company, and an account can own only one."}
        </p>
      )}

      {!state.pending && open && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex max-w-md flex-col gap-4 border-t border-ink/[0.06] pt-4"
          noValidate
        >
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink/80">New owner</p>
            <EmployerFormSelect
              ariaLabel="New owner"
              value={memberId}
              onChange={setMemberId}
              placeholder="Choose a teammate"
              options={eligible.map((c) => ({
                value: c.memberId,
                label: c.email,
                description: c.isSeeker ? "Job-seeker account" : "Employer account",
              }))}
            />
            {ineligible.length > 0 && (
              <p className="mt-1.5 text-xs text-ink/45">
                Not listed: {ineligible.map((c) => c.email).join(", ")}. They already own a company.
              </p>
            )}
          </div>

          {selected?.isSeeker && (
            <p className="text-sm leading-relaxed text-ink/65">
              <strong className="font-semibold text-ink">{selected.email}</strong> has a job-seeker account.
              Accepting turns it into an employer account. Their seeker profile and applications are kept,
              but they won&apos;t be able to reach them while it&apos;s an employer account. The offer email
              tells them this too.
            </p>
          )}

          <div>
            <label htmlFor={credentialId} className="mb-1.5 block text-sm font-medium text-ink/80">
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
              className="w-full rounded-xl border border-ink/12 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20"
            />
          </div>

          {error && (
            <p id={errorId} role="alert" className="text-sm text-ember">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              aria-busy={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send ownership offer"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-ink/60 transition hover:bg-ink/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && !open && (
        <p role="alert" className="mt-3 text-sm text-ember">
          {error}
        </p>
      )}
    </section>
  );
}
