import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Clock,
  Calendar,
  CheckCircle,
  ArrowRight,
  Plus,
  Check,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default async function EmployerDashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });

  if (!company) {
    redirect("/employer/company-profile");
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    activeJobsCount,
    totalApplicantsCount,
    shortlistedCount,
    interviewStageCount,
    hiredCount,
    newApplicantsThisWeek,
    recentJobs,
    recentApplications,
  ] = await Promise.all([
    prisma.job.count({ where: { companyId: company.id, status: "ACTIVE" } }),
    prisma.application.count({ where: { job: { companyId: company.id } } }),
    prisma.application.count({
      where: { job: { companyId: company.id }, status: "SHORTLISTED" },
    }),
    prisma.application.count({
      where: { job: { companyId: company.id }, status: "INTERVIEW" },
    }),
    prisma.application.count({
      where: { job: { companyId: company.id }, status: "HIRED" },
    }),
    prisma.application.count({
      where: { job: { companyId: company.id }, appliedAt: { gte: weekAgo } },
    }),
    prisma.job.findMany({
      where: { companyId: company.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { _count: { select: { applications: true } } },
    }),
    prisma.application.findMany({
      where: { job: { companyId: company.id } },
      orderBy: { appliedAt: "desc" },
      take: 5,
      include: {
        seeker: { select: { fullName: true } },
        job: { select: { title: true } },
      },
    }),
  ]);

  const checklist = [
    { name: "Company Name", done: !!company.companyName },
    { name: "Description", done: !!company.description },
    { name: "Industry", done: !!company.industry },
    { name: "Company Logo", done: !!company.logoUrl },
    {
      name: "Social Links",
      done: !!(company.linkedinUrl || company.facebookUrl || company.instagramUrl || company.xUrl),
    },
    {
      name: "Benefits & Highlights",
      done: company.highlights && company.highlights.length > 0,
    },
  ];

  const completedCount = checklist.filter((item) => item.done).length;
  const profileCompletion = Math.round((completedCount / checklist.length) * 100);

  const stats = [
    {
      label: "Active Jobs",
      value: activeJobsCount,
      trend: "Currently hiring",
      icon: Briefcase,
      color: "text-teal bg-teal/5 border-teal/10",
    },
    {
      label: "Total Applicants",
      value: totalApplicantsCount,
      trend: `${newApplicantsThisWeek} new this week`,
      isTrendUp: newApplicantsThisWeek > 0,
      icon: Users,
      color: "text-navy bg-navy/5 border-navy/10",
    },
    {
      label: "Shortlisted",
      value: shortlistedCount,
      trend: "Marked as promising",
      icon: Clock,
      color: "text-navy bg-navy/8 border-navy/10",
    },
    {
      label: "In Interview",
      value: interviewStageCount,
      trend: "Interview stage",
      icon: Calendar,
      color: "text-teal bg-teal/5 border-teal/10",
    },
    {
      label: "Hired",
      value: hiredCount,
      trend: "Successful matches",
      icon: CheckCircle,
      color: "text-teal bg-teal/8 border-teal/15",
    },
  ];

  const companyVerified = company.verifiedStatus === "APPROVED";

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Welcome back, {company.companyName}
          </h1>
          <p className="mt-1.5 text-sm text-ink/50">
            Here&apos;s what&apos;s happening with your hiring workspace today.
          </p>
        </div>
        <Link
          href="/employer/jobs/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-5 py-3 text-sm font-semibold text-white shadow-md shadow-teal/20 transition-all hover:bg-teal/95 hover:shadow-lg active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Post a job posting
        </Link>
      </div>

      {company.verifiedStatus === "PENDING" && (
        <div className="mb-6 rounded-2xl border border-navy/15 bg-navy/5 px-5 py-4 ring-1 ring-navy/10">
          <p className="font-semibold text-ink">Company verification in progress</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/60">
            Your company profile is under admin review. Job posts cannot appear on the public board
            until verification is approved.
          </p>
          <Link
            href="/employer/company-profile"
            className="mt-3 inline-block text-sm font-semibold text-teal hover:underline"
          >
            Review your company profile →
          </Link>
        </div>
      )}

      {company.verifiedStatus === "REJECTED" && (
        <div className="mb-6 rounded-2xl border border-ember/20 bg-ember/5 px-5 py-4">
          <p className="font-semibold text-ink">Company verification declined</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/60">
            {company.verificationRejectionReason ??
              "Update your company profile and upload verification documents, then request re-review."}
          </p>
          <Link
            href="/employer/company-profile"
            className="mt-3 inline-block text-sm font-semibold text-teal hover:underline"
          >
            Fix company profile →
          </Link>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/40 sm:text-xs">
                  {stat.label}
                </span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${stat.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <p className="font-data text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {stat.value}
                </p>
                <p
                  className={`mt-1 text-xs font-medium ${stat.isTrendUp ? "text-teal" : "text-ink/40"}`}
                >
                  {stat.isTrendUp && "↑ "}
                  {stat.trend}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-ink/5 pb-4">
            <h2 className="text-lg font-bold tracking-tight text-ink">Active Job Postings</h2>
            <Link
              href="/employer/jobs"
              className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
            >
              View all jobs
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="rounded-2xl border border-ink/5 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-ink">No active jobs</h3>
              <p className="mx-auto mt-1 max-w-xs text-xs text-ink/50">
                Get started by posting your first job to source verified virtual assistants.
              </p>
              <Link
                href="/employer/jobs/new"
                className="mt-4 inline-block rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white shadow-sm"
              >
                Create job posting
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="group rounded-2xl border border-ink/5 bg-white p-5 shadow-sm transition-all duration-200 hover:border-ink/10 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold text-ink transition-colors group-hover:text-teal">
                        {job.title}
                      </h3>
                      <p className="mt-1 text-xs text-ink/50">
                        {job.employmentType.replace("_", " ")} &bull; {job.remoteType} &bull;{" "}
                        {job.location}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        job.status === "ACTIVE" && !companyVerified
                          ? "border border-navy/15 bg-navy/8 text-navy"
                          : job.status === "ACTIVE"
                            ? "border border-teal/15 bg-teal/8 text-teal"
                            : job.status === "DRAFT"
                              ? "border border-ink/10 bg-ink/5 text-ink/60"
                              : "border border-ink/10 bg-ink/5 text-ink/55"
                      }`}
                    >
                      {job.status === "ACTIVE" && !companyVerified
                        ? "Approved — not public"
                        : job.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-4">
                    <div className="flex items-center gap-4 text-xs font-medium text-ink/65">
                      <div>
                        <span className="font-data font-bold text-ink">
                          {job._count.applications}
                        </span>{" "}
                        applicants
                      </div>
                      <div className="text-ink/30">|</div>
                      <div className="text-ink/40">
                        Updated {new Date(job.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/employer/jobs/${job.id}/applicants`}
                        className="rounded-lg bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-ink/10"
                      >
                        View applicants
                      </Link>
                      <Link
                        href={`/employer/jobs/${job.id}/edit`}
                        className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink/75 transition-colors hover:bg-ink/5"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-bold text-ink">Company Profile</span>
              <span className="font-data text-2xl font-extrabold text-teal">
                {profileCompletion}%
              </span>
            </div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-ink/5">
              <div
                className="h-full rounded-full bg-teal transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <p className="mb-4 text-xs leading-relaxed text-ink/50">
              Complete your profile to attract highly qualified virtual assistants.
            </p>
            <div className="mb-5 space-y-2">
              {checklist.map((item) => (
                <div key={item.name} className="flex items-center gap-2.5 text-xs">
                  {item.done ? (
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-ink/5 text-ink/40">
                      <X className="h-3 w-3" strokeWidth={3} />
                    </div>
                  )}
                  <span
                    className={
                      item.done ? "text-ink/65 line-through" : "font-medium text-ink/80"
                    }
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/employer/company-profile"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink py-2.5 text-xs font-semibold text-white transition-colors hover:bg-ink/90"
            >
              Complete Profile
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-ink">Hiring Activity</h3>
            {recentApplications.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink/40">No recent applicant activity</p>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((app, i) => (
                  <div key={app.id} className="relative flex gap-3">
                    {i < recentApplications.length - 1 && (
                      <div className="absolute bottom-[-16px] left-2.5 top-6 w-px bg-ink/10" />
                    )}
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/15 text-[10px] font-bold text-teal">
                      {app.seeker.fullName[0]?.toUpperCase()}
                    </div>
                    <div className="text-xs">
                      <p className="font-medium leading-tight text-ink/80">
                        <span className="font-bold text-ink">{app.seeker.fullName}</span> applied
                        for <span className="font-semibold text-teal">{app.job.title}</span>
                      </p>
                      <span className="mt-1 block text-[10px] text-ink/40">
                        {new Date(app.appliedAt).toLocaleDateString()} &bull;{" "}
                        {new Date(app.appliedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-ink">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/employer/jobs/new"
                className="flex items-center justify-between rounded-lg bg-ink/[0.03] px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink/[0.06]"
              >
                <span>Post Job</span>
                <Plus className="h-4 w-4" />
              </Link>
              <Link
                href="/employer/applicants"
                className="flex items-center justify-between rounded-lg bg-ink/[0.03] px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink/[0.06]"
              >
                <span>View Applicants</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/employer/talent"
                className="flex items-center justify-between rounded-lg bg-ink/[0.03] px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink/[0.06]"
              >
                <span>Browse Talent</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
