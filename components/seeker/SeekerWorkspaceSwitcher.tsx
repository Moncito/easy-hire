"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, Building2, Check, ChevronDown, UsersRound } from "lucide-react";

type Workspace = {
  id: string;
  companyId: string;
  role: string;
  company: {
    companyName: string;
    logoUrl: string | null;
  };
};

type Props = {
  userName?: string | null;
  workspaces: Workspace[];
};

function initials(name?: string | null) {
  return (name?.trim() || "S")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roleLabel(role: string) {
  return role.toLowerCase().replace(/_/g, " ");
}

function CompanyMark({ workspace }: { workspace: Workspace }) {
  if (workspace.company.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={workspace.company.logoUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-ink/10"
      />
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-[10px] font-black text-teal">
      {initials(workspace.company.companyName)}
    </span>
  );
}

/** Persistent account-level control for moving between personal and hiring workspaces. */
export default function SeekerWorkspaceSwitcher({ userName, workspaces }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function dismiss(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", dismiss);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", dismiss);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="fixed right-5 top-4 z-[60] hidden lg:block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-ink/8 bg-white/90 py-1.5 pl-2 pr-3 shadow-sm backdrop-blur transition hover:border-teal/25 hover:bg-white"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
          {initials(userName)}
        </span>
        <span className="max-w-28 truncate text-sm font-semibold text-ink">{userName?.trim() || "My account"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-ink/45 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Switch workspace"
          className="absolute right-0 mt-2 w-[316px] overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_18px_45px_rgba(32,36,43,0.16)]"
        >
          <div className="border-b border-ink/7 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45">Switch workspace</p>
            <p className="mt-0.5 text-sm text-ink/60">Your job search and hiring work stay separate.</p>
          </div>

          <Link
            href="/seeker/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-b border-ink/7 px-4 py-3 transition hover:bg-mist/70"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-marigold/15 text-[#9A5B12]"><BriefcaseBusiness className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-ink">My job search</span><span className="block text-xs text-ink/50">Seeker dashboard and applications</span></span>
            <Check className="h-4 w-4 text-teal" aria-label="Current workspace" />
          </Link>

          <div className="px-4 pb-2 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45">Hiring teams {workspaces.length ? `(${workspaces.length})` : ""}</p>
          </div>
          {workspaces.length ? (
            <div className="max-h-64 overflow-y-auto px-2 pb-2">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/hiring/${workspace.companyId}/team`}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-mist"
                >
                  <CompanyMark workspace={workspace} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{workspace.company.companyName}</span><span className="block text-xs capitalize text-ink/50">{roleLabel(workspace.role)} access</span></span>
                  <Building2 className="h-4 w-4 shrink-0 text-ink/30" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="mx-3 mb-3 flex items-start gap-2 rounded-xl bg-mist px-3 py-3 text-xs leading-5 text-ink/55"><UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-teal" />Hiring-team invitations you accept will appear here.</div>
          )}

          <Link href="/hiring" role="menuitem" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 border-t border-ink/7 px-4 py-3 text-xs font-bold text-teal transition hover:bg-teal/[0.04]">
            <UsersRound className="h-3.5 w-3.5" />View all hiring teams
          </Link>
        </div>
      )}
    </div>
  );
}
