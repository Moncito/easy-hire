import { auth } from "@/Auth";
import { redirect } from "next/navigation";
import SeekerPillNav from "@/components/seeker/SeekerPillNav";

export default async function SeekerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "SEEKER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-mist">
      <SeekerPillNav userName={session.user.name} userEmail={session.user.email} />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
