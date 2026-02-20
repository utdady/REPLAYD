import { notFound } from "next/navigation";
import Link from "next/link";
import { MatchPoster } from "@/components/match/match-poster";

async function getList(id: string) {
  if (!id) return null;
  return {
    id,
    title: "Best UCL nights",
    description: "My favourite Champions League games this season.",
    creator: { username: "footy_fan" },
    ranked: true,
  };
}

async function getListItems(_listId: string) {
  return [
    { position: 1, matchId: "m1", competition: "UCL", home: { name: "Real Madrid", crest: "⚪" }, away: { name: "Bayern", crest: "🔴" }, homeScore: 2, awayScore: 1 },
    { position: 2, matchId: "m2", competition: "UCL", home: { name: "Inter", crest: "🔵" }, away: { name: "Atlético", crest: "🔴" }, homeScore: 1, awayScore: 0 },
  ];
}

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const list = await getList(id);
  if (!list) notFound();

  const items = await getListItems(id);

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <header className="py-6 border-b border-border">
          <h1 className="font-display text-2xl md:text-3xl tracking-wide text-white">{list.title}</h1>
          {list.description ? (
            <p className="text-sm text-muted mt-2">{list.description}</p>
          ) : null}
          <p className="text-xs font-mono text-muted2 mt-2">
            by <Link href={`/users/${list.creator.username}`} className="text-green hover:underline">{list.creator.username}</Link>
          </p>
        </header>

        <section className="py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.matchId} className="relative">
                {list.ranked && (
                  <span className="absolute top-0 left-0 z-10 w-6 h-6 flex items-center justify-center rounded-badge bg-surface3 text-xs font-mono text-muted">
                    {item.position}
                  </span>
                )}
                <MatchPoster
                  id={item.matchId}
                  competition={item.competition}
                  home={item.home}
                  away={item.away}
                  homeScore={item.homeScore}
                  awayScore={item.awayScore}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
