"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardHeader,
  DropdownMenu,
  EmptyState,
  PipelineMini,
  StackedRow,
  StatusBadge,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/employer/system";
import EmployerConfirmModal from "@/components/employer/EmployerConfirmModal";
import { patchJobStatus } from "@/lib/client/jobs";
import type { RoleRow } from "@/lib/employer/dashboard-roles";

const CONVERSION_HINT = "Fewer than 10 views — not enough to be meaningful";

async function shareListing(row: RoleRow) {
  const url = `${window.location.origin}/jobs/${row.id}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: row.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Listing link copied");
  } catch (error) {
    // Dismissing the native share sheet rejects with AbortError — not a failure.
    if (error instanceof DOMException && error.name === "AbortError") return;
    toast.error("Couldn't share. Copy the link from the listing page instead.");
  }
}

function StatusChip({ status }: { status: RoleRow["status"] }) {
  if (!status) return null;
  if (status.kind === "no-applicants") return <StatusBadge tone="warning">No applicants</StatusBadge>;
  // The shared two-level rule: marigold from 3 days, Ember past 14. A
  // fresh application is still worth a look, so it keeps a neutral navy pill.
  const tone = status.severity === "critical" ? "danger" : status.severity === "attention" ? "warning" : "info";
  const waited = status.oldestDays !== null && status.severity !== "none" ? ` · ${status.oldestDays}d` : "";
  return (
    <StatusBadge tone={tone} className="num">
      {status.count} needs review{waited}
    </StatusBadge>
  );
}

function RolePipeline({ row }: { row: RoleRow }) {
  const { applied, shortlisted, interview, hired } = row.pipeline;
  return (
    <PipelineMini
      stages={[
        { label: "Applied", value: applied, tone: "muted" },
        { label: "Shortlisted", value: shortlisted, tone: "teal-soft" },
        { label: "Interview", value: interview, tone: "teal" },
        { label: "Hired", value: hired, tone: "teal-strong" },
      ]}
    />
  );
}

function Hired({ row }: { row: RoleRow }) {
  if (row.filled) return <StatusBadge tone="success">Filled</StatusBadge>;
  return (
    <span className="num text-eh-muted">
      {row.hired} of {row.target}
    </span>
  );
}

function Conversion({ row }: { row: RoleRow }) {
  if (row.conversion === null) {
    return (
      <span
        className="cursor-help border-b border-dotted border-eh-muted text-eh-muted"
        title={CONVERSION_HINT}
        aria-label={`No rate: ${CONVERSION_HINT}`}
      >
        —
      </span>
    );
  }
  return <>{row.conversion}%</>;
}

function RowActions({ row, onClose }: { row: RoleRow; onClose: (row: RoleRow) => void }) {
  const variant = row.primary.kind === "review" ? "primary" : "secondary";
  return (
    <div className="flex items-center justify-end gap-1">
      {row.primary.kind === "share" ? (
        <Button size="sm" variant={variant} onClick={() => void shareListing(row)}>
          {row.primary.label}
        </Button>
      ) : (
        <Button size="sm" variant={variant} href={row.primary.href}>
          {row.primary.label}
        </Button>
      )}
      <DropdownMenu
        label={`More actions for ${row.title}`}
        items={[
          { label: "Share listing", onSelect: () => void shareListing(row), hidden: !row.shareable },
          { label: "Edit listing", href: `/employer/jobs/${row.id}/edit` },
          { label: "Close listing", onSelect: () => onClose(row), tone: "danger" },
        ]}
      />
    </div>
  );
}

/**
 * Active roles. A status pill appears only when a role needs something
 * from you; each row shows where its applicants currently sit, and one
 * primary action (Review, Share listing, or View applicants), with Share,
 * Edit and Close in the "⋯" menu. Below 1280px the table becomes a stacked
 * list instead of a sideways-scrolling grid.
 */
export default function ProJobsTable({ rows }: { rows: RoleRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [closing, setClosing] = useState<RoleRow | null>(null);
  const [closingBusy, setClosingBusy] = useState(false);
  const [closed, setClosed] = useState<Set<string>>(new Set());

  const visible = rows.filter((r) => !closed.has(r.id));

  async function confirmClose() {
    if (!closing) return;
    setClosingBusy(true);
    const result = await patchJobStatus(closing.id, "CLOSED");
    setClosingBusy(false);
    if (result.ok) {
      setClosed((prev) => new Set(prev).add(closing.id));
      toast.success("Listing closed");
      setClosing(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Couldn't close this listing");
    }
  }

  return (
    <Card aria-labelledby="pro-roles-heading" padded={false}>
      <CardHeader
        id="pro-roles-heading"
        className="px-5 pb-4 pt-5 sm:px-6"
        title="Active roles"
        description={
          <span className="num">
            {visible.length} {visible.length === 1 ? "listing" : "listings"}
          </span>
        }
        action={
          <Link href="/employer/jobs" className="inline-flex items-center gap-1 text-ui text-eh-muted transition hover:text-eh-ink">
            All jobs
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        }
      />

      {visible.length === 0 ? (
        <div className="border-t border-eh-line">
          <EmptyState
            compact
            icon={<Plus />}
            title="No active roles"
            description="Post a listing and it shows up here with its views, applicants and pipeline."
            action={
              <Button href="/employer/jobs/new" variant="primary" size="sm" icon={<Plus />}>
                Post a job
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="hidden xl:block">
            <Table minWidth={880} caption="Active roles">
              <thead>
                <tr>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Pipeline</Th>
                  <Th align="right">Views</Th>
                  <Th align="right">Applicants</Th>
                  <Th align="right">Hired</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <Tr key={row.id}>
                    <Td className="min-w-[220px]">
                      <p className="font-semibold text-eh-ink">{row.title}</p>
                      <p className="text-small text-eh-muted">{row.meta}</p>
                    </Td>
                    <Td>
                      <StatusChip status={row.status} />
                    </Td>
                    <Td className="w-[140px]">
                      <RolePipeline row={row} />
                    </Td>
                    <Td numeric>
                      {row.views}
                      {row.conversion !== null && (
                        <span className="block text-micro text-eh-muted">{row.conversion}% apply</span>
                      )}
                    </Td>
                    <Td numeric className={row.applicants === 0 ? "text-eh-muted" : undefined}>
                      {row.applicants}
                    </Td>
                    <Td numeric>
                      <Hired row={row} />
                    </Td>
                    <Td>
                      <RowActions row={row} onClose={setClosing} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>

          <ul className="border-t border-eh-line xl:hidden" aria-label="Active roles">
            {visible.map((row) => (
              <StackedRow
                key={row.id}
                title={row.title}
                meta={row.meta}
                aside={<StatusChip status={row.status} />}
                actions={<RowActions row={row} onClose={setClosing} />}
              >
                <RolePipeline row={row} />
                <dl className="mt-3 grid grid-cols-4 gap-2 text-small">
                  <div>
                    <dt className="text-eh-muted">Views</dt>
                    <dd className="num font-semibold text-eh-ink">{row.views}</dd>
                  </div>
                  <div>
                    <dt className="text-eh-muted">Applicants</dt>
                    <dd className="num font-semibold text-eh-ink">{row.applicants}</dd>
                  </div>
                  <div>
                    <dt className="text-eh-muted">Hired</dt>
                    <dd className="font-semibold text-eh-ink">
                      <Hired row={row} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-eh-muted">Conversion</dt>
                    <dd className="num font-semibold text-eh-ink">
                      <Conversion row={row} />
                    </dd>
                  </div>
                </dl>
              </StackedRow>
            ))}
          </ul>

          <p className="border-t border-eh-line px-5 py-3 text-xs text-eh-muted sm:px-6">
            Conversion shows once a listing has 10 or more views. Status only appears when a role needs something from
            you.
          </p>
        </>
      )}

      <EmployerConfirmModal
        open={closing !== null}
        title="Close this listing?"
        subject={closing?.title}
        description="It stops taking applications and comes off the job board. Candidates already in your pipeline stay where they are."
        confirmLabel="Close listing"
        loading={closingBusy}
        onCancel={() => setClosing(null)}
        onConfirm={confirmClose}
      />
    </Card>
  );
}