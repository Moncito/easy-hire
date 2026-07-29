"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Briefcase, Building2, User, LayoutDashboard, Bookmark, Loader2 } from "lucide-react";

type QuickJob = { id: string; title: string; company: string; location: string | null };
type QuickCompany = { id: string; name: string; logoUrl: string | null };

type NavShortcut = {
  key: string;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

function shortcutsForRole(role: string | undefined): NavShortcut[] {
  if (role === "EMPLOYER") {
    return [
      { key: "employer-dashboard", label: "Employer dashboard", href: "/employer/dashboard", icon: LayoutDashboard },
      { key: "employer-jobs", label: "Manage job posts", href: "/employer/jobs", icon: Briefcase },
      { key: "employer-talent", label: "Talent search", href: "/employer/talent", icon: User },
    ];
  }
  if (role === "SEEKER") {
    return [
      { key: "seeker-dashboard", label: "Seeker dashboard", href: "/seeker/dashboard", icon: LayoutDashboard },
      { key: "seeker-saved", label: "Saved jobs", href: "/seeker/saved-jobs", icon: Bookmark },
      { key: "seeker-profile", label: "My profile", href: "/seeker/profile", icon: User },
    ];
  }
  return [
    { key: "browse-jobs", label: "Browse jobs", href: "/jobs", icon: Briefcase },
    { key: "companies", label: "Browse companies", href: "/companies", icon: Building2 },
  ];
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<QuickJob[]>([]);
  const [companies, setCompanies] = useState<QuickCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const shortcuts = shortcutsForRole(session?.user?.role as string | undefined);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setJobs([]);
    setCompanies([]);
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        close();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/quick?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setJobs(data.jobs ?? []);
        setCompanies(data.companies ?? []);
        setActiveIndex(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  const showingResults = query.trim().length >= 2;
  const results: { type: "job" | "company" | "shortcut"; id: string; href: string; label: string; sub?: string }[] =
    showingResults
      ? [
          ...jobs.map((j) => ({
            type: "job" as const,
            id: j.id,
            href: `/jobs/${j.id}`,
            label: j.title,
            sub: [j.company, j.location].filter(Boolean).join(" · "),
          })),
          ...companies.map((c) => ({
            type: "company" as const,
            id: c.id,
            href: `/companies/${c.id}`,
            label: c.name,
          })),
        ]
      : shortcuts.map((s) => ({ type: "shortcut" as const, id: s.key, href: s.href, label: s.label }));

  function go(href: string) {
    close();
    router.push(href);
  }

  function onKeyDownInput(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) go(target.href);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="fixed bottom-5 right-5 z-40 hidden cursor-pointer items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-mist shadow-lg transition-transform hover:scale-105 sm:flex"
      >
        <Search className="h-3.5 w-3.5" />
        Search
        <kbd className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold">Ctrl K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/50 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-ink/8 px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-ink/35" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDownInput}
            placeholder="Search jobs, companies, or jump to a page..."
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/35"
          />
          {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ink/35" />}
          <kbd className="hidden shrink-0 rounded bg-ink/6 px-1.5 py-0.5 text-[10px] font-bold text-ink/45 sm:block">
            Esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {showingResults && !loading && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-ink/40">No matches for &ldquo;{query}&rdquo;</p>
          )}

          {!showingResults && (
            <p className="px-4 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-ink/35">
              Quick links
            </p>
          )}

          {showingResults && jobs.length > 0 && (
            <p className="px-4 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-ink/35">Jobs</p>
          )}

          {results.map((r, idx) => {
            const shortcut = r.type === "shortcut" ? shortcuts.find((s) => s.key === r.id) : null;
            const Icon = shortcut?.icon ?? (r.type === "company" ? Building2 : Briefcase);
            const isCompanyStart = r.type === "company" && results[idx - 1]?.type !== "company";
            return (
              <div key={`${r.type}-${r.id}`}>
                {isCompanyStart && (
                  <p className="px-4 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-wider text-ink/35">
                    Companies
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => go(r.href)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    idx === activeIndex ? "bg-marigold/10 text-ink" : "text-ink/75 hover:bg-ink/4"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-ink/40" />
                  <span className="min-w-0 flex-1 truncate font-medium">{r.label}</span>
                  {r.sub && <span className="shrink-0 truncate text-xs text-ink/40">{r.sub}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
