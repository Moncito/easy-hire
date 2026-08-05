import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  tone?: "navy" | "ember";
  icon?: ReactNode;
};

export default function EmployerAccentBanner({
  title,
  description,
  actionLabel,
  actionHref,
  tone = "navy",
  icon,
}: Props) {
  const toneClass =
    tone === "ember"
      ? "bg-ember/5 ring-ember/15"
      : "bg-navy text-mist ring-white/10";

  return (
    <div
      className={`mb-8 flex flex-col gap-4 rounded-2xl p-5 ring-1 sm:flex-row sm:items-center sm:justify-between ${toneClass}`}
    >
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <p className={`font-semibold ${tone === "ember" ? "text-ink" : "text-mist"}`}>{title}</p>
          <p className={`mt-1 text-sm leading-relaxed ${tone === "ember" ? "text-ink/60" : "text-mist/70"}`}>
            {description}
          </p>
        </div>
      </div>
      <Link
        href={actionHref}
        className={`inline-flex shrink-0 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
          tone === "ember"
            ? "bg-white text-ink ring-1 ring-ink/10 hover:bg-ink/5"
            : "bg-teal text-white shadow-md shadow-teal/30 hover:bg-teal/95"
        }`}
      >
        {actionLabel}
      </Link>
    </div>
  );
}
