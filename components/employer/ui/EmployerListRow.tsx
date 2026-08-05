import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

type Props = {
  href?: string;
  onClick?: () => void;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  pipeline?: ReactNode;
};

export default function EmployerListRow({
  href,
  onClick,
  leading,
  title,
  subtitle,
  meta,
  trailing,
  pipeline,
}: Props) {
  const inner = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-ink">{title}</div>
        {subtitle && <div className="mt-0.5 text-xs text-ink/45">{subtitle}</div>}
      </div>
      {meta && <div className="hidden shrink-0 text-xs text-ink/45 sm:block">{meta}</div>}
      {pipeline && <div className="hidden w-28 shrink-0 md:block">{pipeline}</div>}
      {trailing ?? (href ? <ChevronRight className="h-4 w-4 shrink-0 text-ink/25" /> : null)}
    </>
  );

  const className =
    "group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-ink/[0.03]";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}
