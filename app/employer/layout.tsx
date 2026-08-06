import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EmployerShell from "@/components/employer/EmployerShell";
import { getEmployerNavCounts } from "@/lib/employer-analytics";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });

  const navCounts = company
    ? await getEmployerNavCounts(company.id)
    : { activeJobs: 0, needsReview: 0, unreadMessages: 0 };

  return (
    <EmployerShell
      companyName={company?.companyName || "Your company"}
      verifiedStatus={company?.verifiedStatus || "PENDING"}
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
