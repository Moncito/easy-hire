"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import JobForm, { JobFormData, JobSubmitIntent } from "@/components/employer/JobForm";

type Props = {
  jobId: string;
  initialData: JobFormData;
};

async function saveJob(jobId: string, data: JobFormData) {
  const res = await fetch(`/api/jobs/${jobId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || "Something went wrong");
  }
}

async function submitForReview(jobId: string) {
  const res = await fetch(`/api/jobs/${jobId}/submit`, { method: "PATCH" });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || "Could not submit for review");
  }
}

export default function EditJobForm({ jobId, initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(data: JobFormData, intent: JobSubmitIntent) {
    setError("");
    setLoading(true);

    try {
      await saveJob(jobId, data);
      if (intent === "submit") {
        await submitForReview(jobId);
      }
      router.push("/employer/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      {error && <p className="mb-4 text-sm text-ember">{error}</p>}
      <JobForm initialData={initialData} loading={loading} onSubmit={handleSubmit} />
    </>
  );
}
