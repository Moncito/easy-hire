import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import LoginModalProvider from "@/components/auth/LoginModalProvider";
import EmployerHero from "@/components/employers/EmployerHero";
import EmployerStatsBand from "@/components/employers/EmployerStatsBand";
import EmployerHowItWorks from "@/components/employers/EmployerHowItWorks";
import EmployerWhyEasyHire from "@/components/employers/EmployerWhyEasyHire";
import EmployerSalaryGuide from "@/components/employers/EmployerSalaryGuide";
import EmployerClosingCTA from "@/components/employers/EmployerClosingCTA";
import EmployerMarketingFooter from "@/components/employers/EmployerMarketingFooter";
import { EmployerPageThemeProvider } from "@/components/employers/EmployerPageThemeProvider";
import EmployerThemeToggle from "@/components/employers/EmployerThemeToggle";
import { getLandingStats } from "@/lib/landing";

export const revalidate = 300;

const description =
  "Post a job for free and hire a verified Filipino VA. Admin-reviewed job postings, no salary markup or commission, and free messaging with applicants at launch. Built for US, AU and UK founders.";

export const metadata: Metadata = {
  // No trailing "— EasyHire": the root layout's title template already
  // appends it, so hardcoding it here would double it up.
  title: "Hire Verified Filipino Virtual Assistants",
  description,
  openGraph: {
    title: "Hire Verified Filipino Virtual Assistants — EasyHire for Employers",
    description,
    type: "website",
  },
};

export default async function EmployersPage() {
  const stats = await getLandingStats();

  return (
    <Suspense fallback={null}>
      <LoginModalProvider>
        <EmployerPageThemeProvider>
          <EmployerThemeToggle />
          <main className="relative overflow-hidden">
            <Header />
            <EmployerHero />
            <EmployerStatsBand stats={stats} />
            <EmployerHowItWorks />
            <EmployerWhyEasyHire />
            <EmployerSalaryGuide />
            <EmployerClosingCTA />
            <EmployerMarketingFooter />
          </main>
        </EmployerPageThemeProvider>
      </LoginModalProvider>
    </Suspense>
  );
}
