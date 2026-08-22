import { auth } from "@/Auth";
import PublicJobsHeader from "@/components/jobs/PublicJobsHeader";
import Footer from "@/components/landing/Footer";
import SeekerAreaBackground from "@/components/seeker/SeekerAreaBackground";

export default async function PublicSeekerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isSeeker = session?.user?.role === "SEEKER";

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-hidden"
      style={{ background: "#F5F4F0" }}
    >
      {isSeeker && <SeekerAreaBackground />}
      <PublicJobsHeader />
      <div className="relative z-10 flex-1">{children}</div>
      <Footer />
    </div>
  );
}
