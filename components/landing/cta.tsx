import Link from "next/link";

export function Cta() {
  return (
    <section className="py-24 md:py-32 px-6 text-center relative overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(61,220,132,.07) 0%, transparent 70%)" }}
      />
      <p className="font-mono text-[0.65rem] tracking-[0.22em] uppercase text-green flex items-center justify-center gap-3 mb-4 relative">
        Free. Always.
        <span className="w-10 h-px bg-green opacity-40" />
      </p>
      <h2 className="font-display text-[clamp(2.6rem,4.5vw,4rem)] leading-[0.96] tracking-[0.03em] mb-4 relative">
        START YOUR
        <br />
        MATCH DIARY
      </h2>
      <p className="text-[0.95rem] text-muted leading-[1.72] max-w-[340px] mx-auto mb-9 relative">
        Join fans logging every match, rating every spectacle, and building their watch history.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative">
        <Link
          href="/signup"
          className="inline-block bg-green text-black py-3.5 px-8 rounded-btn text-sm font-semibold tracking-wide hover:opacity-90 transition-all hover:-translate-y-px"
        >
          Sign up free
        </Link>
        <Link
          href="/login"
          className="text-sm text-muted hover:text-white transition-colors"
        >
          Already have an account? Log in
        </Link>
      </div>
    </section>
  );
}
