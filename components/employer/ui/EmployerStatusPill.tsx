const styles: Record<string, string> = {
  ACTIVE: "bg-teal/10 text-teal ring-1 ring-teal/20",
  DRAFT: "bg-ink/5 text-ink/55 ring-1 ring-ink/10",
  PENDING_REVIEW: "bg-navy/8 text-navy ring-1 ring-navy/15",
  CLOSED: "bg-ink/5 text-ink/40 ring-1 ring-ink/8",
  APPROVED_NOT_PUBLIC: "bg-navy/10 text-navy ring-1 ring-navy/20",
};

type Props = {
  status: string;
  label?: string;
};

export default function EmployerStatusPill({ status, label }: Props) {
  const key = status in styles ? status : "DRAFT";
  const text =
    label ??
    status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${styles[key] ?? styles.DRAFT}`}
    >
      {text}
    </span>
  );
}

export function formatJobStatusLabel(status: string, companyVerified: boolean) {
  if (status === "ACTIVE" && !companyVerified) return "Approved — not public";
  return status.replace(/_/g, " ");
}

export function jobStatusPillKey(status: string, companyVerified: boolean) {
  if (status === "ACTIVE" && !companyVerified) return "APPROVED_NOT_PUBLIC";
  return status;
}
