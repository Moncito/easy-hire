"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import OtpInput, { type OtpInputHandle } from "@/components/ui/OtpInput";

type Props = {
  onSuccess?: () => void;
  showSignupLink?: boolean;
  idPrefix?: string;
};

// Two-factor step. "password" is the existing email + password form.
// "code" reveals after `Auth.ts` throws `totp_required` (password was
// correct, account has TOTP enabled) — see the comment on
// `TwoFactorRequired` in Auth.ts for why this and `totp_invalid` are the
// only two error codes this form is allowed to branch on.
type Step = "password" | "code";

// Which widget the code step shows. `Auth.ts` classifies whatever string
// lands in `totpCode` by shape (6 digits vs `xxxxx-xxxxx`) — this only
// controls which input is on screen, never the submitted field name/value.
type CodeMode = "totp" | "recovery";

export default function LoginForm({
  onSuccess,
  showSignupLink = true,
  idPrefix = "login",
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [codeMode, setCodeMode] = useState<CodeMode>("totp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  // Generic, indistinguishable failure — used for everything except
  // totp_required/totp_invalid (wrong password, rate_limited, etc.). Shown
  // on whichever step is active so a rate-limit hit mid-code-entry still
  // renders as this same unreadable failure instead of a new branch.
  const [error, setError] = useState("");
  // totp_invalid only — the code step's own error, kept separate from
  // `error` so the two can never be shown at once.
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const otpRef = useRef<OtpInputHandle>(null);
  const recoveryInputRef = useRef<HTMLInputElement>(null);
  const [focusCodeToken, setFocusCodeToken] = useState(0);

  useEffect(() => {
    if (step !== "code") return;
    if (codeMode === "totp") {
      otpRef.current?.focus();
    } else {
      recoveryInputRef.current?.focus();
      recoveryInputRef.current?.select();
    }
    // Re-focuses on: entering the code step (totp_required), a rejected
    // code (totp_invalid bumps focusCodeToken), and switching between the
    // 6-box and recovery-code widgets (codeMode) — deliberately not on
    // every `step` render, same as before this component had a mode toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCodeToken, codeMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCodeError("");
    setLoading(true);

    // next-auth's client `signIn` serializes this object via
    // `new URLSearchParams({...})`, which stringifies `undefined` to the
    // literal text "undefined" rather than omitting the key — so on step 1
    // this must be "" (not `undefined`), or a 2FA-enabled account would see
    // a non-empty, garbage totpCode and get misrouted to totp_invalid
    // instead of totp_required on the very first submit.
    const result = await signIn("credentials", {
      email,
      password,
      totpCode: step === "code" ? totpCode.trim() : "",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.code === "totp_required") {
        setStep("code");
        setFocusCodeToken((t) => t + 1);
        return;
      }

      if (result.code === "totp_invalid") {
        setCodeError("That code didn't work. Double-check it and try again.");
        setFocusCodeToken((t) => t + 1);
        return;
      }

      // Every other code (including rate_limited) stays this same generic
      // message on purpose — see the comment on LoginRateLimited in Auth.ts.
      setError("Invalid email or password.");
      return;
    }

    onSuccess?.();
    router.push("/dashboard");
  }

  function handleUseDifferentEmail() {
    setStep("password");
    setCodeMode("totp");
    setTotpCode("");
    setCodeError("");
    setError("");
  }

  function handleToggleCodeMode() {
    setCodeMode((m) => (m === "totp" ? "recovery" : "totp"));
    // The two modes hold differently-shaped values (6 digits vs
    // xxxxx-xxxxx) — carrying one over into the other widget would just be
    // confusing leftover text, not a usable partial code.
    setTotpCode("");
    setCodeError("");
  }

  return (
    <div>
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {step === "password" && (
          <>
            <div>
              <label htmlFor={`${idPrefix}-email`} className="sr-only">
                Email address
              </label>
              <input
                id={`${idPrefix}-email`}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-marigold focus:ring-2 focus:ring-marigold/20"
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-password`} className="sr-only">
                Password
              </label>
              <input
                id={`${idPrefix}-password`}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-marigold focus:ring-2 focus:ring-marigold/20"
              />
            </div>

            <div className="-mt-2 text-right">
              <Link
                href="/login/forgot"
                className="text-xs font-semibold text-ink/60 hover:text-ink hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </>
        )}

        {step === "code" && (
          <>
            <div>
              <p className="text-sm text-ink/70">
                Signing in as <span className="font-medium text-ink">{email}</span>.{" "}
                <button
                  type="button"
                  onClick={handleUseDifferentEmail}
                  className="cursor-pointer font-semibold text-ink/60 underline hover:text-ink"
                >
                  Not you?
                </button>
              </p>
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <label
                  htmlFor={`${idPrefix}-totp`}
                  className="block text-sm font-medium text-ink/80"
                >
                  {codeMode === "totp" ? "Two-factor code" : "Recovery code"}
                </label>
                <button
                  type="button"
                  onClick={handleToggleCodeMode}
                  className="cursor-pointer text-xs font-semibold text-ink/60 underline hover:text-ink"
                >
                  {codeMode === "totp"
                    ? "Use a recovery code instead"
                    : "Use your authenticator app instead"}
                </button>
              </div>
              <p className="mb-2 text-xs text-ink/55">
                {codeMode === "totp" ? (
                  "Enter the 6-digit code from your authenticator app."
                ) : (
                  <>
                    Enter one of your recovery codes (formatted like{" "}
                    <span className="font-data">xxxxx-xxxxx</span>) — use this if you&apos;ve
                    lost access to your authenticator app.
                  </>
                )}
              </p>
              {codeMode === "totp" ? (
                <OtpInput
                  ref={otpRef}
                  id={`${idPrefix}-totp`}
                  name="totpCode"
                  value={totpCode}
                  onChange={setTotpCode}
                  onComplete={() => {
                    if (!loading) formRef.current?.requestSubmit();
                  }}
                  autoFocus
                  accent="marigold"
                  hasError={!!codeError}
                  aria-describedby={
                    codeError
                      ? `${idPrefix}-totp-error ${idPrefix}-totp-rate-note`
                      : `${idPrefix}-totp-rate-note`
                  }
                />
              ) : (
                <input
                  ref={recoveryInputRef}
                  id={`${idPrefix}-totp`}
                  name="totpCode"
                  type="text"
                  autoComplete="one-time-code"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="xxxxx-xxxxx"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  required
                  aria-describedby={
                    codeError
                      ? `${idPrefix}-totp-error ${idPrefix}-totp-rate-note`
                      : `${idPrefix}-totp-rate-note`
                  }
                  className="w-full rounded-xl border border-ink/15 px-4 py-3 font-data text-sm tracking-wide text-ink outline-none transition-colors focus:border-marigold focus:ring-2 focus:ring-marigold/20"
                />
              )}
            </div>

            {codeError && (
              <p id={`${idPrefix}-totp-error`} role="alert" className="text-sm text-ember">
                {codeError}
              </p>
            )}

            <p id={`${idPrefix}-totp-rate-note`} className="text-xs text-ink/50">
              For your security, repeated incorrect codes will temporarily lock further
              sign-in attempts on this account.
            </p>
          </>
        )}

        {error && (
          <p role="alert" className="text-sm text-ember">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full cursor-pointer rounded-xl bg-ink py-3 text-sm font-semibold text-mist transition-transform hover:bg-ink/90 active:scale-[0.99] disabled:opacity-60"
        >
          {loading
            ? step === "code"
              ? "Verifying..."
              : "Signing in..."
            : step === "code"
              ? "Verify and sign in"
              : "Sign in"}
        </button>
      </form>

      {step === "password" && (
        <>
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-ink/15" />
            <span className="text-xs text-ink/50">OR</span>
            <div className="flex-1 border-t border-ink/15" />
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full cursor-pointer rounded-xl border border-ink/15 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 active:scale-[0.99]"
          >
            <div className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.28h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.59z"
                  fill="#4285F4"
                />
                <path
                  d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.13-4.07 1.13-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.395 21.3 7.765 24 12.255 24z"
                  fill="#34A853"
                />
                <path
                  d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V7.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.46-3.46C18.205 1.48 15.495 0 12.255 0c-4.49 0-8.86 2.7-10.86 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </div>
          </button>
        </>
      )}

      {showSignupLink && step === "password" && (
        <p className="mt-6 text-center text-sm text-ink/55">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-ink hover:underline">
            Get started
          </Link>
        </p>
      )}
    </div>
  );
}
