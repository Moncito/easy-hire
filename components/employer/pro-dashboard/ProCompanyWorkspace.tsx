import { Check } from "lucide-react";

type ChecklistItem = { label: string; done: boolean };

type Props = {
  profileStrength: number;
  strengthLabel: string;
  checklist: ChecklistItem[];
};

/** Compact profile-strength strip — not a card. */
export default function ProCompanyWorkspace({
  profileStrength,
  strengthLabel,
  checklist,
}: Props) {
  const remaining = checklist.filter((item) => !item.done).length;
  const complete = profileStrength >= 75;

  return (
    <section className="mb-8 flex flex-col gap-4 border-b border-ink/8 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Profile strength</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
          <p className="font-data text-3xl font-bold tabular-nums text-ink">{profileStrength}%</p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
              complete ? "bg-teal/10 text-teal" : "bg-marigold/15 text-[#9A5B12]"
            }`}
          >
            {strengthLabel}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-ink/8">
          <div
            className="h-full rounded-full bg-marigold transition-all duration-500"
            style={{ width: `${profileStrength}%` }}
          />
        </div>
        {remaining > 0 && (
          <p className="mt-2 text-xs text-ink/45">
            {remaining} still open — logo and About move the needle most.
          </p>
        )}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 lg:max-w-xl lg:justify-end">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 text-xs">
            {item.done ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-teal" strokeWidth={3} aria-hidden="true" />
            ) : (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink/20" aria-hidden="true" />
            )}
            <span className={item.done ? "text-ink/40" : "text-ink/75"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
