import SeekerPillNav from "@/components/seeker/SeekerPillNav";
import SeekerAreaBackground from "@/components/seeker/SeekerAreaBackground";
import SeekerWorkspaceSwitcher from "@/components/seeker/SeekerWorkspaceSwitcher";
import { requireSeekerLayoutContext } from "@/lib/auth/seeker-session";
import { getHiringWorkspacesForUser } from "@/lib/collaborative-hiring";
import { redirect } from "next/navigation";

export default async function SeekerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSeekerLayoutContext();
  if (!ctx) redirect("/login");
  const { session } = ctx;
  const workspaces = await getHiringWorkspacesForUser(ctx.userId);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-mist">
      <SeekerAreaBackground />
      <SeekerPillNav userName={session.user.name} userEmail={session.user.email} />
      <SeekerWorkspaceSwitcher userName={session.user.name} workspaces={workspaces} />
      <main className="seeker-shell-main relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
