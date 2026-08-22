import { Suspense } from "react";
import Hero from "@/components/landing/Hero";
import TrustMarquee from "@/components/landing/TrustMarquee";
import JobsTicker from "@/components/landing/JobsTicker";
import ValueProps from "@/components/landing/ValueProps";
import HowItWorks from "@/components/landing/HowItWorks";
import StatsBand from "@/components/landing/StatsBand";
import Manifesto from "@/components/landing/Manifesto";
import FAQ from "@/components/landing/FAQ";
import ClosingCTA from "@/components/landing/ClosingCTA";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import LoginModalProvider from "@/components/auth/LoginModalProvider";
import { listLandingJobs } from "@/lib/public-jobs";
import { getLandingStats, listVerifiedCompanies } from "@/lib/landing";

// Jobs ticker + stats read live tables; re-render at most every 5 minutes.
// The helpers fail soft (empty/zero) so a build-time prerender without DB
// access still succeeds.
export const revalidate = 300;

export default async function HomePage() {
  const [jobs, stats, companies] = await Promise.all([
    listLandingJobs(12),
    getLandingStats(),
    listVerifiedCompanies(10),
  ]);

  return (
    <Suspense fallback={null}>
      <LoginModalProvider>
        <main className="relative overflow-hidden">
          <Header />
          <Hero
            stats={stats}
            featuredCompany={companies.find((c) => c.logoUrl) ?? companies[0] ?? null}
          />
          <TrustMarquee companies={companies} />
          <JobsTicker jobs={jobs} />
          <ValueProps />
          <HowItWorks />
          <StatsBand stats={stats} />
          <Manifesto />
          <FAQ />
          <ClosingCTA />
          <Footer />
        </main>
      </LoginModalProvider>
    </Suspense>
  );
}
