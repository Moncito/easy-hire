"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import DataTable, { type DataTableColumn } from "./DataTable";
import { formatDate } from "./badges";
import { StatTile } from "@/components/admin/statTiles";
import type { HireListItem, HireStats } from "@/lib/admin/hires";

/**
 * `/admin/hires` table + stat band. Rows are not whole-row links (a hire has
 * three different useful destinations), so the company and job cells carry
 * their own links instead. VA names are plain text: the hire row carries the
 * seeker PROFILE id, and the admin user pages are keyed by user id.
 */

function SourceBadge({ source }: { source: HireListItem["hireSource"] }) {
  if (source === "OFFER_ACCEPTED") {
    return (
      <span className="rounded-lg bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal admin-dark:bg-teal/15">
        Accepted offer
      </span>
    );
  }
  if (source === "EMPLOYER_MARKED") {
    return (
      <span className="rounded-lg bg-ink/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink/65 admin-dark:bg-white/10 admin-dark:text-mist/65">
        Employer-marked
      </span>
    );
  }
  return (
    <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink/40 ring-1 ring-ink/10 admin-dark:text-mist/40 admin-dark:ring-white/10">
      Unknown
    </span>
  );
}

const COLUMNS: DataTableColumn<HireListItem>[] = [
  {
    key: "hired",
    header: "Hired",
    cellClassName: "whitespace-nowrap",
    render: (h) => <time dateTime={h.hiredAt} className="font-data text-xs">{formatDate(h.hiredAt)}</time>,
  },
  {
    key: "va",
    header: "VA",
    render: (h) => <span className="font-medium text-ink admin-dark:text-mist">{h.seekerName}</span>,
  },
  {
    key: "company",
    header: "Company",
    render: (h) => (
      <Link
        href={`/admin/companies/${h.companyId}`}
        className="font-medium text-navy hover:underline admin-dark:text-mist"
      >
        {h.companyName}
      </Link>
    ),
  },
  {
    key: "job",
    header: "Job",
    render: (h) => <span className="block max-w-[16rem] truncate">{h.jobTitle}</span>,
  },
  { key: "source", header: "Source", render: (h) => <SourceBadge source={h.hireSource} /> },
  {
    key: "confirmed",
    header: "VA confirmed",
    render: (h) =>
      h.confirmedBySeekerAt ? (
        <span className="inline-flex items-center gap-1 text-teal">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Confirmed {formatDate(h.confirmedBySeekerAt)}</span>
        </span>
      ) : (
        <span className="text-ink/35 admin-dark:text-mist/35">
          <span aria-hidden="true">—</span>
          <span className="sr-only">Not confirmed</span>
        </span>
      ),
  },
  {
    key: "rate",
    header: "Offer rate",
    align: "right",
    cellClassName: "whitespace-nowrap",
    render: (h) => <span className="font-data text-xs">{h.offer?.rateLabel ?? "—"}</span>,
  },
];

export default function HireDirectory({ items, stats }: { items: HireListItem[]; stats: HireStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Total hires" value={stats.total} />
        <StatTile label="Via accepted offer" value={stats.viaOffer} tone="teal" />
        <StatTile label="Employer-marked" value={stats.employerMarked} />
        <StatTile label="Confirmed by VA" value={stats.confirmedBySeeker} tone="marigold" />
        <StatTile label="Guarantee interest" value={stats.guaranteeInterest} />
      </div>

      <DataTable
        columns={COLUMNS}
        rows={items}
        getRowId={(h) => h.applicationId}
        caption="Hires, newest first, with how each was recorded"
        emptyState={
          <div className="rounded-2xl bg-ink/[0.02] px-6 py-10 text-center ring-1 ring-ink/6 admin-dark:bg-white/5 admin-dark:ring-white/10">
            <p className="text-sm text-ink/50 admin-dark:text-mist/50">No hires yet.</p>
          </div>
        }
      />
    </div>
  );
}
