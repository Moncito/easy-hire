"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  MoreVertical, 
  Edit3, 
  Copy, 
  XCircle, 
  ExternalLink,
  ChevronRight,
  TrendingUp
} from "lucide-react";

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  employmentType: string;
  location: string;
  remoteType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: string;
  updatedAt: string;
  _count: { applications: number };
};

type Props = {
  jobs: Job[];
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-ink/5 text-ink/60 border-ink/10",
  PENDING_REVIEW: "bg-marigold/8 text-[#8a5a10] border border-marigold/15",
  ACTIVE: "bg-teal/8 text-teal border border-teal/15",
  CLOSED: "bg-ember/8 text-ember border border-ember/15",
};

export default function JobList({ jobs: initialJobs }: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleCloseJob(id: string) {
    if (!confirm("Are you sure you want to close this job listing?")) return;
    
    setLoadingId(id);
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });

    if (res.ok) {
      const updatedJob = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "CLOSED" } : j)));
    }
    setLoadingId(null);
    setActiveMenuId(null);
  }

  async function handleDuplicateJob(job: Job) {
    if (!confirm(`Duplicate "${job.title}"?`)) return;

    setLoadingId(job.id);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${job.title} (Copy)`,
        description: job.description,
        category: job.category,
        employmentType: job.employmentType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        location: job.location,
        remoteType: job.remoteType,
      }),
    });

    if (res.ok) {
      router.refresh();
      // Reload page to fetch new jobs list
      window.location.reload();
    }
    setLoadingId(null);
    setActiveMenuId(null);
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-3xl border border-ink/5 bg-white p-12 text-center shadow-xs max-w-xl mx-auto mt-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal/5 text-teal animate-pulse">
          <Briefcase className="h-8 w-8" strokeWidth={1.5} />
        </div>
        <h3 className="font-display text-xl font-bold text-ink">Ready to hire your first Virtual Assistant?</h3>
        <p className="mt-2 text-sm text-ink/50 leading-relaxed max-w-sm mx-auto">
          Create your first job posting to start receiving verified applications from top candidates in the Philippines.
        </p>
        <Link
          href="/employer/jobs/new"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-teal/15 hover:bg-teal/95 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
        >
          Post your first job
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => {
        const hasSalary = job.salaryMin || job.salaryMax;
        const formattedSalary = hasSalary
          ? `\u20b1${job.salaryMin?.toLocaleString() || "0"} - \u20b1${job.salaryMax?.toLocaleString() || "0"}`
          : "Salary not specified";

        return (
          <div
            key={job.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-ink/5 bg-white p-5 shadow-xs transition-all duration-300 hover:translate-y-[-3px] hover:border-ink/10 hover:shadow-md"
          >
            {/* Header / Menu */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[job.status]}`}>
                  {job.status.replace("_", " ")}
                </span>
                <h3 className="mt-2.5 font-display text-lg font-bold leading-snug text-ink transition-colors group-hover:text-teal">
                  {job.title}
                </h3>
              </div>

              {/* Three-dot dropdown menu */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setActiveMenuId(activeMenuId === job.id ? null : job.id)}
                  className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
                >
                  <MoreVertical className="h-4.5 w-4.5" />
                </button>

                {activeMenuId === job.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setActiveMenuId(null)}
                    />
                    <div className="absolute right-0 mt-1.5 w-40 origin-top-right rounded-xl border border-ink/10 bg-white p-1.5 shadow-lg z-20">
                      <Link
                        href={`/employer/jobs/${job.id}/edit`}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink/75 hover:bg-ink/5"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit details
                      </Link>
                      <button
                        onClick={() => handleDuplicateJob(job)}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-ink/75 hover:bg-ink/5 cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Duplicate job
                      </button>
                      {job.status !== "CLOSED" && (
                        <button
                          onClick={() => handleCloseJob(job.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-ember hover:bg-ember/5 cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Close posting
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Meta information */}
            <div className="mt-4 space-y-2 border-t border-ink/5 pt-4">
              <div className="flex items-center gap-2 text-xs text-ink/60">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-ink/35" />
                <span>{job.location} &bull; {job.remoteType}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink/60">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-ink/35" />
                <span>{job.employmentType.replace("_", "-")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink/65 font-medium">
                <DollarSign className="h-3.5 w-3.5 shrink-0 text-teal" />
                <span>{formattedSalary}</span>
              </div>
            </div>

            {/* Bottom info & Navigation */}
            <div className="mt-5 flex items-center justify-between border-t border-ink/5 pt-4">
              <div className="flex items-center gap-1.5 text-xs text-ink/50">
                <Users className="h-4 w-4 text-ink/35" />
                <span>
                  <strong className="text-ink font-semibold">{job._count.applications}</strong> applied
                </span>
              </div>

              <Link
                href={`/employer/jobs/${job.id}/applicants`}
                className="flex items-center gap-1 rounded-lg bg-teal/5 hover:bg-teal/10 px-3.5 py-1.5 text-xs font-bold text-teal transition-all"
              >
                <span>Applicants</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            
            {loadingId === job.id && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal border-t-transparent" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}