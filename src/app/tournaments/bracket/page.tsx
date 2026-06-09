"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageBreadcrumb from "@/components/PageBreadcrumb";

type Team = {
  seed: number;
  name: string;
  played: number;
  wins: number;
  points: number;
  diff: number;
};

type Group = {
  name: string;
  teams: Team[];
};

const qualificationOptions = [8, 16, 24, 32];

const teamNames = [
  "Jakarta Rally Club",
  "Bandung Net Force",
  "Surabaya Smash",
  "Bali Court Crew",
  "Medan Match Point",
  "Yogyakarta Aces",
  "Bogor Baseline",
  "Makassar Drive",
  "Tangerang Tempo",
  "Depok Set Point",
  "Semarang Servers",
  "Bekasi Breakers",
  "Malang Momentum",
  "Solo Advantage",
  "Palembang Pulse",
  "Batam Winners",
];

const groups: Group[] = Array.from({ length: 16 }, (_, groupIndex) => ({
  name: String.fromCharCode(65 + groupIndex),
  teams: Array.from({ length: 4 }, (_, teamIndex) => {
    const seed = groupIndex * 4 + teamIndex + 1;
    const wins = Math.max(0, 3 - teamIndex - (groupIndex % 2 === 0 ? 0 : 1));
    return {
      seed,
      name: `${teamNames[groupIndex]} ${teamIndex + 1}`,
      played: 3,
      wins,
      points: wins * 3 + (teamIndex === 2 ? 1 : 0),
      diff: 12 - teamIndex * 5 - (groupIndex % 3),
    };
  }).sort((a, b) => b.points - a.points || b.diff - a.diff),
}));

const allTeams = groups
  .flatMap((group) =>
    group.teams.map((team, index) => ({
      ...team,
      group: group.name,
      groupRank: index + 1,
    })),
  )
  .sort((a, b) => b.points - a.points || b.diff - a.diff || a.seed - b.seed);

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold text-on-surface">{value}</p>
      <p className="mt-1 text-sm text-on-surface-variant">{sub}</p>
    </div>
  );
}

function GroupCard({ group, cutoff }: { group: Group; cutoff: number }) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low px-4 py-3">
        <h3 className="font-extrabold text-on-surface">Group {group.name}</h3>
        <span className="text-xs font-bold text-on-surface-variant">
          4 teams
        </span>
      </div>
      <div className="divide-y divide-outline-variant/20">
        {group.teams.map((team, index) => {
          const globalRank =
            allTeams.findIndex((item) => item.seed === team.seed) + 1;
          const qualified = globalRank <= cutoff;

          return (
            <div
              key={team.seed}
              className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-3 ${
                qualified ? "bg-primary/5" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-extrabold ${
                      index === 0
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <p className="truncate text-sm font-bold text-on-surface">
                    {team.name}
                  </p>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Global rank #{globalRank}
                </p>
              </div>
              <span className="text-sm font-semibold text-on-surface">
                {team.wins}-{team.played - team.wins}
              </span>
              <span className="text-sm font-semibold text-on-surface">
                {team.diff > 0 ? `+${team.diff}` : team.diff}
              </span>
              <span
                className={`rounded-md px-2 py-1 text-xs font-bold ${
                  qualified
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {qualified ? "IN" : "WAIT"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchBox({
  label,
  teams,
  emphasis = false,
}: {
  label: string;
  teams: Array<(typeof allTeams)[number] | null>;
  emphasis?: boolean;
}) {
  return (
    <div className="relative">
      <div
        className={`h-[92px] overflow-hidden rounded-lg border bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0px_14px_35px_rgba(17,24,39,0.08)] ${
          emphasis
            ? "border-primary ring-2 ring-primary/10"
            : "border-outline-variant/30"
        }`}
      >
        <div
          className={`flex items-center justify-between px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider ${
            emphasis
              ? "bg-primary text-on-primary"
              : "bg-surface-container-low text-on-surface-variant"
          }`}
        >
          <span>{label}</span>
          {emphasis && <span>Live seed</span>}
        </div>
        <div className="divide-y divide-outline-variant/20">
          {teams.map((team, index) => (
            <div
              key={team?.seed ?? `${label}-tbd-${index}`}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
                index === 0 && emphasis ? "bg-primary/5" : ""
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`truncate text-xs ${
                    team
                      ? "font-bold text-on-surface"
                      : "font-semibold text-on-surface-variant"
                  }`}
                >
                  {team?.name ?? "TBD"}
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  {team
                    ? `Group ${team.group} winner • ${team.points} pts`
                    : "Waiting for match result"}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-extrabold ${
                  team ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {team ? `#${team.seed}` : "-"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BracketConnectors() {
  const r16Centers = [46, 150, 254, 358, 462, 566, 670, 774];
  const qfCenters = [98, 306, 514, 722];
  const sfCenters = [202, 618];
  const finalCenter = 410;

  const pairPaths = [
    ...qfCenters.map((center, index) => {
      const y1 = r16Centers[index * 2];
      const y2 = r16Centers[index * 2 + 1];
      return `M235 ${y1} H251 V${y2} H235 M251 ${center} H267`;
    }),
    ...sfCenters.map((center, index) => {
      const y1 = qfCenters[index * 2];
      const y2 = qfCenters[index * 2 + 1];
      return `M502 ${y1} H518 V${y2} H502 M518 ${center} H534`;
    }),
    `M769 ${sfCenters[0]} H785 V${sfCenters[1]} H769 M785 ${finalCenter} H801`,
  ];

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-[34px] z-0 h-[820px] w-[1040px] overflow-visible"
      viewBox="0 0 1040 820"
    >
      {pairPaths.map((path) => (
        <path
          key={path}
          d={path}
          fill="none"
          stroke="rgba(26, 86, 219, 0.45)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

function BracketPreview({ teams }: { teams: typeof allTeams }) {
  const roundOf16 = teams
    .slice(0, 16)
    .reduce<Array<[(typeof allTeams)[number], (typeof allTeams)[number]]>>(
      (pairs, team, index, source) => {
        if (index >= 8) return pairs;
        pairs.push([team, source[source.length - 1 - index]]);
        return pairs;
      },
      [],
    );
  const quarterFinals = roundOf16
    .slice(0, 4)
    .map((pair, index) => [
      pair[0],
      roundOf16[roundOf16.length - 1 - index][0],
    ]);
  const semiFinals = [
    [quarterFinals[0][0], quarterFinals[1][0]],
    [quarterFinals[2][0], quarterFinals[3][0]],
  ];
  const final = [semiFinals[0][0], semiFinals[1][0]];

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Bracket view
          </p>
          <h2 className="text-2xl font-extrabold text-on-surface">
            Knockout tree from group standings
          </h2>
        </div>
        <span className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
          Round of 16 to Final
        </span>
      </div>

      <div className="overflow-x-auto pb-3 custom-scrollbar">
        <div className="relative min-w-[1040px] px-1 2xl:min-w-0">
          <BracketConnectors />
          <div className="relative z-10 grid grid-cols-[235px_235px_235px_235px] gap-8">
            <div>
              <h3 className="text-center text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">
                Round of 16
              </h3>
              <div className="mt-4 grid grid-rows-8 gap-3">
                {roundOf16.map(([teamA, teamB], index) => (
                  <MatchBox
                    key={`${teamA.seed}-${teamB.seed}`}
                    label={`Match ${index + 1}`}
                    teams={[teamA, teamB]}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-center text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">
                Quarter-finals
              </h3>
              <div className="mt-4 grid grid-rows-4 gap-3">
                {quarterFinals.map(([teamA, teamB], index) => (
                  <div
                    key={`qf-wrap-${teamA.seed}-${teamB.seed}`}
                    className="flex h-[196px] items-center"
                  >
                    <MatchBox
                      key={`qf-${teamA.seed}-${teamB.seed}`}
                      label={`QF ${index + 1}`}
                      teams={[teamA, teamB]}
                      emphasis={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-center text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">
                Semi-finals
              </h3>
              <div className="mt-4 grid grid-rows-2 gap-3">
                {semiFinals.map(([teamA, teamB], index) => (
                  <div
                    key={`sf-wrap-${teamA.seed}-${teamB.seed}`}
                    className="flex h-[404px] items-center"
                  >
                    <MatchBox
                      key={`sf-${teamA.seed}-${teamB.seed}`}
                      label={`SF ${index + 1}`}
                      teams={[teamA, teamB]}
                      emphasis={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-center text-sm font-extrabold uppercase tracking-widest text-primary">
                Final
              </h3>
              <div className="mt-4 flex h-[820px] items-center">
                <div className="w-full">
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-2xl bg-primary/10 blur-2xl" />
                    <div className="relative">
                      <MatchBox
                        label="Championship Match"
                        teams={final}
                        emphasis
                      />
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl bg-primary p-4 text-center text-on-primary">
                    <span className="material-symbols-outlined text-3xl">
                      emoji_events
                    </span>
                    <p className="mt-2 text-sm font-bold uppercase tracking-wider opacity-80">
                      Champion
                    </p>
                    <p className="text-lg font-extrabold">TBD after final</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BracketPage() {
  const [qualifierCount, setQualifierCount] = useState(16);
  const [activeView, setActiveView] = useState<"groups" | "bracket">("groups");
  const qualifiedTeams = useMemo(
    () => allTeams.slice(0, qualifierCount),
    [qualifierCount],
  );

  return (
    <>
      <Navbar active="bracket" />
      <main className="min-h-screen bg-background px-6 pb-16 pt-28 md:px-10">
        <div className="mx-auto max-w-[1440px]">
          <section className="mb-10">
            <PageBreadcrumb
              parentLabel="Home"
              parentHref="/"
              current="Bracket"
            />

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-secondary-container">
                Group stage first
              </span>
              <span className="text-sm font-semibold text-on-surface-variant">
                Jakarta Arena Championship
              </span>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-on-surface md:text-5xl">
                  Tournament progression
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-on-surface-variant">
                  Registered teams start in group stage. Management can later
                  choose how many teams qualify into knockout brackets from the
                  backend. For this MVP, the interface is mocked with 64 teams.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setActiveView("bracket")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-lg">
                    account_tree
                  </span>
                  View Bracket
                </button>
                <Link
                  href="/tournaments/live"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant px-5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-lg">
                    scoreboard
                  </span>
                  Live Scoring
                </Link>
              </div>
            </div>
          </section>

          <section className="mb-8 rounded-xl border border-outline-variant/30 bg-white p-2 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: "groups",
                  label: "Group Stage",
                  icon: "view_module",
                  sub: "Standings and qualifiers",
                },
                {
                  value: "bracket",
                  label: "Bracket View",
                  icon: "account_tree",
                  sub: "Knockout preview",
                },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setActiveView(item.value as "groups" | "bracket")
                  }
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeView === item.value
                      ? "bg-primary text-on-primary"
                      : "text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>
                    <span className="block text-sm font-extrabold">
                      {item.label}
                    </span>
                    <span
                      className={`block text-xs font-semibold ${
                        activeView === item.value
                          ? "text-on-primary/75"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {item.sub}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard
              icon="groups"
              label="Registered"
              value="64 Teams"
              sub="Capacity filled for this MVP"
            />
            <StatCard
              icon="view_module"
              label="Groups"
              value="16 Groups"
              sub="4 teams per group"
            />
            <StatCard
              icon="rule"
              label="Qualifier rule"
              value={`Top ${qualifierCount}`}
              sub="Editable later from backend"
            />
            <StatCard
              icon="account_tree"
              label="Next phase"
              value="Knockout"
              sub="Auto-seeded from standings"
            />
          </section>

          <section className="mb-8 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Management setting
                </p>
                <h2 className="text-2xl font-extrabold text-on-surface">
                  Select teams advancing from group stage
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  This is static for now. Backend can later store top 4, top 6,
                  top 16, top 32, or any custom tournament rule.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {qualificationOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setQualifierCount(option)}
                    className={`h-10 rounded-lg px-4 text-sm font-bold transition-colors ${
                      qualifierCount === option
                        ? "bg-primary text-on-primary"
                        : "border border-outline-variant text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    Top {option}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {activeView === "groups" ? (
            <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
              <div>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      Group stage
                    </p>
                    <h2 className="text-2xl font-extrabold text-on-surface">
                      Standings overview
                    </h2>
                  </div>
                  <span className="text-sm font-semibold text-on-surface-variant">
                    Showing 8 of 16 groups
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {groups.slice(0, 8).map((group) => (
                    <GroupCard
                      key={group.name}
                      group={group}
                      cutoff={qualifierCount}
                    />
                  ))}
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    Qualified list
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold text-on-surface">
                    Top {qualifierCount} snapshot
                  </h3>
                  <div className="mt-4 max-h-[520px] space-y-2 overflow-auto pr-1 custom-scrollbar">
                    {qualifiedTeams.slice(0, 20).map((team, index) => (
                      <div
                        key={team.seed}
                        className="flex items-center justify-between rounded-lg bg-background px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-on-surface">
                            {index + 1}. {team.name}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            Group {team.group} • {team.points} pts • diff{" "}
                            {team.diff > 0 ? `+${team.diff}` : team.diff}
                          </p>
                        </div>
                        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                          IN
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-outline-variant/30 bg-primary p-5 text-on-primary shadow-[0px_14px_40px_rgba(26,86,219,0.18)]">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                    Backend-ready fields
                  </p>
                  <ul className="mt-4 space-y-3 text-sm font-semibold">
                    <li>registeredTeamLimit: 64</li>
                    <li>groupSize: 4</li>
                    <li>qualifierCount: {qualifierCount}</li>
                    <li>knockoutSeedMode: standings</li>
                  </ul>
                </div>
              </aside>
            </section>
          ) : (
            <section className="space-y-6">
              <BracketPreview teams={qualifiedTeams} />
              <div className="rounded-xl border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Qualification source
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-on-surface">
                  Bracket is seeded from group stage standings
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  The bracket view stays on this same page. Later, backend
                  settings can decide whether the bracket takes top 4, top 6,
                  top 16, top 32, group winners only, or another custom rule.
                </p>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
