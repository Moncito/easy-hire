"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Briefcase,
  Copy,
  Edit3,
  MoreVertical,
  XCircle,
} from "lucide-react";
import EmployerFilterChips from "@/components/employer/ui/EmployerFilterChips";
import EmployerStatusPill, {
  formatJobStatusLabel,
  jobStatusPillKey,
} from "@/components/employer/ui/EmployerStatusPill";
import EmployerEmptyState from "@/components/employer/ui/EmployerEmptyState";
import { EmployerPrimaryButton } from "@/components/employer/ui/EmployerPageHeader";
import { formatPesoRange } from "@/lib/format";

type ScreeningQuestion = {
  prompt: string;
  required: boolean;
};

type Job = {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  category: string;
  industry: string | null;
  status: string;
  employmentType: string;
  location: string;
  remoteType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string;
  createdAt: string;
  updatedAt: string;
  screeningQuestions?: ScreeningQuestion[];
  _count: { applications: number };
};

type Props = {
  jobs: Job[];
  companyVerified: boolean;
};

const FILTER_ALL = "ALL";

export default function JobList({ jobs: initialJobs, companyVerified }: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [filter, setFilter] = useState(FILTER_ALL);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      ALL: jobs.length,
      ACTIVE: 0,
      DRAFT: 0,
      PENDING_REVIEW: 0,
      CLOSED: 0,
    };
    for (const job of jobs) {
      if (job.status in c) c[job.status]++;
    }
    return c;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (filter === FILTER_ALL) return jobs;
    return jobs.filter((j) => j.status === filter);
  }, [jobs, filter]);

  async function handleCloseJob(id: string) {
    if (!confirm("Close this job listing? It will no longer accept applications.")) return;

    setLoadingId(id);
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });

    if (res.ok) {
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
        requirements: job.requirements,
        benefits: job.benefits,
        category: job.category,
        industry: job.industry,
        employmentType: job.employmentType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryPeriod: job.salaryPeriod,
        location: job.location,
        remoteType: job.remoteType,
        screeningQuestions:
          job.screeningQuestions?.map((q) => ({
            prompt: q.prompt,
            required: q.required,
          })) ?? [],
      }),
    });

    if (res.ok) {
      router.refresh();
      window.location.reload();
    }
    setLoadingId(null);
    setActiveMenuId(null);
  }

  const filterOptions = [
    { value: FILTER_ALL, label: "All", count: counts.ALL },
    { value: "ACTIVE", label: "Active", count: counts.ACTIVE },
    { value: "DRAFT", label: "Draft", count: counts.DRAFT },
    { value: "PENDING_REVIEW", label: "Pending", count: counts.PENDING_REVIEW },
    { value: "CLOSED", label: "Closed", count: counts.CLOSED },
  ];

  if (jobs.length === 0) {
    return (
      <EmployerEmptyState
        title="Ready to hire your first Virtual Assistant?"
        description="Create your first job posting to start receiving verified applications from top candidates in the Philippines."
        action={
          <EmployerPrimaryButton href="/employer/jobs/new">
            Post your first job
          </EmployerPrimaryButton>
        }
      />
    );
  }

  return (
    <>
      <EmployerFilterChips options={filterOptions} value={filter} onChange={setFilter} />

      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white/60 shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1fr)_100px_80px_100px_48px] gap-4 border-b border-ink/5 bg-ink/[0.02] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-ink/40 md:grid">
          <span>Job</span>
          <span>Status</span>
          <span className="text-right">Applicants</span>
          <span className="text-right">Updated</span>
          <span />
        </div>

        {filteredJobs.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink/45">
            No jobs match this filter.
          </p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {filteredJobs.map((job) => {
              const pillKey = jobStatusPillKey(job.status, companyVerified);
              const salary = formatPesoRange(job.salaryMin, job.salaryMax);

              return (
                <li key={job.id} className="group relative">
                  <Link
                    href={`/employer/jobs/${job.id}/applicants`}
                    className="grid grid-cols-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-ink/[0.02] md:grid-cols-[minmax(0,1fr)_100px_80px_100px_48px] md:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-display font-bold text-ink transition-colors group-hover:text-teal">
                        {job.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/45">
                        {job.location} · {job.employmentType.replace("_", " ")} · {salary}
                      </p>
                    </div>
                    <div className="md:flex md:justify-start">
                      <EmployerStatusPill
                        status={pillKey}
                        label={formatJobStatusLabel(job.status, companyVerified)}
                      />
                    </div>
                    <p className="font-data text-sm font-semibold tabular-nums text-ink md:text-right">
                      {job._count.applications}
                    </p>
                    <p className="font-data text-xs tabular-nums text-ink/40 md:text-right">
                      {new Date(job.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <div className="hidden md:block" />
                  </Link>

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 md:right-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === job.id ? null : job.id);
                      }}
                      className="rounded-lg p-1.5 text-ink/35 transition hover:bg-ink/5 hover:text-ink"
                      aria-label="Job actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuId === job.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveMenuId(null)}
                          aria-hidden="true"
                        />
                        <div className="absolute right-0 z-20 mt-1 w-44 origin-top-right rounded-xl border border-ink/10 bg-white p-1.5 shadow-lg">
                          <Link
                            href={`/employer/jobs/${job.id}/edit`}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink/75 hover:bg-ink/5"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          <Link
                            href={`/employer/jobs/${job.id}/applicants`}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink/75 hover:bg-ink/5"
                          >
                            <Briefcase className="h-3.5 w-3.5" />
                            Applicants
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDuplicateJob(job)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-ink/75 hover:bg-ink/5"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Duplicate
                          </button>
                          {job.status !== "CLOSED" && (
                            <button
                              type="button"
                              onClick={() => handleCloseJob(job.id)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-ember hover:bg-ember/5"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Close
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {loadingId === job.id && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal border-t-transparent" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
