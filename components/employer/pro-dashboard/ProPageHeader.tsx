import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  stats?: ReactNode;
  actions?: ReactNode;
};

/** Pro page opener — large type, no card wrapper. */
export default function ProPageHeader({ title, description, stats, actions }: Props) {
  return (
    <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-black tracking-tighter text-ink sm:text-5xl sm:leading-[0.95]">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink/50 sm:text-lg">{description}</p>
        )}
        {stats && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/50">{stats}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
    </header>
  );
}
