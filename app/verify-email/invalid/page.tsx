import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { auth } from "@/Auth";
import ResendVerificationForm from "@/components/auth/ResendVerificationForm";

export default async function VerifyEmailInvalidPage() {
  const session = await auth();
  const isSignedIn = Boolean(session?.user);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-mist">
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-marigold/25 to-teal/25 blur-3xl md:h-96 md:w-96" />

      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
            <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
          </div>
          <span className="font-display text-lg font-bold text-ink">EasyHire</span>
        </Link>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl shadow-black/5 md:p-12">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-ember/15 text-ember">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="mb-2 font-display text-2xl font-bold text-ink">
            This link is invalid or has expired
          </h1>
          <p className="mb-8 text-sm text-ink/60">
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
      </div>

      <div className="relative z-10 border-t border-ink/10 bg-mist py-6 text-center text-xs text-ink/50">
        &copy; {new Date().getFullYear()} EasyHire VA Solutions &nbsp;|&nbsp;{" "}
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>{" "}
        &nbsp;|&nbsp;{" "}
        <Link href="/terms" className="hover:underline">
          Terms &amp; Conditions
        </Link>
      </div>
    </div>
  );
}
