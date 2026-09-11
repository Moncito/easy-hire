"use client";

import { forwardRef, useState } from "react";
import { AlertTriangle, ExternalLink, FileText, History, RefreshCw, RotateCcw } from "lucide-react";
import DecisionForm, { type DecisionAction, type DecisionFormHandle } from "./DecisionForm";
import type {
  QueueKind,
  ReasonCodeOption,
  SerializedQueueItem,
  SerializedQueueItemDetail,
  SerializedQueueItemDocument,
} from "./types";

/**
 * Side-by-side review pane — docs/ADMIN-CONSOLE-PLAN.md §4.2: "Document
 * viewer left, decision form right, no navigation between them." Fetched
 * lazily by the parent shell once an item is selected (never for the whole
 * list — see lib/admin/queue-detail.ts's own doc comment on why).
 */

function isPdf(doc: SerializedQueueItemDocument): boolean {
  return /\.pdf($|\?)/i.test(doc.fileName) || /\.pdf($|\?)/i.test(doc.fileUrl);
}

/**
 * Identity of a document set, used as `<DocumentViewer/>`'s `key` so React
 * remounts it — and drops the per-document "link expired" state — whenever
 * the set changes. Includes `fileUrl`, not just `id`: a refresh re-signs the
 * SAME documents with new short-lived URLs, and that is exactly the case
 * where the stale expired flags must be cleared.
 */
function documentSetKey(documents: SerializedQueueItemDocument[]): string {
  return documents.map((d) => `${d.id}:${d.fileUrl}`).join("|");
}

function DocumentViewer({
  documents,
  onLinkExpired,
}: {
  documents: SerializedQueueItemDocument[];
  onLinkExpired: () => void;
}) {
  // Keyed by the caller (see the `key` on each <DocumentViewer/> below), so a
  // fresh document set remounts this component and starts with an empty
  // expired set. That replaces the obvious `useEffect(() => setExpiredIds(new
  // Set()), [documents])`, which is a cascading extra render and what
  // react-hooks/set-state-in-effect exists to catch.
  const [expiredIds, setExpiredIds] = useState<Set<string>>(new Set());

  if (documents.length === 0) {
    return <p className="text-sm text-ink/40">No documents uploaded.</p>;
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => {
        const expired = expiredIds.has(doc.id);
        return (
          <div key={doc.id} className="overflow-hidden rounded-xl border border-ink/10 bg-mist/40">
            <div className="flex items-center justify-between gap-2 border-b border-ink/10 bg-white px-3 py-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-ink/70">
                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{doc.fileName}</span>
              </span>
              <span className="shrink-0 rounded-md bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/45">
                {doc.docType.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex min-h-[220px] items-center justify-center bg-ink/[0.03] p-2">
              {expired ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <AlertTriangle className="h-5 w-5 text-marigold" aria-hidden="true" />
                  <p className="text-xs font-semibold text-ink/70">This link expired</p>
                  <button
                    type="button"
                    onClick={onLinkExpired}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Refresh
                  </button>
                </div>
              ) : isPdf(doc) ? (
                <iframe
                  src={doc.fileUrl}
                  title={doc.fileName}
                  className="h-[420px] w-full rounded-lg bg-white"
                  onError={() => setExpiredIds((prev) => new Set(prev).add(doc.id))}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doc.fileUrl}
                  alt={doc.fileName}
                  className="max-h-[420px] w-full rounded-lg object-contain"
                  onError={() => setExpiredIds((prev) => new Set(prev).add(doc.id))}
                />
              )}
            </div>
            {!expired && (
              <div className="border-t border-ink/10 bg-white px-3 py-1.5 text-right">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
                >
                  Open in new tab
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PriorDecisions({ detail }: { detail: SerializedQueueItemDetail }) {
  if (detail.priorDecisions.length === 0) return null;
  return (
    <div className="rounded-xl border border-marigold/30 bg-marigold/8 p-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8a5a10]">
        <History className="h-3.5 w-3.5" aria-hidden="true" />
        Prior decisions on this target
      </p>
      <ul className="space-y-2">
        {detail.priorDecisions.map((d, i) => (
          <li key={i} className="rounded-lg bg-white/70 px-3 py-2 text-xs text-ink/75">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="font-semibold text-ink">{d.action.replace(/_/g, " ")}</span>
              <span className="font-data text-ink/45">{new Date(d.createdAt).toLocaleString()}</span>
            </div>
            {d.reasonCode && <p className="mt-1 text-ink/60">Reason code: {d.reasonCode}</p>}
            {d.note && <p className="mt-1 text-ink/60">&ldquo;{d.note}&rdquo;</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailBody({ detail, onRefreshDocuments }: { detail: SerializedQueueItemDetail; onRefreshDocuments: () => void }) {
  switch (detail.kind) {
    case "COMPANY":
      return (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink/50">Company</h3>
            <p className="mt-1 text-sm text-ink/75">{detail.description || "No description provided."}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink/60">
              <dt className="font-semibold text-ink/45">Industry</dt>
              <dd>{detail.industry || "—"}</dd>
              <dt className="font-semibold text-ink/45">Email</dt>
              <dd>{detail.email}</dd>
              <dt className="font-semibold text-ink/45">Website</dt>
              <dd>
                {detail.website ? (
                  <a href={detail.website} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
                    {detail.website}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
              <dt className="font-semibold text-ink/45">Trust score</dt>
              <dd className="font-data">{detail.trustScore ?? "—"}</dd>
            </dl>
          </div>
          {detail.jobs.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink/45">Live jobs ({detail.jobs.length})</h4>
              <ul className="space-y-1 text-xs text-ink/65">
                {detail.jobs.map((j) => (
                  <li key={j.id} className="flex items-center justify-between">
                    <span className="truncate">{j.title}</span>
                    <span className="shrink-0 rounded bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink/45">{j.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/45">Verification documents</h4>
            <DocumentViewer key={documentSetKey(detail.documents)} documents={detail.documents} onLinkExpired={onRefreshDocuments} />
          </div>
        </div>
      );
    case "SEEKER":
      return (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink/50">Seeker</h3>
            <p className="mt-1 text-sm text-ink/75">{detail.bio || "No bio provided."}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink/60">
              <dt className="font-semibold text-ink/45">Headline</dt>
              <dd>{detail.headline || "—"}</dd>
              <dt className="font-semibold text-ink/45">Email</dt>
              <dd>{detail.email}</dd>
              <dt className="font-semibold text-ink/45">Phone</dt>
              <dd>{detail.phone || "—"}</dd>
              <dt className="font-semibold text-ink/45">Location</dt>
              <dd>{detail.location || "—"}</dd>
              <dt className="font-semibold text-ink/45">Trust score</dt>
              <dd className="font-data">{detail.trustScore ?? "—"}</dd>
            </dl>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/45">Identity documents</h4>
            <DocumentViewer key={documentSetKey(detail.documents)} documents={detail.documents} onLinkExpired={onRefreshDocuments} />
          </div>
        </div>
      );
    case "JOB":
      return (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink/50">{detail.title}</h3>
            <p className="mt-1 text-xs text-ink/45">
              {detail.company.companyName} · {detail.category} · {detail.employmentType.replace(/_/g, " ")}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink/60">
              <dt className="font-semibold text-ink/45">Salary</dt>
              <dd className="font-data">
                {detail.salaryMin ?? "—"}–{detail.salaryMax ?? "—"} / {detail.salaryPeriod.toLowerCase()}
              </dd>
              <dt className="font-semibold text-ink/45">Location</dt>
              <dd>{detail.location}</dd>
              <dt className="font-semibold text-ink/45">Remote type</dt>
              <dd>{detail.remoteType.replace(/_/g, " ")}</dd>
              <dt className="font-semibold text-ink/45">Company trust score</dt>
              <dd className="font-data">{detail.company.trustScore ?? "—"}</dd>
            </dl>
          </div>
          <div className="prose prose-sm max-w-none text-sm leading-relaxed text-ink/75">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink/45">Description</h4>
            <p className="whitespace-pre-wrap">{detail.description}</p>
            {detail.requirements && (
              <>
                <h4 className="mt-3 text-xs font-bold uppercase tracking-wider text-ink/45">Requirements</h4>
                <p className="whitespace-pre-wrap">{detail.requirements}</p>
              </>
            )}
            {detail.benefits && (
              <>
                <h4 className="mt-3 text-xs font-bold uppercase tracking-wider text-ink/45">Benefits</h4>
                <p className="whitespace-pre-wrap">{detail.benefits}</p>
              </>
            )}
          </div>
        </div>
      );
    case "REVIEW":
      return (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink/50">
              {detail.rating}★ — {detail.authorName} on {detail.subjectName}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink/75">{detail.body}</p>
          </div>
          {detail.disputeReason && (
            <div className="rounded-xl border border-ember/20 bg-ember/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-ember">Dispute reason</p>
              <p className="mt-1 text-sm text-ink/75">{detail.disputeReason}</p>
              {detail.disputedAt && (
                <p className="mt-1 text-[11px] text-ink/45">Disputed {new Date(detail.disputedAt).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
      );
  }
}

type ReviewPaneProps = {
  kind: QueueKind;
  item: SerializedQueueItem | null;
  detail: SerializedQueueItemDetail | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  reasonCodes: ReasonCodeOption[];
  onDecide: (action: DecisionAction, opts: { reason?: string; note?: string; reasonCode?: string }) => Promise<boolean>;
  decisionPending: boolean;
};

const ReviewPane = forwardRef<DecisionFormHandle, ReviewPaneProps>(function ReviewPane(
  { kind, item, detail, loading, error, onRetry, reasonCodes, onDecide, decisionPending },
  ref
) {
  if (!item) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white/50 p-8 text-center text-ink/45">
        <p className="text-sm">Select an item from the queue to review it here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="min-w-0 rounded-2xl border border-ink/5 bg-white p-5">
        {item.isAppeal && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-navy/15 bg-navy/6 px-3 py-2 text-xs font-semibold text-navy">
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            This item was rejected before and has been resubmitted — review its history below.
          </div>
        )}

        {loading && (
          <>
            <p role="status" className="sr-only">
              Loading item…
            </p>
            <div className="animate-pulse space-y-3 py-2" aria-hidden="true">
              <div className="h-4 w-1/3 rounded bg-ink/10" />
              <div className="h-3 w-full rounded bg-ink/5" />
              <div className="h-3 w-5/6 rounded bg-ink/5" />
              <div className="mt-4 h-32 rounded-xl bg-ink/5" />
            </div>
          </>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <AlertTriangle className="h-5 w-5 text-ember" aria-hidden="true" />
            <p className="text-sm text-ink/70">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && detail && (
          <div className="space-y-5">
            <DetailBody detail={detail} onRefreshDocuments={onRetry} />
            <PriorDecisions detail={detail} />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-ink/5 bg-white p-5">
        <DecisionForm
          ref={ref}
          kind={kind}
          itemId={item.id}
          itemTitle={item.title}
          reasonCodes={reasonCodes}
          disabled={loading || !!error || decisionPending}
          onDecide={onDecide}
        />
      </div>
    </div>
  );
});

export default ReviewPane;
