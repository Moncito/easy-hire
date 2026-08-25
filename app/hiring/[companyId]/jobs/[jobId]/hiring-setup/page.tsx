import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UsersRound } from "lucide-react";
import { auth } from "@/Auth";
import { getHiringSetup, DEFAULT_CRITERIA } from "@/lib/hiring-setup";
import { getActiveCompanyMembership } from "@/lib/collaborative-hiring";
import HiringSetupForm from "@/components/employer/hiring-setup/HiringSetupForm";
import RecruiterShell from "@/components/hiring/RecruiterShell";

export default async function CollaboratorHiringSetupPage({
  params,
}: {
  params: Promise<{ companyId: string; jobId: string }>;
}) {
  const session = await auth();
  const { companyId, jobId } = await params;
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/jobs/${jobId}/hiring-setup`)}`);
  }

  const setup = await getHiringSetup(companyId, session.user.id, jobId).catch(() => null);
  if (!setup) redirect(`/hiring/${companyId}/queue`);
  const membership = await getActiveCompanyMembership(companyId, session.user.id);

  return (
    <RecruiterShell companyId={companyId} jobId={jobId} role={membership?.role} active="queue">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/hiring/${companyId}/jobs/${jobId}`}
          className="group inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/10 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          Back
        </Link>
        <header className="mt-4 border-b border-ink/10 pb-6 sm:mt-5 sm:pb-7">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#9A5B12]">
            <UsersRound className="h-3.5 w-3.5" aria-hidden="true" /> Collaborative hiring
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Hiring setup</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base">
            Select the people who will review <span className="font-semibold text-ink/80">{setup.job.title}</span> and tailor the scorecard they’ll use.
          </p>
        </header>
        <HiringSetupForm
          jobId={jobId}
          apiBase={`/api/hiring/${companyId}/jobs/${jobId}`}
          members={setup.members.map((member) => ({ id: member.id, email: member.user.email, role: member.role }))}
          initial={{
            memberIds: setup.job.teamMembers.map((member) => member.memberId),
            title: setup.template?.title ?? "Hiring scorecard",
            instructions: setup.template?.instructions ?? "",
            criteria: setup.template?.criteria.map((criterion) => criterion.label) ?? DEFAULT_CRITERIA,
          }}
        />
      </div>
    </RecruiterShell>
  );
}
