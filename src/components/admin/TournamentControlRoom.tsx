"use client";

import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import type { AdminTournament } from "@/lib/adminTournaments";
import { getAdminTournament } from "@/lib/adminTournaments";

type TeamStatus = "approved" | "pending" | "waitlist";
type MatchStatus = "live" | "scheduled" | "completed";
type Phase = "group" | "knockout";
type AdminTab =
  | "registrations"
  | "draw"
  | "groups"
  | "knockout"
  | "courts"
  | "settings";
type TeamFilter = "all" | TeamStatus;

type Team = {
  id: string;
  player: string;
  partner: string;
  level: string;
  city: string;
  paid: boolean;
  registeredAt: string;
  status: TeamStatus;
  group: string;
};

type Match = {
  id: string;
  phase: Phase;
  group?: string;
  round: string;
  courtId: number | null;
  time: string;
  teamAId: string | null;
  teamBId: string | null;
  score: string;
  referee: string;
  status: MatchStatus;
  winnerTeamId: string | null;
};

type TournamentRuntime = {
  teams: Team[];
  matches: Match[];
  message: string;
  settings: AdminTournament["settings"];
};

const tournamentStorageKey = "tuwaga-admin-tournaments";

function runtimeStorageKey(tournamentId: string) {
  return `tuwaga-admin-runtime:${tournamentId}`;
}

const initialTeams: Team[] = [
  {
    id: "T-1042",
    player: "Raka Pratama",
    partner: "Dimas Arya",
    level: "Intermediate",
    city: "Jakarta Selatan",
    paid: true,
    registeredAt: "09 Jun, 08:12",
    status: "approved",
    group: "A",
  },
  {
    id: "T-1043",
    player: "Maya Lestari",
    partner: "Nadia Putri",
    level: "Advanced",
    city: "Bandung",
    paid: true,
    registeredAt: "09 Jun, 08:24",
    status: "pending",
    group: "B",
  },
  {
    id: "T-1044",
    player: "Bima Hartono",
    partner: "Kevin Wijaya",
    level: "Beginner",
    city: "Tangerang",
    paid: false,
    registeredAt: "09 Jun, 08:35",
    status: "pending",
    group: "A",
  },
  {
    id: "T-1045",
    player: "Sinta Maheswari",
    partner: "Ayu Larasati",
    level: "Intermediate",
    city: "Depok",
    paid: true,
    registeredAt: "09 Jun, 08:49",
    status: "waitlist",
    group: "B",
  },
  {
    id: "T-1046",
    player: "Andre Salim",
    partner: "Yusuf Malik",
    level: "Advanced",
    city: "Bekasi",
    paid: true,
    registeredAt: "09 Jun, 09:03",
    status: "approved",
    group: "A",
  },
  {
    id: "T-1047",
    player: "Clara Santoso",
    partner: "Mika Wijaya",
    level: "Intermediate",
    city: "Jakarta Barat",
    paid: true,
    registeredAt: "09 Jun, 09:18",
    status: "approved",
    group: "B",
  },
];

const initialMatches: Match[] = [
  {
    id: "M-021",
    phase: "group",
    group: "A",
    round: "Group A",
    courtId: 1,
    time: "10:30",
    teamAId: "T-1042",
    teamBId: "T-1046",
    score: "6-4, 2-1",
    referee: "Tania",
    status: "live",
    winnerTeamId: null,
  },
  {
    id: "M-022",
    phase: "group",
    group: "B",
    round: "Group B",
    courtId: 2,
    time: "11:00",
    teamAId: "T-1043",
    teamBId: "T-1047",
    score: "Not started",
    referee: "Reno",
    status: "scheduled",
    winnerTeamId: null,
  },
  {
    id: "M-023",
    phase: "knockout",
    round: "Semi Final",
    courtId: null,
    time: "13:00",
    teamAId: "T-1042",
    teamBId: "T-1047",
    score: "Waiting",
    referee: "Unassigned",
    status: "scheduled",
    winnerTeamId: null,
  },
  {
    id: "M-024",
    phase: "knockout",
    round: "Final",
    courtId: null,
    time: "15:00",
    teamAId: null,
    teamBId: null,
    score: "Waiting finalists",
    referee: "Unassigned",
    status: "scheduled",
    winnerTeamId: null,
  },
];

type BadgeTone = "blue" | "green" | "magenta" | "red" | "neutral";

const teamStatusMeta: Record<
  TeamStatus,
  { label: string; icon: string; tone: BadgeTone }
> = {
  approved: { label: "Approved", icon: "verified", tone: "green" },
  pending: { label: "Review", icon: "pending_actions", tone: "blue" },
  waitlist: { label: "Waitlist", icon: "hourglass_top", tone: "magenta" },
};

const matchStatusMeta: Record<
  MatchStatus,
  { label: string; icon: string; tone: BadgeTone }
> = {
  live: { label: "Live", icon: "sensors", tone: "red" },
  scheduled: { label: "Scheduled", icon: "event", tone: "blue" },
  completed: { label: "Completed", icon: "check_circle", tone: "neutral" },
};

const badgeToneStyles: Record<BadgeTone, string> = {
  blue: "border-primary/20 bg-primary/8 text-primary",
  green: "border-secondary/20 bg-secondary/10 text-secondary",
  magenta: "border-tertiary/20 bg-tertiary/10 text-tertiary",
  red: "border-error/20 bg-error/10 text-error",
  neutral:
    "border-outline-variant/50 bg-surface-container-low text-on-surface-variant",
};

function getStoredTournament(tournamentId: string): AdminTournament | null {
  try {
    const stored = window.localStorage.getItem(tournamentStorageKey);
    if (!stored) return null;

    const tournaments = JSON.parse(stored) as AdminTournament[];
    return (
      tournaments.find((tournament) => tournament.id === tournamentId) ?? null
    );
  } catch {
    return null;
  }
}

function getTeamName(teams: Team[], teamId: string | null) {
  if (!teamId) return "TBD";

  const team = teams.find((item) => item.id === teamId);
  if (!team) return "TBD";

  return `${team.player} / ${team.partner}`;
}

function createInitialRuntime(
  settings: AdminTournament["settings"],
): TournamentRuntime {
  return {
    teams: initialTeams,
    matches: initialMatches,
    message:
      "Registration gate is open. Payment review is the next bottleneck.",
    settings,
  };
}

function readRuntime(
  tournamentId: string,
  settings: AdminTournament["settings"],
): TournamentRuntime {
  try {
    const stored = window.localStorage.getItem(runtimeStorageKey(tournamentId));
    if (!stored) return createInitialRuntime(settings);

    const parsed = JSON.parse(stored) as TournamentRuntime;
    return {
      teams: parsed.teams ?? initialTeams,
      matches: parsed.matches ?? initialMatches,
      message:
        parsed.message ??
        "Registration gate is open. Payment review is the next bottleneck.",
      settings: parsed.settings ?? settings,
    };
  } catch {
    return createInitialRuntime(settings);
  }
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <span className="material-symbols-outlined">{icon}</span>
      </span>
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 text-3xl font-extrabold text-on-surface">{value}</p>
      <p className="mt-1 text-sm text-on-surface-variant">{detail}</p>
    </div>
  );
}

function StatusBadge({
  label,
  icon,
  tone,
}: {
  label: string;
  icon: string;
  tone: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold ${badgeToneStyles[tone]}`}
    >
      <span className="material-symbols-outlined text-[15px]">{icon}</span>
      {label}
    </span>
  );
}

function PaymentBadge({ paid }: { paid: boolean }) {
  return (
    <StatusBadge
      icon={paid ? "payments" : "receipt_long"}
      label={paid ? "Paid" : "Unpaid"}
      tone={paid ? "green" : "red"}
    />
  );
}

export default function TournamentControlRoom({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const fallbackTournament = getAdminTournament(tournamentId);
  const [tournament, setTournament] =
    useState<AdminTournament>(fallbackTournament);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [settings, setSettings] = useState(fallbackTournament.settings);
  const [message, setMessage] = useState(
    "Registration gate is open. Payment review is the next bottleneck.",
  );
  const [activeTab, setActiveTab] = useState<AdminTab>("registrations");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [selectedMatchId, setSelectedMatchId] = useState(initialMatches[0].id);
  const [confirmDraw, setConfirmDraw] = useState(false);
  const [runtimeLoaded, setRuntimeLoaded] = useState(false);

  useEffect(() => {
    const storedTournament = getStoredTournament(tournamentId);
    const activeTournament =
      storedTournament ?? getAdminTournament(tournamentId);
    const runtime = readRuntime(tournamentId, activeTournament.settings);

    setTournament(activeTournament);
    setTeams(runtime.teams);
    setMatches(runtime.matches);
    setSettings(runtime.settings);
    setMessage(runtime.message);
    setSelectedMatchId(runtime.matches[0]?.id ?? "");
    setRuntimeLoaded(true);
  }, [tournamentId]);

  useEffect(() => {
    if (!runtimeLoaded) return;

    const runtime: TournamentRuntime = {
      teams,
      matches,
      message,
      settings,
    };
    window.localStorage.setItem(
      runtimeStorageKey(tournamentId),
      JSON.stringify(runtime),
    );
  }, [matches, message, runtimeLoaded, settings, teams, tournamentId]);

  const selectedMatch =
    matches.find((match) => match.id === selectedMatchId) ?? matches[0] ?? null;

  const totals = useMemo(() => {
    const approved = teams.filter((team) => team.status === "approved");
    const pending = teams.filter((team) => team.status === "pending");
    const paid = teams.filter((team) => team.paid);
    const live = matches.filter((match) => match.status === "live");

    return {
      approved: approved.length,
      pending: pending.length,
      paid: paid.length,
      live: live.length,
      capacity: Math.round((approved.length / settings.maxPlayers) * 100),
    };
  }, [matches, settings.maxPlayers, teams]);

  const filteredTeams = useMemo(() => {
    if (teamFilter === "all") return teams;
    return teams.filter((team) => team.status === teamFilter);
  }, [teamFilter, teams]);

  const groupStandings = useMemo(() => {
    const standings = teams.reduce<
      Record<
        string,
        Array<
          Team & {
            played: number;
            wins: number;
            losses: number;
            points: number;
          }
        >
      >
    >((current, team) => {
      current[team.group] = current[team.group] ?? [];
      current[team.group].push({
        ...team,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
      });
      return current;
    }, {});

    matches
      .filter(
        (match) => match.phase === "group" && match.status === "completed",
      )
      .forEach((match) => {
        const group = match.group ?? "A";
        const rows = standings[group] ?? [];
        [match.teamAId, match.teamBId].forEach((teamId) => {
          const row = rows.find((team) => team.id === teamId);
          if (row) row.played += 1;
        });
        const winner = rows.find((team) => team.id === match.winnerTeamId);
        if (winner) {
          winner.wins += 1;
          winner.points += 3;
        }
        const loser = rows.find(
          (team) =>
            team.id !== match.winnerTeamId &&
            (team.id === match.teamAId || team.id === match.teamBId),
        );
        if (loser) loser.losses += 1;
      });

    return Object.entries(standings).sort(([groupA], [groupB]) =>
      groupA.localeCompare(groupB),
    );
  }, [matches, teams]);

  const updateTeam = (teamId: string, patch: Partial<Team>) => {
    setTeams((current) =>
      current.map((team) =>
        team.id === teamId ? { ...team, ...patch } : team,
      ),
    );
  };

  const updateTeamStatus = (teamId: string, status: TeamStatus) => {
    updateTeam(teamId, { status });
    setMessage(`Team ${teamId} moved to ${status}.`);
  };

  const markPaid = (teamId: string) => {
    updateTeam(teamId, { paid: true });
    setMessage(`Payment marked paid for team ${teamId}.`);
  };

  const runTeamAction = (teamId: string, action: string) => {
    if (action === "mark-paid") {
      markPaid(teamId);
      return;
    }

    if (action === "approve") {
      updateTeamStatus(teamId, "approved");
      return;
    }

    if (action === "waitlist") {
      updateTeamStatus(teamId, "waitlist");
    }
  };

  const updateMatch = (matchId: string, patch: Partial<Match>) => {
    setMatches((current) =>
      current.map((match) =>
        match.id === matchId ? { ...match, ...patch } : match,
      ),
    );
  };

  const saveSettings = () => {
    setMessage(
      `${tournament.name} settings saved: ${settings.maxPlayers} max players, ${settings.courts} courts, ${settings.format}.`,
    );
  };

  const generateDraw = () => {
    const eligibleTeams = teams.filter(
      (team) => team.status === "approved" && team.paid,
    );

    if (eligibleTeams.length < 2) {
      setConfirmDraw(false);
      setMessage(
        "Need at least two approved paid teams before generating draw.",
      );
      return;
    }

    const groupMatches: Match[] = eligibleTeams
      .slice(0, 8)
      .reduce<Match[]>((current, team, index, pool) => {
        if (index % 2 !== 0) return current;
        const opponent = pool[index + 1];
        if (!opponent) return current;
        const group = index < 4 ? "A" : "B";
        current.push({
          id: `M-G${current.length + 1}`,
          phase: "group",
          group,
          round: `Group ${group}`,
          courtId: (current.length % Math.max(settings.courts, 1)) + 1,
          time: `${10 + current.length}:00`,
          teamAId: team.id,
          teamBId: opponent.id,
          score: "Not started",
          referee: "Unassigned",
          status: "scheduled",
          winnerTeamId: null,
        });
        return current;
      }, []);

    const knockoutMatches: Match[] = [
      {
        id: "M-K1",
        phase: "knockout",
        round: "Semi Final",
        courtId: null,
        time: "14:00",
        teamAId: eligibleTeams[0]?.id ?? null,
        teamBId: eligibleTeams[1]?.id ?? null,
        score: "Waiting",
        referee: "Unassigned",
        status: "scheduled",
        winnerTeamId: null,
      },
      {
        id: "M-K2",
        phase: "knockout",
        round: "Final",
        courtId: null,
        time: "16:00",
        teamAId: null,
        teamBId: null,
        score: "Waiting finalists",
        referee: "Unassigned",
        status: "scheduled",
        winnerTeamId: null,
      },
    ];

    setMatches([...groupMatches, ...knockoutMatches]);
    setSelectedMatchId(groupMatches[0]?.id ?? knockoutMatches[0].id);
    setConfirmDraw(false);
    setActiveTab("draw");
    setMessage(
      `${tournament.name} draw generated from ${eligibleTeams.length} approved paid teams.`,
    );
  };

  const tabs: Array<{ id: AdminTab; label: string; icon: string }> = [
    { id: "registrations", label: "Registrations", icon: "how_to_reg" },
    { id: "draw", label: "Draw", icon: "account_tree" },
    { id: "groups", label: "Group Stage", icon: "table_chart" },
    { id: "knockout", label: "Knockout", icon: "schema" },
    { id: "courts", label: "Courts", icon: "sports_tennis" },
    { id: "settings", label: "Settings", icon: "tune" },
  ];

  return (
    <>
      <Navbar active="admin" />

      <main className="min-h-screen bg-background pt-16">
        <section className="border-b border-outline-variant/20 bg-white">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 py-8 md:px-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <PageBreadcrumb
                parentLabel="Admin"
                parentHref="/admin"
                current={tournament.name}
              />
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
                Tournament control room
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant md:text-base">
                {tournament.description} Manage registrations, payments, draw,
                courts, group stage, and knockout phase for {tournament.venue},{" "}
                {tournament.date}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConfirmDraw(true)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-lg">
                  shuffle
                </span>
                Generate draw
              </button>
              <button
                type="button"
                onClick={saveSettings}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                Save setup
              </button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1440px] px-6 py-6 md:px-10">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon="groups"
              label="Approved teams"
              value={`${totals.approved}/${settings.maxPlayers}`}
              detail={`${totals.capacity}% of configured capacity`}
            />
            <MetricCard
              icon="pending_actions"
              label="Needs review"
              value={String(totals.pending)}
              detail="Pending team registrations"
            />
            <MetricCard
              icon="payments"
              label="Payment cleared"
              value={String(totals.paid)}
              detail="Paid teams ready for draw"
            />
            <MetricCard
              icon="sports_tennis"
              label="Live courts"
              value={String(totals.live)}
              detail={`${settings.courts} courts configured`}
            />
          </div>

          <div className="mt-6 rounded-lg border border-outline-variant/30 bg-primary/5 p-4 text-sm font-semibold text-primary">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-lg">info</span>
              <p>{message}</p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="inline-flex min-w-full gap-2 rounded-lg bg-surface-container-low p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-bold transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-primary shadow-sm"
                      : "text-on-surface-variant hover:bg-white hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-[1fr_380px]">
            <section className="flex min-h-0 flex-col">
              {activeTab === "registrations" && (
                <div className="h-full rounded-lg border border-outline-variant/30 bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col gap-3 border-b border-outline-variant/20 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-on-surface">
                        Player registration list
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        Confirm payment, approve teams, or move overflow teams
                        to the waitlist.
                      </p>
                    </div>
                    <div className="inline-flex rounded-lg bg-surface-container-low p-1">
                      {[
                        ["all", "All"],
                        ["pending", "Pending"],
                        ["approved", "Approved"],
                        ["waitlist", "Waitlist"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTeamFilter(value as TeamFilter)}
                          className={`h-8 rounded-md px-3 text-xs font-bold transition-colors ${
                            teamFilter === value
                              ? "bg-white text-primary shadow-sm"
                              : "text-on-surface-variant hover:bg-white hover:text-primary"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1040px] border-collapse text-left">
                      <colgroup>
                        <col className="w-[34%]" />
                        <col className="w-[13%]" />
                        <col className="w-[9%]" />
                        <col className="w-[14%]" />
                        <col className="w-[14%]" />
                        <col className="w-[16%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-outline-variant/20 bg-surface-container-low text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          <th className="px-5 py-3">Team</th>
                          <th className="px-5 py-3">Level</th>
                          <th className="px-5 py-3">Group</th>
                          <th className="px-5 py-3">Payment</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {filteredTeams.map((team) => (
                          <tr
                            key={team.id}
                            className="align-middle transition-colors hover:bg-surface-container-low/50"
                          >
                            <td className="px-5 py-5">
                              <p className="text-sm font-extrabold leading-5 text-on-surface">
                                {team.player} / {team.partner}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                                {team.id} - {team.city}
                              </p>
                              <p className="mt-1 text-xs text-on-surface-variant">
                                Registered {team.registeredAt}
                              </p>
                            </td>
                            <td className="px-5 py-5 text-sm font-semibold text-on-surface-variant">
                              {team.level}
                            </td>
                            <td className="px-5 py-5">
                              <select
                                value={team.group}
                                onChange={(event) =>
                                  updateTeam(team.id, {
                                    group: event.target.value,
                                  })
                                }
                                className="h-9 w-16 rounded-lg border border-outline-variant/50 bg-white px-2 text-sm font-bold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                              >
                                {["A", "B", "C", "D"].map((group) => (
                                  <option key={group}>{group}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-5">
                              <PaymentBadge paid={team.paid} />
                            </td>
                            <td className="px-5 py-5">
                              <StatusBadge {...teamStatusMeta[team.status]} />
                            </td>
                            <td className="px-5 py-5">
                              <select
                                value=""
                                onChange={(event) =>
                                  runTeamAction(team.id, event.target.value)
                                }
                                className="ml-auto block h-9 w-40 rounded-lg border border-outline-variant/60 bg-white px-3 text-sm font-bold text-on-surface outline-none transition-colors hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/10"
                                aria-label={`Action for ${team.player} and ${team.partner}`}
                              >
                                <option value="" disabled>
                                  Select action
                                </option>
                                {!team.paid && (
                                  <option value="mark-paid">Mark paid</option>
                                )}
                                <option
                                  value="approve"
                                  disabled={team.status === "approved"}
                                >
                                  Approve
                                </option>
                                <option
                                  value="waitlist"
                                  disabled={team.status === "waitlist"}
                                >
                                  Move to waitlist
                                </option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "draw" && (
                <div className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-on-surface">
                        Match drawer
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        Select a match, assign court, set score, and publish the
                        result.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDraw(true)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
                    >
                      <span className="material-symbols-outlined text-lg">
                        shuffle
                      </span>
                      Regenerate
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {matches.map((match) => (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() => setSelectedMatchId(match.id)}
                        className={`w-full rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0px_12px_32px_rgba(17,24,39,0.08)] ${
                          selectedMatch?.id === match.id
                            ? "border-primary bg-primary/5"
                            : "border-outline-variant/30 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-extrabold text-on-surface">
                              {getTeamName(teams, match.teamAId)} vs{" "}
                              {getTeamName(teams, match.teamBId)}
                            </p>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {match.round} -{" "}
                              {match.courtId
                                ? `Court ${match.courtId}`
                                : "Court unassigned"}{" "}
                              - {match.time}
                            </p>
                          </div>
                          <StatusBadge {...matchStatusMeta[match.status]} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "groups" && (
                <div className="grid gap-6 xl:grid-cols-2">
                  {groupStandings.map(([group, rows]) => (
                    <div
                      key={group}
                      className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]"
                    >
                      <h2 className="text-lg font-extrabold text-on-surface">
                        Group {group}
                      </h2>
                      <table className="mt-4 w-full text-left text-sm">
                        <thead className="text-xs font-bold uppercase text-on-surface-variant">
                          <tr>
                            <th className="py-2">Team</th>
                            <th className="py-2 text-center">P</th>
                            <th className="py-2 text-center">W</th>
                            <th className="py-2 text-center">L</th>
                            <th className="py-2 text-center">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {rows
                            .sort((a, b) => b.points - a.points)
                            .map((team) => (
                              <tr key={team.id}>
                                <td className="py-3 font-bold text-on-surface">
                                  {team.player} / {team.partner}
                                </td>
                                <td className="py-3 text-center">
                                  {team.played}
                                </td>
                                <td className="py-3 text-center">
                                  {team.wins}
                                </td>
                                <td className="py-3 text-center">
                                  {team.losses}
                                </td>
                                <td className="py-3 text-center font-bold text-primary">
                                  {team.points}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "knockout" && (
                <div className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                  <h2 className="text-lg font-extrabold text-on-surface">
                    Knockout phase
                  </h2>
                  <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    {matches
                      .filter((match) => match.phase === "knockout")
                      .map((match) => (
                        <button
                          key={match.id}
                          type="button"
                          onClick={() => {
                            setSelectedMatchId(match.id);
                            setActiveTab("draw");
                          }}
                          className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                        >
                          <p className="text-xs font-bold uppercase tracking-wider text-primary">
                            {match.round}
                          </p>
                          <p className="mt-3 font-extrabold text-on-surface">
                            {getTeamName(teams, match.teamAId)}
                          </p>
                          <p className="my-1 text-xs font-bold uppercase text-on-surface-variant">
                            versus
                          </p>
                          <p className="font-extrabold text-on-surface">
                            {getTeamName(teams, match.teamBId)}
                          </p>
                          <p className="mt-3 text-xs text-on-surface-variant">
                            Winner: {getTeamName(teams, match.winnerTeamId)}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {activeTab === "courts" && (
                <div className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                  <h2 className="text-lg font-extrabold text-on-surface">
                    Court allocation
                  </h2>
                  <div className="mt-5 grid gap-3 xl:grid-cols-2">
                    {Array.from({ length: settings.courts }, (_, index) => {
                      const courtId = index + 1;
                      const courtMatches = matches.filter(
                        (match) => match.courtId === courtId,
                      );
                      return (
                        <div
                          key={courtId}
                          className="rounded-lg bg-surface-container-low p-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-on-surface">
                              Court {courtId}
                            </p>
                            <span className="material-symbols-outlined text-primary">
                              sports_tennis
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {courtMatches.length === 0 && (
                              <p className="text-sm text-on-surface-variant">
                                Available for assignment
                              </p>
                            )}
                            {courtMatches.map((match) => (
                              <button
                                key={match.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMatchId(match.id);
                                  setActiveTab("draw");
                                }}
                                className="w-full rounded-md bg-white p-3 text-left text-sm font-semibold text-on-surface"
                              >
                                {match.time} -{" "}
                                {getTeamName(teams, match.teamAId)} vs{" "}
                                {getTeamName(teams, match.teamBId)}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                  <h2 className="text-lg font-extrabold text-on-surface">
                    Tournament setup
                  </h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Maximum players
                      </span>
                      <input
                        type="number"
                        min="8"
                        max="256"
                        value={settings.maxPlayers}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            maxPlayers: Number(event.target.value),
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Waitlist limit
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="64"
                        value={settings.waitlistLimit}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            waitlistLimit: Number(event.target.value),
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Active courts
                      </span>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={settings.courts}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            courts: Number(event.target.value),
                          }))
                        }
                        className="mt-3 w-full accent-primary"
                      />
                      <span className="mt-1 block text-sm font-bold text-primary">
                        {settings.courts} courts
                      </span>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Match duration
                      </span>
                      <select
                        value={settings.matchDuration}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            matchDuration: Number(event.target.value),
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      >
                        <option value={20}>20 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </section>

            <aside className="flex">
              <div className="h-full w-full rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-on-surface">
                      Match details
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Assign court, result, winner, and referee.
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-primary">
                    dock_to_right
                  </span>
                </div>

                {selectedMatch && (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-lg bg-surface-container-low p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {selectedMatch.id} - {selectedMatch.round}
                      </p>
                      <h3 className="mt-2 text-lg font-extrabold text-on-surface">
                        {getTeamName(teams, selectedMatch.teamAId)}
                      </h3>
                      <p className="my-2 text-xs font-bold uppercase tracking-wider text-primary">
                        versus
                      </p>
                      <h3 className="text-lg font-extrabold text-on-surface">
                        {getTeamName(teams, selectedMatch.teamBId)}
                      </h3>
                    </div>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Court
                      </span>
                      <select
                        value={selectedMatch.courtId ?? ""}
                        onChange={(event) =>
                          updateMatch(selectedMatch.id, {
                            courtId: event.target.value
                              ? Number(event.target.value)
                              : null,
                          })
                        }
                        className="mt-2 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface"
                      >
                        <option value="">Unassigned</option>
                        {Array.from(
                          { length: settings.courts },
                          (_, index) => index + 1,
                        ).map((courtId) => (
                          <option key={`court-${courtId}`} value={courtId}>
                            Court {courtId}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Status
                      </span>
                      <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-surface-container-low p-1">
                        {(
                          ["scheduled", "live", "completed"] as MatchStatus[]
                        ).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() =>
                              updateMatch(selectedMatch.id, { status })
                            }
                            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md text-xs font-bold transition-colors ${
                              selectedMatch.status === status
                                ? "bg-white text-primary shadow-sm"
                                : "text-on-surface-variant hover:bg-white hover:text-primary"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {matchStatusMeta[status].icon}
                            </span>
                            {matchStatusMeta[status].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Score
                      </span>
                      <input
                        value={selectedMatch.score}
                        onChange={(event) =>
                          updateMatch(selectedMatch.id, {
                            score: event.target.value,
                          })
                        }
                        className="mt-2 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Winner
                      </span>
                      <select
                        value={selectedMatch.winnerTeamId ?? ""}
                        onChange={(event) =>
                          updateMatch(selectedMatch.id, {
                            winnerTeamId: event.target.value || null,
                            status: event.target.value
                              ? "completed"
                              : selectedMatch.status,
                          })
                        }
                        className="mt-2 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface"
                      >
                        <option value="">No winner yet</option>
                        {selectedMatch.teamAId && (
                          <option value={selectedMatch.teamAId}>
                            {getTeamName(teams, selectedMatch.teamAId)}
                          </option>
                        )}
                        {selectedMatch.teamBId && (
                          <option value={selectedMatch.teamBId}>
                            {getTeamName(teams, selectedMatch.teamBId)}
                          </option>
                        )}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Referee
                      </span>
                      <input
                        value={selectedMatch.referee}
                        onChange={(event) =>
                          updateMatch(selectedMatch.id, {
                            referee: event.target.value,
                          })
                        }
                        className="mt-2 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setMessage(
                          `Match ${selectedMatch.id} saved and sent to referee.`,
                        )
                      }
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
                    >
                      <span className="material-symbols-outlined text-lg">
                        send
                      </span>
                      Save match
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />

      {confirmDraw && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/45 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="draw-confirm-title"
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-[0px_24px_80px_rgba(17,24,39,0.22)]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">shuffle</span>
            </div>
            <h2
              id="draw-confirm-title"
              className="text-xl font-extrabold text-on-surface"
            >
              Generate tournament draw?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              This will rebuild group matches and knockout placeholders from
              approved paid teams.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDraw(false)}
                className="h-10 rounded-lg border border-outline-variant/50 px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generateDraw}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
