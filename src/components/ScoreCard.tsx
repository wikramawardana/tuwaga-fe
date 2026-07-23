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
      {sets.map((set, i) => (
        <span
          key={i}
          className={`inline-flex h-6 min-w-[36px] items-center justify-center rounded px-1.5 text-xs font-bold ${
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
    <article className="rounded-xl border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
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
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="text-right">
          <p className="text-4xl font-extrabold tabular-nums text-on-surface md:text-5xl">
            {totalA > 0 ? totalA : "–"}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            vs
          </span>
        </div>
        <div className="text-left">
          <p className="text-4xl font-extrabold tabular-nums text-on-surface md:text-5xl">
            {totalB > 0 ? totalB : "–"}
          </p>
        </div>
      </div>

      {/* Pair details with set scores */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        {/* Team A */}
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-sm font-extrabold text-on-surface">
            {teamA.player1}
          </p>
          <p className="text-xs text-on-surface-variant">{teamA.player2}</p>
          <SetScoreRow sets={sets} teamIndex="teamA" />
        </div>

        {/* Team B */}
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-sm font-extrabold text-on-surface">
            {teamB.player1}
          </p>
          <p className="text-xs text-on-surface-variant">{teamB.player2}</p>
          <SetScoreRow sets={sets} teamIndex="teamB" />
        </div>
      </div>
    </article>
  );
}
