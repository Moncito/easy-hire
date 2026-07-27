import { auth } from "@/Auth";
import { redirect } from "next/navigation";
import SeekerSidebar from "@/components/seeker/SeekerSidebar";

export default async function SeekerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "SEEKER") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-mist">
      <SeekerSidebar />
      <div className="flex min-w-0 flex-1 flex-col pl-64">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-ink/5 bg-white/95 px-8 shadow-xs backdrop-blur-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">Job Seeker</span>
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
