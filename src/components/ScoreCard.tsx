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
    <div className="mt-2 flex flex-wrap gap-1">
      {sets.map((set) => (
        <span
          key={`${set.teamA}-${set.teamB}`}
          className={`inline-flex h-8 min-w-12 items-center justify-center rounded-md px-2 text-sm font-extrabold tabular-nums ${
            set[teamIndex] > set[teamIndex === "teamA" ? "teamB" : "teamA"]
              ? "bg-secondary/10 text-secondary"
              : "bg-surface-container text-on-surface-variant"
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
    <article className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {courtLabel && (
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              {courtLabel}
            </p>
          )}
          {setInfo && (
            <p className="mt-1 text-sm font-semibold text-on-surface-variant">
              {setInfo}
            </p>
          )}
        </div>
        {isLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-error px-3 py-1 text-xs font-bold uppercase text-on-error">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-error" />
            Live
          </span>
        )}
        {status === "completed" && (
          <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold uppercase text-on-surface-variant">
            Final
          </span>
        )}
      </div>

      {/* Main score — big centered */}
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-5">
        <div className="text-right">
          <p className="text-5xl font-extrabold leading-none tabular-nums text-on-surface sm:text-6xl md:text-7xl">
            {totalA > 0 ? totalA : "–"}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
            vs
          </span>
        </div>
        <div className="text-left">
          <p className="text-5xl font-extrabold leading-none tabular-nums text-on-surface sm:text-6xl md:text-7xl">
            {totalB > 0 ? totalB : "–"}
          </p>
        </div>
      </div>

      {/* Pair details with set scores */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {/* Team A */}
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="break-words text-base font-extrabold text-on-surface sm:text-lg">
            {teamA.player1}
          </p>
          <p className="mt-0.5 break-words text-sm text-on-surface-variant">
            {teamA.player2}
          </p>
          <SetScoreRow sets={sets} teamIndex="teamA" />
        </div>

        {/* Team B */}
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="break-words text-base font-extrabold text-on-surface sm:text-lg">
            {teamB.player1}
          </p>
          <p className="mt-0.5 break-words text-sm text-on-surface-variant">
            {teamB.player2}
          </p>
          <SetScoreRow sets={sets} teamIndex="teamB" />
        </div>
      </div>
    </article>
  );
}
