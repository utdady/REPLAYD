import { notFound } from "next/navigation";
import Link from "next/link";
import { getMatchById } from "@/app/actions/match";
import { LogMatchForm } from "./log-match-form";

export default async function MatchLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const matchTitle = `${match.home_team_name} vs ${match.away_team_name}`;

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <Link href={`/matches/${id}`} className="inline-flex items-center gap-2 text-sm font-mono text-muted hover:text-white mb-6">
          <span aria-hidden>←</span>
          Back to match
        </Link>
        <h1 className="font-display text-2xl tracking-wide mb-2">Log this game</h1>
        <p className="text-sm text-muted mb-8">{matchTitle}</p>
        <LogMatchForm matchId={match.id} matchIdStr={id} />
      </div>
    </div>
  );
}
