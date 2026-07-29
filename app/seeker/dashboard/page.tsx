import Link from "next/link";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { ensureSeekerProfile } from "@/lib/seekers";
import {
  Briefcase,
  Bookmark,
  Bell,
  FileText,
  MessageSquare,
  User,
} from "lucide-react";
import { relativeTime } from "@/lib/time-ago";

const STATUS_FILTERS = [
  "ALL",
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEW",
  "HIRED",
  "REJECTED",
] as const;

function statusTone(status: string) {
  if (status === "REJECTED") return "bg-ember/10 text-ember";
  if (status === "HIRED") return "bg-marigold/15 text-marigold";
  if (status === "INTERVIEW") return "bg-marigold/15 text-[#8a5a10]";
  if (status === "SHORTLISTED") return "bg-navy/10 text-navy";
  return "bg-ink/5 text-ink/60";
}

export default async function SeekerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const { status: statusParam } = await searchParams;
  const normalizedStatus = statusParam?.toUpperCase() as (typeof STATUS_FILTERS)[number] | undefined;
  const statusFilter =
    normalizedStatus && STATUS_FILTERS.includes(normalizedStatus) ? normalizedStatus : "ALL";

  await ensureSeekerProfile(session!.user!.id, {
    fullName: session?.user?.name ?? "",
  });

  const profile = await prisma.seekerProfile.findUnique({
    where: { userId: session!.user!.id },
    include: {
      applications: {
        orderBy: { appliedAt: "desc" },
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
      savedJobs: {
        orderBy: { savedAt: "desc" },
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
      conversations: {
        orderBy: { lastMessageAt: "desc" },
        take: 3,
        include: {
          company: { select: { companyName: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const jobAlertCount = profile
    ? await prisma.jobAlert.count({ where: { seekerId: profile.id } })
    : 0;

  const strengthChecks = [
    !!profile?.fullName,
    !!profile?.headline,
    (profile?.skills.length ?? 0) > 0,
    !!profile?.resumeUrl,
    !!profile?.location,
    !!profile?.bio,
    !!profile?.linkedinUrl,
    !!profile?.photoUrl,
    (profile?.certifications?.length ?? 0) > 0,
    (profile?.languages?.length ?? 0) > 0,
    profile?.visibility !== "HIDDEN",
  ];
  const strength = strengthChecks.filter(Boolean).length;
  const strengthTotal = strengthChecks.length;

  const apps =
    statusFilter === "ALL"
      ? profile?.applications ?? []
      : (profile?.applications ?? []).filter((a) => a.status === statusFilter);

  const firstName = profile?.fullName?.split(/\s+/)[0] || "there";

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 text-sm text-ink/55">Your job search command center</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/seeker/profile"
          className="cursor-pointer rounded-2xl border border-navy/8 bg-white p-5 transition hover:border-marigold/30 hover:shadow-[0_8px_24px_rgba(242,169,59,0.08)]"
        >
          <User className="h-5 w-5 text-marigold" aria-hidden="true" />
          <p className="mt-3 font-data text-2xl font-bold text-ink">
            {strength}/{strengthTotal}
          </p>
          <p className="text-sm text-ink/55">Profile strength</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/8">
            <div
              className="h-full rounded-full bg-marigold"
              style={{ width: `${(strength / strengthTotal) * 100}%` }}
            />
          </div>
        </Link>
        <Link
          href="/jobs"
          className="cursor-pointer rounded-2xl border border-navy/8 bg-white p-5 transition hover:border-navy/20"
        >
          <Briefcase className="h-5 w-5 text-navy" aria-hidden="true" />
          <p className="mt-3 font-display text-xl font-bold text-ink">Browse jobs</p>
          <p className="text-sm text-ink/55">Find your next VA role</p>
        </Link>
        <div className="rounded-2xl border border-navy/8 bg-white p-5">
          <FileText className="h-5 w-5 text-ink/50" aria-hidden="true" />
          <p className="mt-3 font-data text-2xl font-bold text-ink">
            {profile?.applications.length ?? 0}
          </p>
          <p className="text-sm text-ink/55">Applications</p>
        </div>
        <Link
          href="/seeker/messages"
          className="cursor-pointer rounded-2xl border border-navy/8 bg-white p-5 transition hover:border-navy/20"
        >
          <MessageSquare className="h-5 w-5 text-navy/70" aria-hidden="true" />
          <p className="mt-3 font-data text-2xl font-bold text-ink">
            {profile?.conversations.length ?? 0}
          </p>
          <p className="text-sm text-ink/55">Recent threads</p>
        </Link>
      </div>

      {strength < 4 && (
        <div className="rounded-2xl border border-marigold/25 bg-marigold/8 p-5">
          <p className="font-semibold text-ink">Strengthen your profile to apply with confidence</p>
          <p className="mt-1 text-sm text-ink/60">
            Add resume, skills, photo, and LinkedIn — employers notice complete profiles.
          </p>
          <Link
            href="/seeker/profile"
            className="mt-3 inline-block cursor-pointer rounded-xl bg-marigold px-4 py-2 text-sm font-semibold text-ink"
          >
            Finish profile
          </Link>
        </div>
      )}

      <section className="rounded-2xl border border-navy/8 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-ink">Application pipeline</h2>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => {
              const href =
                s === "ALL" ? "/seeker/dashboard" : `/seeker/dashboard?status=${s}`;
              const active = statusFilter === s;
              return (
                <Link
                  key={s}
                  href={href}
                  className={`cursor-pointer rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
                    active
                      ? "bg-marigold/20 text-[#8a5a10]"
                      : "bg-ink/4 text-ink/50 hover:bg-ink/8"
                  }`}
                >
                  {s === "ALL" ? "All" : s.replace(/_/g, " ")}
                </Link>
              );
            })}
          </div>
        </div>

        {apps.length ? (
          <ul className="mt-4 divide-y divide-ink/5">
            {apps.map((app) => (
              <li key={app.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <div className="min-w-0">
                  <Link
                    href={`/jobs/${app.job.id}`}
                    className="cursor-pointer font-medium text-ink hover:text-navy"
                  >
                    {app.job.title}
                  </Link>
                  <p className="text-sm text-ink/50">
                    {app.job.company.companyName} · Applied {relativeTime(app.appliedAt.toISOString())}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${statusTone(app.status)}`}
                >
                  {app.status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink/50">
            {statusFilter === "ALL"
              ? "No applications yet. Browse jobs to get started."
              : `No ${statusFilter.toLowerCase().replace(/_/g, " ")} applications.`}
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-navy/8 bg-white p-6">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-navy/60" />
            <h2 className="font-display text-lg font-bold text-ink">Saved jobs</h2>
          </div>
          {(profile?.savedJobs.length ?? 0) > 0 ? (
            <ul className="mt-4 space-y-3">
              {profile!.savedJobs.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/jobs/${s.job.id}`}
                    className="cursor-pointer text-sm font-medium text-ink hover:text-navy"
                  >
                    {s.job.title}
                  </Link>
                  <p className="text-xs text-ink/45">{s.job.company.companyName}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink/50">
              Save roles while browsing to build a shortlist.{" "}
              <Link href="/jobs" className="cursor-pointer font-semibold text-marigold hover:underline">
                Browse jobs
              </Link>
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-navy/8 bg-white p-6">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-navy/60" />
            <h2 className="font-display text-lg font-bold text-ink">Job alerts</h2>
          </div>
          {jobAlertCount > 0 ? (
            <p className="mt-3 text-sm text-ink/60">
              You have {jobAlertCount} alert
              {jobAlertCount === 1 ? "" : "s"} set up.
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink/50">
              Alerts notify you when matching VA roles go live. Save a search on the jobs page to
              get started.
            </p>
          )}
          <Link
            href="/seeker/job-alerts"
            className="mt-4 inline-flex cursor-pointer rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-mist hover:bg-navy/90"
          >
            {jobAlertCount > 0 ? "Manage alerts" : "Explore open roles"}
          </Link>
        </section>
      </div>

      {(profile?.conversations.length ?? 0) > 0 && (
        <section className="rounded-2xl border border-navy/8 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-ink">Recent employer messages</h2>
          <ul className="mt-4 divide-y divide-ink/5">
            {profile!.conversations.map((c) => (
              <li key={c.id} className="py-3 first:pt-0">
                <Link
                  href={`/seeker/messages?c=${c.id}`}
                  className="cursor-pointer font-medium text-ink hover:text-navy"
                >
                  {c.company.companyName}
                </Link>
                {c.messages[0] && (
                  <p className="mt-0.5 truncate text-sm text-ink/50">{c.messages[0].body}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
