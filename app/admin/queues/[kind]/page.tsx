import { notFound } from "next/navigation";
import { requireAdminPagePermission } from "@/lib/auth/admin-session";
import { listQueue, encodeQueueCursor, type QueueKind } from "@/lib/admin/queues";
import {
  ABUSE_REPORT_RESOLUTION_REASON_CODES,
  COMPANY_VERIFICATION_REASON_CODES,
  JOB_POST_REASON_CODES,
  SEEKER_ID_REASON_CODES,
} from "@/lib/admin/reason-codes";
import ReviewQueue from "@/components/admin/ReviewQueue";
import type { ReasonCodeOption } from "@/components/admin/queue/types";
import { QUEUE_KIND_BY_SEGMENT, QUEUE_KIND_LABEL } from "../_lib/kind-map";

const REASON_CODES_BY_KIND: Record<QueueKind, ReasonCodeOption[]> = {
  COMPANY: [...COMPANY_VERIFICATION_REASON_CODES],
  JOB: [...JOB_POST_REASON_CODES],
  SEEKER: [...SEEKER_ID_REASON_CODES],
  // No controlled vocabulary was commissioned for review-dispute resolution
  // (lib/admin/reason-codes.ts's header comment) — DecisionForm/BulkBar
  // render a free-text reason-code field for this kind instead.
  REVIEW: [],
  // Unlike REVIEW, abuse-report resolution DOES have a commissioned
  // vocabulary (lib/admin/reason-codes.ts) — it is the dismiss-reason set.
  // Dismissing a report is the consequential half of this queue: actioning a
  // real one is self-evident, while waving one away is the decision that
  // needs to be explainable later.
  REPORT: [...ABUSE_REPORT_RESOLUTION_REASON_CODES],
};

const KIND_COPY: Record<QueueKind, { title: string; description: string }> = {
  COMPANY: {
    title: "Company verifications",
    description: "Review employer identities before their job listings appear on the public board.",
  },
  SEEKER: {
    title: "Seeker verifications",
    description: "Review VA identity documents before approving their identity confidence badge.",
  },
  JOB: {
    title: "Job approvals",
    description: "Review employer job postings before they go live on the public board.",
  },
  REVIEW: {
    title: "Review disputes",
    description: "Restore what should stay public, hide what shouldn't.",
  },
  REPORT: {
    title: "Abuse reports",
    description: "Reports filed by users against a job, company, account, message or review.",
  },
};

export default async function AdminQueueKindPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  // `queue.decide` — this page server-renders `listQueue` for its first
  // paint, so a bare admin check would serve moderation queues to SUPPORT and
  // FINANCE admins that GET /api/admin/queues already refuses them (§8.1).
  await requireAdminPagePermission("queue.decide");

  const { kind: segment } = await params;
  const kind = QUEUE_KIND_BY_SEGMENT[segment];
  if (!kind) {
    notFound();
  }

  const { filter } = await searchParams;
  const { items, nextCursor } = await listQueue({
    kind,
    status: "PENDING",
    limit: 25,
    breachedOnly: filter === "breached",
  });
  const copy = KIND_COPY[kind];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Queues / {QUEUE_KIND_LABEL[kind]}</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">{copy.title}</h1>
        <p className="mt-2 text-sm text-ink/55">{copy.description}</p>
      </div>

      <ReviewQueue
        kind={kind}
        initialItems={JSON.parse(JSON.stringify(items))}
        initialNextCursor={nextCursor ? encodeQueueCursor(nextCursor) : null}
        initialStatus="PENDING"
        initialFilter={filter === "breached" ? "breached" : undefined}
        reasonCodes={REASON_CODES_BY_KIND[kind]}
      />
    </div>
  );
}
