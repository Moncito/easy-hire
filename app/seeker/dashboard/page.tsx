import Link from "next/link";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { ensureSeekerProfile } from "@/lib/seekers";
import { listJobAlerts } from "@/lib/job-alerts";
import { relativeTime } from "@/lib/time-ago";
import {
  Bookmark,
  Bell,
  MessageSquare,
  Settings2,
  Plus,
  XCircle,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import SeekerDashboardStats from "@/components/seeker/SeekerDashboardStats";
import ApplicationTimeline from "@/components/seeker/ApplicationTimeline";
import { SeekerNavBandBleed } from "@/components/seeker/SeekerNavBand";

const STATUS_PIPELINE = ["APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED"] as const;
type StatusFilter = (typeof STATUS_PIPELINE)[number] | "ALL";

const STATUS_FILTERS: StatusFilter[] = ["ALL", ...STATUS_PIPELINE];

function statusBadge(status: string) {
  if (status === "REJECTED")
    return "bg-ember/10 text-ember border border-ember/20";
  if (status === "HIRED")
    return "bg-marigold/15 text-[#7a4a0a] border border-marigold/20";
  if (status === "INTERVIEW")
    return "bg-marigold/10 text-[#8a5a10] border border-marigold/15";
  if (status === "SHORTLISTED")
    return "bg-navy/8 text-navy border border-navy/15";
  return "bg-ink/5 text-ink/55 border border-ink/8";
}

export default async function SeekerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const { status: statusParam } = await searchParams;
  const normalized = statusParam?.toUpperCase() as StatusFilter | undefined;
  const statusFilter: StatusFilter =
    normalized && STATUS_FILTERS.includes(normalized) ? normalized : "ALL";

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
  const jobAlerts = await listJobAlerts(session!.user!.id);

  // Profile strength
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

  const firstName = profile?.fullName?.split(/\s+/)[0] || "there";

  // Derive typed arrays from profile so callback parameters are properly inferred
  type AppEntry = NonNullable<typeof profile>["applications"][number];
  type SavedJobEntry = NonNullable<typeof profile>["savedJobs"][number];
  type ConvoEntry = NonNullable<typeof profile>["conversations"][number];

  const allApps: AppEntry[] = profile?.applications ?? [];
  const savedJobs: SavedJobEntry[] = profile?.savedJobs ?? [];
  const conversations: ConvoEntry[] = profile?.conversations ?? [];

  // Featured app for timeline: most recent non-rejected
  const featuredApp = allApps.find((a) => a.status !== "REJECTED") ?? null;

  // Apps to show in the pipeline list (respects filter, excludes featured in ALL view)
  const pipelineList =
    statusFilter === "ALL"
      ? allApps.filter((a) => (featuredApp ? a.id !== featuredApp.id : true))
      : allApps.filter((a) => a.status === statusFilter);

  // First job alert for preview card
  const firstAlert = jobAlerts[0] ?? null;

  return (
    <div className="animate-fade-in">
      <SeekerNavBandBleed
        section="Dashboard"
        icon={LayoutDashboard}
        metaLabel={firstName !== "there" ? `Hi, ${firstName}` : null}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold/15 px-2.5 py-1 font-data text-[10px] font-bold uppercase tracking-wide text-[#8a5a10]">
            {strength}/{strengthTotal} profile
          </span>
        }
      />

      <div className="space-y-8 pb-16 pt-6 sm:pt-8">

        {/* ── Header ── */}
        <div>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-ink/50">Your job search command center</p>
        </div>

        {/* ── Stats strip ── */}
        <SeekerDashboardStats
          strength={strength}
          strengthTotal={strengthTotal}
          applicationCount={allApps.length}
          conversationCount={profile?.conversations.length ?? 0}
        />

        {/* ── Profile strength CTA (light inline banner) ── */}
        {strength < 4 && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-marigold/[0.07] px-5 py-4 ring-1 ring-marigold/20">
            <div>
              <p className="font-semibold text-ink">
                Strengthen your profile to stand out
              </p>
              <p className="mt-0.5 text-sm text-ink/55">
                Add your resume, skills, photo, and LinkedIn — employers notice complete profiles.
              </p>
            </div>
            <Link
              href="/seeker/profile"
              className="shrink-0 rounded-xl bg-marigold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-marigold/90"
            >
              Finish profile
            </Link>
          </div>
        )}

        {/* ── Application tracking ── */}
        <section aria-labelledby="pipeline-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="pipeline-heading"
              className="font-display text-lg font-bold text-ink"
            >
              Application tracking
            </h2>

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((s) => {
                const href =
                  s === "ALL"
                    ? "/seeker/dashboard"
                    : `/seeker/dashboard?status=${s}`;
                const active = statusFilter === s;
                return (
                  <Link
                    key={s}
                    href={href}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
                      active
                        ? "bg-marigold/20 text-[#8a5a10]"
                        : "bg-ink/[0.04] text-ink/45 hover:bg-ink/8 hover:text-ink/65"
                    }`}
                  >
                    {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                  </Link>
                );
              })}
            </div>
          </div>

          {allApps.length === 0 ? (
            /* Empty state */
            <div className="rounded-2xl bg-ink/[0.02] px-6 py-10 text-center ring-1 ring-ink/6">
              <p className="text-sm text-ink/50">
                No applications yet.{" "}
                <Link
                  href="/jobs"
                  className="font-semibold text-marigold hover:underline"
                >
                  Browse open VA roles
                </Link>{" "}
                to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Featured app with horizontal timeline */}
              {featuredApp && statusFilter !== "REJECTED" && (
                <div className="rounded-2xl bg-white px-6 py-5 ring-1 ring-ink/8 shadow-[0_2px_12px_rgba(32,36,43,0.05)]">
                  <ApplicationTimeline app={featuredApp} />
                </div>
              )}

              {/* Pipeline list */}
              {pipelineList.length > 0 && (
                <ul
                  className="divide-y divide-ink/5 rounded-2xl bg-white px-5 ring-1 ring-ink/8"
                  aria-label="Other applications"
                >
                  {pipelineList.map((app) => (
                    <li
                      key={app.id}
                      className="flex items-center justify-between gap-3 py-3.5 first:pt-4 last:pb-4"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/jobs/${app.job.id}`}
                          className="font-medium text-ink transition hover:text-navy"
                        >
                          {app.job.title}
                        </Link>
                        <p className="text-xs text-ink/45">
                          {app.job.company.companyName} ·{" "}
                          {relativeTime(app.appliedAt.toISOString())}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${statusBadge(app.status)}`}
                      >
                        {app.status === "REJECTED" && (
                          <XCircle
                            className="mr-1 inline h-3 w-3 text-ember"
                            aria-hidden="true"
                          />
                        )}
                        {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Status-filtered empty state */}
              {statusFilter !== "ALL" && pipelineList.length === 0 && !featuredApp && (
                <p className="py-4 text-sm text-ink/45">
                  No {statusFilter.toLowerCase()} applications.
                </p>
              )}
            </div>
          )}
        </section>

        {/* ── Bottom two-column grid ── */}
        <div className="grid gap-8 lg:grid-cols-2">

          {/* Saved jobs */}
          <section aria-labelledby="saved-heading">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-navy/50" aria-hidden="true" />
                <h2
                  id="saved-heading"
                  className="font-display text-base font-bold text-ink"
                >
                  Saved jobs
                </h2>
              </div>
              <Link
                href="/seeker/saved-jobs"
                className="flex items-center gap-0.5 text-xs font-semibold text-ink/40 transition hover:text-navy"
              >
                View all
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>

            {savedJobs.length > 0 ? (
              <ul className="divide-y divide-ink/5">
                {savedJobs.map((s) => (
                  <li key={s.id} className="py-2.5 first:pt-0 last:pb-0">
                    <Link
                      href={`/jobs/${s.job.id}`}
                      className="block text-sm font-medium text-ink transition hover:text-navy"
                    >
                      {s.job.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink/40">
                      {s.job.company.companyName}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink/45">
                Save roles while browsing to build a shortlist.{" "}
                <Link
                  href="/jobs"
                  className="font-semibold text-marigold hover:underline"
                >
                  Browse jobs
                </Link>
              </p>
            )}
          </section>

          {/* Job alerts */}
          <section aria-labelledby="alerts-heading">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-navy/50" aria-hidden="true" />
                <h2
                  id="alerts-heading"
                  className="font-display text-base font-bold text-ink"
                >
                  Job alerts
                  {jobAlerts.length > 0 && (
                    <span className="ml-2 font-data text-xs font-normal text-ink/40">
                      {jobAlerts.length}
                    </span>
                  )}
                </h2>
              </div>
              <Link
                href="/seeker/job-alerts"
                className="flex items-center gap-1 text-xs font-semibold text-ink/40 transition hover:text-navy"
                aria-label="Manage job alerts"
              >
                <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                Manage
              </Link>
            </div>

            {firstAlert ? (
              <div className="mb-3 rounded-xl bg-ink/[0.03] px-4 py-3 ring-1 ring-ink/8">
                <p className="text-sm font-semibold text-ink">
                  &ldquo;{firstAlert.keywords}&rdquo;
                </p>
                <p className="mt-0.5 text-xs text-ink/45">
                  {firstAlert.category ? `${firstAlert.category} · ` : ""}
                  {firstAlert.frequency.charAt(0) +
                    firstAlert.frequency.slice(1).toLowerCase()}{" "}
                  digest
                </p>
              </div>
            ) : (
              <p className="mb-3 text-sm text-ink/45">
                Get notified when matching VA roles go live. Save a search on
                the jobs page to get started.
              </p>
            )}

            <Link
              href="/seeker/job-alerts"
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink/15 px-3.5 py-2 text-xs font-semibold text-ink/65 transition hover:border-navy/30 hover:text-navy"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {firstAlert ? "Create another alert" : "Create new alert"}
            </Link>
          </section>
        </div>

        {/* ── Recent messages (light section) ── */}
        {conversations.length > 0 && (
          <section aria-labelledby="messages-heading">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare
                  className="h-4 w-4 text-teal/70"
                  aria-hidden="true"
                />
                <h2
                  id="messages-heading"
                  className="font-display text-base font-bold text-ink"
                >
                  Recent messages
                </h2>
              </div>
              <Link
                href="/seeker/messages"
                className="flex items-center gap-0.5 text-xs font-semibold text-ink/40 transition hover:text-navy"
              >
                View all
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>

            <ul className="divide-y divide-ink/5">
              {conversations.map((c) => (
                <li key={c.id} className="py-2.5 first:pt-0 last:pb-0">
                  <Link
                    href={`/seeker/messages?c=${c.id}`}
                    className="block text-sm font-medium text-ink transition hover:text-navy"
                  >
                    {c.company.companyName}
                  </Link>
                  {c.messages[0] && (
                    <p className="mt-0.5 truncate text-xs text-ink/40">
                      {c.messages[0].body}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
