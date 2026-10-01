import { Check, Gauge } from "lucide-react";
import { StatusBadge, cx } from "@/components/employer/system";

type ChecklistItem = { label: string; done: boolean };

type Props = {
  profileStrength: number;
  strengthLabel: string;
  checklist: ChecklistItem[];
};

/**
 * Company profile strength: the score, a bar that turns teal once the
 * profile is strong, and every checklist item as a pill — done ones
 * ticked, open ones listed first so the next step is obvious.
 */
export default function ProCompanyWorkspace({ profileStrength, strengthLabel, checklist }: Props) {
  const remaining = checklist.filter((item) => !item.done);
  const complete = profileStrength >= 75;
  const ordered = [...remaining, ...checklist.filter((item) => item.done)];

  return (
    <section
      aria-labelledby="company-strength-heading"
      className="mb-6 rounded-card border border-eh-line bg-eh-surface p-5 shadow-eh-sm sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-4 lg:w-[300px] lg:shrink-0">
          <span
            className={cx(
              "grid h-12 w-12 shrink-0 place-items-center rounded-control [&_svg]:h-6 [&_svg]:w-6",
              complete ? "bg-eh-teal-tint text-eh-teal-ink" : "bg-eh-marigold-tint text-eh-marigold-ink"
            )}
            aria-hidden="true"
          >
            <Gauge />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="company-strength-heading" className="text-small text-eh-muted">
              Profile strength
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <p className="num font-heading text-[28px] font-bold leading-tight text-eh-ink">{profileStrength}%</p>
              <StatusBadge tone={complete ? "success" : "warning"}>{strengthLabel}</StatusBadge>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-eh-line"
              role="progressbar"
              aria-valuenow={profileStrength}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile strength"
            >
              <div
                className={cx(
                  "h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500",
                  complete ? "bg-eh-teal" : "bg-eh-marigold"
                )}
                style={{ width: `${profileStrength}%` }}
              />
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-2 text-small text-eh-muted">
            {remaining.length === 0
              ? "Everything VAs look for is filled in."
              : `${remaining.length} still open — logo and About move the needle most.`}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {ordered.map((item) => (
              <li
                key={item.label}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-small",
                  item.done
                    ? "bg-eh-teal-tint text-eh-teal-ink"
                    : "border border-dashed border-[color-mix(in_srgb,var(--eh-marigold)_60%,var(--eh-line))] bg-eh-surface text-eh-ink"
                )}
              >
                {item.done ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-eh-marigold" aria-hidden="true" />
                )}
                {item.label}
                <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
