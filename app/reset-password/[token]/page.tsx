import Link from "next/link";
import AuthPageShell from "@/components/auth/AuthPageShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

const focusRing =
  "rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <AuthPageShell
      topRight={
        <>
          Remembered your password?{" "}
          <Link href="/login" className={`font-semibold text-ink underline-offset-2 hover:underline ${focusRing}`}>
            Sign in
          </Link>
        </>
      }
    >
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-navy">Account recovery</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Set a new password
        </h1>
        <p className="mb-6 mt-1.5 text-sm text-ink/65">
          Choose a strong new password for your account.
        </p>
        <ResetPasswordForm token={token} />
      </div>
    </AuthPageShell>
  );
}
