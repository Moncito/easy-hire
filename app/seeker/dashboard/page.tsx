import Link from "next/link";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { ensureSeekerProfile } from "@/lib/seekers";
import { Briefcase, FileText, User } from "lucide-react";

export default async function SeekerDashboardPage() {
  const session = await auth();
  await ensureSeekerProfile(session!.user!.id, {
    fullName: session?.user?.name ?? "",
  });

  const profile = await prisma.seekerProfile.findUnique({
    where: { userId: session!.user!.id },
    include: {
      applications: {
        orderBy: { appliedAt: "desc" },
        take: 5,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: { select: { companyName: true } },
            },
          },
        },
      },
    },
  });

  const essentials = [
    { label: "Full name", done: !!profile?.fullName },
    { label: "Headline", done: !!profile?.headline },
    { label: "Skills", done: (profile?.skills.length ?? 0) > 0 },
    { label: "Resume", done: !!profile?.resumeUrl },
  ];
  const completeCount = essentials.filter((e) => e.done).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-ink/55">Signed in as {session?.user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/seeker/profile"
          className="rounded-2xl border border-ink/5 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
        >
          <User className="h-5 w-5 text-marigold" aria-hidden="true" />
          <p className="mt-3 font-display text-2xl font-bold text-ink">{completeCount}/4</p>
          <p className="text-sm text-ink/55">Profile essentials</p>
        </Link>
        <Link
          href="/jobs"
          className="rounded-2xl border border-ink/5 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
        >
          <Briefcase className="h-5 w-5 text-teal" aria-hidden="true" />
          <p className="mt-3 font-display text-2xl font-bold text-ink">Browse</p>
          <p className="text-sm text-ink/55">Find VA jobs</p>
        </Link>
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-xs">
          <FileText className="h-5 w-5 text-navy/60" aria-hidden="true" />
          <p className="mt-3 font-display text-2xl font-bold text-ink">{profile?.applications.length ?? 0}</p>
          <p className="text-sm text-ink/55">Recent applications</p>
        </div>
      </div>

      {completeCount < 4 && (
        <div className="mt-6 rounded-2xl border border-marigold/20 bg-marigold/5 p-5">
          <p className="font-semibold text-ink">Complete your profile to apply</p>
          <p className="mt-1 text-sm text-ink/60">
            Employers need your resume and skills before you can submit applications.
          </p>
          <Link
            href="/seeker/profile"
            className="mt-3 inline-block rounded-xl bg-marigold px-4 py-2 text-sm font-semibold text-ink"
          >
            Finish profile
          </Link>
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-ink/5 bg-white p-6 shadow-xs">
        <h2 className="font-display text-lg font-bold text-ink">Recent applications</h2>
        {profile?.applications.length ? (
          <ul className="mt-4 divide-y divide-ink/5">
            {profile.applications.map((app) => (
              <li key={app.id} className="flex items-center justify-between py-3 first:pt-0">
                <div>
                  <Link href={`/jobs/${app.job.id}`} className="font-medium text-ink hover:text-teal">
                    {app.job.title}
                  </Link>
                  <p className="text-sm text-ink/50">{app.job.company.companyName}</p>
                </div>
                <span className="rounded-lg bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/60">
                  {app.status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink/50">No applications yet. Browse jobs to get started.</p>
        )}
      </section>
    </div>
  );
}
