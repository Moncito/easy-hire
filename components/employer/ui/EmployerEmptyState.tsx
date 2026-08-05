import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmployerEmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/10 bg-white/50 px-8 py-14 text-center">
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink/50">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
