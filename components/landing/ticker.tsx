const TICKER_ITEMS = [
  { comp: "EPL", text: "Liverpool", score: "3–2", vs: "Chelsea" },
  { comp: "UCL", text: "Madrid", score: "3–2", vs: "Man City" },
  { comp: "LL", text: "Barcelona", score: "4–0", vs: "Villarreal" },
  { comp: "BL", text: "Dortmund", score: "1–2", vs: "Leverkusen" },
  { comp: "SA", text: "Napoli", score: "2–0", vs: "AC Milan" },
  { comp: "L1", text: "PSG", score: "5–1", vs: "Lyon" },
  { comp: "UCL", text: "Arsenal", score: "2–1", vs: "PSG" },
  { comp: "EPL", text: "Arsenal", score: "3–1", vs: "Tottenham" },
];

export function Ticker() {
  const duplicated = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="bg-surface border-y border-border py-2.5 overflow-hidden">
      <div className="flex gap-10 animate-ticker">
        {duplicated.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <span className="font-mono text-[0.65rem] tracking-wide text-muted flex items-center gap-2.5">
              <span className="text-green text-[0.58rem]">{item.comp}</span>
              {item.text}{" "}
              <span className="text-white font-medium">{item.score}</span> {item.vs}
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-border2 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
