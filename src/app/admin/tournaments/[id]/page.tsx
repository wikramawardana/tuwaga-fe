import TournamentControlRoom from "@/components/admin/TournamentControlRoom";

export default async function AdminTournamentPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return <TournamentControlRoom tournamentId={id} />;
}
