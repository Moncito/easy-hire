"use client";

import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { Copy, Download, Info, KeyRound, Loader2, Mail, ShieldCheck, ShieldOff } from "lucide-react";

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
  /**
   * Pre-formatted relative-time string ("24d ago"), or null when
   * unavailable. Computed server-side (see AccountSettingsSections) so this
   * client component never calls `Date.now()` during render — doing that
   * here would risk a hydration mismatch between the server-rendered HTML
   * and the client's first render. Null covers two distinct cases that
   * must not be conflated: a Google-only account with no password at all,
   * and a credentials account whose change date predates the column and so
   * is genuinely unknown — never treat null as "never changed".
   */
  passwordChangedLabel: string | null;
};

type TwoFactorStatus = {
  enabled: boolean;
  unusedRecoveryCodeCount: number;
};

type EnrollmentData = {
  otpauthUri: string;
  qrCodeDataUrl: string;
};

type SetupStep = "idle" | "starting" | "verify" | "recovery";

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

/**
 * The `/enroll` response never returns the secret as its own field — only
 * inside the `otpauth://` URI it builds for the QR code (see `buildTotpUri`
 * in lib/auth/two-factor.ts). Pulling it back out here, purely for display
 * as the manual-entry key, doesn't expose anything the QR image doesn't
 * already encode — it's the same one-time value either way, and this
 * component never sends it anywhere or logs it.
 */
function extractManualKey(otpauthUri: string): string | null {
  const queryIndex = otpauthUri.indexOf("?");
  if (queryIndex === -1) return null;
  const params = new URLSearchParams(otpauthUri.slice(queryIndex + 1));
  return params.get("secret");
}

/** Strips everything but digits so a pasted code with spaces or dashes still works, and caps at 6 — mirrors the server's `^\d{6}$` check (after its own trim). */
function sanitizeCodeInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export default function AccountSecurityPanel({ role, hasPassword, passwordChangedLabel }: Props) {
  const isEmployer = role === "EMPLOYER";
  const accentBg = isEmployer ? "bg-teal/15 text-teal" : "bg-marigold/20 text-[#9A5B12]";
  const accentButton = isEmployer ? "bg-teal hover:bg-teal/90" : "bg-navy hover:bg-navy/90";
  const accentFocus = isEmployer
    ? "focus:border-teal focus:ring-teal/20"
    : "focus:border-marigold focus:ring-marigold/20";

  // --- Password state ---
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

  // --- Two-factor state ---
  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null);
  const [twoFactorLoadError, setTwoFactorLoadError] = useState<string | null>(null);
  const [twoFactorStatusMsg, setTwoFactorStatusMsg] = useState("");

  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [recoveryAcknowledged, setRecoveryAcknowledged] = useState(false);
  const [recoveryCopied, setRecoveryCopied] = useState(false);

  const [disableOpen, setDisableOpen] = useState(false);
  const [disableMode, setDisableMode] = useState<"password" | "code">(hasPassword ? "password" : "code");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disableSubmitting, setDisableSubmitting] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  const twoFactorHeadingId = useId();
  const codeInputId = useId();
  const setupErrorId = useId();
  const disablePasswordId = useId();
  const disableCodeId = useId();
  const disableErrorId = useId();

  const manualKey = enrollment ? extractManualKey(enrollment.otpauthUri) : null;

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const res = await fetch("/api/account/2fa");
        if (!res.ok) throw new Error("status_failed");
        const data = (await res.json()) as TwoFactorStatus;
        if (!cancelled) setTwoFactor(data);
      } catch {
        if (!cancelled) {
          setTwoFactorLoadError("Couldn't load your two-factor status. Refresh to try again.");
        }
      }
    }
    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

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

  async function handleStartSetup() {
    setSetupError(null);
    setSetupStep("starting");
    setTwoFactorStatusMsg("Starting two-factor setup…");
    try {
      const res = await fetch("/api/account/2fa/enroll", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          res.status === 429
            ? `You've reached the setup attempt limit. Try again ${retryWindowLabel(res)}.`
            : ((body as { error?: string } | null)?.error ?? "Couldn't start setup. Please try again.");
        setSetupError(message);
        setTwoFactorStatusMsg(message);
        setSetupStep("idle");
        return;
      }

      const data = (await res.json()) as { ok: true; otpauthUri: string; qrCodeDataUrl: string };
      setEnrollment({ otpauthUri: data.otpauthUri, qrCodeDataUrl: data.qrCodeDataUrl });
      setCode("");
      setSetupStep("verify");
      setTwoFactorStatusMsg("Scan the QR code, then enter the 6-digit code from your authenticator app.");
    } catch {
      const message = "Couldn't start setup. Please check your connection and try again.";
      setSetupError(message);
      setTwoFactorStatusMsg(message);
      setSetupStep("idle");
    }
  }

  function cancelSetup() {
    setSetupStep("idle");
    setEnrollment(null);
    setCode("");
    setSetupError(null);
    setTwoFactorStatusMsg("");
  }

  async function handleConfirmCode(event: FormEvent) {
    event.preventDefault();
    setSetupError(null);

    if (code.length !== 6) {
      setSetupError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setConfirmSubmitting(true);
    setTwoFactorStatusMsg("Checking your code…");
    try {
      const res = await fetch("/api/account/2fa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          res.status === 429
            ? `Too many attempts. Try again ${retryWindowLabel(res)}.`
            : ((data as { error?: string } | null)?.error ??
              "Incorrect code. Check the time on your device and try again.");
        setSetupError(message);
        setTwoFactorStatusMsg(message);
        return;
      }

      const codes = (data as { ok: true; recoveryCodes: string[] }).recoveryCodes;
      setRecoveryCodes(codes);
      setRecoveryAcknowledged(false);
      setRecoveryCopied(false);
      setSetupStep("recovery");
      setTwoFactor({ enabled: true, unusedRecoveryCodeCount: codes.length });
      setTwoFactorStatusMsg(
        "Two-factor authentication is on. Save your recovery codes before leaving this screen."
      );
    } catch {
      const message = "Couldn't verify your code. Please check your connection and try again.";
      setSetupError(message);
      setTwoFactorStatusMsg(message);
    } finally {
      setConfirmSubmitting(false);
    }
  }

  async function copyRecoveryCodes() {
    if (!recoveryCodes) return;
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      setRecoveryCopied(true);
      setTwoFactorStatusMsg("Recovery codes copied to your clipboard.");
    } catch {
      setTwoFactorStatusMsg("Couldn't copy automatically — select and copy the codes manually.");
    }
  }

  function downloadRecoveryCodes() {
    if (!recoveryCodes) return;
    const contents = [
      "EasyHire VA Solutions — two-factor recovery codes",
      `Generated ${new Date().toISOString()}`,
      "Each code works once. Store this somewhere safe — these will not be shown again.",
      "",
      ...recoveryCodes,
      "",
    ].join("\n");
    const blob = new Blob([contents], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "easyhire-recovery-codes.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setTwoFactorStatusMsg("Recovery codes downloaded.");
  }

  function finishRecoveryStep() {
    setSetupStep("idle");
    setEnrollment(null);
    setRecoveryCodes(null);
    setRecoveryAcknowledged(false);
    setRecoveryCopied(false);
    setCode("");
    setTwoFactorStatusMsg("Two-factor authentication is on.");
  }

  function openDisable() {
    setDisableOpen(true);
    setDisableError(null);
    setDisablePassword("");
    setDisableCode("");
    setDisableMode(hasPassword ? "password" : "code");
  }

  function cancelDisable() {
    setDisableOpen(false);
    setDisableError(null);
    setDisablePassword("");
    setDisableCode("");
    setTwoFactorStatusMsg("");
  }

  async function handleDisable(event: FormEvent) {
    event.preventDefault();
    setDisableError(null);
    setDisableSubmitting(true);
    setTwoFactorStatusMsg("Turning off two-factor authentication…");
    try {
      const body = disableMode === "password" ? { password: disablePassword } : { code: disableCode };
      const res = await fetch("/api/account/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          res.status === 429
            ? `Too many attempts. Try again ${retryWindowLabel(res)}.`
            : ((data as { error?: string } | null)?.error ??
              "Couldn't turn off two-factor authentication. Please try again.");
        setDisableError(message);
        setTwoFactorStatusMsg(message);
        return;
      }

      setTwoFactor({ enabled: false, unusedRecoveryCodeCount: 0 });
      setDisableOpen(false);
      setDisablePassword("");
      setDisableCode("");
      setTwoFactorStatusMsg("Two-factor authentication is off.");
    } catch {
      const message =
        "Couldn't turn off two-factor authentication. Please check your connection and try again.";
      setDisableError(message);
      setTwoFactorStatusMsg(message);
    } finally {
      setDisableSubmitting(false);
    }
  }

  const disableSubmitDisabled =
    disableSubmitting || (disableMode === "password" ? disablePassword.length === 0 : disableCode.length !== 6);

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
          <p className="mt-2 text-xs text-ink/40">
            {passwordChangedLabel ? `Last changed ${passwordChangedLabel}` : "Last change not recorded"}
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
                className={`w-full rounded-xl border border-ink/12 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:ring-2 ${accentFocus}`}
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
                className={`w-full rounded-xl border border-ink/12 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:ring-2 ${accentFocus}`}
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
                className={`w-full rounded-xl border border-ink/12 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:ring-2 ${accentFocus}`}
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
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${accentButton}`}
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
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${accentButton}`}
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

      {/* Two-factor authentication */}
      <div className="mt-6 border-t border-ink/10 pt-6">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentBg}`}>
            <ShieldCheck className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 id={twoFactorHeadingId} className="font-display text-base font-bold text-ink">
              Two-factor authentication
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/60">
              Require a 6-digit code from an authenticator app, in addition to your password, when
              signing in.
            </p>
          </div>
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          {twoFactorStatusMsg}
        </div>

        {/* Honesty notices — always visible, not tucked behind any state */}
        <div className="mt-3 max-w-2xl space-y-2.5 rounded-xl border border-navy/15 bg-navy/[0.04] p-3.5 text-sm leading-relaxed text-ink/70">
          <p className="flex gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-navy" strokeWidth={2} aria-hidden="true" />
            <span>
              <strong className="font-semibold text-ink">Google sign-in isn&apos;t covered.</strong> This
              code is only checked when you sign in with your password. If your account also has Google
              linked, signing in with Google still skips it — we can&apos;t add a second step to a login
              we don&apos;t control.
            </span>
          </p>
          <p className="flex gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-navy" strokeWidth={2} aria-hidden="true" />
            <span>
              <strong className="font-semibold text-ink">Not required yet.</strong> Setup is available
              now; we&apos;ll start requiring your code at sign-in shortly. Turning this on today
              doesn&apos;t change how you log in.
            </span>
          </p>
        </div>

        <div className="mt-4">
          {twoFactor === null && !twoFactorLoadError && (
            <div className="max-w-sm space-y-2" aria-hidden="true">
              <div className="h-10 w-48 animate-pulse rounded-xl bg-ink/[0.05]" />
            </div>
          )}

          {twoFactorLoadError && (
            <p role="alert" className="text-sm text-ember">
              {twoFactorLoadError}
            </p>
          )}

          {/* Not enrolled */}
          {twoFactor && !twoFactor.enabled && setupStep === "idle" && (
            <button
              type="button"
              onClick={handleStartSetup}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] ${accentButton}`}
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              Set up two-factor authentication
            </button>
          )}

          {setupStep === "starting" && (
            <p className="flex items-center gap-2 text-sm text-ink/55">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Starting setup…
            </p>
          )}

          {/* Setup: QR + manual key + verify code */}
          {setupStep === "verify" && enrollment && (
            <div className="max-w-sm">
              <div className="flex flex-col items-start gap-4 sm:flex-row">
                {/* Freshly generated `data:image/png;base64,...` per enrollment — next/image's
                    optimizer has nothing to fetch or cache here, so a plain <img> is correct. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={enrollment.qrCodeDataUrl}
                  alt="QR code for two-factor setup — scan with your authenticator app"
                  width={152}
                  height={152}
                  className="h-[152px] w-[152px] shrink-0 rounded-lg border border-ink/10 bg-white p-2"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink/80">Can&apos;t scan the code?</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink/50">
                    Enter this key manually in your authenticator app instead.
                  </p>
                  <code className="mt-1.5 block w-full break-all rounded-lg bg-ink/5 px-3 py-2 font-data text-xs text-ink">
                    {manualKey ?? "Unavailable — cancel and start setup again."}
                  </code>
                </div>
              </div>

              <form onSubmit={handleConfirmCode} className="mt-5 flex flex-col gap-4" noValidate>
                <div>
                  <label htmlFor={codeInputId} className="mb-1.5 block text-sm font-medium text-ink/80">
                    6-digit code
                  </label>
                  <input
                    id={codeInputId}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => setCode(sanitizeCodeInput(event.target.value))}
                    placeholder="000000"
                    aria-describedby={setupError ? setupErrorId : undefined}
                    className={`w-full max-w-[10rem] rounded-xl border border-ink/12 px-4 py-2.5 text-center font-data text-lg tracking-[0.3em] text-ink outline-none transition-colors focus:ring-2 ${accentFocus}`}
                  />
                </div>

                {setupError && (
                  <p id={setupErrorId} role="alert" className="text-sm text-ember">
                    {setupError}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={confirmSubmitting || code.length !== 6}
                    aria-busy={confirmSubmitting}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${accentButton}`}
                  >
                    {confirmSubmitting ? "Verifying…" : "Verify and turn on"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelSetup}
                    disabled={confirmSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-ink/60 transition hover:bg-ink/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Recovery codes — shown exactly once, never retrievable again */}
          {setupStep === "recovery" && recoveryCodes && (
            <div className="max-w-lg">
              <div
                className={`rounded-xl border p-4 text-sm leading-relaxed text-ink/80 ${
                  isEmployer ? "border-teal/25 bg-teal/[0.06]" : "border-marigold/30 bg-marigold/[0.08]"
                }`}
              >
                <strong className="font-semibold text-ink">Save these recovery codes now.</strong> Each
                one works once, and this is the only time they will ever be shown — EasyHire cannot
                redisplay or recover them later. If you lose your authenticator app and don&apos;t have
                one of these, you will be locked out of password sign-in.
              </div>

              <ul className="mt-4 grid grid-cols-2 gap-2 font-data text-sm text-ink">
                {recoveryCodes.map((recoveryCode) => (
                  <li key={recoveryCode} className="rounded-lg bg-ink/5 px-3 py-2 text-center">
                    {recoveryCode}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copyRecoveryCodes}
                  className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/75 transition hover:bg-ink/[0.04] active:scale-[0.98]"
                >
                  <Copy className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  {recoveryCopied ? "Copied" : "Copy codes"}
                </button>
                <button
                  type="button"
                  onClick={downloadRecoveryCodes}
                  className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/75 transition hover:bg-ink/[0.04] active:scale-[0.98]"
                >
                  <Download className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  Download as .txt
                </button>
              </div>

              <label className="mt-5 flex items-start gap-2.5 text-sm text-ink/75">
                <input
                  type="checkbox"
                  checked={recoveryAcknowledged}
                  onChange={(event) => setRecoveryAcknowledged(event.target.checked)}
                  className={`mt-0.5 h-4 w-4 rounded border-ink/30 ${isEmployer ? "accent-teal" : "accent-marigold"}`}
                />
                <span>I&apos;ve saved these recovery codes somewhere safe.</span>
              </label>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={finishRecoveryStep}
                  disabled={!recoveryAcknowledged}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${accentButton}`}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Enrolled */}
          {twoFactor && twoFactor.enabled && setupStep === "idle" && (
            <div className="max-w-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white/60 p-4">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                  <ShieldCheck
                    className={`h-4 w-4 ${isEmployer ? "text-teal" : "text-[#9A5B12]"}`}
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                  Two-factor authentication is on
                </span>
                <span className="font-data text-xs text-ink/55">
                  {twoFactor.unusedRecoveryCodeCount} recovery{" "}
                  {twoFactor.unusedRecoveryCodeCount === 1 ? "code" : "codes"} left
                </span>
              </div>

              {twoFactor.unusedRecoveryCodeCount === 0 && (
                <p className="mt-2 text-sm text-ember">
                  You have no recovery codes left. If you lose access to your authenticator app you
                  won&apos;t be able to get back in — turn two-factor off and set it up again for a
                  fresh set.
                </p>
              )}

              {!disableOpen ? (
                <button
                  type="button"
                  onClick={openDisable}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-ember px-5 py-2.5 text-sm font-semibold text-ember transition hover:bg-ember/10 active:scale-[0.98]"
                >
                  <ShieldOff className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  Turn off
                </button>
              ) : (
                <form onSubmit={handleDisable} className="mt-4 flex flex-col gap-4" noValidate>
                  {hasPassword && (
                    <fieldset className="text-sm text-ink/75">
                      <legend className="mb-1.5 block text-sm font-medium text-ink/80">
                        Confirm it&apos;s you
                      </legend>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="two-factor-disable-mode"
                            checked={disableMode === "password"}
                            onChange={() => setDisableMode("password")}
                            className="accent-ember"
                          />
                          My password
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="two-factor-disable-mode"
                            checked={disableMode === "code"}
                            onChange={() => setDisableMode("code")}
                            className="accent-ember"
                          />
                          A 6-digit code
                        </label>
                      </div>
                    </fieldset>
                  )}

                  {disableMode === "password" ? (
                    <div>
                      <label htmlFor={disablePasswordId} className="mb-1.5 block text-sm font-medium text-ink/80">
                        Current password
                      </label>
                      <input
                        id={disablePasswordId}
                        type="password"
                        value={disablePassword}
                        onChange={(event) => setDisablePassword(event.target.value)}
                        autoComplete="current-password"
                        aria-describedby={disableError ? disableErrorId : undefined}
                        className="w-full max-w-xs rounded-xl border border-ember/30 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ember focus:ring-2 focus:ring-ember/20"
                      />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor={disableCodeId} className="mb-1.5 block text-sm font-medium text-ink/80">
                        6-digit code
                      </label>
                      <input
                        id={disableCodeId}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={disableCode}
                        onChange={(event) => setDisableCode(sanitizeCodeInput(event.target.value))}
                        placeholder="000000"
                        aria-describedby={disableError ? disableErrorId : undefined}
                        className="w-full max-w-[10rem] rounded-xl border border-ember/30 px-4 py-2.5 text-center font-data text-lg tracking-[0.3em] text-ink outline-none transition-colors focus:border-ember focus:ring-2 focus:ring-ember/20"
                      />
                    </div>
                  )}

                  {disableError && (
                    <p id={disableErrorId} role="alert" className="text-sm text-ember">
                      {disableError}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={disableSubmitDisabled}
                      aria-busy={disableSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ember/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {disableSubmitting ? "Turning off…" : "Turn off two-factor authentication"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelDisable}
                      disabled={disableSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-ink/60 transition hover:bg-ink/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
