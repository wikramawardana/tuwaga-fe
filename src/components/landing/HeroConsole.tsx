/**
 * Product visual for the hero: a live padel scoreboard as it appears in the
 * public display, plus two floating status cards. Static sample data.
 */
const sets = [
  { id: "s1", a: 6, b: 3 },
  { id: "s2", a: 4, b: 6 },
  { id: "s3", a: 3, b: 2 },
];

const teams = [
  { key: "a", name: "Rizky / Fajar", seed: 1, points: "40", serving: true },
  { key: "b", name: "Dimas / Bagas", seed: 4, points: "30", serving: false },
] as const;

// Last points of the current set: true = team A won the rally.
const rallies = [
  true,
  false,
  true,
  true,
  false,
  false,
  true,
  false,
  true,
  true,
  false,
  true,
  true,
  false,
  true,
  true,
];

const grid =
  "grid grid-cols-[minmax(0,1fr)_repeat(3,1.75rem)_2.75rem] gap-x-1 sm:grid-cols-[minmax(0,1fr)_repeat(3,2.25rem)_3.75rem]";

export default function HeroConsole() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="relative overflow-hidden rounded-2xl border border-cream-200/15 bg-ink-900/85 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <div className="texture-halftone pointer-events-none absolute inset-x-0 top-0 h-28 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" />

        <div className="relative flex items-center justify-between gap-3 border-b border-cream-200/10 px-4 py-3.5 sm:px-5">
          <span className="eyebrow flex items-center gap-2.5 text-cream-100">
            <span className="live-dot" />
            Live · Court 02
          </span>
          <span className="eyebrow truncate text-cream-100/45">
            Padel · Mens Open
          </span>
        </div>

        <div
          className={`${grid} eyebrow items-center px-4 pb-1 pt-4 text-[10px] text-cream-100/35 sm:px-5`}
        >
          <span>Quarter final</span>
          <span className="text-center">S1</span>
          <span className="text-center">S2</span>
          <span className="text-center">S3</span>
          <span className="text-right">Pts</span>
        </div>

        {teams.map((team, index) => (
          <div
            key={team.key}
            className={`${grid} items-center px-4 py-3.5 sm:px-5 ${index > 0 ? "border-t border-cream-200/[0.07]" : ""}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  team.serving
                    ? "bg-brand-500 shadow-[0_0_0_4px_rgba(224,109,48,0.18)]"
                    : "bg-cream-200/10"
                }`}
                title={team.serving ? "Serving" : undefined}
              />
              <p className="truncate text-sm font-semibold text-cream-50 sm:text-[15px]">
                {team.name}
              </p>
              <span className="hidden shrink-0 rounded border border-cream-200/15 px-1 font-mono text-[10px] text-cream-100/45 sm:inline">
                {team.seed}
              </span>
            </div>
            {sets.map((set, setIndex) => {
              const games = team.key === "a" ? set.a : set.b;
              const other = team.key === "a" ? set.b : set.a;
              const isCurrent = setIndex === sets.length - 1;
              return (
                <span
                  key={set.id}
                  className={`rounded-md py-1 text-center font-mono text-base tabular-nums sm:text-lg ${
                    isCurrent
                      ? "bg-cream-200/[0.07] text-cream-50"
                      : games > other
                        ? "text-cream-50"
                        : "text-cream-100/35"
                  }`}
                >
                  {games}
                </span>
              );
            })}
            <span
              className={`text-right font-mono text-[26px] leading-none tabular-nums sm:text-[32px] ${
                team.serving ? "text-brand-500" : "text-cream-50"
              }`}
            >
              {team.points}
            </span>
          </div>
        ))}

        <div className="flex h-12 items-end gap-[3px] border-t border-cream-200/10 px-5 pb-3 pt-3">
          {rallies.map((wonByA, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: static decorative sequence
              key={index}
              className={`flex-1 rounded-sm ${wonByA ? "h-full bg-brand-500/80" : "h-1/2 bg-cream-200/20"}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-cream-200/10 px-5 py-3">
          <span className="eyebrow text-[10px] text-cream-100/45">
            Set 3 · Game 6
          </span>
          <span className="eyebrow rounded-full border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 text-[10px] text-brand-400">
            Golden point
          </span>
          <span className="font-mono text-xs tabular-nums text-cream-100/55">
            01:12:40
          </span>
        </div>
      </div>

      <div className="motion-float absolute -bottom-24 -left-10 hidden w-56 rounded-xl border border-cream-200/15 bg-ink-950/90 p-4 shadow-2xl backdrop-blur md:block">
        <p className="eyebrow text-[10px] text-cream-100/45">Next · Court 01</p>
        <p className="mt-2 font-mono text-2xl tabular-nums text-cream-50">
          10:20
        </p>
        <p className="mt-1 text-xs text-cream-100/60">
          Upper beginner women · Semi final
        </p>
      </div>

      <div className="motion-float motion-float-delay absolute -right-6 -top-[6.75rem] hidden rounded-xl border border-cream-200/15 bg-ink-950/90 p-3.5 shadow-2xl backdrop-blur md:block">
        <svg
          viewBox="0 0 132 64"
          className="h-16 w-32"
          fill="none"
          aria-hidden="true"
        >
          <g stroke="#eddebd" strokeOpacity="0.3" strokeWidth="1.25">
            <path d="M2 6h30v14H2M2 44h30v14H2" />
            <path d="M32 13h14v18h18M32 51h14V33" />
          </g>
          <g stroke="#e06d30" strokeWidth="1.5">
            <path d="M46 31h18v-19h22M64 31v20h22" strokeOpacity="0.45" />
            <path d="M86 12h14v19h30" />
          </g>
          <circle cx="130" cy="31" r="2" fill="#e06d30" />
        </svg>
        <p className="eyebrow mt-2 text-[10px] text-cream-100/70">
          Final ready
        </p>
      </div>
    </div>
  );
}
