import Link from "next/link";

export default function PublicJobsHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
            <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
          </div>
          <span className="font-display text-lg font-bold text-ink">EasyHire</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/jobs" className="font-semibold text-teal">
            Browse jobs
          </Link>
          <Link href="/login" className="font-medium text-ink/60 hover:text-ink">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal/95"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
