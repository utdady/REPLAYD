"use client";

const COMP_CHIPS = ["All", "EPL", "UCL", "La Liga", "BL", "Serie A", "L1"];
const DATE_DAYS = [
  { dow: "Mon", num: "13" },
  { dow: "Tue", num: "14" },
  { dow: "Wed", num: "15" },
  { dow: "Thu", num: "16", active: true },
  { dow: "Fri", num: "17" },
  { dow: "Sat", num: "18" },
  { dow: "Sun", num: "19" },
];
const TABS = [
  { label: "Games", active: true },
  { label: "Reviews", active: false },
  { label: "Lists", active: false },
  { label: "Journal", active: false },
];

export function PhoneMockup() {
  return (
    <div
      className="relative w-[var(--phone-w)] max-w-[320px]"
      style={{
        filter: "drop-shadow(0 40px 80px rgba(0,0,0,.8)) drop-shadow(0 0 1px rgba(61,220,132,.15))",
      }}
    >
      {/* Glow behind phone */}
      <div
        className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-[260px] h-[200px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(61,220,132,.18) 0%, transparent 70%)",
        }}
      />
      <div className="w-full bg-[#101010] rounded-[36px] border border-border2 overflow-hidden relative flex flex-col min-h-[var(--phone-h)] max-h-[640px]" style={{ height: "var(--phone-h)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-[#101010] rounded-b-2xl z-10" />
        <div className="flex flex-col flex-1 overflow-hidden bg-[#0d0d0d]">
          {/* App top bar */}
          <div className="pt-9 px-4 pb-2.5 flex items-center justify-between flex-shrink-0">
            <div className="font-display text-[1.3rem] tracking-[0.15em] text-green">
              REPLAY<span className="text-white">D</span>
            </div>
            <div className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-surface3 flex items-center justify-center text-[0.7rem] text-muted">🔍</span>
              <span className="w-7 h-7 rounded-full bg-surface3 flex items-center justify-center text-[0.7rem] text-muted">🔔</span>
            </div>
          </div>
          {/* Tab bar */}
          <div className="flex items-center px-4 border-b border-border flex-shrink-0">
            {TABS.map((tab) => (
              <span
                key={tab.label}
                className={`text-[0.7rem] font-medium py-2.5 px-3.5 whitespace-nowrap relative ${
                  tab.active ? "text-white" : "text-muted2"
                }`}
              >
                {tab.label}
                {tab.active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green" />
                )}
              </span>
            ))}
          </div>
          {/* Comp chips */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-hide flex-shrink-0">
            {COMP_CHIPS.map((c, i) => (
              <span
                key={c}
                className={`shrink-0 text-[0.62rem] font-medium tracking-wider py-1.5 px-2.5 rounded-pill border transition-colors ${
                  i === 0 ? "bg-green-dim text-green border-green/20" : "bg-surface3 text-muted border-transparent"
                }`}
              >
                {c}
              </span>
            ))}
          </div>
          {/* Date strip */}
          <div className="flex gap-0 px-4 pb-2.5 overflow-x-auto scrollbar-hide flex-shrink-0">
            {DATE_DAYS.map((d) => (
              <span
                key={d.dow}
                className={`shrink-0 flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-md min-w-[36px] ${
                  d.active ? "bg-green-dim" : ""
                }`}
              >
                <span className={`font-mono text-[0.52rem] tracking-wider ${d.active ? "text-green" : "text-muted2"}`}>{d.dow}</span>
                <span className={`text-[0.72rem] font-semibold ${d.active ? "text-green" : "text-muted"}`}>{d.num}</span>
              </span>
            ))}
          </div>
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
            {/* Today's matches */}
            <div className="px-4 pb-1">
              <div className="flex items-center justify-between py-2.5 pb-2">
                <span className="text-[0.72rem] font-semibold text-white">Today&apos;s Games</span>
                <span className="text-[0.62rem] text-muted2">All ›</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="bg-surface2 rounded-card p-3.5 border border-border">
                  <div className="flex justify-between mb-2.5">
                    <span className="font-mono text-[0.52rem] tracking-wider uppercase text-green bg-green-dim px-2 py-0.5 rounded-badge">UCL · QF</span>
                    <span className="font-mono text-[0.58rem] text-red">● LIVE 67&apos;</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-[22px] h-[22px] rounded-full bg-surface3 flex items-center justify-center text-[0.75rem]">⚫</span>
                      <span className="text-[0.68rem] font-medium text-white truncate">Real Madrid</span>
                    </div>
                    <span className="font-display text-[1.2rem] tracking-wide text-white">3 – 2</span>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[0.68rem] font-medium text-white truncate">Man City</span>
                      <span className="w-[22px] h-[22px] rounded-full bg-surface3 flex items-center justify-center text-[0.75rem]">🔵</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface2 rounded-card p-3.5 border border-border">
                  <div className="flex justify-between mb-2.5">
                    <span className="font-mono text-[0.52rem] tracking-wider uppercase text-green bg-green-dim px-2 py-0.5 rounded-badge">UCL · QF</span>
                    <span className="font-mono text-[0.58rem] text-muted">21:00</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-[22px] h-[22px] rounded-full bg-surface3 flex items-center justify-center text-[0.75rem]">🔴</span>
                      <span className="text-[0.68rem] font-medium text-white truncate">Arsenal</span>
                    </div>
                    <span className="font-mono text-[0.68rem] text-muted">vs</span>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[0.68rem] font-medium text-white truncate">PSG</span>
                      <span className="w-[22px] h-[22px] rounded-full bg-surface3 flex items-center justify-center text-[0.75rem]">🔵</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface2 rounded-card p-3.5 border border-border">
                  <div className="flex justify-between mb-2.5">
                    <span className="font-mono text-[0.52rem] tracking-wider uppercase text-green bg-green-dim px-2 py-0.5 rounded-badge">EPL · MD31</span>
                    <span className="font-mono text-[0.58rem] text-muted">FINAL</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-[22px] h-[22px] rounded-full bg-surface3 flex items-center justify-center text-[0.75rem]">🔴</span>
                      <span className="text-[0.68rem] font-medium text-white truncate">Liverpool</span>
                    </div>
                    <span className="font-display text-[1.2rem] tracking-wide text-white">2 – 1</span>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[0.68rem] font-medium text-white truncate">Chelsea</span>
                      <span className="w-[22px] h-[22px] rounded-full bg-surface3 flex items-center justify-center text-[0.75rem]">🔵</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-px bg-border mx-4 my-1" />
            {/* Popular this week */}
            <div className="py-3 pb-1">
              <div className="flex justify-between px-4 pb-2">
                <span className="text-[0.72rem] font-semibold text-white">Popular this week</span>
                <span className="text-[0.62rem] text-muted2">See all ›</span>
              </div>
              <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
                {[
                  { crests: ["⚫", "🔵"], score: "3–2", comp: "UCL", title: "Madrid v City" },
                  { crests: ["🔴", "🟡"], score: "3–2", comp: "EPL", title: "Liverpool v BVB" },
                  { crests: ["🔵", "🟡"], score: "4–0", comp: "LL", title: "Barca v Vila" },
                  { crests: ["⚫", "🔴"], score: "1–2", comp: "BL", title: "BVB v B04" },
                ].map((p) => (
                  <div key={p.title} className="shrink-0 w-[90px]">
                    <div className="w-[90px] h-14 rounded-md bg-surface3 border border-border flex flex-col items-center justify-center gap-0.5 relative">
                      <div className="flex items-center gap-1">
                        <span className="text-[0.95rem]">{p.crests[0]}</span>
                        <span className="font-display text-[0.9rem] text-white">{p.score}</span>
                        <span className="text-[0.95rem]">{p.crests[1]}</span>
                      </div>
                      <span className="absolute bottom-0.5 left-1 font-mono text-[0.42rem] tracking-wider text-green uppercase">{p.comp}</span>
                    </div>
                    <p className="text-[0.58rem] text-muted text-center mt-1 truncate">{p.title}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* New from friends */}
            <div className="py-3 pb-1">
              <div className="flex justify-between px-4 pb-2">
                <span className="text-[0.72rem] font-semibold text-white">New from friends</span>
                <span className="text-[0.62rem] text-muted2">See all ›</span>
              </div>
              <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
                {[
                  { crests: ["⚫", "🔵"], score: "3–2", comp: "UCL", title: "Madrid v City", user: "jreidinho" },
                  { crests: ["🔴", "⚪"], score: "2–0", comp: "SA", title: "Napoli v Milan", user: "adriannn" },
                  { crests: ["🔵", "🔵"], score: "5–1", comp: "L1", title: "PSG v Lyon", user: "tina_lfc" },
                ].map((p) => (
                  <div key={p.title + p.user} className="shrink-0 w-[90px]">
                    <div className="w-[90px] h-14 rounded-md bg-surface3 border border-border flex flex-col items-center justify-center gap-0.5 relative">
                      <div className="flex items-center gap-1">
                        <span className="text-[0.95rem]">{p.crests[0]}</span>
                        <span className="font-display text-[0.9rem] text-white">{p.score}</span>
                        <span className="text-[0.95rem]">{p.crests[1]}</span>
                      </div>
                      <span className="absolute bottom-0.5 left-1 font-mono text-[0.42rem] tracking-wider text-green uppercase">{p.comp}</span>
                    </div>
                    <p className="text-[0.58rem] text-muted text-center mt-1 truncate">{p.title}</p>
                    <div className="flex items-center gap-1 mt-1 justify-center">
                      <span className="w-3 h-3 rounded-full bg-green-dim border border-green/20 flex items-center justify-center text-[0.4rem] text-green flex-shrink-0">{p.user[0]}</span>
                      <span className="text-[0.5rem] text-muted2 truncate max-w-[60px]">{p.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Bottom nav */}
          <div className="flex items-center justify-around py-3.5 pb-5 pt-2 bg-surface border-t border-border flex-shrink-0">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-base opacity-100">⚽</span>
              <span className="text-[0.46rem] tracking-wider text-green">Games</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-base opacity-40">🔍</span>
              <span className="text-[0.46rem] tracking-wider text-muted2">Search</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-green flex items-center justify-center text-black font-bold text-lg -mt-1.5" style={{ boxShadow: "0 0 20px rgba(61,220,132,.35)" }}>+</div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-base opacity-40">👥</span>
              <span className="text-[0.46rem] tracking-wider text-muted2">Community</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-base opacity-40">👤</span>
              <span className="text-[0.46rem] tracking-wider text-muted2">Profile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
