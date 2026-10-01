import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";

export default function VerifyEmailSuccessPage() {
  return (
    <AuthPageShell>
      <div className="rounded-3xl border border-ink/10 bg-white p-6 text-center shadow-xl shadow-black/5 sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/15 text-teal">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-navy">Email verification</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Email verified
        </h1>
        <p className="mb-6 mt-1.5 text-sm text-ink/65">
          Your email address has been confirmed. You&apos;re all set.
        </p>
        <Link
          href="/dashboard"
          className="inline-block w-full rounded-xl bg-ink py-3 text-sm font-semibold text-mist transition-transform hover:bg-ink/90 active:scale-[0.99]"
        >
          Go to your dashboard
        </Link>
      </div>
    </AuthPageShell>
  );
}
