import type { LucideIcon } from "lucide-react";
import { getSession } from "@/lib/employer-session";
import Footer from "@/components/landing/Footer";
import PublicJobsHeader from "@/components/jobs/PublicJobsHeader";
import { LegalNavBandBleed } from "@/components/legal/LegalNavBand";
import SeekerAreaBackground from "@/components/seeker/SeekerAreaBackground";

type Props = {
  title: string;
  description: string;
  navSection: string;
  navIcon: LucideIcon;
  navHint?: string;
  children: React.ReactNode;
};

export default async function LegalPageShell({
  title,
  description,
  navSection,
  navIcon,
  navHint,
  children,
}: Props) {
  const session = await getSession();
  const isSeeker = session?.user?.role === "SEEKER";
  const firstName = session?.user?.name?.trim().split(/\s+/)[0];
  const metaLabel = isSeeker && firstName ? `Hi, ${firstName}` : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-mist">
      <SeekerAreaBackground />
      <PublicJobsHeader />
      <main className="header-offset relative z-10 pb-16">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <LegalNavBandBleed
            section={navSection}
            icon={navIcon}
            hint={navHint}
            isSeeker={isSeeker}
            metaLabel={metaLabel}
          />
          <header className="mb-10 border-b border-ink/10 pb-8 pt-2">
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink">{title}</h1>
            <p className="mt-3 text-sm text-ink/55">{description}</p>
          </header>
          <div className="space-y-6 text-sm leading-relaxed text-ink/75">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-bold text-ink">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export { Section };
