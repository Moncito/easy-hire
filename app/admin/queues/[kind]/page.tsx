import { notFound } from "next/navigation";
import { requireAdminPagePermission } from "@/lib/auth/admin-session";
import { listQueue, encodeQueueCursor, getQueueKindStats, type QueueKind } from "@/lib/admin/queues";
import {
  ABUSE_REPORT_RESOLUTION_REASON_CODES,
  COMPANY_VERIFICATION_REASON_CODES,
  JOB_POST_REASON_CODES,
  SEEKER_ID_REASON_CODES,
} from "@/lib/admin/reason-codes";
import ReviewQueue from "@/components/admin/ReviewQueue";
import QueueKindStatTiles from "@/components/admin/queue/QueueKindStatTiles";
import type { ReasonCodeOption } from "@/components/admin/queue/types";
import { QUEUE_KIND_BY_SEGMENT } from "../_lib/kind-map";

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
  const [{ items, nextCursor }, stats] = await Promise.all([
    listQueue({
      kind,
      status: "PENDING",
      limit: 25,
      breachedOnly: filter === "breached",
    }),
    getQueueKindStats(kind),
  ]);
  const copy = KIND_COPY[kind];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        {/* Was `Queues / ${QUEUE_KIND_LABEL[kind]}` (e.g. "Queues / Companies")
            — near-identical to AdminHeader.tsx's pathname-derived top-bar
            title ("Companies queue") just above it, with the H1 below
            ("Company verifications") also overlapping in meaning. Three
            layers said the same thing. Fix: this breadcrumb now matches its
            sibling on the parent /admin/queues index page ("Operations /
            Queues") instead of re-stating the specific kind — the top-bar
            title already carries "which queue", the H1 already carries
            "what reviewing here means", so the breadcrumb's job shrinks to
            "which section of the console", same as every other admin page's
            breadcrumb (see app/admin/{trust,users,system}/page.tsx). */}
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">Operations / Queues</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink admin-dark:text-mist">{copy.title}</h1>
        <p className="mt-2 text-sm text-ink/55 admin-dark:text-mist/55">{copy.description}</p>
      </div>

      <QueueKindStatTiles kind={kind} stats={stats} />

      <ReviewQueue
        kind={kind}
        initialItems={JSON.parse(JSON.stringify(items))}
        initialNextCursor={nextCursor ? encodeQueueCursor(nextCursor) : null}
        initialStatus="PENDING"
        initialFilter={filter === "breached" ? "breached" : undefined}
        reasonCodes={REASON_CODES_BY_KIND[kind]}
        pendingCount={stats.pendingCount}
      />
    </div>
  );
}
