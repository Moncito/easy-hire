import Hero from "@/components/landing/Hero";
import ValueProps from "@/components/landing/ValueProps";
import HowItWorks from "@/components/landing/HowItWorks";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <Header />
      <Hero />
      <ValueProps />
      <HowItWorks />
      <FAQ />
      <Footer />
    </main>
  );
}