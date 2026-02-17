const COMPS = [
  { flag: "🏴", name: "Premier League", sub: "380 matches · 20 clubs" },
  { flag: "🇪🇸", name: "La Liga", sub: "380 matches · 20 clubs" },
  { flag: "🇩🇪", name: "Bundesliga", sub: "306 matches · 18 clubs" },
  { flag: "🇮🇹", name: "Serie A", sub: "380 matches · 20 clubs" },
  { flag: "🇫🇷", name: "Ligue 1", sub: "306 matches · 18 clubs" },
  { flag: "⭐", name: "Champions League", sub: "189 matches · Group + KO" },
];

export function Competitions() {
  return (
    <section className="bg-surface border-y border-border py-16 md:py-20 px-6 md:px-10">
      <div className="max-w-[1180px] mx-auto">
        <p className="font-mono text-[0.65rem] tracking-[0.22em] uppercase text-green flex items-center gap-3 mb-4">
          Coverage
          <span className="w-10 h-px bg-green opacity-40" />
        </p>
        <h2 className="font-display text-[clamp(2.6rem,4.5vw,4rem)] leading-[0.96] tracking-[0.03em] mb-12">
          SIX COMPETITIONS.
          <br />
          EVERY MATCH.
          <br />
          2024/25.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border rounded-section overflow-hidden">
          {COMPS.map((c) => (
            <div
              key={c.name}
              className="bg-surface p-5 md:p-6 flex items-center gap-3.5 hover:bg-[#141414] transition-colors"
            >
              <span className="text-2xl">{c.flag}</span>
              <div>
                <div className="text-sm font-medium text-white">{c.name}</div>
                <div className="font-mono text-[0.58rem] text-muted tracking-wide mt-0.5">{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
