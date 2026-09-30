import { MinusIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";

/*
 * Miniature product UIs for the "How it works" steps. They mirror the real
 * referee workspace, venue display, and knockout bracket screens.
 */

export function RefereeVisual() {
  const sides = [
    { name: "Team A", score: 5, accent: true },
    { name: "Team B", score: 3, accent: false },
  ];
  return (
    <div className="grid h-full grid-cols-2 gap-2.5 p-4">
      {sides.map((side) => (
        <div
          key={side.name}
          className="flex flex-col justify-between rounded-lg border border-cream-200/10 bg-ink-900 p-3"
        >
          <span className="eyebrow text-[10px] text-cream-100/45">
            {side.name}
          </span>
          <span
            className={`font-mono text-5xl leading-none tabular-nums ${side.accent ? "text-brand-500" : "text-cream-50"}`}
          >
            {side.score}
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <span className="flex h-8 items-center justify-center rounded-md border border-cream-200/15 text-cream-100/60">
              <MinusIcon weight="bold" aria-hidden="true" />
            </span>
            <span
              className={`flex h-8 items-center justify-center rounded-md ${side.accent ? "bg-brand-500 text-ink-950" : "bg-cream-200/10 text-cream-50"}`}
            >
              <PlusIcon weight="bold" aria-hidden="true" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LiveBoardVisual() {
  const rows = [
    { court: "01", name: "Nadia / Sekar", score: "6 2", live: false },
    { court: "02", name: "Rizky / Fajar", score: "6 4 3", live: true },
    { court: "03", name: "Final · 14:00", score: "—", live: false },
  ];
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-[10px] text-cream-100/45">
          Venue display
        </span>
        <span className="eyebrow flex items-center gap-1.5 text-[10px] text-brand-400">
          <span className="live-dot" />
          Live
        </span>
      </div>
      <div className="mt-3 flex flex-1 flex-col justify-center gap-1.5">
        {rows.map((row) => (
          <div
            key={row.court}
            className={`flex items-center gap-3 rounded-md px-3 py-2 ${row.live ? "bg-brand-500 text-ink-950" : "bg-ink-900 text-cream-100"}`}
          >
            <span
              className={`font-mono text-[10px] ${row.live ? "text-ink-950/60" : "text-cream-100/40"}`}
            >
              CT {row.court}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-semibold">
              {row.name}
            </span>
            <span className="font-mono text-xs tabular-nums">{row.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BracketVisual() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <svg
        viewBox="0 0 260 150"
        className="h-full max-h-40 w-full"
        fill="none"
        aria-hidden="true"
      >
        <g
          fill="#eddebd"
          fillOpacity="0.08"
          stroke="#eddebd"
          strokeOpacity="0.2"
        >
          <rect x="4" y="8" width="64" height="20" rx="4" />
          <rect x="4" y="44" width="64" height="20" rx="4" />
          <rect x="4" y="86" width="64" height="20" rx="4" />
          <rect x="4" y="122" width="64" height="20" rx="4" />
          <rect x="98" y="26" width="64" height="20" rx="4" />
          <rect x="98" y="104" width="64" height="20" rx="4" />
        </g>
        <g stroke="#eddebd" strokeOpacity="0.25" strokeWidth="1.25">
          <path d="M68 18h15v18h15M68 54h15V36" />
          <path d="M68 96h15v18h15M68 132h15v-18" />
          <path d="M162 114h18V75" />
        </g>
        <g stroke="#e06d30" strokeWidth="1.75">
          <path d="M162 36h18v39h12" />
        </g>
        <rect x="192" y="64" width="64" height="22" rx="4" fill="#e06d30" />
        <g fill="#171717" fillOpacity="0.7">
          <rect x="200" y="72" width="30" height="6" rx="3" />
        </g>
        <g fill="#eddebd" fillOpacity="0.45">
          <rect x="12" y="15" width="34" height="6" rx="3" />
          <rect x="106" y="33" width="38" height="6" rx="3" />
          <rect x="12" y="51" width="26" height="6" rx="3" />
          <rect x="12" y="93" width="30" height="6" rx="3" />
          <rect x="12" y="129" width="36" height="6" rx="3" />
          <rect x="106" y="111" width="30" height="6" rx="3" />
        </g>
      </svg>
    </div>
  );
}
