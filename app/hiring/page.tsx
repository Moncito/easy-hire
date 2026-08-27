import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell, BriefcaseBusiness, ShieldCheck, Sparkles } from "lucide-react";
import { auth } from "@/Auth";
import { getHiringWorkspacesForUser } from "@/lib/collaborative-hiring";
import HiringWorkspacePicker, { type WorkspaceCard } from "@/components/hiring/HiringWorkspacePicker";

export default async function HiringWorkspacesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/hiring");
  const workspaces = await getHiringWorkspacesForUser(session.user.id);
  const accountHref = session.user.role === "SEEKER" ? "/seeker/dashboard" : "/employer/dashboard";

  const cards: WorkspaceCard[] = workspaces.map((w) => ({
    companyId: w.companyId,
    role: w.role,
    company: { companyName: w.company.companyName, logoUrl: w.company.logoUrl },
  }));

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-mist px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-teal/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-marigold/[0.10] blur-3xl" />
      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mb-7 flex items-center justify-between">
          <Link href={accountHref} className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition hover:text-teal">
            <ArrowLeft className="h-4 w-4" />
            My EasyHire account
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/hiring/notifications" className="rounded-full p-2 text-ink/55 transition hover:bg-white hover:text-teal" aria-label="Hiring notifications">
              <Bell className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <span className="relative flex h-8 w-8 overflow-hidden rounded-full">
                <span className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
                <span className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
              </span>
              <span className="font-display text-lg font-black tracking-tighter">EasyHire</span>
            </div>
          </div>
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
          <section>
            <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A5B12]">
              <Sparkles className="h-3.5 w-3.5" />
              Collaborative hiring
            </p>
            <h1 className="mt-3 font-display text-4xl font-black tracking-tighter text-ink sm:text-5xl sm:leading-[0.93]">
              Choose where<br />you&rsquo;re hiring.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-ink/60">
              Company workspaces are private and role-based. Your personal seeker profile, applications, and job search remain entirely separate.
            </p>
            <div className="mt-7 flex items-start gap-3 border-l-2 border-teal bg-teal/[0.05] px-4 py-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
              <p className="text-sm leading-6 text-ink/65">You can move between your account and any hiring team at any time.</p>
            </div>
            <Link href="/jobs" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink/65 transition hover:text-teal">
              <BriefcaseBusiness className="h-4 w-4" />
              Browse public jobs
            </Link>
          </section>
          <section aria-label="Available hiring workspaces">
            <HiringWorkspacePicker workspaces={cards} />
          </section>
        </div>
      </div>
    </main>
  );
}
