import Link from "next/link";
import type { ReactNode } from "react";

/**
 * THE ONE DENSE TABLE — docs/ADMIN-CONSOLE-PLAN.md §9: "a single `DataTable`"
 * rather than four bespoke ones. Used by the user directory, the job
 * directory, and the members table on the company detail page.
 *
 * Density (§5): 32px rows (`h-8`), sticky header, numbers/ids/durations
 * right-aligned in `font-data`. Real semantic `<table>` — no div-grid
 * pretending to be one.
 *
 * Row-as-link accessibility: when `getRowHref` is supplied, the first cell of
 * each row gets a real `<Link>` stretched to cover the whole row (`absolute
 * inset-0` on a `position: relative` `<tr>` — the standard "stretched link"
 * technique). That gives keyboard users a single real, labelled, Tab-reachable
 * link per row and mouse users a click-anywhere row, without faking table
 * semantics with a `role="link"` on the `<tr>` itself. Any interactive content
 * rendered by a column's `render()` sits in a `relative z-10` wrapper so it
 * stays clickable above the stretched link.
 */

export type DataTableColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => ReactNode;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  getRowHref?: (row: T) => string;
  getRowAriaLabel?: (row: T) => string;
  /** Screen-reader-only `<caption>` describing what this specific table shows. */
  caption: string;
  loading?: boolean;
  skeletonRowCount?: number;
  emptyState: ReactNode;
  footer?: ReactNode;
  maxHeightClassName?: string;
};

function SkeletonRows({ columnCount, count }: { columnCount: number; count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="h-8 animate-pulse border-b border-ink/5">
          {Array.from({ length: columnCount }).map((__, j) => (
            <td key={j} className="px-2 py-0">
              <div className={`h-3 rounded bg-ink/10 ${j === 0 ? "w-32" : "w-14"}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function DataTable<T>({
  columns,
  rows,
  getRowId,
  getRowHref,
  getRowAriaLabel,
  caption,
  loading = false,
  skeletonRowCount = 8,
  emptyState,
  footer,
  maxHeightClassName = "max-h-[65vh]",
}: DataTableProps<T>) {
  if (rows.length === 0 && !loading) {
    return <>{emptyState}</>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white">
      <div className={`${maxHeightClassName} overflow-y-auto`}>
        <table className="w-full border-collapse text-sm" aria-busy={loading}>
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-10 bg-mist/95 backdrop-blur-sm">
            <tr className="border-b border-ink/10 text-left text-[10px] font-bold uppercase tracking-wider text-ink/45">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-2 py-2 first:pl-3 last:pr-3 ${col.align === "right" ? "text-right" : "text-left"} ${col.headerClassName ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <SkeletonRows columnCount={columns.length} count={skeletonRowCount} />
            ) : (
              rows.map((row) => {
                const id = getRowId(row);
                const href = getRowHref?.(row);
                return (
                  <tr
                    key={id}
                    className="relative h-8 border-b border-ink/5 text-ink/80 transition-colors hover:bg-ink/[0.03]"
                  >
                    {columns.map((col, colIndex) => (
                      <td
                        key={col.key}
                        className={`px-2 py-0 first:pl-3 last:pr-3 ${col.align === "right" ? "text-right" : "text-left"} ${col.cellClassName ?? ""}`}
                      >
                        {colIndex === 0 && href ? (
                          <Link
                            href={href}
                            aria-label={getRowAriaLabel?.(row)}
                            className="absolute inset-0 z-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-inset"
                          />
                        ) : null}
                        <div className="relative z-10">{col.render(row)}</div>
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
