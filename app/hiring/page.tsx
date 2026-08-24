import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, BriefcaseBusiness, ChevronRight } from "lucide-react";
import { auth } from "@/Auth";
import { getHiringWorkspacesForUser } from "@/lib/collaborative-hiring";

export default async function HiringWorkspacesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/hiring");
  const workspaces = await getHiringWorkspacesForUser(session.user.id);

  return (
    <main className="min-h-screen bg-mist px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href={session.user.role === "SEEKER" ? "/seeker/dashboard" : "/employer/dashboard"} className="text-sm font-semibold text-teal hover:underline">← Back to my account</Link>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.16em] text-teal">EasyHire workspaces</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Hiring teams you belong to</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink/60">Your job-seeker profile and applications stay separate from these private company workspaces.</p>
        {workspaces.length === 0 ? <div className="mt-7 rounded-2xl border border-ink/8 bg-white p-7 text-sm text-ink/60">You do not have an active hiring-team workspace yet.</div> : <ul className="mt-7 space-y-3">{workspaces.map((workspace) => <li key={workspace.id}><Link href={`/hiring/${workspace.companyId}/team`} className="flex items-center gap-4 rounded-2xl border border-ink/8 bg-white p-5 shadow-xs transition hover:border-teal/30 hover:shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal"><Building2 className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate font-display text-lg font-bold text-ink">{workspace.company.companyName}</p><p className="mt-0.5 text-sm text-ink/50">{workspace.role.replace(/_/g, " ").toLowerCase()} access</p></div><ChevronRight className="h-5 w-5 text-ink/35" /></Link></li>)}</ul>}
        <Link href="/jobs" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink/65 hover:text-teal"><BriefcaseBusiness className="h-4 w-4" />Browse jobs</Link>
      </div>
    </main>
  );
}
