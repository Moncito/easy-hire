import SeekerPillNav from "@/components/seeker/SeekerPillNav";
import SeekerAreaBackground from "@/components/seeker/SeekerAreaBackground";
import { requireSeekerLayoutContext } from "@/lib/auth/seeker-session";
import { redirect } from "next/navigation";

export default async function SeekerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSeekerLayoutContext();
  if (!ctx) redirect("/login");
  const { session } = ctx;

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
