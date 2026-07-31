import { Suspense } from "react";
import Hero from "@/components/landing/Hero";
import ValueProps from "@/components/landing/ValueProps";
import HowItWorks from "@/components/landing/HowItWorks";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import LoginModalProvider from "@/components/auth/LoginModalProvider";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <LoginModalProvider>
        <main className="relative overflow-hidden">
          <Header />
          <Hero />
          <ValueProps />
          <HowItWorks />
          <FAQ />
          <Footer />
        </main>
      </LoginModalProvider>
    </Suspense>
  );
}
