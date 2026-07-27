"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Check,
  X,
  Globe,
  MapPin,
  Mail,
  Briefcase,
  Clock,
  ExternalLink,
} from "lucide-react";

type PendingCompany = {
  id: string;
  companyName: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  teamSize: string | null;
  foundedYear: number | null;
  headquarters: string | null;
  highlights: string[];
  logoUrl: string | null;
  updatedAt: string;
  user: { email: string };
  jobs: { id: string; title: string; status: string }[];
  _count: { jobs: number };
};

type Props = {
  initialCompanies: PendingCompany[];
};

export default function CompanyReviewQueue({ initialCompanies }: Props) {
  const router = useRouter();
  const [companies, setCompanies] = useState(initialCompanies);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  async function review(companyId: string, action: "approve" | "reject", reason?: string) {
    setError("");
    setLoadingId(companyId);

    const res = await fetch(`/api/admin/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });

    const result = await res.json();
    setLoadingId(null);

    if (!res.ok) {
      setError(result.error || "Action failed");
      return;
    }

    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    setRejectingId(null);
    setRejectReason("");
    router.refresh();
  }

  if (companies.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/5 bg-white p-12 text-center shadow-xs">
        <Check className="mx-auto mb-3 h-8 w-8 text-teal" aria-hidden="true" />
        <h2 className="font-display text-lg font-bold text-ink">All caught up</h2>
        <p className="mt-1 text-sm text-ink/50">No employers are waiting for company verification.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">{error}</div>
      )}

      <div className="rounded-xl border border-navy/10 bg-navy/5 px-4 py-3 text-sm text-ink/70">
        <strong className="text-ink">Two-step trust model:</strong> verify the employer company first, then approve
        individual job posts. Jobs from unverified companies cannot go live on the public board.
      </div>

      {companies.map((company) => {
        const initials = company.companyName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <article
            key={company.id}
            className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs transition-shadow hover:shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-4">
                  {company.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={company.logoUrl}
                      alt=""
                      className="h-14 w-14 rounded-xl border border-ink/5 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal/10 font-display text-lg font-bold text-teal">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-bold text-ink">{company.companyName}</h2>
                      <span className="rounded-full bg-marigold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5a10]">
                        Pending verification
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink/55">{company.industry || "Industry not set"}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink/45">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    {company.user.email}
                  </span>
                  {company.headquarters && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {company.headquarters}
                    </span>
                  )}
                  {company.teamSize && <span>{company.teamSize} employees</span>}
                  {company.foundedYear && <span>Founded {company.foundedYear}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    Updated {new Date(company.updatedAt).toLocaleString()}
                  </span>
                </div>

                {company.description && (
                  <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-ink/70">{company.description}</p>
                )}

                {company.highlights.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {company.highlights.map((h) => (
                      <span
                        key={h}
                        className="rounded-md bg-teal/8 px-2 py-0.5 text-[10px] font-semibold text-teal"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}

                {company.jobs.length > 0 && (
                  <div className="mt-4 rounded-xl bg-mist/80 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink/45">
                      <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                      Job activity ({company._count.jobs} total)
                    </p>
                    <ul className="space-y-1">
                      {company.jobs.map((job) => (
                        <li key={job.id} className="flex items-center justify-between text-sm">
                          <span className="text-ink/75">{job.title}</span>
                          <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-ink/50">
                            {job.status.replace(/_/g, " ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal hover:underline"
                    >
                      <Globe className="h-4 w-4" aria-hidden="true" />
                      Website
                    </a>
                  )}
                  <Link
                    href={`/companies/${company.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-ink/55 hover:text-teal"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Preview public profile
                  </Link>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
                <button
                  type="button"
                  disabled={loadingId === company.id}
                  onClick={() => review(company.id, "approve")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal/95 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Verify company
                </button>
                <button
                  type="button"
                  disabled={loadingId === company.id}
                  onClick={() => setRejectingId(company.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/4 disabled:opacity-60"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Reject
                </button>
              </div>
            </div>

            {rejectingId === company.id && (
              <div className="mt-4 border-t border-ink/5 pt-4">
                <label htmlFor={`reason-${company.id}`} className="mb-2 block text-sm font-medium text-ink">
                  Rejection reason
                </label>
                <textarea
                  id={`reason-${company.id}`}
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain what the employer needs to fix..."
                  className="w-full resize-y rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(null);
                      setRejectReason("");
                    }}
                    className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loadingId === company.id}
                    onClick={() => review(company.id, "reject", rejectReason)}
                    className="rounded-xl bg-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Confirm rejection
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
