import type { LiveTeam } from "@/lib/tuwagaApi";

type ScoreCardProps = {
  courtLabel?: string;
  setInfo?: string;
  status?: "live" | "scheduled" | "completed";
  teamA: LiveTeam;
  teamB: LiveTeam;
  scoreSets?: Array<{ teamA: number; teamB: number }>;
};

function aggregateScore(scores: number[]) {
  return scores.reduce((a, b) => a + b, 0);
}

function SetScoreRow({
  sets,
  teamIndex,
}: {
  sets: Array<{ teamA: number; teamB: number }>;
  teamIndex: "teamA" | "teamB";
}) {
  if (sets.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sets.map((set) => (
        <span
          key={`${set.teamA}-${set.teamB}`}
          className={`inline-flex h-7 min-w-10 items-center justify-center rounded-md px-2 text-xs font-bold tabular-nums ${
            set[teamIndex] > set[teamIndex === "teamA" ? "teamB" : "teamA"]
              ? "bg-emerald-600/10 text-emerald-600"
              : "bg-ink-200 text-ink-600"
          }`}
        >
          {set[teamIndex]}-{set[teamIndex === "teamA" ? "teamB" : "teamA"]}
        </span>
      ))}
    </div>
  );
}

export default function ScoreCard({
  courtLabel,
  setInfo,
  status,
  teamA,
  teamB,
  scoreSets,
}: ScoreCardProps) {
  const totalA = aggregateScore(teamA.scores);
  const totalB = aggregateScore(teamB.scores);
  const isLive = status === "live";
  const sets = scoreSets ?? [];

  return (
    <article className="relative overflow-hidden rounded-xl border border-ink-300/30 bg-white p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] sm:p-6">
      {isLive && (
        <div className="admin-live-sweep absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-amber-300 to-rose-500" />
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {courtLabel && (
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
              {courtLabel}
            </p>
          )}
          {setInfo && (
            <p className="mt-1 text-sm font-semibold text-ink-600">{setInfo}</p>
          )}
        </div>
        {isLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold uppercase text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        )}
        {status === "completed" && (
          <span className="rounded-full bg-ink-200 px-3 py-1 text-xs font-bold uppercase text-ink-600">
            Final
          </span>
        )}
      </div>

      {/* Main score — big centered */}
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-5">
        <div className="text-right">
          <p className="text-5xl font-extrabold leading-none tabular-nums text-ink-950 sm:text-6xl md:text-7xl">
            {totalA > 0 ? totalA : "–"}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold uppercase tracking-widest text-ink-600">
            vs
          </span>
        </div>
        <div className="text-left">
          <p className="text-5xl font-extrabold leading-none tabular-nums text-ink-950 sm:text-6xl md:text-7xl">
            {totalB > 0 ? totalB : "–"}
          </p>
        </div>
      </div>

      {/* Pair details with set scores */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {/* Team A */}
        <div className="rounded-lg bg-ink-100 p-3">
          <p className="break-words text-base font-extrabold text-ink-950 sm:text-lg">
            {teamA.player1}
          </p>
          <p className="mt-0.5 break-words text-sm text-ink-600">
            {teamA.player2}
          </p>
          <SetScoreRow sets={sets} teamIndex="teamA" />
        </div>

        {/* Team B */}
        <div className="rounded-lg bg-ink-100 p-3">
          <p className="break-words text-base font-extrabold text-ink-950 sm:text-lg">
            {teamB.player1}
          </p>
          <p className="mt-0.5 break-words text-sm text-ink-600">
            {teamB.player2}
          </p>
          <SetScoreRow sets={sets} teamIndex="teamB" />
        </div>
      </div>
    </article>
  );
}
