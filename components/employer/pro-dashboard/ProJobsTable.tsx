"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
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
  if (status.kind === "no-applicants") {
    return <span className="rounded-chip bg-eh-marigold-tint px-2 py-0.5 text-xs text-eh-marigold-ink">No applicants</span>;
  }
  // Red only once the oldest pending application is past the 14-day target.
  return (
    <span
      className={`num whitespace-nowrap rounded-chip px-2 py-0.5 text-xs ${
        status.overdue ? "bg-eh-danger-tint text-eh-danger" : "bg-eh-marigold-tint text-eh-marigold-ink"
      }`}
    >
      {status.count} needs review
    </span>
  );
}

function RowMenu({ row, onClose }: { row: RoleRow; onClose: (row: RoleRow) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    function onPointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpen((v) => !v);
  }

  const itemClass =
    "block w-full rounded-[6px] px-2.5 py-1.5 text-left text-ui text-eh-ink-2 outline-none transition hover:bg-eh-surface-2 hover:text-eh-ink focus-visible:bg-eh-surface-2 focus-visible:text-eh-ink";

  // Rendered into the workspace root: escapes the table's scroll container
  // (which would clip it) while keeping the --eh-* theme variables.
  const host = typeof document !== "undefined" ? document.querySelector(".employer-workspace") : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${row.title}`}
        className="grid h-[30px] w-[30px] place-items-center rounded-control border border-transparent text-eh-muted transition hover:border-eh-line hover:bg-eh-surface hover:text-eh-ink"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
      {open &&
        pos &&
        host &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${row.title}`}
            className="fixed z-50 min-w-[168px] rounded-control border border-eh-line bg-eh-surface p-1 shadow-[0_8px_24px_rgba(16,24,40,0.12)]"
            style={{ top: pos.top, right: pos.right }}
          >
            {row.shareable && (
              <button
                type="button"
                role="menuitem"
                className={itemClass}
                onClick={() => {
                  setOpen(false);
                  void shareListing(row);
                }}
              >
                Share listing
              </button>
            )}
            <Link role="menuitem" href={`/employer/jobs/${row.id}/edit`} className={itemClass}>
              Edit listing
            </Link>
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                onClose(row);
              }}
            >
              Close listing
            </button>
          </div>,
          host
        )}
    </>
  );
}

/**
 * Active roles. A status chip appears only when a role needs something
 * from you; one primary action per row (Review, Share listing, or View
 * applicants), with Share, Edit and Close in the "⋯" menu. Scrolls
 * horizontally inside its card on small screens.
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

  const th = "whitespace-nowrap border-b border-eh-line bg-eh-surface-2 px-5 py-2.5 text-small font-medium text-eh-muted";
  const td = "border-b border-eh-line px-5 py-3 align-middle";

  return (
    <section
      aria-labelledby="pro-roles-heading"
      className="rounded-card border border-eh-line bg-eh-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
    >
      <div className="flex items-center gap-2.5 px-5 pb-3.5 pt-4">
        <h2 id="pro-roles-heading" className="text-card-title text-eh-ink">
          Active roles
        </h2>
        <span className="num text-ui text-eh-muted">
          {visible.length} {visible.length === 1 ? "listing" : "listings"}
        </span>
        <Link
          href="/employer/jobs"
          className="ml-auto inline-flex items-center gap-1 text-ui text-eh-muted transition hover:text-eh-ink"
        >
          All jobs
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="border-t border-eh-line px-5 py-8 text-center">
          <p className="text-body text-eh-ink">No active roles</p>
          <p className="mt-1 text-ui text-eh-muted">Post a listing and it shows up here with its views and applicants.</p>
          <Link
            href="/employer/jobs/new"
            className="mt-4 inline-flex h-9 items-center rounded-control bg-eh-marigold px-3.5 text-ui font-semibold text-[#241500] transition hover:bg-eh-marigold-strong"
          >
            Post a job
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-body">
              <thead>
                <tr>
                  <th scope="col" className={`${th} text-left`}>Role</th>
                  <th scope="col" className={`${th} text-left`}>Status</th>
                  <th scope="col" className={`${th} text-right`}>Views</th>
                  <th scope="col" className={`${th} text-right`}>Applicants</th>
                  <th scope="col" className={`${th} text-right`}>Hired</th>
                  <th scope="col" className={`${th} text-right`}>View → apply</th>
                  <th scope="col" className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row, index) => {
                  const last = index === visible.length - 1;
                  const cell = last ? td.replace("border-b ", "") : td;
                  const primaryClass = `inline-flex h-[30px] items-center whitespace-nowrap rounded-control border px-2.5 text-small transition ${
                    row.primary.kind === "review"
                      ? "border-eh-marigold bg-eh-marigold font-semibold text-[#241500] hover:bg-eh-marigold-strong"
                      : "border-eh-line bg-eh-surface font-medium text-eh-ink hover:bg-eh-surface-2"
                  }`;
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-eh-surface-2">
                      <td className={cell}>
                        <p className="font-semibold text-eh-ink">{row.title}</p>
                        <p className="text-small text-eh-muted">{row.meta}</p>
                      </td>
                      <td className={cell}>
                        <StatusChip status={row.status} />
                      </td>
                      <td className={`${cell} num text-right`}>{row.views}</td>
                      <td className={`${cell} num text-right ${row.applicants === 0 ? "text-eh-muted" : ""}`}>
                        {row.applicants}
                      </td>
                      <td className={`${cell} num text-right`}>
                        {row.filled ? (
                          <span className="rounded-chip bg-eh-success-tint px-2 py-0.5 text-xs text-eh-success">Filled</span>
                        ) : (
                          <span className="text-eh-muted">
                            {row.hired} of {row.target}
                          </span>
                        )}
                      </td>
                      <td className={`${cell} num text-right`}>
                        {row.conversion === null ? (
                          <span
                            className="cursor-help border-b border-dotted border-eh-muted text-eh-muted"
                            title={CONVERSION_HINT}
                            aria-label={`No rate: ${CONVERSION_HINT}`}
                          >
                            —
                          </span>
                        ) : (
                          `${row.conversion}%`
                        )}
                      </td>
                      <td className={cell}>
                        <div className="flex items-center justify-end gap-1">
                          {row.primary.kind === "share" ? (
                            <button type="button" onClick={() => void shareListing(row)} className={primaryClass}>
                              {row.primary.label}
                            </button>
                          ) : (
                            <Link href={row.primary.href} className={primaryClass}>
                              {row.primary.label}
                            </Link>
                          )}
                          <RowMenu row={row} onClose={setClosing} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-eh-line px-5 py-2.5 text-xs text-eh-muted">
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
    </section>
  );
}
