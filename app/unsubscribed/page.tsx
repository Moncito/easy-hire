import Link from "next/link";
import { MailCheck } from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";

export const metadata = {
  title: "Unsubscribed — EasyHire",
  description: "You've been unsubscribed from EasyHire digest emails.",
};

/**
 * Where GET /api/unsubscribe/[token] lands. Deliberately public and
 * session-free: the whole point of the token is that it works for a
 * logged-out recipient, so this page must render for one too.
 *
 * It states what is still sent, because "unsubscribe" reads as "all email
 * stops" — and account-security mail and interview invitations deliberately
 * ignore preferences. Someone who expects silence and then receives a
 * password-reset email should not think the unsubscribe failed.
 */
export default function UnsubscribedPage() {
  return (
    <AuthPageShell>
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal">
          <MailCheck className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-navy">Email preferences</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          You&rsquo;re unsubscribed
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
          You won&rsquo;t receive job alert digests or weekly summaries from EasyHire any more.
        </p>

        <div className="mt-5 rounded-xl border border-ink/10 bg-mist/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Still sent</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/60">
            Account security emails &mdash; password resets and email verification &mdash; and
            interview invitations. Those can&rsquo;t be turned off, since they protect your account
            or involve a commitment someone else is relying on.
          </p>
        </div>

        <p className="mt-5 text-sm text-ink/60">
          Changed your mind? You can turn digests back on any time in{" "}
          <Link href="/login" className="font-semibold text-teal hover:underline">
            your account settings
          </Link>
          .
        </p>
      </div>
    </AuthPageShell>
  );
}
