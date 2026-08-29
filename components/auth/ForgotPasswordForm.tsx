"use client";

import { useId, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const emailInputId = useId();
  const emailErrorId = useId();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    setStatusMessage("Sending reset link…");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
        setStatusMessage(
          "If an account exists for that address, we've sent a reset link."
        );
        setLoading(false);
        return;
      }

      let message = "Something went wrong. Please try again.";
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        message = retryAfter
          ? `Too many attempts. Please try again in ${retryAfter} seconds.`
          : "Too many attempts. Please try again later.";
      } else {
        const data = await res.json().catch(() => null);
        if (data?.error) message = data.error;
      }

      setError(message);
      setStatusMessage(message);
      setLoading(false);
    } catch {
      const message = "Something went wrong. Please check your connection and try again.";
      setError(message);
      setStatusMessage(message);
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Persistent live region so screen readers announce async results,
          independent of whether the confirmation panel below is mounted. */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      {submitted ? (
        <div className="rounded-xl bg-teal/10 px-4 py-3 text-sm text-ink">
          If an account exists for that address, we&apos;ve sent a reset link. Check your
          inbox (and spam folder) for next steps.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor={emailInputId} className="mb-1.5 block text-sm font-medium text-ink/80">
              Email address
            </label>
            <input
              id={emailInputId}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? emailErrorId : undefined}
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-marigold focus:ring-2 focus:ring-marigold/20"
            />
          </div>

          {error && (
            <p id={emailErrorId} role="alert" className="text-sm text-ember">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="mt-1 w-full cursor-pointer rounded-xl bg-ink py-3 text-sm font-semibold text-mist transition-transform hover:bg-ink/90 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink/55">
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
