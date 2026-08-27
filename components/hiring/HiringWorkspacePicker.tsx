"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, UsersRound } from "lucide-react";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

export type WorkspaceCard = {
  companyId: string;
  role: string;
  company: { companyName: string; logoUrl: string | null };
};

const roleDescription: Record<string, string> = {
  OWNER: "Full workspace control",
  RECRUITER: "Candidate and pipeline access",
  HIRING_MANAGER: "Assigned-role review access",
  VIEWER: "Read-only workspace access",
};

export default function HiringWorkspacePicker({ workspaces }: { workspaces: WorkspaceCard[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<string | null>(null);

  function open(ws: WorkspaceCard) {
    if (pending) return;
    setTarget(ws.company.companyName);
    startTransition(() => {
      router.push(`/hiring/${ws.companyId}/team`);
    });
  }

  if (workspaces.length === 0) {
    return (
      <div className="rounded-[24px] border border-ink/8 bg-white p-8 shadow-[0_16px_40px_rgba(32,36,43,0.06)]">
        <UsersRound className="h-7 w-7 text-teal" />
        <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">No active workspaces yet</h2>
        <p className="mt-2 text-sm leading-6 text-ink/55">
          When a company invites you to collaborate, your private hiring workspace will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      {pending && <FullScreenLoader label={`Opening ${target ?? "workspace"}…`} sublabel="Checking your access" />}
      <div className="overflow-hidden rounded-[24px] border border-ink/8 bg-white shadow-[0_16px_40px_rgba(32,36,43,0.06)]">
        <div className="flex items-center justify-between border-b border-ink/7 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-ink/45">Your workspaces</p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">Hiring teams</h2>
          </div>
          <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">{workspaces.length}</span>
        </div>
        <ul className="divide-y divide-ink/7">
          {workspaces.map((ws) => (
            <li key={ws.companyId}>
              <button
                type="button"
                onClick={() => open(ws)}
                disabled={pending}
                className="group flex w-full items-center gap-4 px-6 py-5 text-left transition hover:bg-mist/60 disabled:cursor-wait disabled:opacity-60"
              >
                <EmployerAvatar
                  name={ws.company.companyName}
                  imageUrl={ws.company.logoUrl}
                  size="lg"
                  shape="rounded"
                  className="!h-14 !w-14 !rounded-2xl"
                  fallbackClassName="bg-marigold/20 text-[#81510d] text-lg font-bold"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl font-bold tracking-tight text-ink">{ws.company.companyName}</p>
                  <p className="mt-1 text-sm text-ink/50">{roleDescription[ws.role] ?? ws.role.replace(/_/g, " ")}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/55">
                    <Building2 className="h-3 w-3" />
                    {ws.role.replace(/_/g, " ")}
                  </span>
                </div>
                <ArrowRight className="h-5 w-5 text-ink/30 transition group-hover:translate-x-1 group-hover:text-teal" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
