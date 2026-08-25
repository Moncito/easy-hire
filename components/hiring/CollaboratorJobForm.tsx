"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import JobForm, { JobFormData, JobSubmitIntent } from "@/components/employer/JobForm";
import JobFormPageShell from "@/components/employer/JobFormPageShell";
import { EmployerShellProvider } from "@/components/employer/EmployerShellContext";
import RecruiterShell from "@/components/hiring/RecruiterShell";
import type { CompanyMemberRole } from "@/lib/collaborative-hiring";

type Props = {
  companyId: string;
  role: CompanyMemberRole;
  jobId?: string;
  initialData?: JobFormData;
};

async function saveJob(companyId: string, data: JobFormData, jobId?: string) {
  const url = jobId ? `/api/hiring/${companyId}/jobs/${jobId}` : `/api/hiring/${companyId}/jobs`;
  const method = jobId ? "PATCH" : "POST";
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Something went wrong");
  return result as { id: string };
}

async function submitForReview(companyId: string, jobId: string) {
  const res = await fetch(`/api/hiring/${companyId}/jobs/${jobId}/submit`, { method: "PATCH" });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Could not submit for review");
}

export default function CollaboratorJobForm({ companyId, role, jobId, initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(data: JobFormData, intent: JobSubmitIntent) {
    setError("");
    setLoading(true);
    try {
      const job = await saveJob(companyId, data, jobId);
      if (intent === "submit") await submitForReview(companyId, jobId ?? job.id);
      router.push(`/hiring/${companyId}/jobs/${jobId ?? job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <RecruiterShell companyId={companyId} role={role} active="jobs">
      <EmployerShellProvider plan="PRO">
        <JobFormPageShell
          title={jobId ? "Edit job posting" : "Post a new job"}
          description={jobId ? "Saving changes on a live role sends it back for review before it's visible again." : "Save a draft anytime, or submit for review when you're ready to go live."}
          footer={error ? <p className="mt-4 text-sm text-ember">{error}</p> : undefined}
        >
          <JobForm initialData={initialData} loading={loading} onSubmit={handleSubmit} hideAiTools />
        </JobFormPageShell>
      </EmployerShellProvider>
    </RecruiterShell>
  );
}
