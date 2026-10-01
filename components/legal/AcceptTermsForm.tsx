"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  FileText,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { BrandLockup } from "@/components/brand/BrandMark";
import { useSignOut } from "@/components/ui/useSignOut";
import { currentLegalVersion } from "@/lib/legal/changelog";
import { businessInfo } from "@/lib/legal/business-info";
import { CURRENT_TERMS_VERSION } from "@/lib/legal/terms-version";

const ROLE_STYLES = {
  SEEKER: {
    button: "bg-marigold text-ink hover:bg-marigold/90 focus-visible:outline-marigold",
    accent: "accent-marigold",
    ring: "focus-visible:outline-marigold",
  },
  EMPLOYER: {
    button: "bg-teal text-white hover:bg-teal/90 focus-visible:outline-teal",
    accent: "accent-teal",
    ring: "focus-visible:outline-teal",
  },
  OTHER: {
    button: "bg-navy text-white hover:bg-navy/90 focus-visible:outline-navy",
    accent: "accent-navy",
    ring: "focus-visible:outline-navy",
  },
} as const;

const linkClass =
  "font-semibold text-ink underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

export default function AcceptTermsForm({ next, role }: { next: string; role?: string }) {
  const router = useRouter();
  const { update } = useSession();
  const { signOut, pending: signingOut, overlay } = useSignOut();
  const [isAdult, setIsAdult] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const legal = currentLegalVersion();
  const styles = role === "SEEKER" ? ROLE_STYLES.SEEKER : role === "EMPLOYER" ? ROLE_STYLES.EMPLOYER : ROLE_STYLES.OTHER;
  const canAccept = isAdult && agreed;

  async function handleAccept() {
    if (!canAccept || loading) return;
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
      // update() with no argument is a plain GET that skips the jwt "update"
      // trigger; pass {} so the client session refreshes too.
      await update({});
      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  const docs = [
    { title: "Terms of Service", href: "/terms", icon: FileText },
    { title: "Privacy Policy", href: "/privacy", icon: Lock },
  ];

  return (
    <main className="relative min-h-dvh overflow-x-clip bg-mist px-4 py-6 sm:px-6 sm:py-10 lg:flex lg:h-dvh lg:items-center lg:overflow-hidden lg:py-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-marigold/20 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-teal/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-navy/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-5xl rounded-3xl border border-ink/10 bg-white shadow-xl shadow-black/5 lg:max-h-full lg:grid-cols-[3fr_2fr] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden">
        {/* LEFT — on lg it scrolls inside the card only when the window is
            too short, so the page itself never scrolls and Accept stays put. */}
        <div className="p-6 sm:p-10 lg:min-h-0 lg:overflow-y-auto lg:p-8">
          <BrandLockup size="md" />
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink">
            We&apos;ve updated our Terms
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            We&apos;ve updated the EasyHire Terms of Service and Privacy Policy. Please review them
            before continuing.
          </p>
          <p className="mt-3 flex items-center gap-2 text-xs text-ink/55">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Effective {legal.effective}
          </p>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {docs.map(({ title, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-14 items-center gap-3 rounded-2xl border border-ink/10 bg-white p-3 transition-colors hover:border-navy/40 hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/10 text-navy">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{title}</span>
                    <span className="block text-xs text-ink/55">Updated {legal.effective}</span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-ink/40 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                  <span className="sr-only">(opens in a new tab)</span>
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="mt-6 font-display text-lg font-bold text-ink">What&apos;s changed</h2>
          <ol className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {legal.changes.map((change, i) => (
              <li key={change.href} className="flex gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/10 font-mono text-xs font-semibold text-navy"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <Link
                    href={change.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-ink underline-offset-2 hover:text-navy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                  >
                    {change.title}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </Link>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink/60">{change.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col rounded-b-3xl border-t border-ink/10 bg-mist/60 p-6 sm:p-10 lg:min-h-0 lg:overflow-y-auto lg:rounded-b-none lg:p-8 lg:pb-0 lg:rounded-r-3xl lg:border-l lg:border-t-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/45">
            Your account
          </p>

          <div className="mt-4 space-y-1">
            <div className="flex min-h-11 items-start gap-3 py-2">
              <input
                id="accept-age"
                type="checkbox"
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                required
                className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-ink/30 ${styles.accent} focus-visible:outline-2 focus-visible:outline-offset-2 ${styles.ring}`}
              />
              <label htmlFor="accept-age" className="cursor-pointer text-sm leading-snug text-ink/80">
                I confirm that I am 18 years old or older.
              </label>
            </div>
            <div className="flex min-h-11 items-start gap-3 py-2">
              <input
                id="accept-terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                aria-describedby={error ? "accept-terms-error" : undefined}
                className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-ink/30 ${styles.accent} focus-visible:outline-2 focus-visible:outline-offset-2 ${styles.ring}`}
              />
              <label htmlFor="accept-terms" className="cursor-pointer text-sm leading-snug text-ink/80">
                I have read and agree to the{" "}
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
          </div>

          <hr className="my-5 border-ink/10" />

          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink">Your data, your call</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/65">
                We never sell your data. You can download or delete it anytime from your account
                settings.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-ink/10 bg-white p-4">
            <p className="text-sm font-semibold text-ink">Need help?</p>
            <p className="mt-1 text-sm text-ink/65">
              Questions about these updates?{" "}
              <a
                href={`mailto:${businessInfo.contact.general}`}
                className="font-semibold text-navy underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Email us
              </a>
              .
            </p>
          </div>

          {/* Spacer so the sticky mobile action bar never covers content */}
          <div className="h-4 lg:hidden" aria-hidden="true" />

          <div className="sticky bottom-0 z-10 -mx-6 mt-auto border-t border-ink/10 bg-white px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:-mx-10 sm:px-10 lg:-mx-8 lg:mt-auto lg:border-0 lg:bg-[color-mix(in_srgb,var(--color-mist)_60%,white)] lg:px-8 lg:pb-6 lg:pt-6">
            {error && (
              <p id="accept-terms-error" role="alert" className="mb-2 text-sm text-ember">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleAccept}
              disabled={!canAccept || loading}
              className={`inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${styles.button}`}
            >
              {loading ? "Saving..." : "Accept and continue"}
              {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut || loading}
              className="mt-2 min-h-11 w-full cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-ink/60 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-60"
            >
              Sign out
            </button>
            <p className="mt-2 text-center font-mono text-xs text-ink/45 lg:text-left">
              Version {CURRENT_TERMS_VERSION} &middot; Effective {legal.effective}
            </p>
          </div>
        </div>
      </div>
      {overlay}
    </main>
  );
}
