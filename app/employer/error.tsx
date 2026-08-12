"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EmployerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-bold uppercase tracking-wider text-ember">Something went wrong</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">Employer workspace error</h1>
      <p className="mt-2 text-sm text-ink/55">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal/95"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => router.push("/employer/dashboard")}
          className="rounded-xl border border-ink/10 px-5 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/5"
        >
          Back to dashboard
        </button>
        <Link href="/" className="text-sm font-medium text-teal hover:underline">
          Home
        </Link>
      </div>
    </div>
  );
}
