import SeekerPillNav from "@/components/seeker/SeekerPillNav";
import SeekerAreaBackground from "@/components/seeker/SeekerAreaBackground";
import SeekerWorkspaceSwitcher from "@/components/seeker/SeekerWorkspaceSwitcher";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";
import { requireSeekerLayoutContext } from "@/lib/auth/seeker-session";
import { getHiringWorkspacesForUser } from "@/lib/collaborative-hiring";
import { redirect } from "next/navigation";

export default async function SeekerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSeekerLayoutContext();
  if (!ctx) redirect("/login");
  const { session, impersonation } = ctx;
  const workspaces = await getHiringWorkspacesForUser(ctx.userId);

  return (
    // `paddingTop` is `--eh-impersonation-h` (0px unless ImpersonationBanner
    // below is mounted and has measured itself) — it shifts this whole
    // in-flow subtree down so SeekerPillNav / SeekerWorkspaceSwitcher (both
    // `fixed`, offset by the same variable in their own components) don't
    // end up floating over content that never moved.
    <div className="relative min-h-screen overflow-x-hidden bg-mist" style={{ paddingTop: "var(--eh-impersonation-h, 0px)" }}>
      {impersonation && (
        <ImpersonationBanner
          targetDisplayName={impersonation.targetDisplayName}
          expiresAt={impersonation.expiresAt.toISOString()}
        />
      )}
      <SeekerAreaBackground />
      <SeekerPillNav userName={session.user.name} userEmail={session.user.email} />
      <SeekerWorkspaceSwitcher userName={session.user.name} workspaces={workspaces} />
      <main className="seeker-shell-main relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
