import { Hero } from "@/components/landing/hero";
import { Ticker } from "@/components/landing/ticker";
import { Features } from "@/components/landing/features";
import { Competitions } from "@/components/landing/competitions";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export function LandingPage() {
  return (
    <>
      <Hero />
      <Ticker />
      <Features />
      <Competitions />
      <Cta />
      <Footer />
    </>
  );
}
