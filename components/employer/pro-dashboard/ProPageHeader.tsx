import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  stats?: ReactNode;
  actions?: ReactNode;
};

/** Pro page opener — display title, no card wrapper. */
export default function ProPageHeader({ title, description, stats, actions }: Props) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink/55">{description}</p>
        )}
        {stats && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/50">{stats}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
    </header>
  );
}
