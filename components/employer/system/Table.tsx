import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cx } from "@/components/employer/system/cx";

/**
 * Lightweight table parts: subtle horizontal separators, no boxed cells,
 * hover rows. Put the table in a Card with padded={false}. On narrow
 * screens prefer a stacked list (see StackedRow) over squeezing the table;
 * `minWidth` + horizontal scroll is the fallback when columns must stay.
 */
export function Table({ children, minWidth, caption }: { children: ReactNode; minWidth?: number; caption?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-body" style={minWidth ? { minWidth } : undefined}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function Th({
  align = "left",
  children,
  className,
  ...rest
}: Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> & { align?: "left" | "right" }) {
  return (
    <th
      scope="col"
      {...rest}
      className={cx(
        "whitespace-nowrap border-b border-eh-line bg-eh-surface-2 px-5 py-2.5 text-small font-medium text-eh-muted",
        align === "right" ? "text-right" : "text-left",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Tr({ children, selected = false }: { children: ReactNode; selected?: boolean }) {
  return (
    <tr
      aria-selected={selected || undefined}
      className={cx(
        "border-b border-eh-line transition-colors duration-150 last:border-0 hover:bg-eh-surface-2",
        selected && "bg-eh-surface-2"
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  align = "left",
  numeric = false,
  children,
  className,
  ...rest
}: Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> & { align?: "left" | "right"; numeric?: boolean }) {
  return (
    <td
      {...rest}
      className={cx("px-5 py-3 align-middle", (align === "right" || numeric) && "text-right", numeric && "num", className)}
    >
      {children}
    </td>
  );
}

/**
 * The mobile counterpart of a table row: primary line, metadata line,
 * optional trailing content, and an actions row. Rows separate with the
 * same hairline as table rows.
 */
export function StackedRow({
  title,
  meta,
  aside,
  actions,
  children,
}: {
  title: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="border-b border-eh-line px-5 py-4 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-eh-ink">{title}</p>
          {meta && <p className="mt-0.5 text-small text-eh-muted">{meta}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
      {actions && <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>}
    </li>
  );
}
