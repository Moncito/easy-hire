import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "@/components/employer/Sidebar";
import Topbar from "@/components/employer/Topbar";
import EmployerPageContainer from "@/components/employer/EmployerPageContainer";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-mist">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pl-64">
        <Topbar
          companyName={company?.companyName || "Your company"}
          verifiedStatus={company?.verifiedStatus || "PENDING"}
        />
        <main className="flex-1 overflow-y-auto">
          <EmployerPageContainer>{children}</EmployerPageContainer>
        </main>
      </div>
    </div>
  );
}
