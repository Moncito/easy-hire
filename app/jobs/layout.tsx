import PublicJobsHeader from "@/components/jobs/PublicJobsHeader";
import Footer from "@/components/landing/Footer";

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
      <PublicJobsHeader />
      <div className="header-offset flex min-h-0 flex-1 flex-col lg:overflow-hidden">{children}</div>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
