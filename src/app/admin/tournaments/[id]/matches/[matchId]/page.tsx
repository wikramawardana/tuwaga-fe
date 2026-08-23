import MatchScoringWorkspace from "@/components/admin/MatchScoringWorkspace";

export default async function MatchScoringPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { id, matchId } = await params;
  return <MatchScoringWorkspace tournamentId={id} matchId={matchId} />;
}
