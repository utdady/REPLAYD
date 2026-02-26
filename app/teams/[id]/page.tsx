import { notFound } from "next/navigation";
import { getTeamById, getTeamSeasons, isTeamFavorited } from "@/app/actions/team";
import { TeamPageClient } from "@/components/team/team-page-client";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const team = await getTeamById(id);
  if (!team) notFound();

  const teamId = team.id as number;
  const [seasons, favorited] = await Promise.all([
    getTeamSeasons(teamId),
    isTeamFavorited(teamId),
  ]);
  const initialSeason = seasons.length > 0 ? seasons[0] : new Date().getFullYear();

  return (
    <TeamPageClient
      team={team}
      teamId={teamId}
      seasons={seasons}
      initialSeason={initialSeason}
      initialFavorited={favorited}
    />
  );
}
