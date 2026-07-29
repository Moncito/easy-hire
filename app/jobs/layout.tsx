import PublicJobsHeader from "@/components/jobs/PublicJobsHeader";
import Footer from "@/components/landing/Footer";

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist">
      <PublicJobsHeader />
      <div className="header-offset">{children}</div>
      <Footer />
    </div>
  );
}
