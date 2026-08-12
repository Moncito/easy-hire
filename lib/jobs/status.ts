import { ApiError } from "@/lib/api-error";

export type JobStatus = "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "CLOSED";

/** Status transitions employers may perform via PATCH (never ACTIVE). */
const EMPLOYER_ALLOWED: Partial<Record<JobStatus, JobStatus[]>> = {
  ACTIVE: ["CLOSED"],
  DRAFT: ["CLOSED"],
  PENDING_REVIEW: ["CLOSED"],
};

export function assertEmployerStatusTransition(
  current: JobStatus,
  next: JobStatus
): void {
  if (current === next) return;

  const allowed = EMPLOYER_ALLOWED[current];
  if (!allowed?.includes(next)) {
    throw new ApiError(
      `Cannot change job status from ${current} to ${next}. Submit for review or contact support.`,
      400
    );
  }
}

export function canEmployerSetStatus(current: JobStatus, next: JobStatus): boolean {
  if (current === next) return true;
  return EMPLOYER_ALLOWED[current]?.includes(next) ?? false;
}
