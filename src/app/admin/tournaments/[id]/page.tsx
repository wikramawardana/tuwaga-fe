import { Suspense } from "react";
import TournamentControlRoom from "@/components/admin/TournamentControlRoom";

export default async function AdminTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      }
    >
      <TournamentControlRoom tournamentId={id} />
    </Suspense>
  );
}
