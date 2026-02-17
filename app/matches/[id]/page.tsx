import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MatchScore } from "@/components/match/match-score";
import { Button } from "@/components/ui/button";
import { LogFeedItem } from "@/components/feed/log-feed-item";

// Placeholder — replace with DB lookup by id
async function getMatch(id: string) {
  if (!id) return null;
  return {
    id,
    competition: "EPL",
    home: { id: "t1", name: "Arsenal", crest: "🔴" },
    away: { id: "t2", name: "Chelsea", crest: "🔵" },
    homeScore: 2,
    awayScore: 1,
    date: "2025-02-15T15:00:00Z",
  };
}

async function getLogs(_matchId: string) {
  return [
    { id: "log1", username: "footy_fan", avatarUrl: null, rating: 4.5, reviewSnippet: "Great game, Saka was on fire.", matchId: "m1", logId: "log1" },
  ];
}

const TABS = [
  { slug: "overview", label: "Overview" },
  { slug: "logs", label: "Logs" },
  { slug: "reviews", label: "Reviews" },
];

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  const logs = await getLogs(id);
  const matchTitle = `${match.home.name} vs ${match.away.name}`;

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        {/* Match header */}
        <header className="py-6 border-b border-border">
          <Badge className="mb-3">{match.competition}</Badge>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="text-center">
              <span className="text-2xl" aria-hidden>{match.home.crest}</span>
              <p className="font-sans font-medium mt-1">{match.home.name}</p>
            </div>
            <MatchScore home={match.homeScore} away={match.awayScore} />
            <div className="text-center">
              <span className="text-2xl" aria-hidden>{match.away.crest}</span>
              <p className="font-sans font-medium mt-1">{match.away.name}</p>
            </div>
          </div>
          <p className="text-sm font-mono text-muted mt-2">
            {new Date(match.date).toLocaleDateString("en-GB", { dateStyle: "long" })}
          </p>
        </header>

        {/* Tab bar */}
        <nav className="flex items-center gap-6 border-b border-border py-2 -mb-px">
          {TABS.map((tab) => (
            <Link
              key={tab.slug}
              href={`/matches/${id}?tab=${tab.slug}`}
              className="text-sm font-sans font-medium pb-2 border-b-2 border-transparent text-muted2 hover:text-white data-[active]:text-white data-[active]:border-green"
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Community logs */}
        <section className="py-6">
          <h3 className="text-sm font-semibold mb-4">Community logs</h3>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted">No logs yet. Be the first to log this match.</p>
            ) : (
              logs.map((log) => (
                <LogFeedItem
                  key={log.id}
                  username={log.username}
                  avatarUrl={log.avatarUrl}
                  rating={log.rating}
                  reviewSnippet={log.reviewSnippet}
                  matchTitle={matchTitle}
                  matchId={id}
                  logId={log.logId}
                />
              ))
            )}
          </div>
        </section>

        {/* Sticky CTA */}
        <div className="fixed bottom-20 md:bottom-6 left-0 right-0 max-w-2xl mx-auto px-4 z-40">
          <Link href={`/matches/${id}/log`} className="block">
            <Button variant="primary" className="w-full py-3">
              Log this match
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
