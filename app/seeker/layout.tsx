import { auth } from "@/Auth";
import { redirect } from "next/navigation";
import SeekerPillNav from "@/components/seeker/SeekerPillNav";
import SeekerAreaBackground from "@/components/seeker/SeekerAreaBackground";

export default async function SeekerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "SEEKER") {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-mist">
      <SeekerAreaBackground />
      <SeekerPillNav userName={session.user.name} userEmail={session.user.email} />
      <main className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
