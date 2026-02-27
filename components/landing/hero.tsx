import Link from "next/link";
import { PhoneMockup } from "@/components/landing/phone-mockup";

export function Hero() {
  return (
    <section className="min-h-screen grid grid-cols-1 lg:grid-cols-2 items-center pt-20 lg:pt-24 px-6 md:px-10 pb-16 gap-12 lg:gap-16 max-w-[1180px] mx-auto">
      <div className="animate-fade-up">
        <p className="font-mono text-[0.68rem] tracking-[0.22em] uppercase text-green flex items-center gap-3 mb-6">
          <span className="w-5 h-px bg-green" aria-hidden />
          Log. Rate. Review. Remember.
        </p>
        <h1 className="font-display text-[clamp(4rem,8.5vw,7.5rem)] leading-[0.92] tracking-[0.02em] mb-7">
          EVERY
          <br />
          GAME
          <br />
          YOU&apos;VE
          <br />
          <em className="not-italic text-green">EVER SEEN.</em>
        </h1>
        <p className="text-base leading-[1.72] text-muted max-w-[400px] mb-9">
          Your personal game diary. <strong className="text-white font-normal">Rate with stars</strong>, write short
          reviews, add games to lists, and see what the community is watching across sports. Football first — F1, NBA & NFL coming soon.
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <Link
            href="/signup"
            className="inline-block bg-green text-black py-3 px-8 rounded-btn text-sm font-semibold tracking-wide hover:opacity-90 transition-all hover:-translate-y-px"
          >
            Start for free →
          </Link>
          <a
            href="#how-it-works"
            className="text-sm text-muted hover:text-white transition-colors"
          >
            See how it works ↓
          </a>
        </div>
      </div>
      <div className="flex justify-center animate-fade-up" style={{ animationDelay: "120ms" }}>
        <PhoneMockup />
      </div>
    </section>
  );
}
