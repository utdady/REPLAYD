import { notFound } from "next/navigation";
import Link from "next/link";
import { SectionEyebrow } from "@/components/layout/section-eyebrow";
import { MatchPoster } from "@/components/match/match-poster";

const TABS = [
  { slug: "matches", label: "Matches" },
  { slug: "reviews", label: "Reviews" },
  { slug: "lists", label: "Lists" },
];

async function getProfile(username: string) {
  if (!username) return null;
  return {
    username,
    bio: "Football fan. Premier League & UCL.",
    avatarUrl: null as string | null,
    stats: { matchesLogged: 42, avgRating: 4.2, favouriteCompetition: "EPL" },
  };
}

async function getRecentLogs(_username: string) {
  return [
    { id: "m1", competition: "EPL", home: { name: "Arsenal", crest: "🔴" }, away: { name: "Chelsea", crest: "🔵" }, homeScore: 2, awayScore: 1 },
  ];
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const recentLogs = await getRecentLogs(username);

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <header className="py-8 border-b border-border">
          <div className="flex items-center gap-4">
            <span
              className="w-20 h-20 rounded-full bg-green-dim bg-cover bg-center shrink-0"
              style={{ backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : undefined }}
              aria-hidden
            />
            <div>
              <h1 className="font-display text-2xl tracking-wide text-white">{profile.username}</h1>
              {profile.bio ? <p className="text-sm text-muted mt-1">{profile.bio}</p> : null}
              <div className="flex gap-4 mt-2 text-xs font-mono text-muted">
                <span>{profile.stats.matchesLogged} logged</span>
                <span>Ø {profile.stats.avgRating}</span>
                <span>{profile.stats.favouriteCompetition}</span>
              </div>
            </div>
          </div>
        </header>

        <nav className="flex items-center gap-6 border-b border-border py-2 mt-4">
          {TABS.map((tab) => (
            <Link
              key={tab.slug}
              href={`/users/${username}?tab=${tab.slug}`}
              className="text-sm font-sans font-medium pb-2 border-b-2 border-transparent text-muted2 hover:text-white"
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <section className="py-8">
          <SectionEyebrow>Recent</SectionEyebrow>
          <h2 className="font-display text-2xl tracking-wide mt-2 mb-4">MATCHES</h2>
          <div className="flex flex-wrap gap-4">
            {recentLogs.map((m) => (
              <MatchPoster
                key={m.id}
                id={m.id}
                competition={m.competition}
                home={m.home}
                away={m.away}
                homeScore={m.homeScore}
                awayScore={m.awayScore}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
