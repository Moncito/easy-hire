import { redirect } from "next/navigation";
import { Syne, Source_Sans_3 } from "next/font/google";
import EmployerShell from "@/components/employer/EmployerShell";
import { requireEmployerLayoutContext } from "@/lib/employer-session";

// Pro-only typography (neomorphism design system). The CSS variables these
// expose are only *consumed* under `[data-employer-plan="pro"]` in
// globals.css, so Free renders never reference `--font-syne` /
// `--font-source-sans` and browsers won't fetch the files for Free sessions.
const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source-sans",
});

const proFontClassName = `${syne.variable} ${sourceSans.variable}`;

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireEmployerLayoutContext();

  if (!ctx) {
    redirect("/login");
  }

  const { company, navCounts, plan } = ctx;

  return (
    <EmployerShell
      companyName={company?.companyName || "Your company"}
      companyLogoUrl={company?.logoUrl ?? null}
      verifiedStatus={company?.verifiedStatus || "PENDING"}
      plan={plan}
      proFontClassName={proFontClassName}
      navCounts={{
        activeJobs: navCounts.activeJobs,
        needsReview: navCounts.needsReview,
        unreadMessages: navCounts.unreadMessages,
      }}
    >
      {children}
    </EmployerShell>
  );
}
