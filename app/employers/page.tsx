import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import LoginModalProvider from "@/components/auth/LoginModalProvider";
import EmployerHero from "@/components/employers/EmployerHero";
import EmployerStatsBand from "@/components/employers/EmployerStatsBand";
import EmployerHowItWorks from "@/components/employers/EmployerHowItWorks";
import EmployerWhyEasyHire from "@/components/employers/EmployerWhyEasyHire";
import EmployerSalaryGuide from "@/components/employers/EmployerSalaryGuide";
import EmployerClosingCTA from "@/components/employers/EmployerClosingCTA";
import { getLandingStats } from "@/lib/landing";

// Stats read live tables; re-render at most every 5 minutes. getLandingStats
// fails soft (zeros) so a build-time prerender without DB access still succeeds.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Hire Verified Filipino Virtual Assistants — EasyHire for Employers",
  description:
    "Post a job for free and hire a verified Filipino VA. Admin-reviewed job postings, no salary markup or commission, and free messaging with applicants at launch. Built for US, AU and UK founders.",
};

export default async function EmployersPage() {
  const stats = await getLandingStats();

  return (
    <Suspense fallback={null}>
      <LoginModalProvider>
        <main className="relative overflow-hidden">
          <Header />
          <EmployerHero />
          <EmployerStatsBand stats={stats} />
          <EmployerHowItWorks />
          <EmployerWhyEasyHire />
          <EmployerSalaryGuide />
          <EmployerClosingCTA />
          <Footer />
        </main>
      </LoginModalProvider>
    </Suspense>
  );
}
