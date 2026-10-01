import { auth } from "@/Auth";
import Footer from "@/components/landing/Footer";
import SeekerAreaBackground from "@/components/seeker/SeekerAreaBackground";

/**
 * Public VA profile. No floating site nav here — the profile is the page;
 * the page's own back link and the footer cover navigation.
 */
export default async function PublicSeekerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isSeeker = session?.user?.role === "SEEKER";

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-hidden"
      style={{ background: "#F5F4F0" }}
    >
      {isSeeker && <SeekerAreaBackground />}
      <div className="relative z-10 flex-1">{children}</div>
      <Footer />
    </div>
  );
}
