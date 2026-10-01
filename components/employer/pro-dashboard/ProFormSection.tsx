import type { ReactNode } from "react";
import { TONE_CHIP, type SectionTone } from "@/components/employer/talent/tones";

/**
 * A settings-style form section for Employer Pro: its own card, a Space
 * Grotesk title with the section's icon on a tinted chip, an optional
 * description, then the fields. The Pro counterpart of EmployerFormSection.
 */
export default function ProFormSection({
  id,
  title,
  description,
  icon,
  tone = "navy",
  action,
  children,
}: {
  id?: string;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  tone?: SectionTone;
  /** Right-aligned control in the header, e.g. a status pill. */
  action?: ReactNode;
  children: ReactNode;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-24 rounded-card border border-eh-line bg-eh-surface p-5 shadow-eh-sm sm:p-6"
    >
      <div className="mb-5 flex items-start gap-3">
        {icon && (
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-control [&_svg]:h-[18px] [&_svg]:w-[18px] ${TONE_CHIP[tone]}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="font-heading text-[18px] font-semibold tracking-[-0.01em] text-eh-ink">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-ui text-eh-muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
