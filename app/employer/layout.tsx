import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EmployerShell from "@/components/employer/EmployerShell";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <EmployerShell
      companyName={company?.companyName || "Your company"}
      verifiedStatus={company?.verifiedStatus || "PENDING"}
    >
      {children}
    </EmployerShell>
  );
}
