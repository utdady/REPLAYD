const FEATURES = [
  {
    num: "01",
    icon: "📺",
    title: "LOG IT",
    desc: "Watched a game? Find it, tap log. Mark when you watched it, whether it was a rewatch, and flag spoilers for your followers.",
  },
  {
    num: "02",
    icon: "⭐",
    title: "RATE IT",
    desc: "Half-star ratings 0.5 to 5. Rate the game as a spectacle — the tension, the quality, the occasion. Not just whether your team won.",
  },
  {
    num: "03",
    icon: "📋",
    title: "LIST IT",
    desc: "Build lists. Every Clasico you've seen. Greatest comebacks. Games that broke your heart. Rank them. Share them. Own them.",
  },
];

export function Features() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 px-6 md:px-10 max-w-[1180px] mx-auto">
      <p className="font-mono text-[0.65rem] tracking-[0.22em] uppercase text-green flex items-center gap-3 mb-4">
        How it works
        <span className="w-10 h-px bg-green opacity-40" />
      </p>
      <h2 className="font-display text-[clamp(2.6rem,4.5vw,4rem)] leading-[0.96] tracking-[0.03em] mb-14">
        THREE THINGS.
        <br />
        THAT&apos;S IT.
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border rounded-section overflow-hidden">
        {FEATURES.map((f) => (
          <div
            key={f.num}
            className="bg-surface p-8 md:py-8 md:px-7 hover:bg-[#141414] transition-colors"
          >
            <div className="font-display text-6xl leading-none text-border2 mb-3">{f.num}</div>
            <div className="text-xl mb-3.5">{f.icon}</div>
            <div className="font-display text-2xl tracking-wide text-white mb-2.5">{f.title}</div>
            <p className="text-[0.82rem] leading-[1.65] text-muted">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
