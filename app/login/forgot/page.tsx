import Link from "next/link";
import AuthPageShell from "@/components/auth/AuthPageShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

const focusRing =
  "rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      topRight={
        <>
          Remember it?{" "}
          <Link href="/login" className={`font-semibold text-ink underline-offset-2 hover:underline ${focusRing}`}>
            Sign in
          </Link>
        </>
      }
    >
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-navy">Account recovery</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Forgot your password?
        </h1>
        <p className="mb-6 mt-1.5 text-sm text-ink/65">
          Enter the email address on your account and we&apos;ll send you a link to reset
          your password.
        </p>
        <ForgotPasswordForm />
      </div>
    </AuthPageShell>
  );
}
