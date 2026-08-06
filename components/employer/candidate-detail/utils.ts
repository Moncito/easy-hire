import type { CandidateApplication } from "./types";

export function mergeApplicationUpdate(
  existing: CandidateApplication,
  updated: Partial<CandidateApplication>
): CandidateApplication {
  return {
    ...existing,
    ...updated,
    seeker: updated.seeker ? { ...existing.seeker, ...updated.seeker } : existing.seeker,
    answers: updated.answers ?? existing.answers,
  };
}

export function formatAppliedAt(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "VA"
  );
}

export function stageIndex(status: string) {
  const stages = ["APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED"];
  if (status === "REJECTED") return -1;
  return stages.indexOf(status);
}
