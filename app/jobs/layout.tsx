import { auth } from "@/Auth";
import PublicJobsHeader from "@/components/jobs/PublicJobsHeader";
import SeekerAreaBackground from "@/components/seeker/SeekerAreaBackground";

export default async function JobsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isSeeker = session?.user?.role === "SEEKER";

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-mist lg:h-dvh lg:max-h-dvh">
      {isSeeker && <SeekerAreaBackground />}
      <PublicJobsHeader />
      <div
        className={`jobs-workspace-shell relative z-10${isSeeker ? " seeker-jobs-shell-mobile" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
