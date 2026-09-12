import type { Match } from "@/lib/tuwagaApi";

export type ParticipantInfo = {
  name: string;
  club?: string;
  rating?: string;
};

export function parseParticipantLabel(raw?: string | null): ParticipantInfo {
  if (!raw || raw.trim() === "" || raw.toUpperCase() === "TBD") {
    return { name: "TBD", club: "", rating: "" };
  }
  const text = raw.trim();
  const match = text.match(/^(.*?)(?:\s*\((.*?)\))?(?:\s*\[?(\d+)\]?)?$/);
  if (match) {
    return {
      name: (match[1] || "").trim() || text,
      club: (match[2] || "").trim(),
      rating: (match[3] || "").trim(),
    };
  }
  return { name: text, club: "", rating: "" };
}

export type BaganSlideData = {
  division: string;
  title: string;
  subtitle: string;
  slideIndex: number;
  totalSlides: number;
  roundLabels: [string, string, string, string, string];
  seeds: Array<{
    seedNumber: number;
    name: string;
    club?: string;
    rating?: string;
  }>;
  prelimMatches: (Match | undefined)[];
  round2Matches: (Match | undefined)[];
  round3Matches: (Match | undefined)[];
  round4Matches: (Match | undefined)[];
  round5Match: Match | undefined;
  isFinalRound?: boolean;
};

export function buildBaganSlides(matches: Match[]): BaganSlideData[] {
  const mById = new Map(matches.map((m) => [m.id, m]));
  const get = (id: string) => mById.get(id);

  // --- SLIDE 1: Divisi 4 & 5 (Bagan 1 / Top Half: Seeds 1 to 20) ---
  const p1Prelims = [
    get("fing-fong-folk-series-ii-M-K1"),
    get("fing-fong-folk-series-ii-M-K2"),
    get("fing-fong-folk-series-ii-M-K3"),
    get("fing-fong-folk-series-ii-M-K4"),
  ];
  const p1R2 = [
    get("fing-fong-folk-series-ii-M-K9"),
    get("fing-fong-folk-series-ii-M-K10"),
    get("fing-fong-folk-series-ii-M-K11"),
    get("fing-fong-folk-series-ii-M-K12"),
    get("fing-fong-folk-series-ii-M-K13"),
    get("fing-fong-folk-series-ii-M-K14"),
    get("fing-fong-folk-series-ii-M-K15"),
    get("fing-fong-folk-series-ii-M-K16"),
  ];
  const p1R3 = [
    get("fing-fong-folk-series-ii-M-K25"),
    get("fing-fong-folk-series-ii-M-K26"),
    get("fing-fong-folk-series-ii-M-K27"),
    get("fing-fong-folk-series-ii-M-K28"),
  ];
  const p1R4 = [
    get("fing-fong-folk-series-ii-M-K33"),
    get("fing-fong-folk-series-ii-M-K34"),
  ];
  const p1R5 = get("fing-fong-folk-series-ii-M-K37");

  const rawSeedsP1 = [
    p1R2[0]?.teamAName || "ANDRE (STRIA) 4",
    p1Prelims[0]?.teamAName || "NICHO (FOLKAF) 5",
    p1Prelims[0]?.teamBName || "AFIF (NIRWANA) 4",
    p1R2[1]?.teamAName || "INDRA (MS) 4",
    p1R2[1]?.teamBName || "ANTOK (GOTRO) 4",
    p1R2[2]?.teamAName || "BENJIRO (TOHO) 4",
    p1R2[2]?.teamBName || "LUTFI (FOLKAF) 5",
    p1Prelims[1]?.teamAName || "ROFIQ (SANSPORT) 5",
    p1Prelims[1]?.teamBName || "MASROKAN (BATMAN) 5",
    p1R2[3]?.teamBName || "ANGPO (BENDLI) 5",
    p1R2[4]?.teamAName || "ISJA (BENDLI) 4",
    p1Prelims[2]?.teamAName || "SAKTI (X JAJAR) 5",
    p1Prelims[2]?.teamBName || "JUNED (TJI) 5",
    p1R2[5]?.teamAName || "IKA (SATRIA) 4",
    p1R2[5]?.teamBName || "YUKA (GAZGAZ) 5",
    p1R2[6]?.teamAName || "DAFA (SANSPORT) 5",
    p1R2[6]?.teamBName || "KIKI (SPINLAB) 4",
    p1Prelims[3]?.teamAName || "ARIF (TJI) 4",
    p1Prelims[3]?.teamBName || "BIMA (DTTC) 4",
    p1R2[7]?.teamBName || "BILAL (MS) 4",
  ];

  const seedsP1 = rawSeedsP1.map((raw, idx) => {
    const parsed = parseParticipantLabel(raw);
    return {
      seedNumber: idx + 1,
      name: parsed.name,
      club: parsed.club,
      rating: parsed.rating,
    };
  });

  const slide1: BaganSlideData = {
    division: "Divisi 4 & 5",
    title: "DIVISI 4 & 5 · BAGAN 1",
    subtitle: "BAGIAN ATAS (SEEDS 1–20) · SEMARANG, 13 SEPTEMBER 2026",
    slideIndex: 0,
    totalSlides: 3,
    roundLabels: [
      "Babak Kualifikasi",
      "32 Besar",
      "16 Besar",
      "Perempat Final",
      "Semifinal 1",
    ],
    seeds: seedsP1,
    prelimMatches: p1Prelims,
    round2Matches: p1R2,
    round3Matches: p1R3,
    round4Matches: p1R4,
    round5Match: p1R5,
    isFinalRound: false,
  };

  // --- SLIDE 2: Divisi 4 & 5 (Bagan 2 / Bottom Half: Seeds 21 to 40) ---
  const p2Prelims = [
    get("fing-fong-folk-series-ii-M-K5"),
    get("fing-fong-folk-series-ii-M-K6"),
    get("fing-fong-folk-series-ii-M-K7"),
    get("fing-fong-folk-series-ii-M-K8"),
  ];
  const p2R2 = [
    get("fing-fong-folk-series-ii-M-K17"),
    get("fing-fong-folk-series-ii-M-K18"),
    get("fing-fong-folk-series-ii-M-K19"),
    get("fing-fong-folk-series-ii-M-K20"),
    get("fing-fong-folk-series-ii-M-K21"),
    get("fing-fong-folk-series-ii-M-K22"),
    get("fing-fong-folk-series-ii-M-K23"),
    get("fing-fong-folk-series-ii-M-K24"),
  ];
  const p2R3 = [
    get("fing-fong-folk-series-ii-M-K29"),
    get("fing-fong-folk-series-ii-M-K30"),
    get("fing-fong-folk-series-ii-M-K31"),
    get("fing-fong-folk-series-ii-M-K32"),
  ];
  const p2R4 = [
    get("fing-fong-folk-series-ii-M-K35"),
    get("fing-fong-folk-series-ii-M-K36"),
  ];
  const p2R5 = get("fing-fong-folk-series-ii-M-K38");

  const rawSeedsP2 = [
    p2R2[0]?.teamAName || "VINO (X JAJAR) 4",
    p2Prelims[0]?.teamAName || "GOPREK (NIRWANA) 5",
    p2Prelims[0]?.teamBName || "AJI (MS) 4",
    p2R2[1]?.teamAName || "YUDA (SPINS) 4",
    p2R2[1]?.teamBName || "RIZIQ (SANSPORT) 5",
    p2R2[2]?.teamAName || "FEBY (BENDLI) 5",
    p2R2[2]?.teamBName || "BAMBANG (DTTC) 5",
    p2Prelims[1]?.teamAName || "MASRU (PSR) 5",
    p2Prelims[1]?.teamBName || "RISKI (MAHARDIKA) 5",
    p2R2[3]?.teamBName || "CAHYO (SATRIA) 4",
    p2R2[4]?.teamAName || "JALIL (MBEJI) 4",
    p2Prelims[2]?.teamAName || "RIFKI (SPINS) 4",
    p2Prelims[2]?.teamBName || "SENO (KAULA) 5",
    p2R2[5]?.teamAName || "ROLAND (BENDLI) 5",
    p2R2[5]?.teamBName || "IRFAN (MS) 4",
    p2R2[6]?.teamAName || "RIFAL (SPINS) 5",
    p2R2[6]?.teamBName || "HENDRA (FOLKA) 5",
    p2Prelims[3]?.teamAName || "RAHARJO (AGUNG MOTOR) 5",
    p2Prelims[3]?.teamBName || "ABIDIN (BINTORO) 5",
    p2R2[7]?.teamBName || "PRIYONO (BSM) 4",
  ];

  const seedsP2 = rawSeedsP2.map((raw, idx) => {
    const parsed = parseParticipantLabel(raw);
    return {
      seedNumber: 20 + idx + 1,
      name: parsed.name,
      club: parsed.club,
      rating: parsed.rating,
    };
  });

  const slide2: BaganSlideData = {
    division: "Divisi 4 & 5",
    title: "DIVISI 4 & 5 · BAGAN 2",
    subtitle: "BAGIAN BAWAH (SEEDS 21–40) · SEMARANG, 13 SEPTEMBER 2026",
    slideIndex: 1,
    totalSlides: 3,
    roundLabels: [
      "Babak Kualifikasi",
      "32 Besar",
      "16 Besar",
      "Perempat Final",
      "Semifinal 2",
    ],
    seeds: seedsP2,
    prelimMatches: p2Prelims,
    round2Matches: p2R2,
    round3Matches: p2R3,
    round4Matches: p2R4,
    round5Match: p2R5,
    isFinalRound: false,
  };

  // --- SLIDE 3: Divisi 2 & 3 (Bagan Penuh: Seeds 1 to 20) ---
  const p3Prelims = [
    get("fing-fong-folk-series-ii-M-K40"),
    get("fing-fong-folk-series-ii-M-K41"),
    get("fing-fong-folk-series-ii-M-K42"),
    get("fing-fong-folk-series-ii-M-K43"),
  ];
  const p3R2 = [
    get("fing-fong-folk-series-ii-M-K44"),
    get("fing-fong-folk-series-ii-M-K45"),
    get("fing-fong-folk-series-ii-M-K46"),
    get("fing-fong-folk-series-ii-M-K47"),
    get("fing-fong-folk-series-ii-M-K48"),
    get("fing-fong-folk-series-ii-M-K49"),
    get("fing-fong-folk-series-ii-M-K50"),
    get("fing-fong-folk-series-ii-M-K51"),
  ];
  const p3R3 = [
    get("fing-fong-folk-series-ii-M-K52"),
    get("fing-fong-folk-series-ii-M-K53"),
    get("fing-fong-folk-series-ii-M-K54"),
    get("fing-fong-folk-series-ii-M-K55"),
  ];
  const p3R4 = [
    get("fing-fong-folk-series-ii-M-K56"),
    get("fing-fong-folk-series-ii-M-K57"),
  ];
  const p3R5 = get("fing-fong-folk-series-ii-M-K58");

  const rawSeedsP3 = [
    p3R2[0]?.teamAName || "IQBAL (GAZGAZ) 2",
    p3Prelims[0]?.teamAName || "DONAN (SATRIA) 3",
    p3Prelims[0]?.teamBName || "PANJI (BSM) 3",
    p3R2[1]?.teamAName || "SHEILO (SS DEMAK) 3",
    p3R2[1]?.teamBName || "HABIB (SAINSPORT) 3",
    p3R2[2]?.teamAName || "SAHURI (TJI) 3",
    p3R2[2]?.teamBName || "NOPEK (DTTC) 3",
    p3Prelims[1]?.teamAName || "USAMA (GAZGAZ) 2",
    p3Prelims[1]?.teamBName || "ANDI (SS DEMAK) 3",
    p3R2[3]?.teamBName || "RAGIL (VICTORY) 2",
    p3R2[4]?.teamAName || "YANUAR (PASER BENDLI) 2",
    p3Prelims[2]?.teamAName || "AFRIZAL (TJI) 3",
    p3Prelims[2]?.teamBName || "CIPUT (KUDUS) 3",
    p3R2[5]?.teamAName || "TONO (GAZGAZ) 3",
    p3R2[5]?.teamBName || "ANTOK (GOTRO) 3",
    p3R2[6]?.teamAName || "MULYADI (TJI) 3",
    p3R2[6]?.teamBName || "KEVIN (SATRIA) 3",
    p3Prelims[3]?.teamAName || "RENDY (DTTC) 3",
    p3Prelims[3]?.teamBName || "ALDIN (NIRWANA) 3",
    p3R2[7]?.teamBName || "AKBAR (GAZGAZ) 2",
  ];

  const seedsP3 = rawSeedsP3.map((raw, idx) => {
    const parsed = parseParticipantLabel(raw);
    return {
      seedNumber: idx + 1,
      name: parsed.name,
      club: parsed.club,
      rating: parsed.rating,
    };
  });

  const slide3: BaganSlideData = {
    division: "Divisi 2 & 3",
    title: "DIVISI 2 & 3 · BAGAN LENGKAP",
    subtitle: "BAGAN UTAMA (SEEDS 1–20) · SEMARANG, 13 SEPTEMBER 2026",
    slideIndex: 2,
    totalSlides: 3,
    roundLabels: [
      "Babak Kualifikasi",
      "16 Besar",
      "Perempat Final",
      "Semifinal",
      "Grand Final",
    ],
    seeds: seedsP3,
    prelimMatches: p3Prelims,
    round2Matches: p3R2,
    round3Matches: p3R3,
    round4Matches: p3R4,
    round5Match: p3R5,
    isFinalRound: true,
  };

  return [slide1, slide2, slide3];
}

export function KnockoutBaganTree({
  slide,
}: {
  slide: BaganSlideData;
  matchesById?: Map<string, Match>;
  championTeamId?: string | null;
}) {
  const {
    title,
    subtitle,
    slideIndex,
    totalSlides,
    roundLabels,
    seeds,
    prelimMatches,
    round2Matches,
    round3Matches,
    round4Matches,
    round5Match,
    isFinalRound,
  } = slide;

  // Geometry calculations for 1320x760 SVG view
  const SVG_W = 1320;
  const SVG_H = 750;
  const TOP_Y = 56;
  const USABLE_H = SVG_H - TOP_Y - 24;
  const TRACK_STEP = USABLE_H / 19.0; // 20 tracks: 0 to 19

  const trackY = (idx: number) => TOP_Y + idx * TRACK_STEP;

  // Column boundaries
  const C0_X = 14;
  const C0_W = 236; // Entrants
  const C1_FORK_X = 320; // Prelim fork
  const C2_X = 416; // Round 2 line
  const C2_FORK_X = 490;
  const C3_X = 636;
  const C3_FORK_X = 710;
  const C4_X = 866;
  const C4_FORK_X = 940;
  const C5_X = 1096;
  const C5_FINISH_X = 1190;

  // Center Y for each round
  // Prelims (Column 1)
  const yP0 = (trackY(1) + trackY(2)) / 2;
  const yP1 = (trackY(7) + trackY(8)) / 2;
  const yP2 = (trackY(11) + trackY(12)) / 2;
  const yP3 = (trackY(17) + trackY(18)) / 2;

  // Round 2 (Column 2) - 8 matches
  const yR0 = (trackY(0) + trackY(2)) / 2;
  const yR1 = (trackY(3) + trackY(4)) / 2;
  const yR2 = (trackY(5) + trackY(6)) / 2;
  const yR3 = (trackY(7) + trackY(9)) / 2;
  const yR4 = (trackY(10) + trackY(12)) / 2;
  const yR5 = (trackY(13) + trackY(14)) / 2;
  const yR6 = (trackY(15) + trackY(16)) / 2;
  const yR7 = (trackY(17) + trackY(19)) / 2;

  // Round 3 (Column 3) - 4 matches
  const yQ0 = (yR0 + yR1) / 2;
  const yQ1 = (yR2 + yR3) / 2;
  const yQ2 = (yR4 + yR5) / 2;
  const yQ3 = (yR6 + yR7) / 2;

  // Round 4 (Column 4) - 2 matches
  const yS0 = (yQ0 + yQ1) / 2;
  const yS1 = (yQ2 + yQ3) / 2;

  // Round 5 (Column 5) - 1 match
  const yF0 = (yS0 + yS1) / 2;

  // Render match badge helper
  const renderMatchBadge = (
    match: Match | undefined,
    cx: number,
    cy: number,
    labelFallback?: string,
  ) => {
    const live = match?.status === "live";
    const completed = match?.status === "completed";
    const score = match?.score;
    const time = match?.time;

    return (
      <g
        transform={`translate(${cx - 34}, ${cy - 12})`}
        className="pointer-events-none select-none"
      >
        <rect
          width="68"
          height="24"
          rx="5"
          fill={live ? "#fee2e2" : completed ? "#f1f5f9" : "#ffffff"}
          stroke={live ? "#ef4444" : completed ? "#cbd5e1" : "#94a3b8"}
          strokeWidth="1.2"
        />
        <text
          x="34"
          y="15"
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill={live ? "#b91c1c" : completed ? "#0f172a" : "#1e40af"}
        >
          {live
            ? "● Live"
            : completed && score
              ? score
              : time
                ? time
                : labelFallback || "—"}
        </text>
      </g>
    );
  };

  return (
    <section className="display-scene-enter flex flex-col justify-between">
      {/* Slide Top Bar */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-blue-900">
            <span className="material-symbols-outlined text-sm text-blue-700">
              account_tree
            </span>
            Scene 03 · Knockout Bagan
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            {title}
          </h2>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-blue-900/20 bg-[#071c4d] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-xs">
            Slide {slideIndex + 1} / {totalSlides}
          </span>
        </div>
      </div>

      {/* SVG Canvas Bagan Tree */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white p-2 shadow-sm">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="h-auto w-full"
          style={{ maxHeight: "calc(100vh - 210px)" }}
          role="img"
          aria-label={title}
        >
          <title>{title}</title>
          {/* Column Headers */}
          <g className="font-extrabold uppercase tracking-wider text-slate-700">
            <text
              x="130"
              y="24"
              textAnchor="middle"
              fontSize="12"
              fill="#0f172a"
            >
              Peserta
            </text>
            <text
              x={C1_FORK_X}
              y="24"
              textAnchor="middle"
              fontSize="11"
              fill="#475569"
            >
              {roundLabels[0]}
            </text>
            <text
              x={C2_FORK_X}
              y="24"
              textAnchor="middle"
              fontSize="11"
              fill="#475569"
            >
              {roundLabels[1]}
            </text>
            <text
              x={C3_FORK_X}
              y="24"
              textAnchor="middle"
              fontSize="11"
              fill="#475569"
            >
              {roundLabels[2]}
            </text>
            <text
              x={C4_FORK_X}
              y="24"
              textAnchor="middle"
              fontSize="11"
              fill="#475569"
            >
              {roundLabels[3]}
            </text>
            <text
              x={C5_FINISH_X}
              y="24"
              textAnchor="middle"
              fontSize="11"
              fill="#1e40af"
            >
              {roundLabels[4]}
            </text>
          </g>

          {/* Grid lines background for crisp tournament aesthetic */}
          <line
            x1="10"
            y1="34"
            x2={SVG_W - 10}
            y2="34"
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {/* ================= COLUMN 0: 20 ENTRANT SEEDS ================= */}
          {seeds.map((s, idx) => {
            const y = trackY(idx);
            return (
              <g key={`seed-${s.seedNumber}-${idx}`}>
                {/* Entrant Container Card */}
                <rect
                  x={C0_X}
                  y={y - 13}
                  width={C0_W}
                  height="26"
                  rx="4"
                  fill="#f8fafc"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                {/* Seed Number Badge */}
                <rect
                  x={C0_X + 2}
                  y={y - 11}
                  width="22"
                  height="22"
                  rx="3"
                  fill="#071c4d"
                />
                <text
                  x={C0_X + 13}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="900"
                  fill="#ffffff"
                >
                  {s.seedNumber}
                </text>
                {/* Name */}
                <text
                  x={C0_X + 28}
                  y={y + 3.5}
                  fontSize="11"
                  fontWeight="800"
                  fill="#0f172a"
                >
                  {s.name}
                </text>
                {/* Club Pill */}
                {s.club && (
                  <text
                    x={C0_X + 172}
                    y={y + 3.5}
                    fontSize="9.5"
                    fontWeight="600"
                    fill="#64748b"
                    textAnchor="end"
                  >
                    ({s.club})
                  </text>
                )}
                {/* Rating Badge */}
                {s.rating && (
                  <g>
                    <rect
                      x={C0_X + C0_W - 24}
                      y={y - 8}
                      width="18"
                      height="16"
                      rx="3"
                      fill="#e0e7ff"
                    />
                    <text
                      x={C0_X + C0_W - 15}
                      y={y + 3.5}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="800"
                      fill="#3730a3"
                    >
                      {s.rating}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ================= CONNECTORS: COLUMN 0 TO COLUMN 1 / 2 ================= */}
          {/* Seed 1 (track 0) directly to R0 */}
          <line
            x1={C0_X + C0_W}
            y1={trackY(0)}
            x2={C2_X}
            y2={trackY(0)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />

          {/* Prelim 0 (tracks 1 & 2) */}
          <line
            x1={C0_X + C0_W}
            y1={trackY(1)}
            x2={C1_FORK_X}
            y2={trackY(1)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C0_X + C0_W}
            y1={trackY(2)}
            x2={C1_FORK_X}
            y2={trackY(2)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X}
            y1={trackY(1)}
            x2={C1_FORK_X}
            y2={trackY(2)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {/* Stem of P0 goes to track 2 of R0 */}
          <line
            x1={C1_FORK_X}
            y1={yP0}
            x2={C1_FORK_X + 24}
            y2={yP0}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X + 24}
            y1={yP0}
            x2={C1_FORK_X + 24}
            y2={trackY(2)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X + 24}
            y1={trackY(2)}
            x2={C2_X}
            y2={trackY(2)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(prelimMatches[0], C1_FORK_X - 6, yP0, "09:00")}

          {/* Seeds 4, 5, 6, 7 go straight to C2 */}
          <line
            x1={C0_X + C0_W}
            y1={trackY(3)}
            x2={C2_X}
            y2={trackY(3)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C0_X + C0_W}
            y1={trackY(4)}
            x2={C2_X}
            y2={trackY(4)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C0_X + C0_W}
            y1={trackY(5)}
            x2={C2_X}
            y2={trackY(5)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C0_X + C0_W}
            y1={trackY(6)}
            x2={C2_X}
            y2={trackY(6)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />

          {/* Prelim 1 (tracks 7 & 8) -> feeds into R3 top (track 7) */}
          <line
            x1={C0_X + C0_W}
            y1={trackY(7)}
            x2={C1_FORK_X}
            y2={trackY(7)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C0_X + C0_W}
            y1={trackY(8)}
            x2={C1_FORK_X}
            y2={trackY(8)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X}
            y1={trackY(7)}
            x2={C1_FORK_X}
            y2={trackY(8)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X}
            y1={yP1}
            x2={C1_FORK_X + 24}
            y2={yP1}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X + 24}
            y1={yP1}
            x2={C1_FORK_X + 24}
            y2={trackY(7)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X + 24}
            y1={trackY(7)}
            x2={C2_X}
            y2={trackY(7)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(prelimMatches[1], C1_FORK_X - 6, yP1, "09:20")}

          {/* Seed 10 (track 9) goes straight to C2 */}
          <line
            x1={C0_X + C0_W}
            y1={trackY(9)}
            x2={C2_X}
            y2={trackY(9)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />

          {/* Seed 11 (track 10) goes straight to C2 */}
          <line
            x1={C0_X + C0_W}
            y1={trackY(10)}
            x2={C2_X}
            y2={trackY(10)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />

          {/* Prelim 2 (tracks 11 & 12) -> feeds into R4 bottom (track 12) */}
          <line
            x1={C0_X + C0_W}
            y1={trackY(11)}
            x2={C1_FORK_X}
            y2={trackY(11)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C0_X + C0_W}
            y1={trackY(12)}
            x2={C1_FORK_X}
            y2={trackY(12)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X}
            y1={trackY(11)}
            x2={C1_FORK_X}
            y2={trackY(12)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X}
            y1={yP2}
            x2={C1_FORK_X + 24}
            y2={yP2}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X + 24}
            y1={yP2}
            x2={C1_FORK_X + 24}
            y2={trackY(12)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X + 24}
            y1={trackY(12)}
            x2={C2_X}
            y2={trackY(12)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(prelimMatches[2], C1_FORK_X - 6, yP2, "10:00")}

          {/* Seeds 14, 15, 16, 17 straight to C2 */}
          <line
            x1={C0_X + C0_W}
            y1={trackY(13)}
            x2={C2_X}
            y2={trackY(13)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C0_X + C0_W}
            y1={trackY(14)}
            x2={C2_X}
            y2={trackY(14)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C0_X + C0_W}
            y1={trackY(15)}
            x2={C2_X}
            y2={trackY(15)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C0_X + C0_W}
            y1={trackY(16)}
            x2={C2_X}
            y2={trackY(16)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />

          {/* Prelim 3 (tracks 17 & 18) -> feeds into R7 top (track 17) */}
          <line
            x1={C0_X + C0_W}
            y1={trackY(17)}
            x2={C1_FORK_X}
            y2={trackY(17)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C0_X + C0_W}
            y1={trackY(18)}
            x2={C1_FORK_X}
            y2={trackY(18)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X}
            y1={trackY(17)}
            x2={C1_FORK_X}
            y2={trackY(18)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X}
            y1={yP3}
            x2={C1_FORK_X + 24}
            y2={yP3}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X + 24}
            y1={yP3}
            x2={C1_FORK_X + 24}
            y2={trackY(17)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C1_FORK_X + 24}
            y1={trackY(17)}
            x2={C2_X}
            y2={trackY(17)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(prelimMatches[3], C1_FORK_X - 6, yP3, "10:20")}

          {/* Seed 20 (track 19) straight to C2 */}
          <line
            x1={C0_X + C0_W}
            y1={trackY(19)}
            x2={C2_X}
            y2={trackY(19)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />

          {/* ================= COLUMN 2: ROUND OF 32 / 16 (8 MATCHES) ================= */}
          {/* R0 (track 0 & 2) */}
          <line
            x1={C2_X}
            y1={trackY(0)}
            x2={C2_FORK_X}
            y2={trackY(0)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_X}
            y1={trackY(2)}
            x2={C2_FORK_X}
            y2={trackY(2)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={trackY(0)}
            x2={C2_FORK_X}
            y2={trackY(2)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={yR0}
            x2={C3_X}
            y2={yR0}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round2Matches[0], C2_FORK_X - 10, yR0, "13:20")}

          {/* R1 (track 3 & 4) */}
          <line
            x1={C2_X}
            y1={trackY(3)}
            x2={C2_FORK_X}
            y2={trackY(3)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_X}
            y1={trackY(4)}
            x2={C2_FORK_X}
            y2={trackY(4)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={trackY(3)}
            x2={C2_FORK_X}
            y2={trackY(4)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={yR1}
            x2={C3_X}
            y2={yR1}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round2Matches[1], C2_FORK_X - 10, yR1, "11:00")}

          {/* R2 (track 5 & 6) */}
          <line
            x1={C2_X}
            y1={trackY(5)}
            x2={C2_FORK_X}
            y2={trackY(5)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_X}
            y1={trackY(6)}
            x2={C2_FORK_X}
            y2={trackY(6)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={trackY(5)}
            x2={C2_FORK_X}
            y2={trackY(6)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={yR2}
            x2={C3_X}
            y2={yR2}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round2Matches[2], C2_FORK_X - 10, yR2, "11:20")}

          {/* R3 (track 7 & 9) */}
          <line
            x1={C2_X}
            y1={trackY(7)}
            x2={C2_FORK_X}
            y2={trackY(7)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_X}
            y1={trackY(9)}
            x2={C2_FORK_X}
            y2={trackY(9)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={trackY(7)}
            x2={C2_FORK_X}
            y2={trackY(9)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={yR3}
            x2={C3_X}
            y2={yR3}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round2Matches[3], C2_FORK_X - 10, yR3, "13:40")}

          {/* R4 (track 10 & 12) */}
          <line
            x1={C2_X}
            y1={trackY(10)}
            x2={C2_FORK_X}
            y2={trackY(10)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_X}
            y1={trackY(12)}
            x2={C2_FORK_X}
            y2={trackY(12)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={trackY(10)}
            x2={C2_FORK_X}
            y2={trackY(12)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={yR4}
            x2={C3_X}
            y2={yR4}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round2Matches[4], C2_FORK_X - 10, yR4, "14:20")}

          {/* R5 (track 13 & 14) */}
          <line
            x1={C2_X}
            y1={trackY(13)}
            x2={C2_FORK_X}
            y2={trackY(13)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_X}
            y1={trackY(14)}
            x2={C2_FORK_X}
            y2={trackY(14)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={trackY(13)}
            x2={C2_FORK_X}
            y2={trackY(14)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={yR5}
            x2={C3_X}
            y2={yR5}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round2Matches[5], C2_FORK_X - 10, yR5, "12:00")}

          {/* R6 (track 15 & 16) */}
          <line
            x1={C2_X}
            y1={trackY(15)}
            x2={C2_FORK_X}
            y2={trackY(15)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_X}
            y1={trackY(16)}
            x2={C2_FORK_X}
            y2={trackY(16)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={trackY(15)}
            x2={C2_FORK_X}
            y2={trackY(16)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={yR6}
            x2={C3_X}
            y2={yR6}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round2Matches[6], C2_FORK_X - 10, yR6, "12:20")}

          {/* R7 (track 17 & 19) */}
          <line
            x1={C2_X}
            y1={trackY(17)}
            x2={C2_FORK_X}
            y2={trackY(17)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_X}
            y1={trackY(19)}
            x2={C2_FORK_X}
            y2={trackY(19)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={trackY(17)}
            x2={C2_FORK_X}
            y2={trackY(19)}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C2_FORK_X}
            y1={yR7}
            x2={C3_X}
            y2={yR7}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round2Matches[7], C2_FORK_X - 10, yR7, "14:40")}

          {/* ================= COLUMN 3: ROUND OF 16 / QF (4 MATCHES) ================= */}
          {/* Q0 (yR0 & yR1) */}
          <line
            x1={C3_X}
            y1={yR0}
            x2={C3_FORK_X}
            y2={yR0}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C3_X}
            y1={yR1}
            x2={C3_FORK_X}
            y2={yR1}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C3_FORK_X}
            y1={yR0}
            x2={C3_FORK_X}
            y2={yR1}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C3_FORK_X}
            y1={yQ0}
            x2={C4_X}
            y2={yQ0}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round3Matches[0], C3_FORK_X - 10, yQ0, "15:20")}

          {/* Q1 (yR2 & yR3) */}
          <line
            x1={C3_X}
            y1={yR2}
            x2={C3_FORK_X}
            y2={yR2}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C3_X}
            y1={yR3}
            x2={C3_FORK_X}
            y2={yR3}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C3_FORK_X}
            y1={yR2}
            x2={C3_FORK_X}
            y2={yR3}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C3_FORK_X}
            y1={yQ1}
            x2={C4_X}
            y2={yQ1}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round3Matches[1], C3_FORK_X - 10, yQ1, "15:40")}

          {/* Q2 (yR4 & yR5) */}
          <line
            x1={C3_X}
            y1={yR4}
            x2={C3_FORK_X}
            y2={yR4}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C3_X}
            y1={yR5}
            x2={C3_FORK_X}
            y2={yR5}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C3_FORK_X}
            y1={yR4}
            x2={C3_FORK_X}
            y2={yR5}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C3_FORK_X}
            y1={yQ2}
            x2={C4_X}
            y2={yQ2}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round3Matches[2], C3_FORK_X - 10, yQ2, "16:20")}

          {/* Q3 (yR6 & yR7) */}
          <line
            x1={C3_X}
            y1={yR6}
            x2={C3_FORK_X}
            y2={yR6}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C3_X}
            y1={yR7}
            x2={C3_FORK_X}
            y2={yR7}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C3_FORK_X}
            y1={yR6}
            x2={C3_FORK_X}
            y2={yR7}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C3_FORK_X}
            y1={yQ3}
            x2={C4_X}
            y2={yQ3}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round3Matches[3], C3_FORK_X - 10, yQ3, "16:40")}

          {/* ================= COLUMN 4: QUARTER FINAL / SF (2 MATCHES) ================= */}
          {/* S0 (yQ0 & yQ1) */}
          <line
            x1={C4_X}
            y1={yQ0}
            x2={C4_FORK_X}
            y2={yQ0}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C4_X}
            y1={yQ1}
            x2={C4_FORK_X}
            y2={yQ1}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C4_FORK_X}
            y1={yQ0}
            x2={C4_FORK_X}
            y2={yQ1}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C4_FORK_X}
            y1={yS0}
            x2={C5_X}
            y2={yS0}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round4Matches[0], C4_FORK_X - 10, yS0, "18:30")}

          {/* S1 (yQ2 & yQ3) */}
          <line
            x1={C4_X}
            y1={yQ2}
            x2={C4_FORK_X}
            y2={yQ2}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C4_X}
            y1={yQ3}
            x2={C4_FORK_X}
            y2={yQ3}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C4_FORK_X}
            y1={yQ2}
            x2={C4_FORK_X}
            y2={yQ3}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C4_FORK_X}
            y1={yS1}
            x2={C5_X}
            y2={yS1}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {renderMatchBadge(round4Matches[1], C4_FORK_X - 10, yS1, "19:00")}

          {/* ================= COLUMN 5: SEMIFINAL / GRAND FINAL (1 MATCH) ================= */}
          <line
            x1={C5_X}
            y1={yS0}
            x2={C5_FINISH_X}
            y2={yS0}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C5_X}
            y1={yS1}
            x2={C5_FINISH_X}
            y2={yS1}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          <line
            x1={C5_FINISH_X}
            y1={yS0}
            x2={C5_FINISH_X}
            y2={yS1}
            stroke="#94a3b8"
            strokeWidth="1.4"
          />
          {/* Finish Stem */}
          <line
            x1={C5_FINISH_X}
            y1={yF0}
            x2={SVG_W - 20}
            y2={yF0}
            stroke="#1e40af"
            strokeWidth="2"
          />
          {renderMatchBadge(
            round5Match,
            C5_FINISH_X - 10,
            yF0,
            isFinalRound ? "21:00" : "19:30",
          )}

          {/* Destination Badge at Right Edge */}
          <g transform={`translate(${SVG_W - 110}, ${yF0 - 16})`}>
            <rect
              width="100"
              height="32"
              rx="6"
              fill="#071c4d"
              stroke="#1e40af"
              strokeWidth="1.5"
            />
            <text
              x="50"
              y="20"
              textAnchor="middle"
              fontSize="11"
              fontWeight="900"
              fill="#ffffff"
            >
              {isFinalRound ? "🏆 JUARA 1" : "FINALIS ➔"}
            </text>
          </g>
        </svg>
      </div>
    </section>
  );
}
