"use client";

import { useEffect } from "react";

export default function JobViewTracker({ jobId }: { jobId: string }) {
  useEffect(() => {
    fetch(`/api/jobs/${jobId}/view`, { method: "POST" }).catch(() => {});
  }, [jobId]);

  return null;
}
