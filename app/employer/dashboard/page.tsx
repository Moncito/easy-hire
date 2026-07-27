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
  MoreVertical, 
  Check, 
  X,
  ExternalLink,
  ChevronRight
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
    // If somehow user has role employer but no company profile, redirect to build it
    redirect("/employer/company-profile");
  }

  // Fetch counts
  const [
    activeJobsCount,
    totalApplicantsCount,
    shortlistedCount,
    interviewStageCount,
    hiredCount,
    newApplicantsThisWeek,
    recentJobs,
    recentApplications
  ] = await Promise.all([
    prisma.job.count({ where: { companyId: company.id, status: "ACTIVE" } }),
    prisma.application.count({ where: { job: { companyId: company.id } } }),
    prisma.application.count({ where: { job: { companyId: company.id }, status: "SHORTLISTED" } }),
    prisma.application.count({ where: { job: { companyId: company.id }, status: "INTERVIEW" } }),
    prisma.application.count({ where: { job: { companyId: company.id }, status: "HIRED" } }),
    prisma.application.count({ 
      where: { 
        job: { companyId: company.id }, 
        appliedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      } 
    }),
    prisma.job.findMany({
      where: { companyId: company.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: {
        _count: { select: { applications: true } }
      }
    }),
    prisma.application.findMany({
      where: { job: { companyId: company.id } },
      orderBy: { appliedAt: "desc" },
      take: 5,
      include: {
        seeker: { select: { fullName: true } },
        job: { select: { title: true } }
      }
    })
  ]);

  // Calculate profile completion checklist
  const checklist = [
    { name: "Company Name", done: !!company.companyName },
    { name: "Description", done: !!company.description },
    { name: "Industry", done: !!company.industry },
    { name: "Company Logo", done: !!company.logoUrl },
    { name: "Social Links", done: !!(company.linkedinUrl || company.facebookUrl || company.instagramUrl || company.xUrl) },
    { name: "Benefits & Highlights", done: company.highlights && company.highlights.length > 0 },
  ];
  
  const completedCount = checklist.filter(item => item.done).length;
  const profileCompletion = Math.round((completedCount / checklist.length) * 100);

  // Stats Card data
  const stats = [
    { 
      label: "Active Jobs", 
      value: activeJobsCount, 
      trend: "Currently hiring", 
      icon: Briefcase, 
      color: "text-teal bg-teal/5 border-teal/10" 
    },
    { 
      label: "Total Applicants", 
      value: totalApplicantsCount, 
      trend: `${newApplicantsThisWeek} new this week`, 
      isTrendUp: newApplicantsThisWeek > 0,
      icon: Users, 
      color: "text-navy bg-navy/5 border-navy/10" 
    },
    { 
      label: "Shortlisted", 
      value: shortlistedCount, 
      trend: "Marked as promising", 
      icon: Clock, 
      color: "text-marigold bg-marigold/5 border-marigold/10" 
    },
    { 
      label: "In Interview", 
      value: interviewStageCount, 
      trend: "Interview stage", 
      icon: Calendar, 
      color: "text-indigo-600 bg-indigo-50 border-indigo-100" 
    },
    { 
      label: "Hired", 
      value: hiredCount, 
      trend: "Successful matches", 
      icon: CheckCircle, 
      color: "text-emerald-600 bg-emerald-50 border-emerald-100" 
    },
  ];

  return (
    <>
        {/* Hero Banner */}
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
              Welcome back, {company.companyName}
            </h1>
            <p className="mt-1.5 text-sm text-ink/50">
              Here&apos;s what&apos;s happening with your virtual assistant hiring workspace today.
            </p>
          </div>
          <Link
            href="/employer/jobs/new"
            className="flex items-center gap-2 rounded-xl bg-teal px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-teal/15 transition-all hover:bg-teal/95 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
            Post a job posting
          </Link>
        </div>

        {company.verifiedStatus === "PENDING" && (
          <div className="mb-8 rounded-2xl border border-marigold/20 bg-marigold/5 px-5 py-4">
            <p className="font-semibold text-ink">Company verification in progress</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/60">
              Your company profile is under admin review. Job posts cannot appear on the public board until
              verification is approved — even if individual jobs are marked active internally.
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
          <div className="mb-8 rounded-2xl border border-ember/20 bg-ember/5 px-5 py-4">
            <p className="font-semibold text-ink">Company verification declined</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/60">
              Update your company profile and contact support if you need help resolving this.
              Public job listings remain hidden until verification is restored.
            </p>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div 
                key={i} 
                className={`rounded-2xl border bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">{stat.label}</span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color} border`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="font-display text-3xl font-bold tracking-tight text-ink">{stat.value}</p>
                  <p className={`mt-1.5 text-xs font-medium ${stat.isTrendUp ? "text-teal" : "text-ink/40"}`}>
                    {stat.isTrendUp && "↑ "}{stat.trend}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* LEFT: Job Postings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-ink/5 pb-4">
              <h2 className="text-lg font-bold text-ink tracking-tight">Active Job Postings</h2>
              <Link 
                href="/employer/jobs" 
                className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
              >
                View all jobs
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <div className="rounded-2xl border border-ink/5 bg-white p-12 text-center shadow-xs">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal/5 text-teal">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-ink">No active jobs</h3>
                <p className="mt-1 text-xs text-ink/50 max-w-xs mx-auto">
                  Get started by posting your first job specification to source verified virtual assistants.
                </p>
                <Link
                  href="/employer/jobs/new"
                  className="mt-4 inline-block rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white shadow-xs"
                >
                  Create job description
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {recentJobs.map((job) => (
                  <div 
                    key={job.id}
                    className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-ink/5 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-ink/10"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-display text-base font-bold text-ink transition-colors group-hover:text-teal">
                          {job.title}
                        </h4>
                        <p className="mt-1 text-xs text-ink/50">
                          {job.employmentType.replace("_", " ")} &bull; {job.remoteType} &bull; {job.location}
                        </p>
                      </div>
                      
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                        job.status === "ACTIVE" && company.verifiedStatus !== "APPROVED"
                          ? "bg-marigold/8 text-[#8a5a10] border border-marigold/15"
                          : job.status === "ACTIVE"
                          ? "bg-teal/8 text-teal border border-teal/15"
                          : job.status === "DRAFT"
                          ? "bg-ink/5 text-ink/60 border border-ink/10"
                          : "bg-marigold/8 text-[#8a5a10] border border-marigold/15"
                      }`}>
                        {job.status === "ACTIVE" && company.verifiedStatus !== "APPROVED"
                          ? "Approved — not public"
                          : job.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-ink/5 pt-4 mt-1">
                      <div className="flex items-center gap-4 text-xs font-medium text-ink/65">
                        <div>
                          <span className="font-bold text-ink">{job._count.applications}</span> applicants
                        </div>
                        <div className="text-ink/30">|</div>
                        <div className="text-ink/40">
                          Updated {new Date(job.updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/employer/jobs/${job.id}/applicants`}
                          className="rounded-lg bg-ink/5 hover:bg-ink/10 px-3 py-1.5 text-xs font-semibold text-ink transition-colors"
                        >
                          View applicants
                        </Link>
                        
                        <Link
                          href={`/employer/jobs/${job.id}/edit`}
                          className="rounded-lg border border-ink/10 hover:bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink/75 transition-colors"
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

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            
            {/* Profile Completion */}
            <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-bold text-ink">Company Profile</span>
                <span className="font-display text-2xl font-extrabold text-teal">{profileCompletion}%</span>
              </div>
              
              <div className="h-2 overflow-hidden rounded-full bg-ink/5 mb-4">
                <div 
                  className="h-full rounded-full bg-teal transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>

              <p className="text-xs text-ink/50 leading-relaxed mb-4">
                Complete your profile and add social channels to attract highly qualified virtual assistants.
              </p>

              <div className="space-y-2 mb-5">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2.5 text-xs">
                    {item.done ? (
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ember/5 text-ember/70 border border-ember/15">
                        <X className="h-3 w-3" strokeWidth={3} />
                      </div>
                    )}
                    <span className={item.done ? "text-ink/65 line-through" : "text-ink/80 font-medium"}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/employer/company-profile"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink py-2.5 text-xs font-semibold text-white transition-colors hover:bg-ink/90 cursor-pointer"
              >
                Complete Profile
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Hiring Activity Timeline */}
            <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-ink mb-4">Hiring Activity</h3>

              {recentApplications.length === 0 ? (
                <p className="text-xs text-ink/40 text-center py-4">No recent applicant activities</p>
              ) : (
                <div className="space-y-4">
                  {recentApplications.map((app, i) => (
                    <div key={app.id} className="relative flex gap-3">
                      {/* Timeline Line */}
                      {i < recentApplications.length - 1 && (
                        <div className="absolute left-2.5 top-6 bottom-[-16px] w-px bg-ink/10" />
                      )}
                      
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/15 text-teal text-[10px] font-bold">
                        {app.seeker.fullName[0].toUpperCase()}
                      </div>
                      
                      <div className="text-xs">
                        <p className="text-ink/80 font-medium leading-tight">
                          <span className="font-bold text-ink">{app.seeker.fullName}</span> applied for{" "}
                          <span className="font-semibold text-teal">{app.job.title}</span>
                        </p>
                        <span className="text-[10px] text-ink/40 mt-1 block">
                          {new Date(app.appliedAt).toLocaleDateString()} &bull; {new Date(app.appliedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-ink mb-3">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-2">
                <Link
                  href="/employer/jobs/new"
                  className="flex items-center justify-between rounded-lg bg-ink/3 hover:bg-ink/5 px-3 py-2 text-xs font-semibold text-ink transition-colors"
                >
                  <span>Post Job</span>
                  <Plus className="h-4 w-4" />
                </Link>
                <Link
                  href="/employer/applicants"
                  className="flex items-center justify-between rounded-lg bg-ink/3 hover:bg-ink/5 px-3 py-2 text-xs font-semibold text-ink transition-colors"
                >
                  <span>View Applicants</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/employer/company-profile"
                  className="flex items-center justify-between rounded-lg bg-ink/3 hover:bg-ink/5 px-3 py-2 text-xs font-semibold text-ink transition-colors"
                >
                  <span>Edit Company Profile</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>

    </>
  );
}