"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSignOut } from "@/components/ui/useSignOut";
import { CURRENT_TERMS_VERSION } from "@/lib/legal/terms-version";

export default function AcceptTermsForm({ next }: { next: string }) {
  const router = useRouter();
  const { update } = useSession();
  const { signOut, pending: signingOut, overlay } = useSignOut();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    if (!checked || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/account/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: CURRENT_TERMS_VERSION }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(
          res.status === 409
            ? "Our Terms were just updated. Please reload this page and try again."
            : data?.error || "Something went wrong. Please try again."
        );
        setLoading(false);
        return;
      }
      await update();
      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl shadow-black/5 sm:p-10">
        <h1 className="font-display text-2xl font-bold text-navy">We&apos;ve updated our Terms</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/75">
          Before continuing, please review and accept the current{" "}
          <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mt-2 text-xs text-ink/55">
          Version <span className="font-mono">{CURRENT_TERMS_VERSION}</span>
        </p>

        <div className="mt-6 flex min-h-11 items-start gap-3 py-2">
          <input
            id="accept-terms"
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            aria-describedby={error ? "accept-terms-error" : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-ink/30 accent-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          />
          <label htmlFor="accept-terms" className="cursor-pointer text-sm leading-snug text-ink/75">
            I&apos;m 18 or older and I agree to the Terms of Service and Privacy Policy.
          </label>
        </div>

        {error && (
          <p id="accept-terms-error" role="alert" className="mt-2 text-sm text-ember">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleAccept}
          disabled={!checked || loading}
          className="mt-5 min-h-11 w-full cursor-pointer rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-mist transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Accept and continue"}
        </button>

        <button
          type="button"
          onClick={signOut}
          disabled={signingOut || loading}
          className="mt-3 min-h-11 w-full cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-ink/60 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-60"
        >
          Sign out
        </button>
      </div>
      {overlay}
    </main>
  );
}
