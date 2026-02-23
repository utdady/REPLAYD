import { notFound } from "next/navigation";
import Link from "next/link";
import { getListById, getListItems } from "@/app/actions/list";
import { MatchPoster } from "@/components/match/match-poster";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const list = await getListById(id);
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
            by{" "}
            <Link href={`/users/${list.creator_username}`} className="text-green hover:underline">
              {list.creator_username}
            </Link>
          </p>
        </header>

        <section className="py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="relative">
                {list.is_ranked && item.position != null && (
                  <span className="absolute top-0 left-0 z-10 w-6 h-6 flex items-center justify-center rounded-badge bg-surface3 text-xs font-mono text-muted">
                    {item.position}
                  </span>
                )}
                <MatchPoster
                  id={String(item.match_id)}
                  competition={item.competition_name}
                  home={{ name: item.home_team_name, crest: item.home_crest_url }}
                  away={{ name: item.away_team_name, crest: item.away_crest_url }}
                  homeScore={item.home_score}
                  awayScore={item.away_score}
                />
              </div>
            ))}
          </div>
          {items.length === 0 && (
            <p className="text-sm text-muted">This list is empty.</p>
          )}
        </section>
      </div>
    </div>
  );
}
