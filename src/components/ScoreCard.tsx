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
          className={`inline-flex h-7 min-w-10 items-center justify-center rounded-md border px-2 text-xs font-bold tabular-nums ${
            set[teamIndex] > set[teamIndex === "teamA" ? "teamB" : "teamA"]
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-[#e6e3da] bg-white text-slate-600"
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
    <article className="relative overflow-hidden rounded-2xl border border-[#e6e3da] bg-white p-4 shadow-sm sm:p-6">
      {isLive && (
        <div className="admin-live-sweep absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-amber-300 to-rose-500" />
      )}
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
        <div className="rounded-xl border border-[#f0ede6] bg-[#faf9f6] p-3">
          <p className="break-words text-base font-bold text-[#0c0d11]">
            {teamA.player1}
          </p>
          <p className="mt-0.5 break-words text-xs font-medium text-slate-500">
            {teamA.player2}
          </p>
          <SetScoreRow sets={sets} teamIndex="teamA" />
        </div>

        {/* Team B */}
        <div className="rounded-xl border border-[#f0ede6] bg-[#faf9f6] p-3">
          <p className="break-words text-base font-bold text-[#0c0d11]">
            {teamB.player1}
          </p>
          <p className="mt-0.5 break-words text-xs font-medium text-slate-500">
            {teamB.player2}
          </p>
          <SetScoreRow sets={sets} teamIndex="teamB" />
        </div>
      </div>
    </article>
  );
}
