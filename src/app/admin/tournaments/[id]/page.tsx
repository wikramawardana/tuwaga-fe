import TournamentControlRoom from "@/components/admin/TournamentControlRoom";
import { adminTournaments } from "@/lib/adminTournaments";

export function generateStaticParams() {
  return adminTournaments.map((tournament) => ({ id: tournament.id }));
}

export default async function AdminTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TournamentControlRoom tournamentId={id} />;
}
