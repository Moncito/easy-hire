import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { auth } from "@/Auth";
import AuthPageShell from "@/components/auth/AuthPageShell";
import ResendVerificationForm from "@/components/auth/ResendVerificationForm";

export default async function VerifyEmailInvalidPage() {
  const session = await auth();
  const isSignedIn = Boolean(session?.user);

  return (
    <AuthPageShell>
      <div className="rounded-3xl border border-ink/10 bg-white p-6 text-center shadow-xl shadow-black/5 sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ember/15 text-ember">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-navy">Email verification</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          This link is invalid or has expired
        </h1>
        <p className="mb-6 mt-1.5 text-sm text-ink/65">
          Verification links only work once and expire after a while for security.
          {isSignedIn
            ? " Request a new one below."
            : " Sign in, then request a new one from your account."}
        </p>

        {isSignedIn ? (
          <ResendVerificationForm />
        ) : (
          <Link
            href="/login"
            className="inline-block w-full rounded-xl bg-ink py-3 text-sm font-semibold text-mist transition-transform hover:bg-ink/90 active:scale-[0.99]"
          >
            Sign in
          </Link>
        )}
      </div>
    </AuthPageShell>
  );
}
