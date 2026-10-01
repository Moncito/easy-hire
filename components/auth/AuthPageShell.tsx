import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLockup } from "@/components/brand/BrandMark";

const focusRing =
  "rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

type Props = {
  children: ReactNode;
  topRight?: ReactNode;
  /** Lets the child card grow to max-w-4xl on large screens (two-column layouts). */
  wide?: boolean;
};

export default function AuthPageShell({ children, topRight, wide = false }: Props) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-mist">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-marigold/20 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-teal/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-navy/10 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link href="/" aria-label="EasyHire home" className={focusRing}>
          <BrandLockup size="md" />
        </Link>
        {topRight ? <div className="text-sm text-ink/65">{topRight}</div> : null}
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-2 sm:px-6">
        <div className={`w-full max-w-md ${wide ? "lg:max-w-4xl" : ""}`}>{children}</div>
      </main>

      <footer className="relative z-10 px-4 py-3 text-center text-xs text-ink/60">
        &copy; {new Date().getFullYear()} EasyHire VA Solutions &middot;{" "}
        <Link href="/privacy" className={`hover:underline ${focusRing}`}>
          Privacy Policy
        </Link>{" "}
        &middot;{" "}
        <Link href="/terms" className={`hover:underline ${focusRing}`}>
          Terms of Service
        </Link>
      </footer>
    </div>
  );
}
