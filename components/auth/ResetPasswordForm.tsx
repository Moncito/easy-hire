"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { passwordSchema } from "@/lib/validations/sign-up";

type Props = {
  token: string;
};

type FieldErrors = {
  password?: string;
  confirm?: string;
};

export default function ResetPasswordForm({ token }: Props) {
  const passwordInputId = useId();
  const confirmInputId = useId();
  const passwordErrorId = useId();
  const confirmErrorId = useId();
  const formErrorId = useId();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    setTokenInvalid(false);

    const parsed = passwordSchema.safeParse(password);
    const nextFieldErrors: FieldErrors = {};

    if (!parsed.success) {
      nextFieldErrors.password = parsed.error.issues[0]?.message ?? "Invalid password";
    }
    if (password !== confirmPassword) {
      nextFieldErrors.confirm = "Passwords don't match";
    }

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      setStatusMessage("Please fix the errors in the form.");
      return;
    }

    setLoading(true);
    setStatusMessage("Resetting your password…");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
        setStatusMessage("Your password has been reset.");
        setLoading(false);
        return;
      }

      let message = "Something went wrong. Please try again.";
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        message = retryAfter
          ? `Too many attempts. Please try again in ${retryAfter} seconds.`
          : "Too many attempts. Please try again later.";
        setFormError(message);
      } else if (res.status === 400) {
        const data = await res.json().catch(() => null);
        message = data?.error || "This link is invalid or has expired.";
        setTokenInvalid(true);
        setFormError(message);
      } else {
        const data = await res.json().catch(() => null);
        if (data?.error) message = data.error;
        setFormError(message);
      }

      setStatusMessage(message);
      setLoading(false);
    } catch {
      const message = "Something went wrong. Please check your connection and try again.";
      setFormError(message);
      setStatusMessage(message);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div>
        <div role="status" aria-live="polite" className="sr-only">
          {statusMessage}
        </div>
        <div className="rounded-xl bg-teal/10 px-4 py-3 text-sm text-ink">
          Your password has been reset. You can now sign in with your new password.
        </div>
        <Link
          href="/login"
          className="mt-6 inline-block w-full rounded-xl bg-ink py-3 text-center text-sm font-semibold text-mist transition-transform hover:bg-ink/90 active:scale-[0.99]"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Persistent live region so screen readers announce async results. */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor={passwordInputId} className="mb-1.5 block text-sm font-medium text-ink/80">
            New password
          </label>
          <input
            id={passwordInputId}
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="new-password"
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
            className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-marigold focus:ring-2 focus:ring-marigold/20"
          />
          {fieldErrors.password && (
            <p id={passwordErrorId} role="alert" className="mt-1.5 text-sm text-ember">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={confirmInputId} className="mb-1.5 block text-sm font-medium text-ink/80">
            Confirm new password
          </label>
          <input
            id={confirmInputId}
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            autoComplete="new-password"
            aria-invalid={fieldErrors.confirm ? true : undefined}
            aria-describedby={fieldErrors.confirm ? confirmErrorId : undefined}
            className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-marigold focus:ring-2 focus:ring-marigold/20"
          />
          {fieldErrors.confirm && (
            <p id={confirmErrorId} role="alert" className="mt-1.5 text-sm text-ember">
              {fieldErrors.confirm}
            </p>
          )}
        </div>

        {formError && (
          <div id={formErrorId} role="alert" className="rounded-xl bg-ember/10 px-4 py-3 text-sm text-ember">
            <p>{formError}</p>
            {tokenInvalid && (
              <p className="mt-1">
                <Link href="/login/forgot" className="font-semibold underline">
                  Request a new reset link
                </Link>
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="mt-1 w-full cursor-pointer rounded-xl bg-ink py-3 text-sm font-semibold text-mist transition-transform hover:bg-ink/90 active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/55">
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
