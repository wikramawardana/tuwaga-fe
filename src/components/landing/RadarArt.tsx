/**
 * Hero line art: courts plotted on a radar, after the brand's
 * "interface reference" boards (thin rings, crosshair, mono labels).
 * Purely decorative.
 */
const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
const round = (value: number) => Math.round(value * 100) / 100;

const courts = [
  { x: 150, y: 214, label: "COURT 01", live: false },
  { x: 628, y: 612, label: "COURT 03", live: false },
  { x: 236, y: 700, label: "COURT 04", live: false },
];

export default function RadarArt({
  className = "",
  showCourts = true,
}: {
  className?: string;
  showCourts?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 800 800"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id="radar-sweep"
          x1="400"
          y1="400"
          x2="520"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#e06d30" stopOpacity="0" />
          <stop offset="1" stopColor="#e06d30" stopOpacity="0.22" />
        </linearGradient>
        <radialGradient id="radar-fade" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="radar-mask">
          <rect width="800" height="800" fill="url(#radar-fade)" />
        </mask>
      </defs>

      <g mask="url(#radar-mask)" stroke="#eddebd">
        {[70, 150, 230, 310, 385].map((r) => (
          <circle key={r} cx="400" cy="400" r={r} strokeOpacity="0.1" />
        ))}
        <circle
          cx="400"
          cy="400"
          r="270"
          strokeOpacity="0.22"
          strokeDasharray="2 9"
        />
        <line x1="0" y1="400" x2="800" y2="400" strokeOpacity="0.08" />
        <line x1="400" y1="0" x2="400" y2="800" strokeOpacity="0.08" />
        <line
          x1="117"
          y1="117"
          x2="683"
          y2="683"
          strokeOpacity="0.05"
          strokeDasharray="4 8"
        />
        {ticks.map((deg) => {
          const long = deg % 45 === 0;
          const rad = (deg * Math.PI) / 180;
          const r1 = 310;
          const r2 = long ? 330 : 318;
          return (
            <line
              key={deg}
              x1={round(400 + r1 * Math.cos(rad))}
              y1={round(400 + r1 * Math.sin(rad))}
              x2={round(400 + r2 * Math.cos(rad))}
              y2={round(400 + r2 * Math.sin(rad))}
              strokeOpacity={long ? 0.4 : 0.16}
            />
          );
        })}
      </g>

      <g mask="url(#radar-mask)">
        <g className="radar-sweep">
          <path
            d="M400 400 L400 30 A370 370 0 0 1 612 97 Z"
            fill="url(#radar-sweep)"
          />
          <line
            x1="400"
            y1="400"
            x2="612"
            y2="97"
            stroke="#e06d30"
            strokeOpacity="0.5"
          />
        </g>
      </g>

      {showCourts &&
        courts.map((court) => (
          <g key={court.label}>
            {court.live && (
              <circle
                cx={court.x}
                cy={court.y}
                r="16"
                stroke="#e06d30"
                strokeOpacity="0.55"
              />
            )}
            <rect
              x={court.x - 9}
              y={court.y - 5}
              width="18"
              height="10"
              rx="1.5"
              stroke={court.live ? "#e06d30" : "#eddebd"}
              strokeOpacity={court.live ? 1 : 0.45}
            />
            <line
              x1={court.x}
              y1={court.y - 5}
              x2={court.x}
              y2={court.y + 5}
              stroke={court.live ? "#e06d30" : "#eddebd"}
              strokeOpacity={court.live ? 1 : 0.45}
            />
            <text
              x={court.x + 24}
              y={court.y + 4}
              fill="#eddebd"
              fillOpacity={court.live ? 0.8 : 0.4}
              fontSize="11"
              letterSpacing="1.6"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {court.label}
            </text>
          </g>
        ))}
    </svg>
  );
}
