import { Suspense } from "react";
import TournamentDisplay from "@/components/TournamentDisplay";

export default async function TournamentDisplayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={null}>
      <TournamentDisplay slug={slug} />
    </Suspense>
  );
}
