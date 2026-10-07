import { AskBand } from "@/components/landing/ask-band";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Nav } from "@/components/landing/nav";
import { Pricing } from "@/components/landing/pricing";
import { RawVsRead } from "@/components/landing/raw-vs-read";
import { Closing, HowItWorks, Privacy } from "@/components/landing/sections";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <Hero />
        <RawVsRead />
        <Features />
        <AskBand />
        <HowItWorks />
        <Privacy />
        <Pricing />
        <Faq />
        <Closing />
      </main>
      <Footer />
    </>
  );
}
