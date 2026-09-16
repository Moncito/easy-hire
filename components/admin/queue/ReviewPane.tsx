"use client";

import { forwardRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, ExternalLink, FileText, History, RefreshCw, RotateCcw } from "lucide-react";
import DecisionForm, { type DecisionAction, type DecisionFormHandle } from "./DecisionForm";
import { SeverityChips } from "./SlaBadge";
import { formatDate } from "../directory/badges";
import type {
  QueueKind,
  ReasonCodeOption,
  SerializedJobLiveState,
  SerializedQueueItem,
  SerializedQueueItemDetail,
  SerializedQueueItemDocument,
} from "./types";

/**
 * Master-detail review pane — the item table lives beside this (see
 * ReviewQueue.tsx's grid), and this is the single, unified detail rail: one
 * panel, a header identifying the record, a tab bar switching between its
 * facets, and a decision footer pinned to the bottom regardless of which tab
 * is open. Fetched lazily by the parent shell once an item is selected
 * (never for the whole list — see lib/admin/queue-detail.ts's own rationale).
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
    return <p className="text-sm text-ink/40 admin-dark:text-mist/40">No documents uploaded.</p>;
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => {
        const expired = expiredIds.has(doc.id);
        return (
          <div key={doc.id} className="overflow-hidden rounded-xl border border-ink/10 bg-mist/40 admin-dark:border-white/10 admin-dark:bg-white/5">
            <div className="flex items-center justify-between gap-2 border-b border-ink/10 bg-white px-3 py-2 admin-dark:border-white/10 admin-dark:bg-white/5">
              <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-ink/70 admin-dark:text-mist/70">
                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{doc.fileName}</span>
              </span>
              <span className="shrink-0 rounded-md bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/45 admin-dark:bg-white/10 admin-dark:text-mist/45">
                {doc.docType.replace(/_/g, " ")}
              </span>
            </div>
            {/* Deliberately NOT recolored for dark mode. Uploaded ID scans and
                business permits are themselves near-always white/light-
                background images — forcing this surface dark would put a
                light document on a light-bordered "hole" cut into a dark
                page, which reads worse, not better, and the document's own
                background does the contrast work regardless of theme. The
                expired/error state inside it still needs to read correctly
                against this always-light surface, so those two elements
                (icon, text, refresh button) intentionally keep their
                light-mode-only colors too, rather than getting an admin-dark
                override that would only ever render on top of this light
                surface anyway. */}
            <div className="flex min-h-[220px] items-center justify-center bg-ink/[0.03] p-2">
              {expired ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <AlertTriangle className="h-5 w-5 text-marigold" aria-hidden="true" />
                  <p className="text-xs font-semibold text-ink/70">This link expired</p>
                  <button
                    type="button"
                    onClick={onLinkExpired}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-navy/5"
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
              <div className="border-t border-ink/10 bg-white px-3 py-1.5 text-right admin-dark:border-white/10 admin-dark:bg-white/5">
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

/**
 * A company's "Live Jobs" badge — driven by `liveState` (lib/admin/queue-
 * detail.ts's truthful derived status), never the raw `status` field. Prior
 * to this, an expired job (`status: "ACTIVE"` but `expiresAt` in the past)
 * rendered a plain "ACTIVE" chip identical to a genuinely live one, hiding
 * exactly the discrepancy an admin reviewing this company needs to see.
 *
 * Colour choices, matched to existing conventions rather than invented here:
 * - ACTIVE_LIVE ("Live") reuses the teal treatment `JobDirectory.tsx`'s
 *   `STATUS_STYLE.ACTIVE` already uses for a genuinely active job.
 * - ACTIVE_EXPIRED ("Expired") is deliberately NOT Ember. CLAUDE.md reserves
 *   Ember for genuine warnings/rejections, and a job simply lapsing past its
 *   `expiresAt` isn't itself a fraud or policy signal about the company —
 *   it's routine, informational lifecycle state (every job expires
 *   eventually). It reuses the same muted `ink/45` treatment
 *   `JobDirectory.tsx` gives a CLOSED job, which is the closest existing
 *   analog ("no longer live, nothing alarming about that on its own").
 * - PENDING_REVIEW ("Pending review") reuses the marigold treatment already
 *   used for this exact status elsewhere (`JobDirectory.tsx`'s
 *   `STATUS_STYLE.PENDING_REVIEW`, and `VERIFICATION_STATUS_STYLE`'s PENDING
 *   in `badges.tsx`).
 *
 * Every state pairs an icon with its text (no colour-only encoding, per
 * docs/ADMIN-CONSOLE-PLAN.md §5), and the expired case surfaces the exact
 * `expiresAt` date inline (compact, matching this list's small-item density)
 * plus the full sentence in a `title` tooltip.
 */
function JobLiveBadge({ liveState, expiresAt }: { liveState: SerializedJobLiveState; expiresAt: string | null }) {
  if (liveState === "ACTIVE_LIVE") {
    return (
      <span
        title="Live on the public job board"
        className="inline-flex shrink-0 items-center gap-1 rounded bg-teal/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal"
      >
        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
        Live
      </span>
    );
  }
  if (liveState === "ACTIVE_EXPIRED") {
    const expiredOn = formatDate(expiresAt);
    return (
      <span
        title={
          expiresAt
            ? `Expired ${expiredOn} — no longer visible on the public job board, despite its raw status still being ACTIVE`
            : "Expired — no longer visible on the public job board, despite its raw status still being ACTIVE"
        }
        className="inline-flex shrink-0 items-center gap-1 rounded bg-ink/8 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/45 admin-dark:bg-white/10 admin-dark:text-mist/45"
      >
        <History className="h-3 w-3 shrink-0" aria-hidden="true" />
        Expired{expiresAt ? ` · ${expiredOn}` : ""}
      </span>
    );
  }
  // Same AMBER-band treatment SlaBadge.tsx already established
  // (bg-marigold/15 text-[#8a5a10] -> a bumped marigold fill and plain
  // text-marigold, since the hand-picked #8a5a10 was only chosen for
  // contrast against the light-mode marigold/15 tint).
  return (
    <span
      title="Awaiting admin approval — has never been live"
      className="inline-flex shrink-0 items-center gap-1 rounded bg-marigold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5a10] admin-dark:bg-marigold/25 admin-dark:text-marigold"
    >
      <CircleDashed className="h-3 w-3 shrink-0" aria-hidden="true" />
      Pending review
    </span>
  );
}

function PriorDecisions({ priorDecisions }: { priorDecisions: SerializedQueueItemDetail["priorDecisions"] }) {
  if (priorDecisions.length === 0) return null;
  return (
    <div className="rounded-xl border border-marigold/30 bg-marigold/8 p-4 admin-dark:border-marigold/40 admin-dark:bg-marigold/15">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8a5a10] admin-dark:text-marigold">
        <History className="h-3.5 w-3.5" aria-hidden="true" />
        Prior decisions on this target
      </p>
      <ul className="space-y-2">
        {priorDecisions.map((d, i) => (
          <li key={i} className="rounded-lg bg-white/70 px-3 py-2 text-xs text-ink/75 admin-dark:bg-white/10 admin-dark:text-mist/75">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="font-semibold text-ink admin-dark:text-mist">{d.action.replace(/_/g, " ")}</span>
              <span className="font-data text-ink/45 admin-dark:text-mist/45">{new Date(d.createdAt).toLocaleString()}</span>
            </div>
            {d.reasonCode && <p className="mt-1 text-ink/60 admin-dark:text-mist/60">Reason code: {d.reasonCode}</p>}
            {d.note && <p className="mt-1 text-ink/60 admin-dark:text-mist/60">&ldquo;{d.note}&rdquo;</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Shared field label/value grid used by every kind's "Overview" tab. */
function FieldGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-ink/60 admin-dark:text-mist/60">{children}</dl>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="font-semibold text-ink/45 admin-dark:text-mist/45">{label}</dt>
      <dd className="break-words">{children}</dd>
    </>
  );
}

/** `submittedAt` -> "2026-09-16 13:47", local time, no seconds — this value is
 * an `updatedAt` proxy (see the field's own doc comment in queue-detail.ts),
 * so it's deliberately a plain, low-precision stamp rather than a full
 * locale-formatted timestamp with seconds, which would read as more exact
 * than it actually is. */
function formatSubmittedAt(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "camelCase"/"snake_case" -> "Camel Case", used only by the generic REPORT
 * fallback below, where field names aren't known ahead of time. */
function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function ActivityTab({ detail }: { detail: SerializedQueueItemDetail }) {
  if (detail.priorDecisions.length === 0) {
    return <p className="text-sm text-ink/40 admin-dark:text-mist/40">No admin actions recorded yet for this item.</p>;
  }
  return <PriorDecisions priorDecisions={detail.priorDecisions} />;
}

type TabDef = { key: string; label: string; content: React.ReactNode };

/**
 * Builds the tab set + per-tab content for the currently loaded detail.
 * Reuses the exact field content the old single-scroll `DetailBody` switch
 * rendered per kind — only the container (tabs instead of one long stack)
 * changed here, per the task brief.
 */
function buildTabs(detail: SerializedQueueItemDetail, item: SerializedQueueItem, onRefreshDocuments: () => void): TabDef[] {
  switch (detail.kind) {
    case "COMPANY":
      return [
        {
          key: "overview",
          label: "Overview",
          content: (
            <div className="space-y-4">
              <FieldGrid>
                <Field label="Industry">{detail.industry || "—"}</Field>
                <Field label="Email">{detail.email}</Field>
                <Field label="Website">
                  {detail.website ? (
                    <a href={detail.website} target="_blank" rel="noopener noreferrer" className="break-words text-teal hover:underline">
                      {detail.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </Field>
                <Field label="Trust score">
                  <span className="font-data">{detail.trustScore ?? "—"}</span>
                </Field>
                <Field label="Submitted">
                  <span className="font-data">{formatSubmittedAt(detail.submittedAt)}</span>
                </Field>
              </FieldGrid>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">Risk signals</h4>
                <div className="mt-1.5">
                  <SeverityChips signals={item.severitySignals} max={item.severitySignals.length} />
                </div>
              </div>
            </div>
          ),
        },
        {
          key: "jobs",
          label: `Live jobs (${detail.jobs.length})`,
          content:
            detail.jobs.length === 0 ? (
              <p className="text-sm text-ink/40 admin-dark:text-mist/40">This company has no jobs on the board yet.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-ink/65 admin-dark:text-mist/65">
                {detail.jobs.map((j) => (
                  <li
                    key={j.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-ink/5 bg-mist/40 px-3 py-2 admin-dark:border-white/10 admin-dark:bg-white/5"
                  >
                    <span className="truncate">{j.title}</span>
                    <JobLiveBadge liveState={j.liveState} expiresAt={j.expiresAt} />
                  </li>
                ))}
              </ul>
            ),
        },
        {
          key: "documents",
          label: `Documents (${detail.documents.length})`,
          content: <DocumentViewer key={documentSetKey(detail.documents)} documents={detail.documents} onLinkExpired={onRefreshDocuments} />,
        },
        { key: "activity", label: "Activity", content: <ActivityTab detail={detail} /> },
      ];

    case "SEEKER":
      return [
        {
          key: "overview",
          label: "Overview",
          content: (
            <div className="space-y-4">
              <FieldGrid>
                <Field label="Headline">{detail.headline || "—"}</Field>
                <Field label="Email">{detail.email}</Field>
                <Field label="Phone">{detail.phone || "—"}</Field>
                <Field label="Location">{detail.location || "—"}</Field>
                <Field label="Trust score">
                  <span className="font-data">{detail.trustScore ?? "—"}</span>
                </Field>
                <Field label="Submitted">
                  <span className="font-data">{formatSubmittedAt(detail.submittedAt)}</span>
                </Field>
              </FieldGrid>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">Risk signals</h4>
                <div className="mt-1.5">
                  <SeverityChips signals={item.severitySignals} max={item.severitySignals.length} />
                </div>
              </div>
            </div>
          ),
        },
        {
          key: "documents",
          label: `Documents (${detail.documents.length})`,
          content: <DocumentViewer key={documentSetKey(detail.documents)} documents={detail.documents} onLinkExpired={onRefreshDocuments} />,
        },
        { key: "activity", label: "Activity", content: <ActivityTab detail={detail} /> },
      ];

    case "JOB":
      return [
        {
          key: "overview",
          label: "Overview",
          content: (
            <div className="space-y-4">
              <p className="text-xs text-ink/45 admin-dark:text-mist/45">
                {detail.company.companyName} · {detail.category} · {detail.employmentType.replace(/_/g, " ")}
              </p>
              <FieldGrid>
                <Field label="Salary">
                  <span className="font-data">
                    {detail.salaryMin ?? "—"}–{detail.salaryMax ?? "—"} / {detail.salaryPeriod.toLowerCase()}
                  </span>
                </Field>
                <Field label="Location">{detail.location}</Field>
                <Field label="Remote type">{detail.remoteType.replace(/_/g, " ")}</Field>
                <Field label="Company trust score">
                  <span className="font-data">{detail.company.trustScore ?? "—"}</span>
                </Field>
              </FieldGrid>
              <div className="prose prose-sm max-w-none text-sm leading-relaxed text-ink/75 admin-dark:text-mist/75">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">Description</h4>
                <p className="whitespace-pre-wrap">{detail.description}</p>
                {detail.requirements && (
                  <>
                    <h4 className="mt-3 text-[10px] font-bold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">Requirements</h4>
                    <p className="whitespace-pre-wrap">{detail.requirements}</p>
                  </>
                )}
                {detail.benefits && (
                  <>
                    <h4 className="mt-3 text-[10px] font-bold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">Benefits</h4>
                    <p className="whitespace-pre-wrap">{detail.benefits}</p>
                  </>
                )}
              </div>
            </div>
          ),
        },
        { key: "activity", label: "Activity", content: <ActivityTab detail={detail} /> },
      ];

    case "REVIEW":
      return [
        {
          key: "overview",
          label: "Overview",
          content: (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-ink admin-dark:text-mist">
                {detail.rating}★ — {detail.authorName} on {detail.subjectName}
              </p>
              <p className="whitespace-pre-wrap text-sm text-ink/75 admin-dark:text-mist/75">{detail.body}</p>
              {detail.disputeReason && (
                <div className="rounded-xl border border-ember/20 bg-ember/5 p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-ember">Dispute reason</p>
                  <p className="mt-1 text-sm text-ink/75 admin-dark:text-mist/75">{detail.disputeReason}</p>
                  {detail.disputedAt && (
                    <p className="mt-1 text-[11px] text-ink/45 admin-dark:text-mist/45">Disputed {new Date(detail.disputedAt).toLocaleString()}</p>
                  )}
                </div>
              )}
            </div>
          ),
        },
        { key: "activity", label: "Activity", content: <ActivityTab detail={detail} /> },
      ];

    default: {
      // Pre-existing gap, not introduced by this restructuring: the server
      // (lib/admin/queue-detail.ts's `ReportQueueItemDetail`) has carried a
      // full REPORT shape (reporterEmail, targetType, reason, severity,
      // otherReportsForTarget, ...) since Phase 4 added REPORT as the queue
      // system's fifth kind, but this file's `SerializedQueueItemDetail`
      // union (./types.ts) was never extended to include it — so `detail`
      // here is typed `never`. Rather than fabricate a bespoke REPORT tab
      // for fields this file doesn't know the shape of, fall back to a
      // generic dump of whatever scalar fields the object actually carries
      // at runtime, so selecting a REPORT item degrades gracefully instead
      // of crashing or rendering blank.
      const generic = detail as unknown as Record<string, unknown>;
      const entries = Object.entries(generic).filter(
        ([key, value]) => key !== "kind" && key !== "documents" && key !== "priorDecisions" && (value === null || typeof value !== "object")
      );
      const priorDecisions = Array.isArray(generic.priorDecisions) ? (generic.priorDecisions as SerializedQueueItemDetail["priorDecisions"]) : [];
      return [
        {
          key: "overview",
          label: "Overview",
          content: (
            <FieldGrid>
              {entries.map(([key, value]) => (
                <Field key={key} label={formatFieldLabel(key)}>
                  {value === null || value === "" ? "—" : String(value)}
                </Field>
              ))}
            </FieldGrid>
          ),
        },
        {
          key: "activity",
          label: "Activity",
          content:
            priorDecisions.length === 0 ? (
              <p className="text-sm text-ink/40 admin-dark:text-mist/40">No admin actions recorded yet for this item.</p>
            ) : (
              <PriorDecisions priorDecisions={priorDecisions} />
            ),
        },
      ];
    }
  }
}

/** "The Black Saint Directory" -> "BS" — skips leading articles so the chip
 * reflects the meaningful words in the title, not "The X". Falls back to the
 * unfiltered word list if every word happens to be a stopword. */
const LEADING_STOPWORDS = new Set(["the", "a", "an"]);
function getInitials(title: string): string {
  const allWords = title.trim().split(/\s+/).filter(Boolean);
  const words = allWords.filter((w) => !LEADING_STOPWORDS.has(w.toLowerCase()));
  const source = words.length > 0 ? words : allWords;
  if (source.length === 0) return "?";
  if (source.length === 1) return source[0].slice(0, 2).toUpperCase();
  return (source[0][0] + source[1][0]).toUpperCase();
}

/**
 * Header subtitle — the reference mockup's header shows the record's own
 * description/bio, not `item.subtitle` (the same compact "{industry} · {id}"
 * line already shown under the title in the table row — redundant here).
 * Falls back to `item.subtitle` while `detail` hasn't loaded yet, and to a
 * "No description/bio provided." message (matching this file's existing
 * empty-state tone, e.g. DocumentViewer's "No documents uploaded.") once
 * `detail` HAS loaded but the field is genuinely empty — that's a materially
 * different fact from "still loading" and deserves its own message rather
 * than silently reusing the table's compact line.
 */
function headerSubtitle(item: SerializedQueueItem, detail: SerializedQueueItemDetail | null): string {
  if (detail?.kind === "COMPANY") {
    return detail.description && detail.description.trim() !== "" ? detail.description : "No description provided.";
  }
  if (detail?.kind === "SEEKER") {
    return detail.bio && detail.bio.trim() !== "" ? detail.bio : "No bio provided.";
  }
  return item.subtitle;
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
  const [activeTab, setActiveTab] = useState("overview");
  // Tracks which item's selection `activeTab` currently reflects, so a fresh
  // selection can reset synchronously during render (React's documented
  // "adjusting state when a prop changes" pattern) instead of an effect —
  // carrying e.g. "Documents" over from the previous item could select a tab
  // the new item's kind doesn't even have.
  const [activeTabItemId, setActiveTabItemId] = useState<string | null>(null);
  // Tracks which item's selection the avatar's "image failed to load" state
  // currently reflects, mirroring `activeTabItemId` immediately above rather
  // than the `useEffect`+`setState` pattern this exact file already dropped
  // (react-hooks/set-state-in-effect) — reset happens synchronously during
  // render, in the same render-time block, the moment the selection changes.
  const [imageErrorItemId, setImageErrorItemId] = useState<string | null>(null);
  if (item && item.id !== activeTabItemId) {
    setActiveTabItemId(item.id);
    setActiveTab("overview");
    setImageErrorItemId(null);
  }

  if (!item) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white/50 p-8 text-center text-ink/45 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist/45">
        <p className="text-sm">Select an item from the queue to review it here.</p>
      </div>
    );
  }

  const tabs = detail ? buildTabs(detail, item, onRetry) : [];
  const activeTabDef = tabs.find((t) => t.key === activeTab) ?? tabs[0] ?? null;
  const initials = getInitials(item.title);
  const imageErrored = imageErrorItemId === item.id;

  return (
    <div className="flex h-full max-h-[80vh] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-ink/5 bg-white admin-dark:border-white/10 admin-dark:bg-white/5">
      {/* Header — avatar/initials chip + title + one-line subtitle. Purely an
          identicon-style visual anchor: a neutral navy tint, never Ember /
          Marigold / Teal, since it carries no status meaning of its own. */}
      <div className="flex shrink-0 items-start gap-3 border-b border-ink/10 p-5 admin-dark:border-white/10">
        {/* Real logo/photo when the loaded detail carries one — falls back to
            the neutral initials chip while still loading, when the record
            has no image on file, or if the image URL fails to load (signed
            URL expired, 404, etc). `alt=""` is intentional, not a missing-alt
            bug: the adjacent title text already names the company/seeker, so
            the image is decorative-adjacent-to-equivalent-text (WCAG). */}
        {detail?.kind === "COMPANY" && detail.logoUrl && !imageErrored ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={detail.logoUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
            onError={() => setImageErrorItemId(item.id)}
          />
        ) : detail?.kind === "SEEKER" && detail.photoUrl && !imageErrored ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={detail.photoUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
            onError={() => setImageErrorItemId(item.id)}
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/10 font-display text-sm font-bold text-navy admin-dark:bg-white/10 admin-dark:text-mist"
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-bold text-ink admin-dark:text-mist">{item.title}</h2>
          <p className="truncate text-sm text-ink/55 admin-dark:text-mist/55">{headerSubtitle(item, detail)}</p>
        </div>
      </div>

      {item.isAppeal && (
        // Informational banner (not a "current selection" state), so it
        // follows the same navy-tint-badge bump as SlaBadge's GREEN band /
        // AppealBadge above, rather than the neutral-highlight treatment.
        // Pinned above the tabs (not inside a specific tab) since it's a
        // fact about the item as a whole, true no matter which tab is open.
        <div className="mx-5 mt-4 flex shrink-0 items-center gap-2 rounded-xl border border-navy/15 bg-navy/6 px-3 py-2 text-xs font-semibold text-navy admin-dark:border-navy/30 admin-dark:bg-navy/20 admin-dark:text-mist">
          <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          This item was rejected before and has been resubmitted — review its history below.
        </div>
      )}

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        {loading && (
          <div className="flex-1 overflow-y-auto p-5">
            <p role="status" className="sr-only">
              Loading item…
            </p>
            <div className="animate-pulse space-y-3" aria-hidden="true">
              <div className="h-4 w-1/3 rounded bg-ink/10 admin-dark:bg-white/10" />
              <div className="h-3 w-full rounded bg-ink/5 admin-dark:bg-white/8" />
              <div className="h-3 w-5/6 rounded bg-ink/5 admin-dark:bg-white/8" />
              <div className="mt-4 h-32 rounded-xl bg-ink/5 admin-dark:bg-white/8" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-5 text-center">
            <AlertTriangle className="h-5 w-5 text-ember" aria-hidden="true" />
            <p className="text-sm text-ink/70 admin-dark:text-mist/70">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 cursor-pointer rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-navy/5 admin-dark:border-white/15 admin-dark:text-teal admin-dark:hover:bg-teal/10"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && detail && activeTabDef && (
          <>
            {/* Tab bar — mirrors ReviewQueue.tsx's STATUS_TABS accessibility
                pattern (plain buttons + aria-pressed + visible focus ring)
                rather than a full ARIA tabs/tablist pattern, matching the
                convention already established for this exact kind of
                horizontal-switcher control elsewhere in this file tree. */}
            <div className="tab-strip-scroll flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-ink/10 px-4 admin-dark:border-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`cursor-pointer whitespace-nowrap border-b-2 px-1.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
                    activeTab === tab.key
                      ? "border-navy text-navy admin-dark:border-navy/70 admin-dark:text-mist"
                      : "border-transparent text-ink/50 hover:text-ink admin-dark:text-mist/50 admin-dark:hover:text-mist"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-5">{activeTabDef.content}</div>
          </>
        )}
      </div>

      {/* Decision footer — pinned to the bottom of this same panel, visible
          regardless of which tab is open. DecisionForm's own internal
          "Reviewing {itemTitle}" line stands in for the one-line label the
          task brief asks for here — the header above already names the
          record once; repeating it a second time immediately above these
          buttons would just be the same title shown twice in one panel. */}
      <div className="shrink-0 border-t border-ink/10 p-5 admin-dark:border-white/10">
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
