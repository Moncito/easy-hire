import Link from "next/link";
import { CalendarDays, FileText, Lock, ReceiptText, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getSession } from "@/lib/employer-session";
import Footer from "@/components/landing/Footer";
import PublicJobsHeader from "@/components/jobs/PublicJobsHeader";
import { LegalNavBandBleed } from "@/components/legal/LegalNavBand";
import LegalToc from "@/components/legal/LegalToc";
import SeekerAreaBackground from "@/components/seeker/SeekerAreaBackground";

type LegalDoc = "terms" | "privacy" | "refunds" | "pricing";

type Props = {
  title: string;
  description: string;
  navSection: string;
  navIcon: LucideIcon;
  navHint?: string;
  /** Which document this page is; highlights it in the switcher row. */
  doc?: LegalDoc;
  /** Section anchors for the "On this page" navigation. */
  toc?: { id: string; title: string }[];
  /** Human-readable last-updated date, e.g. "October 1, 2026". */
  updated?: string;
  /** Terms/Privacy version string, shown in mono. */
  version?: string;
  children: React.ReactNode;
};

const DOCS: { key: LegalDoc; label: string; href: string; icon: LucideIcon }[] = [
  { key: "terms", label: "Terms of Service", href: "/terms", icon: FileText },
  { key: "privacy", label: "Privacy Policy", href: "/privacy", icon: Lock },
  { key: "refunds", label: "Refunds", href: "/refund-policy", icon: ReceiptText },
  { key: "pricing", label: "Pricing", href: "/pricing", icon: Tag },
];

export default async function LegalPageShell({
  title,
  description,
  navSection,
  navIcon,
  navHint,
  doc,
  toc,
  updated,
  version,
  children,
}: Props) {
  const session = await getSession();
  const isSeeker = session?.user?.role === "SEEKER";
  const firstName = session?.user?.name?.trim().split(/\s+/)[0];
  const metaLabel = isSeeker && firstName ? `Hi, ${firstName}` : null;
  const tocItems = toc && toc.length > 0 ? toc : null;
  const hasToc = tocItems !== null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-mist">
      {isSeeker && <SeekerAreaBackground />}
      <PublicJobsHeader />
      <main className="header-offset relative z-10 pb-16">
        <div
          className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${hasToc ? "max-w-5xl" : "max-w-3xl"}`}
        >
          {isSeeker && (
            <LegalNavBandBleed
              section={navSection}
              icon={navIcon}
              hint={navHint}
              isSeeker
              metaLabel={metaLabel}
            />
          )}
          <header
            className={`relative mb-8 overflow-hidden rounded-3xl border border-ink/10 bg-gradient-to-br from-mist via-mist to-navy/5 px-5 py-8 sm:px-8 sm:py-10 ${isSeeker ? "mt-2" : "mt-6 sm:mt-8"}`}
          >
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-ink/60">{description}</p>

            {(updated || version) && (
              <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/55">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {updated && <span>Last updated {updated}</span>}
                {updated && version && <span aria-hidden="true">&middot;</span>}
                {version && (
                  <span>
                    Version <span className="font-mono">{version}</span>
                  </span>
                )}
              </p>
            )}

            {doc && (
              <nav
                aria-label="Legal documents"
                className="mt-6"
              >
                <ul className="flex flex-wrap gap-2">
                  {DOCS.map(({ key, label, href, icon: Icon }) => {
                    const current = key === doc;
                    const classes = `inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] sm:gap-2 sm:px-3.5 sm:text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                      current
                        ? "border-navy bg-navy/10 text-navy"
                        : "border-ink/10 bg-white text-ink/65 hover:border-navy/40 hover:text-ink"
                    }`;
                    return (
                      <li key={key} className="shrink-0">
                        {current ? (
                          <span aria-current="page" className={classes}>
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            {label}
                          </span>
                        ) : (
                          <Link href={href} className={classes}>
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            {label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </header>

          {tocItems ? (
            <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
              <LegalToc items={tocItems} />
              <div className="max-w-3xl space-y-8 text-sm leading-relaxed text-ink/75">
                {children}
              </div>
            </div>
          ) : (
            <div className="space-y-8 text-sm leading-relaxed text-ink/75">{children}</div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({
  id,
  title,
  summary,
  children,
}: {
  id?: string;
  title: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="mb-3 font-display text-lg font-bold text-ink">{title}</h2>
      {summary && (
        <div className="mb-4 rounded-lg border border-navy/10 bg-navy/5 px-3.5 py-2.5 text-sm text-ink/80">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy">
            In short
          </p>
          {summary}
        </div>
      )}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export { Section };
