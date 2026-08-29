"use client";

import { useState } from "react";

/**
 * Resend action for a signed-in user whose verification link was invalid or
 * expired. Hits POST /api/auth/verify-email (authenticated, rate-limited by
 * user id) — see app/api/auth/verify-email/route.ts.
 */
export default function ResendVerificationForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  async function handleResend() {
    setError("");
    setLoading(true);
    setStatusMessage("Sending verification email…");

    try {
      const res = await fetch("/api/auth/verify-email", { method: "POST" });

      if (res.ok) {
        setSent(true);
        setStatusMessage("Verification email sent. Check your inbox.");
        setLoading(false);
        return;
      }

      let message = "Something went wrong. Please try again.";
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        message = retryAfter
          ? `Too many attempts. Please try again in ${retryAfter} seconds.`
          : "Too many attempts. Please try again later.";
      } else if (res.status === 401) {
        message = "Your session has expired. Please sign in again.";
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
      {/* Persistent live region so screen readers announce async results. */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      {sent ? (
        <div className="rounded-xl bg-teal/10 px-4 py-3 text-sm text-ink">
          Verification email sent. Check your inbox (and spam folder).
        </div>
      ) : (
        <>
          {error && (
            <p role="alert" className="mb-4 text-sm text-ember">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            aria-busy={loading}
            className="w-full cursor-pointer rounded-xl bg-ink py-3 text-sm font-semibold text-mist transition-transform hover:bg-ink/90 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "Sending..." : "Resend verification email"}
          </button>
        </>
      )}
    </div>
  );
}
