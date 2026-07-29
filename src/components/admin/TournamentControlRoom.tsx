"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import type { AdminTournament } from "@/lib/adminTournaments";
import {
  type AdminCreateRegistrationInput,
  type Match as ApiMatch,
  type TeamStatus as ApiTeamStatus,
  adminCreateRegistration,
  deleteRegistration,
  generateDraw as generateDrawRequest,
  getTournament,
  listMatches,
  listRegistrations,
  type MatchStatus,
  type Phase,
  type RegistrationTeam,
  type Tournament,
  updateMatch as updateMatchRequest,
  updateRegistration,
  updateSettings,
} from "@/lib/tuwagaApi";

type TeamStatus = Exclude<ApiTeamStatus, "rejected">;
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
  category: string;
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
  group: string | null;
  round: string;
  courtId: number | null;
  time: string;
  teamAId: string | null;
  teamBId: string | null;
  score: string;
  scoreSets: Array<{ teamA: number; teamB: number }>;
  referee: string;
  status: MatchStatus;
  winnerTeamId: string | null;
};

const defaultSettings: AdminTournament["settings"] = {
  maxPlayers: 64,
  waitlistLimit: 12,
  courts: 4,
  matchDuration: 30,
  teamSize: "Doubles",
  format: "Group stage + knockout",
  status: "setup",
  categories: [],
};

function loadingTournament(tournamentId: string): AdminTournament {
  return {
    id: tournamentId,
    name: "Loading tournament",
    venue: "",
    date: "",
    status: "setup",
    description: "Loading tournament data from the backend.",
    settings: defaultSettings,
  };
}

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

function toAdminTournament(tournament: Tournament): AdminTournament {
  return {
    id: tournament.id,
    name: tournament.name,
    venue: tournament.venue,
    date: tournament.dateLabel,
    status: tournament.status,
    description: tournament.description,
    settings: {
      maxPlayers: tournament.settings.maxPlayers,
      waitlistLimit: tournament.settings.waitlistLimit,
      courts: tournament.settings.courts,
      matchDuration: tournament.settings.matchDuration,
      teamSize: tournament.settings.teamSize,
      format: tournament.settings.format,
      status: tournament.status,
      categories: tournament.settings.categories ?? [],
    },
  };
}

function getTeamName(teams: Team[], teamId: string | null) {
  if (!teamId) return "TBD";

  const team = teams.find((item) => item.id === teamId);
  if (!team) return "TBD";

  return team.partner ? `${team.player} / ${team.partner}` : team.player;
}

function toTeam(team: RegistrationTeam): Team {
  return {
    id: team.id,
    player: team.player,
    partner: team.partner ?? "",
    category: team.category,
    level: team.level,
    city: team.city,
    paid: team.paid,
    registeredAt: new Date(team.registeredAt).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: team.status === "rejected" ? "pending" : team.status,
    group: team.group ?? "",
  };
}

function toMatch(match: ApiMatch): Match {
  return {
    id: match.id,
    phase: match.phase,
    group: match.group,
    round: match.round,
    courtId: match.courtId,
    time: match.time,
    teamAId: match.teamAId,
    teamBId: match.teamBId,
    score: match.score,
    scoreSets: match.scoreSets ?? [],
    referee: match.referee,
    status: match.status,
    winnerTeamId: match.winnerTeamId,
  };
}

function computeScoreString(
  sets: Array<{ teamA: number; teamB: number }>,
): string {
  return sets.map((s) => `${s.teamA}-${s.teamB}`).join(", ");
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
  const [tournament, setTournament] = useState<AdminTournament>(() =>
    loadingTournament(tournamentId),
  );
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [message, setMessage] = useState("Loading tournament data.");
  const [activeTab, setActiveTab] = useState<AdminTab>("registrations");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [confirmDraw, setConfirmDraw] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Team | null>(null);
  const [removingTeamId, setRemovingTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [insertOpen, setInsertOpen] = useState(false);
  const [insertError, setInsertError] = useState("");
  const [insertSubmitting, setInsertSubmitting] = useState(false);
  const [showWinnerPicker, setShowWinnerPicker] = useState(false);
  const [draftSets, setDraftSets] = useState<
    Array<{ teamA: number; teamB: number }>
  >([]);
  const [insertForm, setInsertForm] = useState({
    playerFullName: "",
    playerEmail: "",
    playerPhone: "",
    playerNationality: "ID",
    playerSkillLevel: "intermediate",
    playerCity: "",
    partnerFullName: "",
    partnerEmail: "",
    partnerSkillLevel: "intermediate",
    category: "",
    paid: false,
    status: "pending" as TeamStatus,
  });

  useEffect(() => {
    let active = true;

    async function loadTournamentRuntime() {
      setLoading(true);
      try {
        const [remoteTournament, remoteTeams, remoteMatches] =
          await Promise.all([
            getTournament(tournamentId),
            listRegistrations(tournamentId),
            listMatches(tournamentId),
          ]);

        if (!active) return;
        const adminTournament = toAdminTournament(remoteTournament);
        setTournament(adminTournament);
        setTeams(remoteTeams.map(toTeam));
        const nextMatches = remoteMatches.map(toMatch);
        setMatches(nextMatches);
        setSettings(adminTournament.settings);
        setSelectedMatchId(nextMatches[0]?.id ?? "");
        setMessage("Tournament data loaded from the backend.");
      } catch (err) {
        if (!active) return;
        setMessage(
          err instanceof Error
            ? err.message
            : "Failed to load tournament data from the backend.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTournamentRuntime();

    return () => {
      active = false;
    };
  }, [tournamentId]);

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
    let result = teams;
    if (teamFilter !== "all") {
      result = result.filter((team) => team.status === teamFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((team) => team.category === categoryFilter);
    }
    return result;
  }, [teamFilter, categoryFilter, teams]);

  const groupStandings = useMemo(() => {
    const standings = teams
      .filter((team) => team.group)
      .reduce<
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

  const setTeamPatch = (teamId: string, patch: Partial<Team>) => {
    setTeams((current) =>
      current.map((team) =>
        team.id === teamId ? { ...team, ...patch } : team,
      ),
    );
  };

  const updateTeam = async (teamId: string, patch: Partial<Team>) => {
    const previous = teams;
    setTeamPatch(teamId, patch);
    try {
      const updated = await updateRegistration(tournamentId, teamId, {
        paid: patch.paid,
        status: patch.status,
        group: patch.group,
      });
      setTeamPatch(teamId, toTeam(updated));
      setMessage(`Team ${teamId} saved.`);
    } catch (err) {
      setTeams(previous);
      setMessage(err instanceof Error ? err.message : "Failed to update team.");
    }
  };

  const updateTeamStatus = async (teamId: string, status: TeamStatus) => {
    await updateTeam(teamId, { status });
  };

  const markPaid = async (teamId: string) => {
    await updateTeam(teamId, { paid: true });
  };

  const removeTeam = async () => {
    if (!removeTarget) return;

    const teamId = removeTarget.id;
    const teamName = removeTarget.partner
      ? `${removeTarget.player} / ${removeTarget.partner}`
      : removeTarget.player;
    setRemovingTeamId(teamId);
    try {
      await deleteRegistration(tournamentId, teamId);
      setTeams((current) => current.filter((item) => item.id !== teamId));
      setRemoveTarget(null);
      setMessage(`Registration for ${teamName} removed.`);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to remove registration.",
      );
    } finally {
      setRemovingTeamId(null);
    }
  };

  const runTeamAction = async (teamId: string, action: string) => {
    if (action === "mark-paid") {
      await markPaid(teamId);
      return;
    }

    if (action === "approve") {
      await updateTeamStatus(teamId, "approved");
      return;
    }

    if (action === "waitlist") {
      await updateTeamStatus(teamId, "waitlist");
      return;
    }

    if (action === "remove") {
      const team = teams.find((item) => item.id === teamId);
      if (team) setRemoveTarget(team);
    }
  };

  const setMatchPatch = useCallback(
    (matchId: string, patch: Partial<Match>) => {
      setMatches((current) =>
        current.map((match) =>
          match.id === matchId ? { ...match, ...patch } : match,
        ),
      );
    },
    [],
  );

  const updateMatch = useCallback(
    async (matchId: string, patch: Partial<Match>) => {
      const previous = matches;
      setMatchPatch(matchId, patch);
      try {
        const updated = await updateMatchRequest(tournamentId, matchId, patch);
        setMatchPatch(matchId, toMatch(updated));
        setMessage(`Match ${matchId} saved.`);
      } catch (err) {
        setMatches(previous);
        setMessage(
          err instanceof Error ? err.message : "Failed to update match.",
        );
      }
    },
    [matches, tournamentId, setMatchPatch],
  );

  useEffect(() => {
    setDraftSets(selectedMatch?.scoreSets ?? []);
    setShowWinnerPicker(false);
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedMatch || selectedMatch.status !== "live") return;
    const timer = setTimeout(() => {
      updateMatch(selectedMatch.id, {
        scoreSets: draftSets,
        score: computeScoreString(draftSets),
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [draftSets, selectedMatch, updateMatch]);

  const updateDraftSet = (
    index: number,
    side: "teamA" | "teamB",
    value: number,
  ) => {
    setDraftSets((current) =>
      current.map((s, i) =>
        i === index
          ? { ...s, [side]: Math.max(0, Math.min(99, value || 0)) }
          : s,
      ),
    );
  };

  const addDraftSet = () => {
    setDraftSets((c) => [...c, { teamA: 0, teamB: 0 }]);
  };

  const removeDraftSet = (index: number) => {
    setDraftSets((c) => c.filter((_, i) => i !== index));
  };

  const finishMatch = async (winnerTeamId: string) => {
    if (!selectedMatch) return;
    setShowWinnerPicker(false);
    await updateMatch(selectedMatch.id, {
      winnerTeamId,
      status: "completed",
      scoreSets: draftSets,
      score: computeScoreString(draftSets),
    });
  };

  const saveSettings = async () => {
    try {
      const saved = await updateSettings(tournamentId, settings);
      setSettings({
        maxPlayers: saved.maxPlayers,
        waitlistLimit: saved.waitlistLimit,
        courts: saved.courts,
        matchDuration: saved.matchDuration,
        teamSize: saved.teamSize,
        format: saved.format,
        categories: saved.categories,
        status: settings.status,
      });
      setTournament((current) => ({
        ...current,
        status: settings.status ?? current.status,
        settings: {
          ...current.settings,
          status: settings.status ?? current.settings.status,
        },
      }));
      setMessage(
        `${tournament.name} settings saved: ${saved.maxPlayers} max players, ${saved.courts} courts, ${saved.format}, status: ${settings.status ?? "unchanged"}.`,
      );
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to save settings.",
      );
    }
  };

  const generateDraw = async (phase: "group" | "knockout" | "all" = "all") => {
    setConfirmDraw(false);
    try {
      const draw = await generateDrawRequest(tournamentId, phase);
      const nextMatches = draw.matches.map(toMatch);
      setMatches(nextMatches);
      setSelectedMatchId(nextMatches[0]?.id ?? "");
      setActiveTab(phase === "knockout" ? "knockout" : "draw");
      setMessage(draw.message);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to generate draw.",
      );
    }
  };

  const submitInsertPlayers = async () => {
    setInsertError("");
    if (
      !insertForm.playerFullName.trim() ||
      !insertForm.playerEmail.trim() ||
      !insertForm.playerPhone.trim()
    ) {
      setInsertError("Player name, email, and phone are required.");
      return;
    }

    if (!insertForm.partnerFullName.trim() || !insertForm.partnerEmail.trim()) {
      setInsertError("Partner name and email are required for pair entry.");
      return;
    }

    setInsertSubmitting(true);
    try {
      const input: AdminCreateRegistrationInput = {
        player: {
          fullName: insertForm.playerFullName.trim(),
          email: insertForm.playerEmail.trim(),
          phone: insertForm.playerPhone.trim(),
          nationality: insertForm.playerNationality,
          skillLevel: insertForm.playerSkillLevel,
          city: insertForm.playerCity.trim() || null,
        },
        partner: {
          fullName: insertForm.partnerFullName.trim(),
          email: insertForm.partnerEmail.trim(),
          skillLevel: insertForm.partnerSkillLevel,
        },
        category: insertForm.category || undefined,
        paid: insertForm.paid,
        status: insertForm.status,
      };

      const created = await adminCreateRegistration(tournamentId, input);
      setTeams((current) => [...current, toTeam(created)]);
      setMessage(
        `Team "${created.player}${created.partner ? ` / ${created.partner}` : ""}" added successfully.`,
      );
      setInsertOpen(false);
      setInsertForm({
        playerFullName: "",
        playerEmail: "",
        playerPhone: "",
        playerNationality: "ID",
        playerSkillLevel: "intermediate",
        playerCity: "",
        partnerFullName: "",
        partnerEmail: "",
        partnerSkillLevel: "intermediate",
        category: "",
        paid: false,
        status: "pending",
      });
    } catch (err) {
      setInsertError(
        err instanceof Error ? err.message : "Failed to insert players.",
      );
    } finally {
      setInsertSubmitting(false);
    }
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
                onClick={() => setInsertOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-bold text-on-secondary transition-colors hover:bg-secondary/90"
              >
                <span className="material-symbols-outlined text-lg">
                  person_add
                </span>
                Insert players
              </button>
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
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-4 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                Save settings
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
              <p>{loading ? "Loading tournament data..." : message}</p>
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
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="h-9 rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-bold text-on-surface outline-none"
                    >
                      <option value="all">All categories</option>
                      {(tournament.settings.categories ?? []).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1040px] border-collapse text-left">
                      <colgroup>
                        <col className="w-[28%]" />
                        <col className="w-[11%]" />
                        <col className="w-[11%]" />
                        <col className="w-[9%]" />
                        <col className="w-[11%]" />
                        <col className="w-[11%]" />
                        <col className="w-[19%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-outline-variant/20 bg-surface-container-low text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          <th className="px-5 py-3">Team</th>
                          <th className="px-5 py-3">Category</th>
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
                                {team.partner
                                  ? `${team.player} / ${team.partner}`
                                  : team.player}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                                {team.id} - {team.city}
                              </p>
                              <p className="mt-1 text-xs text-on-surface-variant">
                                Registered {team.registeredAt}
                              </p>
                            </td>
                            <td className="px-5 py-5 text-sm font-semibold text-on-surface">
                              {team.category}
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
                                <option value="">—</option>
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
                                <option value="remove">Remove</option>
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
                        Group Stage — Order of Play
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        Group matches generated from approved paid teams. Edit
                        court assignments and scores in the match detail panel.
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
                      Regenerate groups
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {matches
                      .filter((m) => m.phase === "group")
                      .map((match) => (
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
                  {groupStandings.length === 0 && (
                    <div className="rounded-lg border border-outline-variant/30 bg-white p-8 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.04)] xl:col-span-2">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                        table_chart
                      </span>
                      <p className="mt-3 text-sm font-bold text-on-surface">
                        No groups assigned yet
                      </p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Assign groups to teams in the Registrations tab, or
                        generate the draw to auto-assign them.
                      </p>
                    </div>
                  )}
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
                                  {team.partner
                                    ? `${team.player} / ${team.partner}`
                                    : team.player}
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
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-on-surface">
                        Knockout phase
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        Group winners advance to knockout. Regenerate to update
                        OOP.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => generateDraw("knockout")}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
                    >
                      <span className="material-symbols-outlined text-lg">
                        shuffle
                      </span>
                      Regenerate knockout
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {matches
                      .filter((match) => match.phase === "knockout")
                      .map((match) => (
                        <div
                          key={match.id}
                          className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                                {match.round}
                              </p>
                              <div className="mt-2 grid gap-3 md:grid-cols-2">
                                <div>
                                  <p className="text-sm font-bold text-on-surface">
                                    {getTeamName(teams, match.teamAId)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-on-surface">
                                    {getTeamName(teams, match.teamBId)}
                                  </p>
                                </div>
                              </div>
                              {match.winnerTeamId && (
                                <p className="mt-2 text-xs font-semibold text-secondary">
                                  Winner:{" "}
                                  {getTeamName(teams, match.winnerTeamId)}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMatchId(match.id);
                                setActiveTab("draw");
                              }}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-outline-variant/50 bg-white px-3 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-low"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                edit
                              </span>
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    {matches.filter((m) => m.phase === "knockout").length ===
                      0 && (
                      <div className="rounded-lg bg-surface-container-low p-5 text-sm font-semibold text-on-surface-variant">
                        No knockout matches yet. Generate the draw first, then
                        group winners will appear here.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "courts" && (
                <div className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-on-surface">
                        Order of Play (OOP)
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        Scheduled matches ordered by time across all courts.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface-variant">
                      <span className="material-symbols-outlined text-[15px]">
                        schedule
                      </span>
                      {matches.length} matches
                    </span>
                  </div>
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[700px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-outline-variant/20 bg-surface-container-low text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          <th className="px-4 py-3">Time</th>
                          <th className="px-4 py-3">Court</th>
                          <th className="px-4 py-3">Match</th>
                          <th className="px-4 py-3">Round</th>
                          <th className="px-4 py-3">Score</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {matches
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((match) => (
                            <tr
                              key={match.id}
                              className="align-middle transition-colors hover:bg-surface-container-low/50 cursor-pointer"
                              onClick={() => {
                                setSelectedMatchId(match.id);
                                setActiveTab("draw");
                              }}
                            >
                              <td className="px-4 py-4 text-sm font-bold text-on-surface">
                                {match.time}
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-on-surface-variant">
                                {match.courtId ? `Court ${match.courtId}` : "—"}
                              </td>
                              <td className="px-4 py-4">
                                <p className="text-sm font-bold text-on-surface">
                                  {getTeamName(teams, match.teamAId)}
                                </p>
                                <p className="text-xs text-on-surface-variant">
                                  vs
                                </p>
                                <p className="text-sm font-bold text-on-surface">
                                  {getTeamName(teams, match.teamBId)}
                                </p>
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-on-surface-variant">
                                {match.round}
                              </td>
                              <td className="px-4 py-4 text-sm font-bold text-primary">
                                {match.score}
                              </td>
                              <td className="px-4 py-4">
                                <StatusBadge
                                  {...matchStatusMeta[match.status]}
                                />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
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
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Tournament status
                      </span>
                      <select
                        value={settings.status ?? "setup"}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            status: event.target
                              .value as AdminTournament["status"],
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      >
                        <option value="setup">Setup</option>
                        <option value="registration">Registration</option>
                        <option value="live">Live</option>
                        <option value="completed">Completed</option>
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
                      Manage match status, scoring, and results.
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-primary">
                    dock_to_right
                  </span>
                </div>

                {selectedMatch && (
                  <div className="mt-5 space-y-4">
                    {/* Match info card */}
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

                    {/* Court selector — always visible */}
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

                    {/* ── Scheduled state ── */}
                    {selectedMatch.status === "scheduled" && (
                      <div className="space-y-3">
                        <StatusBadge {...matchStatusMeta.scheduled} />
                        <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-4 text-center">
                          <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                            score
                          </span>
                          <p className="mt-2 text-sm font-semibold text-on-surface-variant">
                            Start the match to enter scores
                          </p>
                        </div>
                        {!selectedMatch.teamAId || !selectedMatch.teamBId ? (
                          <div className="rounded-lg bg-surface-container-low p-4 text-center">
                            <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                              hourglass_empty
                            </span>
                            <p className="mt-2 text-xs font-semibold text-on-surface-variant">
                              Teams not yet determined.
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              updateMatch(selectedMatch.id, { status: "live" })
                            }
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-sm font-bold text-on-secondary shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-colors hover:bg-secondary/90"
                          >
                            <span className="material-symbols-outlined text-lg">
                              play_arrow
                            </span>
                            Start match
                          </button>
                        )}
                      </div>
                    )}

                    {/* ── Live state ── */}
                    {selectedMatch.status === "live" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-error px-3 py-1 text-xs font-bold uppercase text-on-error">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-error" />
                            Live
                          </span>
                        </div>

                        {/* Set-based scoring */}
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Score
                          </span>
                          <div className="mt-2 space-y-2">
                            {draftSets.map((set, index) => {
                              const aWins = set.teamA > set.teamB;
                              const bWins = set.teamB > set.teamA;
                              return (
                                <div
                                  key={`set-${index}-${set.teamA}-${set.teamB}`}
                                  className="flex items-center gap-2 rounded-lg bg-surface-container-low p-3"
                                >
                                  <span className="w-8 text-xs font-bold uppercase text-on-surface-variant">
                                    S{index + 1}
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={99}
                                    value={set.teamA}
                                    onChange={(e) =>
                                      updateDraftSet(
                                        index,
                                        "teamA",
                                        Number(e.target.value),
                                      )
                                    }
                                    className={`h-10 w-16 rounded-lg border bg-white text-center text-lg font-extrabold tabular-nums outline-none transition-colors focus:ring-2 focus:ring-primary/10 ${
                                      aWins
                                        ? "border-secondary/40 bg-secondary/5 text-secondary"
                                        : "border-outline-variant/50 text-on-surface"
                                    }`}
                                  />
                                  <span className="text-sm font-bold text-on-surface-variant">
                                    –
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={99}
                                    value={set.teamB}
                                    onChange={(e) =>
                                      updateDraftSet(
                                        index,
                                        "teamB",
                                        Number(e.target.value),
                                      )
                                    }
                                    className={`h-10 w-16 rounded-lg border bg-white text-center text-lg font-extrabold tabular-nums outline-none transition-colors focus:ring-2 focus:ring-primary/10 ${
                                      bWins
                                        ? "border-secondary/40 bg-secondary/5 text-secondary"
                                        : "border-outline-variant/50 text-on-surface"
                                    }`}
                                  />
                                  {(aWins || bWins) && (
                                    <span className="material-symbols-outlined text-base text-secondary">
                                      check_circle
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeDraftSet(index)}
                                    className="ml-auto text-on-surface-variant transition-colors hover:text-error"
                                    aria-label={`Remove set ${index + 1}`}
                                  >
                                    <span className="material-symbols-outlined text-lg">
                                      close
                                    </span>
                                  </button>
                                </div>
                              );
                            })}
                            <button
                              type="button"
                              onClick={addDraftSet}
                              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-outline-variant/50 text-sm font-bold text-primary transition-colors hover:border-primary/40 hover:bg-primary/5"
                            >
                              <span className="material-symbols-outlined text-lg">
                                add
                              </span>
                              Add set
                            </button>
                          </div>
                        </div>

                        {/* Finish Match */}
                        {draftSets.length > 0 &&
                          !showWinnerPicker &&
                          selectedMatch.teamAId &&
                          selectedMatch.teamBId && (
                            <button
                              type="button"
                              onClick={() => setShowWinnerPicker(true)}
                              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-sm font-bold text-on-secondary shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-colors hover:bg-secondary/90"
                            >
                              <span className="material-symbols-outlined text-lg">
                                emoji_events
                              </span>
                              Finish match
                            </button>
                          )}

                        {showWinnerPicker && (
                          <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-4">
                            <p className="text-sm font-extrabold text-on-surface">
                              Who won the match?
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {selectedMatch.teamAId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    finishMatch(selectedMatch.teamAId ?? "")
                                  }
                                  className="flex h-12 items-center justify-center rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-bold text-on-surface transition-colors hover:border-secondary hover:bg-secondary/5"
                                >
                                  {getTeamName(teams, selectedMatch.teamAId)}
                                </button>
                              )}
                              {selectedMatch.teamBId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    finishMatch(selectedMatch.teamBId ?? "")
                                  }
                                  className="flex h-12 items-center justify-center rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-bold text-on-surface transition-colors hover:border-secondary hover:bg-secondary/5"
                                >
                                  {getTeamName(teams, selectedMatch.teamBId)}
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowWinnerPicker(false)}
                              className="mt-2 w-full text-center text-xs font-bold text-on-surface-variant transition-colors hover:text-primary"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Completed state ── */}
                    {selectedMatch.status === "completed" && (
                      <div className="space-y-3">
                        <StatusBadge {...matchStatusMeta.completed} />

                        {/* Winner banner */}
                        {selectedMatch.winnerTeamId && (
                          <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-4">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-xl text-secondary">
                                emoji_events
                              </span>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                                  Winner
                                </p>
                                <p className="text-sm font-extrabold text-on-surface">
                                  {getTeamName(
                                    teams,
                                    selectedMatch.winnerTeamId,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Read-only score display */}
                        {selectedMatch.scoreSets.length > 0 && (
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                              Final score
                            </span>
                            <div className="mt-2 space-y-2">
                              {selectedMatch.scoreSets.map((set, index) => {
                                const aWins = set.teamA > set.teamB;
                                const bWins = set.teamB > set.teamA;
                                return (
                                  <div
                                    key={`set-${index}-${set.teamA}-${set.teamB}`}
                                    className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3"
                                  >
                                    <span className="w-8 text-xs font-bold uppercase text-on-surface-variant">
                                      S{index + 1}
                                    </span>
                                    <span
                                      className={`text-lg font-extrabold tabular-nums ${
                                        aWins
                                          ? "text-secondary"
                                          : "text-on-surface-variant"
                                      }`}
                                    >
                                      {set.teamA}
                                    </span>
                                    <span className="text-sm font-bold text-on-surface-variant">
                                      –
                                    </span>
                                    <span
                                      className={`text-lg font-extrabold tabular-nums ${
                                        bWins
                                          ? "text-secondary"
                                          : "text-on-surface-variant"
                                      }`}
                                    >
                                      {set.teamB}
                                    </span>
                                    {(aWins || bWins) && (
                                      <span className="material-symbols-outlined text-base text-secondary">
                                        check_circle
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <p className="mt-2 text-center text-sm font-bold text-primary">
                              {selectedMatch.score}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Referee — editable except when completed */}
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
                        disabled={selectedMatch.status === "completed"}
                        className={`mt-2 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface ${
                          selectedMatch.status === "completed"
                            ? "cursor-not-allowed opacity-50"
                            : ""
                        }`}
                      />
                    </label>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />

      {removeTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/45 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-registration-title"
            aria-describedby="remove-registration-description"
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-[0px_24px_80px_rgba(17,24,39,0.22)]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-error/10 text-error">
              <span className="material-symbols-outlined">person_remove</span>
            </div>
            <h2
              id="remove-registration-title"
              className="text-xl font-extrabold text-on-surface"
            >
              Remove registration?
            </h2>
            <p
              id="remove-registration-description"
              className="mt-2 text-sm leading-relaxed text-on-surface-variant"
            >
              This will permanently remove{" "}
              <span className="font-bold text-on-surface">
                {removeTarget.partner
                  ? `${removeTarget.player} / ${removeTarget.partner}`
                  : removeTarget.player}
              </span>{" "}
              from this tournament.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                disabled={removingTeamId === removeTarget.id}
                className="h-10 rounded-lg border border-outline-variant/50 px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-wait disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={removeTeam}
                disabled={removingTeamId === removeTarget.id}
                className="h-10 rounded-lg bg-error px-4 text-sm font-bold text-on-error transition-colors hover:bg-error/90 disabled:cursor-wait disabled:opacity-70"
              >
                {removingTeamId === removeTarget.id
                  ? "Removing..."
                  : "Remove registration"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => generateDraw("group")}
                className="h-10 rounded-lg bg-secondary px-4 text-sm font-bold text-on-secondary transition-colors hover:bg-secondary/90"
              >
                Groups only
              </button>
              <button
                type="button"
                onClick={() => generateDraw("all")}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
              >
                Generate all
              </button>
            </div>
          </div>
        </div>
      )}

      {insertOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/45 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="insert-players-title"
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-[0px_24px_80px_rgba(17,24,39,0.22)] max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <h2
              id="insert-players-title"
              className="text-xl font-extrabold text-on-surface"
            >
              Insert players
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Manually register a team (player + partner) for this tournament.
            </p>

            <div className="mt-6 grid gap-4">
              <fieldset className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
                <legend className="text-sm font-extrabold text-on-surface px-2">
                  Player
                </legend>
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Full name *
                      </span>
                      <input
                        value={insertForm.playerFullName}
                        onChange={(e) =>
                          setInsertForm((f) => ({
                            ...f,
                            playerFullName: e.target.value,
                          }))
                        }
                        placeholder="Player name"
                        className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Email *
                      </span>
                      <input
                        type="email"
                        value={insertForm.playerEmail}
                        onChange={(e) =>
                          setInsertForm((f) => ({
                            ...f,
                            playerEmail: e.target.value,
                          }))
                        }
                        placeholder="player@email.com"
                        className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Phone *
                      </span>
                      <input
                        value={insertForm.playerPhone}
                        onChange={(e) =>
                          setInsertForm((f) => ({
                            ...f,
                            playerPhone: e.target.value,
                          }))
                        }
                        placeholder="+62..."
                        className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Nationality
                      </span>
                      <input
                        value={insertForm.playerNationality}
                        onChange={(e) =>
                          setInsertForm((f) => ({
                            ...f,
                            playerNationality: e.target.value,
                          }))
                        }
                        placeholder="ID"
                        className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Skill level
                      </span>
                      <select
                        value={insertForm.playerSkillLevel}
                        onChange={(e) =>
                          setInsertForm((f) => ({
                            ...f,
                            playerSkillLevel: e.target.value,
                          }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="professional">Professional</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        City
                      </span>
                      <input
                        value={insertForm.playerCity}
                        onChange={(e) =>
                          setInsertForm((f) => ({
                            ...f,
                            playerCity: e.target.value,
                          }))
                        }
                        placeholder="Jakarta"
                        className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                  </div>
                </div>
              </fieldset>

              {(tournament.settings.categories ?? []).length > 0 && (
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Category
                  </span>
                  <select
                    value={insertForm.category}
                    onChange={(e) =>
                      setInsertForm((f) => ({
                        ...f,
                        category: e.target.value,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="">Select category</option>
                    {(tournament.settings.categories ?? []).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <fieldset className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
                <legend className="text-sm font-extrabold text-on-surface px-2">
                  Partner
                </legend>
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Full name *
                      </span>
                      <input
                        value={insertForm.partnerFullName}
                        onChange={(e) =>
                          setInsertForm((f) => ({
                            ...f,
                            partnerFullName: e.target.value,
                          }))
                        }
                        placeholder="Partner name"
                        className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Email *
                      </span>
                      <input
                        type="email"
                        value={insertForm.partnerEmail}
                        onChange={(e) =>
                          setInsertForm((f) => ({
                            ...f,
                            partnerEmail: e.target.value,
                          }))
                        }
                        placeholder="partner@email.com"
                        className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Skill level
                    </span>
                    <select
                      value={insertForm.partnerSkillLevel}
                      onChange={(e) =>
                        setInsertForm((f) => ({
                          ...f,
                          partnerSkillLevel: e.target.value,
                        }))
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="professional">Professional</option>
                    </select>
                  </label>
                </div>
              </fieldset>

              <fieldset className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
                <legend className="text-sm font-extrabold text-on-surface px-2">
                  Admin overrides
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={insertForm.paid}
                      onChange={(e) =>
                        setInsertForm((f) => ({
                          ...f,
                          paid: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span className="text-sm font-semibold text-on-surface">
                      Mark as paid
                    </span>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Team status
                    </span>
                    <select
                      value={insertForm.status}
                      onChange={(e) =>
                        setInsertForm((f) => ({
                          ...f,
                          status: e.target.value as TeamStatus,
                        }))
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="waitlist">Waitlist</option>
                    </select>
                  </label>
                </div>
              </fieldset>
            </div>

            {insertError && (
              <div className="mt-5 rounded-lg border border-error/20 bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-lg">
                    error
                  </span>
                  <p>{insertError}</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setInsertOpen(false);
                  setInsertError("");
                }}
                disabled={insertSubmitting}
                className="h-10 rounded-lg border border-outline-variant/50 px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-wait disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitInsertPlayers}
                disabled={insertSubmitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-secondary px-4 text-sm font-bold text-on-secondary transition-colors hover:bg-secondary/90 disabled:cursor-wait disabled:opacity-70"
              >
                <span className="material-symbols-outlined text-lg">
                  {insertSubmitting ? "hourglass_top" : "person_add"}
                </span>
                {insertSubmitting ? "Inserting..." : "Insert players"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
