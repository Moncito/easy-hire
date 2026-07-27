"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import JobForm, { JobFormData, JobSubmitIntent } from "@/components/employer/JobForm";
import JobFormPageShell from "@/components/employer/JobFormPageShell";

async function saveJob(data: JobFormData, jobId?: string) {
  const url = jobId ? `/api/jobs/${jobId}` : "/api/jobs";
  const method = jobId ? "PATCH" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || "Something went wrong");
  }

  return result as { id: string };
}

async function submitForReview(jobId: string) {
  const res = await fetch(`/api/jobs/${jobId}/submit`, { method: "PATCH" });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || "Could not submit for review");
  }
}

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(data: JobFormData, intent: JobSubmitIntent) {
    setError("");
    setLoading(true);

    try {
      const job = await saveJob(data);
      if (intent === "submit") {
        await submitForReview(job.id);
      }
      router.push("/employer/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <JobFormPageShell
      title="Post a new job"
      description="Save a draft anytime, or submit for review when you're ready to go live."
      footer={error ? <p className="mt-4 text-sm text-ember">{error}</p> : undefined}
    >
      <JobForm loading={loading} onSubmit={handleSubmit} />
    </JobFormPageShell>
  );
}
