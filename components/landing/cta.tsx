"use client";

import { useState } from "react";

export function Cta() {
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to waitlist/API
  }

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
        Join fans logging every match, rating every spectacle, and building their football memory.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex max-w-[360px] mx-auto border border-border2 rounded overflow-hidden bg-surface relative"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 bg-transparent border-0 outline-none py-3.5 px-4 font-sans text-sm text-white placeholder:text-muted2"
        />
        <button
          type="submit"
          className="bg-green text-black py-3.5 px-5 font-sans text-sm font-semibold whitespace-nowrap hover:opacity-90 transition-opacity"
        >
          Get early access
        </button>
      </form>
    </section>
  );
}
