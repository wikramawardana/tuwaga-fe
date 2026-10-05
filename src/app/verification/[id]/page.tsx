import VerificationWorkspace from "@/components/verification/VerificationWorkspace";

export default async function TournamentVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VerificationWorkspace tournamentId={id} />;
}
