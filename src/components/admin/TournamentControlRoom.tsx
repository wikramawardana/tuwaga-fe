"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DateRangePicker, { formatDateRange } from "@/components/DateRangePicker";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import type { AdminTournament } from "@/lib/adminTournaments";
import {
  createDivisionLabel,
  DIVISION_SKILL_LEVELS,
  type DivisionSkillLevel,
  divisionSkillLevel,
} from "@/lib/matchDivisions";
import {
  buildOopWorkbook,
  type DrawMatchResult,
  downloadBlob,
  matchToTeams,
  padelCahOopTemplate,
  parseDrawWorkbook,
} from "@/lib/oopFile";
import {
  type AdminCreateRegistrationInput,
  type Match as ApiMatch,
  type TeamStatus as ApiTeamStatus,
  adminCreateRegistration,
  deleteRegistration,
  generateDraw as generateDrawRequest,
  getOop,
  getTournament,
  importDraw as importDrawRequest,
  listMatches,
  listRegistrations,
  type MatchStatus,
  type OopPlan,
  type OopSettings,
  type Phase,
  type RegistrationTeam,
  type Tournament,
  updateMatch as updateMatchRequest,
  updateRegistration,
  updateSettings,
} from "@/lib/tuwagaApi";

type TeamStatus = Exclude<ApiTeamStatus, "rejected">;
type AdminTab = "setup" | "registrations" | "schedule" | "matches" | "results";
type TeamFilter = "all" | TeamStatus;

type Team = {
  id: string;
  player: string;
  partner: string;
  category: string;
  city: string;
  paid: boolean;
  registeredAt: string;
  status: TeamStatus;
  group: string;
  seed: number | null;
};

type Match = {
  id: string;
  category: string;
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
  groupSize: 4,
  qualifierCount: 16,
  divisionSettings: {},
  status: "setup",
  categories: [],
  name: "",
  venue: "",
  dateLabel: "",
  startsAt: "",
  endsAt: "",
  description: "",
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
      groupSize: tournament.settings.groupSize,
      qualifierCount: tournament.settings.qualifierCount,
      divisionSettings: tournament.settings.divisionSettings ?? {},
      oop: tournament.settings.oop,
      status: tournament.status,
      categories: tournament.settings.categories ?? [],
      name: tournament.name,
      venue: tournament.venue,
      dateLabel: tournament.dateLabel,
      startsAt: tournament.startsAt ?? "",
      endsAt: tournament.endsAt ?? "",
      description: tournament.description,
    },
  };
}

function getTeamName(teams: Team[], teamId: string | null) {
  if (!teamId) return "TBD";

  const team = teams.find((item) => item.id === teamId);
  if (!team) return "TBD";

  return team.partner ? `${team.player} / ${team.partner}` : team.player;
}

// Same palette as the exported workbook: women purple, men blue, misc green.
function oopCategoryClasses(category: string): string {
  const value = category.toLowerCase();
  if (
    value.includes("women") ||
    value.includes("ladies") ||
    value.includes("female")
  ) {
    return "bg-[#B4A7D6] text-black";
  }
  if (value.includes("men") || value.includes("male")) {
    return "bg-[#CFE2F3] text-black";
  }
  return "bg-[#C6E0B4] text-black";
}

function toTeam(team: RegistrationTeam): Team {
  return {
    id: team.id,
    player: team.player,
    partner: team.partner ?? "",
    category: team.category,
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
    seed: team.seed ?? null,
  };
}

function toMatch(match: ApiMatch): Match {
  const rawSets = match.scoreSets ?? [];
  return {
    id: match.id,
    category: match.category ?? "",
    phase: match.phase,
    group: match.group,
    round: match.round,
    courtId: match.courtId,
    time: match.time,
    teamAId: match.teamAId,
    teamBId: match.teamBId,
    score: match.score,
    scoreSets: rawSets.map((s: Record<string, number>) => ({
      teamA: s.team_a ?? s.teamA ?? 0,
      teamB: s.team_b ?? s.teamB ?? 0,
    })),
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

/** Mirror of the backend grouping: full groups, a lone leftover joins the previous group. */
function countGroups(teamCount: number, groupSize: number): number {
  if (teamCount < 2) return 0;
  const size = Math.max(2, groupSize);
  const groups = Math.ceil(teamCount / size);
  return groups > 1 && teamCount % size === 1 ? groups - 1 : groups;
}

/** Mirror of the qualification rule: group winners first, then best runner-ups. */
function qualifierBreakdown(
  teamCount: number,
  groups: number,
  qualifierCount: number,
): string {
  const winners = Math.min(groups, qualifierCount);
  const runnerUps = Math.min(groups, Math.max(0, qualifierCount - winners));
  const advancing = Math.min(teamCount, winners + runnerUps);
  const shownWinners = Math.min(winners, advancing);
  const shownRunners = advancing - shownWinners;
  const parts = [`${shownWinners} group winners`];
  if (shownRunners > 0) {
    parts.push(`${shownRunners} runner-ups`);
  }
  return `${advancing} advance (${parts.join(" + ")})`;
}

/** Effective group size for a division: its override, else the default. */
function divisionGroupSize(
  settings: AdminTournament["settings"],
  division: string,
): number {
  return settings.divisionSettings?.[division]?.groupSize ?? settings.groupSize;
}

/** Effective knockout size for a division: its override, else the default. */
function divisionKnockoutSize(
  settings: AdminTournament["settings"],
  division: string,
): number {
  return (
    settings.divisionSettings?.[division]?.knockoutSize ??
    settings.qualifierCount
  );
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
  const [activeTab, setActiveTab] = useState<AdminTab>("setup");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [matchCategoryFilter, setMatchCategoryFilter] = useState("all");
  const [matchPhaseFilter, setMatchPhaseFilter] = useState<"all" | Phase>(
    "all",
  );
  const [newDivisionName, setNewDivisionName] = useState("");
  const [newDivisionLevel, setNewDivisionLevel] =
    useState<DivisionSkillLevel>("intermediate");
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
    playerCity: "",
    partnerFullName: "",
    partnerEmail: "",
    category: "",
    paid: false,
    status: "pending" as TeamStatus,
  });
  // Full API shapes kept alongside the view models: the OOP export needs the
  // raw tournament settings and team seeds, which the admin view drops.
  const [rawTournament, setRawTournament] = useState<Tournament | null>(null);
  const [rawTeams, setRawTeams] = useState<RegistrationTeam[]>([]);
  const [oopPlan, setOopPlan] = useState<OopPlan | null>(null);
  const [importPreview, setImportPreview] = useState<DrawMatchResult | null>(
    null,
  );
  const [importFileName, setImportFileName] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [exportingOop, setExportingOop] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function loadTournamentRuntime() {
      setLoading(true);
      try {
        const [remoteTournament, remoteTeams, remoteMatches, remoteOop] =
          await Promise.all([
            getTournament(tournamentId),
            listRegistrations(tournamentId),
            listMatches(tournamentId),
            getOop(tournamentId).catch(() => null),
          ]);

        if (!active) return;
        const adminTournament = toAdminTournament(remoteTournament);
        setTournament(adminTournament);
        setRawTournament(remoteTournament);
        setRawTeams(remoteTeams);
        setTeams(remoteTeams.map(toTeam));
        const nextMatches = remoteMatches.map(toMatch);
        setMatches(nextMatches);
        setSettings(adminTournament.settings);
        setOopPlan(remoteOop);
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

  // Projection shown in Setup: mirrors what "Generate draw" will produce for
  // the teams that are approved and paid right now.
  const drawPreview = useMemo(() => {
    const eligible = teams.filter(
      (team) => team.status === "approved" && team.paid,
    );
    const byDivision = new Map<string, number>();
    for (const team of eligible) {
      const division = team.category.trim() || "Open Division";
      byDivision.set(division, (byDivision.get(division) ?? 0) + 1);
    }
    return [...byDivision.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([division, teamCount]) => {
        const groupSize = divisionGroupSize(settings, division);
        const knockoutSize = divisionKnockoutSize(settings, division);
        const groups = countGroups(teamCount, groupSize);
        return {
          division,
          teamCount,
          groupSize,
          knockoutSize,
          groups,
          advancement:
            groups > 0
              ? qualifierBreakdown(teamCount, groups, knockoutSize)
              : "Needs at least two teams to draw",
        };
      });
  }, [settings, teams]);

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

  const filteredMatches = useMemo(
    () =>
      matches.filter(
        (match) =>
          (matchCategoryFilter === "all" ||
            match.category === matchCategoryFilter) &&
          (matchPhaseFilter === "all" || match.phase === matchPhaseFilter),
      ),
    [matchCategoryFilter, matchPhaseFilter, matches],
  );

  const groupStandings = useMemo(() => {
    type StandingRow = Team & {
      played: number;
      wins: number;
      losses: number;
      points: number;
    };
    const standings: Record<string, StandingRow[]> = {};

    matches
      .filter(
        (match) =>
          match.phase === "group" &&
          (matchCategoryFilter === "all" ||
            match.category === matchCategoryFilter),
      )
      .forEach((match) => {
        const group =
          match.group ?? `${match.category || "Open Division"} · Group`;
        standings[group] = standings[group] ?? [];
        const rows = standings[group];
        [match.teamAId, match.teamBId].forEach((teamId) => {
          const team = teams.find((item) => item.id === teamId);
          if (team && !rows.some((row) => row.id === team.id)) {
            rows.push({
              ...team,
              played: 0,
              wins: 0,
              losses: 0,
              points: 0,
            });
          }
        });

        if (match.status !== "completed") return;
        rows.forEach((row) => {
          if (row.id === match.teamAId || row.id === match.teamBId) {
            row.played += 1;
            if (row.id === match.winnerTeamId) {
              row.wins += 1;
              row.points += 3;
            } else {
              row.losses += 1;
            }
          }
        });
      });

    return Object.entries(standings).sort(([groupA], [groupB]) =>
      groupA.localeCompare(groupB),
    );
  }, [matchCategoryFilter, matches, teams]);

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
      const apiPatch: Record<string, unknown> = { ...patch };
      if (patch.scoreSets) {
        apiPatch.scoreSets = patch.scoreSets.map((s) => ({
          team_a: s.teamA,
          team_b: s.teamB,
        }));
      }
      try {
        const updated = await updateMatchRequest(
          tournamentId,
          matchId,
          apiPatch as Partial<Match>,
        );
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

  const lastSyncedMatchId = useRef<string | null>(null);

  useEffect(() => {
    const matchId = selectedMatch?.id ?? null;
    if (matchId !== lastSyncedMatchId.current) {
      lastSyncedMatchId.current = matchId;
      setDraftSets(selectedMatch?.scoreSets ?? []);
      setShowWinnerPicker(false);
    }
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedMatch || selectedMatch.status !== "live") return;
    const timer = setTimeout(() => {
      updateMatch(selectedMatch.id, {
        scoreSets: draftSets,
        score: computeScoreString(draftSets),
      });
    }, 5000);
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

    const finalSets = draftSets;
    const finalScore = computeScoreString(finalSets);
    const completedPatch = {
      winnerTeamId,
      status: "completed" as MatchStatus,
      scoreSets: finalSets,
      score: finalScore,
    };

    // Optimistic update — immediately show completed
    setMatchPatch(selectedMatch.id, completedPatch);
    lastSyncedMatchId.current = null; // prevent sync effect from resetting

    try {
      const apiPatch: Record<string, unknown> = { ...completedPatch };
      apiPatch.scoreSets = finalSets.map((s) => ({
        team_a: s.teamA,
        team_b: s.teamB,
      }));
      await updateMatchRequest(
        tournamentId,
        selectedMatch.id,
        apiPatch as Partial<Match>,
      );
      setMessage(`Match ${selectedMatch.id} completed.`);
    } catch (err) {
      setMatches((current) =>
        current.map((m) =>
          m.id === selectedMatch.id
            ? { ...m, status: "live" as MatchStatus }
            : m,
        ),
      );
      setMessage(
        err instanceof Error ? err.message : "Failed to finish match.",
      );
    }
  };

  const saveSettings = async () => {
    try {
      const payload = { ...settings };
      if (payload.startsAt && payload.endsAt) {
        payload.dateLabel = formatDateRange(payload.startsAt, payload.endsAt);
      }
      const saved = await updateSettings(tournamentId, payload);
      // Refetch so header fields (name, venue, dates, description) stay in
      // sync with what the backend stored.
      const remote = await getTournament(tournamentId);
      const fresh = toAdminTournament(remote);
      setTournament(fresh);
      setRawTournament(remote);
      setSettings({
        ...fresh.settings,
        maxPlayers: saved.maxPlayers,
        waitlistLimit: saved.waitlistLimit,
        courts: saved.courts,
        matchDuration: saved.matchDuration,
        teamSize: saved.teamSize,
        format: saved.format,
        groupSize: saved.groupSize,
        qualifierCount: saved.qualifierCount,
        divisionSettings: saved.divisionSettings ?? {},
        oop: saved.oop,
        categories: saved.categories,
      });
      setMessage(
        `${fresh.name} settings saved: ${saved.maxPlayers} max players, ${saved.courts} courts, ${saved.format}, status: ${settings.status ?? "unchanged"}.`,
      );
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to save settings.",
      );
    }
  };

  const addDivision = () => {
    const division = createDivisionLabel(newDivisionName, newDivisionLevel);
    if (!division || settings.categories.includes(division)) return;
    setSettings((current) => ({
      ...current,
      categories: [...current.categories, division],
    }));
    setNewDivisionName("");
  };

  const removeDivision = (division: string) => {
    const isInUse =
      teams.some((team) => team.category === division) ||
      matches.some((match) => match.category === division);
    if (isInUse) {
      setMessage(
        `${division} cannot be removed because registrations or matches already use it.`,
      );
      return;
    }
    setSettings((current) => {
      const overrides = { ...(current.divisionSettings ?? {}) };
      delete overrides[division];
      return {
        ...current,
        categories: current.categories.filter((item) => item !== division),
        divisionSettings: overrides,
      };
    });
  };

  const setDivisionOverride = (
    division: string,
    field: "groupSize" | "knockoutSize",
    value: number | null,
  ) => {
    setSettings((current) => {
      const overrides = { ...(current.divisionSettings ?? {}) };
      const entry = { ...(overrides[division] ?? {}) };
      if (value === null) {
        delete entry[field];
      } else {
        entry[field] = value;
      }
      if (Object.keys(entry).length === 0) {
        delete overrides[division];
      } else {
        overrides[division] = entry;
      }
      return { ...current, divisionSettings: overrides };
    });
  };

  const setDivisionBronze = (division: string, enabled: boolean) => {
    setSettings((current) => {
      const overrides = { ...(current.divisionSettings ?? {}) };
      const entry = { ...(overrides[division] ?? {}) };
      if (enabled) {
        entry.bronzeMatch = true;
      } else {
        delete entry.bronzeMatch;
      }
      if (Object.keys(entry).length === 0) {
        delete overrides[division];
      } else {
        overrides[division] = entry;
      }
      return { ...current, divisionSettings: overrides };
    });
  };

  const updateOopSettings = (updater: (oop: OopSettings) => OopSettings) => {
    setSettings((current) => ({
      ...current,
      oop: updater(
        current.oop ?? {
          startTime: "09:00",
          slotsPerSession: 6,
          categoryOrder: [],
          sessions: [],
          knockoutOrder: [],
        },
      ),
    }));
  };

  // True once an official draw file has been imported: every eligible team
  // carries a seed number, and regenerating must keep those groups.
  const hasImportedDraw = useMemo(() => {
    const eligible = teams.filter(
      (team) => team.status === "approved" && team.paid,
    );
    return eligible.length > 0 && eligible.every((team) => team.seed != null);
  }, [teams]);

  const refreshDrawRuntime = useCallback(async () => {
    const [remoteTeams, remoteMatches, remoteOop] = await Promise.all([
      listRegistrations(tournamentId),
      listMatches(tournamentId),
      getOop(tournamentId).catch(() => null),
    ]);
    setRawTeams(remoteTeams);
    setTeams(remoteTeams.map(toTeam));
    const nextMatches = remoteMatches.map(toMatch);
    setMatches(nextMatches);
    setOopPlan(remoteOop);
    setSelectedMatchId(nextMatches[0]?.id ?? "");
  }, [tournamentId]);

  const generateDraw = async (
    phase: "group" | "knockout" | "all" = "all",
    options: { useExistingGroups?: boolean } = {},
  ) => {
    setConfirmDraw(false);
    try {
      const draw = await generateDrawRequest(tournamentId, phase, options);
      await refreshDrawRuntime();
      setActiveTab("schedule");
      setMessage(draw.message);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to generate draw.",
      );
    }
  };

  const exportOopFile = async () => {
    if (!rawTournament || !oopPlan || oopPlan.sessions.length === 0) {
      setMessage("Generate the draw before exporting the order of play.");
      return;
    }
    setExportingOop(true);
    try {
      const blob = await buildOopWorkbook({
        tournament: rawTournament,
        teams: rawTeams,
        plan: oopPlan,
      });
      downloadBlob(blob, `OOP ${rawTournament.name.toUpperCase()}.xlsx`);
      setMessage("Order of play exported as an .xlsx workbook.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to export the OOP file.",
      );
    } finally {
      setExportingOop(false);
    }
  };

  const openImportPicker = () => importInputRef.current?.click();

  const handleImportFile = async (file: File | null) => {
    if (!file) return;
    try {
      const parsed = await parseDrawWorkbook(file);
      if (parsed.rows.length === 0) {
        setMessage(
          "No draw rows found. Expected sheets with No. / Player 1 / Player 2 / GROUP columns starting at row 12.",
        );
        return;
      }
      const result = matchToTeams(parsed, rawTeams);
      setImportFileName(file.name);
      setImportPreview(result);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to read the workbook.",
      );
    }
  };

  const confirmImportDraw = async () => {
    if (!importPreview || importPreview.assignments.length === 0) return;
    setImportBusy(true);
    try {
      await importDrawRequest(
        tournamentId,
        importPreview.assignments.map((assignment) => ({
          teamId: assignment.teamId,
          group: assignment.group,
          seed: assignment.seed,
        })),
      );
      setImportPreview(null);
      setImportFileName("");
      await generateDraw("all", { useExistingGroups: true });
      setMessage(
        "Official draw imported: groups and seeds applied, matches regenerated.",
      );
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to import the draw.",
      );
    } finally {
      setImportBusy(false);
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
    if (!insertForm.category) {
      setInsertError("Select a match division.");
      return;
    }

    setInsertSubmitting(true);
    try {
      const divisionLevel = divisionSkillLevel(insertForm.category);
      const input: AdminCreateRegistrationInput = {
        player: {
          fullName: insertForm.playerFullName.trim(),
          email: insertForm.playerEmail.trim(),
          phone: insertForm.playerPhone.trim(),
          nationality: insertForm.playerNationality,
          skillLevel: divisionLevel,
          city: insertForm.playerCity.trim() || null,
        },
        partner: {
          fullName: insertForm.partnerFullName.trim(),
          email: insertForm.partnerEmail.trim(),
          skillLevel: divisionLevel,
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
        playerCity: "",
        partnerFullName: "",
        partnerEmail: "",
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
    { id: "setup", label: "1. Setup", icon: "tune" },
    { id: "registrations", label: "2. Registrations", icon: "how_to_reg" },
    { id: "schedule", label: "3. Draw & Schedule", icon: "account_tree" },
    { id: "matches", label: "4. Matches", icon: "sports_tennis" },
    { id: "results", label: "5. Results", icon: "emoji_events" },
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
                {tournament.description} Follow setup, registrations, draw and
                schedule, match operations, then results for {tournament.venue},{" "}
                {tournament.date}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeTab === "registrations" && (
                <>
                  <button
                    type="button"
                    onClick={openImportPicker}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-4 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-lg">
                      upload_file
                    </span>
                    Import draw (.xlsx)
                  </button>
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
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = "";
                      void handleImportFile(file);
                    }}
                  />
                </>
              )}
              {activeTab === "schedule" && (
                <>
                  <button
                    type="button"
                    onClick={() => void exportOopFile()}
                    disabled={exportingOop}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-4 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:cursor-wait disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-lg">
                      download
                    </span>
                    {exportingOop ? "Exporting..." : "Export OOP (.xlsx)"}
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
                </>
              )}
              {activeTab === "setup" && (
                <button
                  type="button"
                  onClick={saveSettings}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-4 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-lg">
                    save
                  </span>
                  Save setup
                </button>
              )}
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

          <div
            className={`mt-6 grid min-w-0 items-stretch gap-6 ${
              activeTab === "matches"
                ? "xl:grid-cols-[minmax(0,1fr)_380px]"
                : ""
            }`}
          >
            <section className="flex min-h-0 min-w-0 flex-col gap-6">
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
                      <option value="all">All divisions</option>
                      {settings.categories.map((division) => (
                        <option key={division} value={division}>
                          {division}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1040px] border-collapse text-left">
                      <colgroup>
                        <col className="w-[29%]" />
                        <col className="w-[20%]" />
                        <col className="w-[9%]" />
                        <col className="w-[11%]" />
                        <col className="w-[11%]" />
                        <col className="w-[20%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-outline-variant/20 bg-surface-container-low text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          <th className="px-5 py-3">Team</th>
                          <th className="px-5 py-3">Match division</th>
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
                            <td className="px-5 py-5">
                              <span className="inline-flex h-9 min-w-16 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-low px-2.5 text-sm font-bold text-on-surface">
                                {team.group
                                  ? (team.group.split(" · ").pop() ??
                                    team.group)
                                  : "—"}
                              </span>
                              <span className="mt-1 block text-[11px] text-on-surface-variant">
                                {team.seed != null
                                  ? `Seed ${team.seed} (official draw)`
                                  : "Assigned by draw"}
                              </span>
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

              {activeTab === "matches" && (
                <div className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-on-surface">
                        Match operations
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        Select a scheduled, live, or completed match to manage
                        scoring in the detail panel.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={matchCategoryFilter}
                        onChange={(event) =>
                          setMatchCategoryFilter(event.target.value)
                        }
                        className="h-10 rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-bold text-on-surface"
                        aria-label="Filter matches by division"
                      >
                        <option value="all">All divisions</option>
                        {settings.categories.map((division) => (
                          <option key={division} value={division}>
                            {division}
                          </option>
                        ))}
                      </select>
                      <select
                        value={matchPhaseFilter}
                        onChange={(event) =>
                          setMatchPhaseFilter(
                            event.target.value as "all" | Phase,
                          )
                        }
                        className="h-10 rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-bold text-on-surface"
                        aria-label="Filter matches by phase"
                      >
                        <option value="all">All phases</option>
                        <option value="group">Group stage</option>
                        <option value="knockout">Knockout</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {filteredMatches.map((match) => (
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
                            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                              {match.category || "Open Division"} ·{" "}
                              {match.phase}
                            </p>
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
                    {filteredMatches.length === 0 && (
                      <div className="rounded-lg bg-surface-container-low p-5 text-sm font-semibold text-on-surface-variant xl:col-span-2">
                        No matches found for these filters. Generate and publish
                        the draw from Draw & Schedule first.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "results" && (
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="flex flex-col gap-3 rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between xl:col-span-2">
                    <div>
                      <h2 className="text-lg font-extrabold text-on-surface">
                        Tournament results
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        Group standings and knockout results stay separated by
                        match division.
                      </p>
                    </div>
                    <select
                      value={matchCategoryFilter}
                      onChange={(event) =>
                        setMatchCategoryFilter(event.target.value)
                      }
                      className="h-10 rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-bold text-on-surface"
                      aria-label="Filter results by division"
                    >
                      <option value="all">All divisions</option>
                      {settings.categories.map((division) => (
                        <option key={division} value={division}>
                          {division}
                        </option>
                      ))}
                    </select>
                  </div>
                  {groupStandings.length === 0 && (
                    <div className="rounded-lg border border-outline-variant/30 bg-white p-8 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.04)] xl:col-span-2">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                        table_chart
                      </span>
                      <p className="mt-3 text-sm font-bold text-on-surface">
                        No groups assigned yet
                      </p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Generate the draw and complete group matches to populate
                        standings.
                      </p>
                    </div>
                  )}
                  {groupStandings.map(([group, rows]) => (
                    <div
                      key={group}
                      className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]"
                    >
                      <h2 className="text-lg font-extrabold text-on-surface">
                        {group}
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

              {activeTab === "results" && (
                <div className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-on-surface">
                        Knockout phase
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        Group winners and the best runner-ups advance to
                        knockout. Regenerate to update OOP.
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
                      .filter(
                        (match) =>
                          match.phase === "knockout" &&
                          (matchCategoryFilter === "all" ||
                            match.category === matchCategoryFilter),
                      )
                      .map((match) => (
                        <div
                          key={match.id}
                          className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                                {match.category || "Open Division"} ·{" "}
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
                                setActiveTab("matches");
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
                    {matches.filter(
                      (match) =>
                        match.phase === "knockout" &&
                        (matchCategoryFilter === "all" ||
                          match.category === matchCategoryFilter),
                    ).length === 0 && (
                      <div className="rounded-lg bg-surface-container-low p-5 text-sm font-semibold text-on-surface-variant">
                        No knockout matches yet. Generate the draw first, then
                        group winners will appear here.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "schedule" && (
                <div className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-on-surface">
                        Order of Play (OOP)
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        {oopPlan?.title ??
                          "Session-based schedule across all courts."}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface-variant">
                        <span className="material-symbols-outlined text-[15px]">
                          schedule
                        </span>
                        {matches.length} matches
                      </span>
                    </div>
                  </div>

                  {!oopPlan || oopPlan.sessions.length === 0 ? (
                    <div className="mt-5 rounded-lg bg-surface-container-low p-6 text-sm font-semibold text-on-surface-variant">
                      No order of play yet. Generate the draw (or import an
                      official draw file from the Registrations tab) to build
                      the session schedule.
                    </div>
                  ) : (
                    <div className="mt-5 space-y-8">
                      {oopPlan.sessions.map((session, sessionIndex) => (
                        <div
                          key={`${session.timeLabel}-${sessionIndex}`}
                          className="overflow-hidden rounded-lg border border-outline-variant/25"
                        >
                          <div className="flex flex-wrap items-center gap-3 bg-[#E69138] px-4 py-2.5">
                            <span className="material-symbols-outlined text-lg text-white">
                              schedule
                            </span>
                            <p className="text-sm font-extrabold uppercase tracking-wide text-white">
                              {session.timeLabel}
                            </p>
                            <p className="ml-auto text-xs font-bold text-white/80">
                              {session.slots.length}{" "}
                              {session.slots.length === 1 ? "slot" : "slots"}
                            </p>
                          </div>
                          <div className="overflow-x-auto">
                            <div
                              className="grid min-w-[760px]"
                              style={{
                                gridTemplateColumns: `56px repeat(${oopPlan.courts}, minmax(165px, 1fr))`,
                              }}
                            >
                              <div className="bg-surface-container-low px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                #
                              </div>
                              {Array.from(
                                { length: oopPlan.courts },
                                (_, courtIndex) => `Court ${courtIndex + 1}`,
                              ).map((courtLabel) => (
                                <div
                                  key={courtLabel}
                                  className="border-l border-outline-variant/15 bg-surface-container-low px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-on-surface-variant"
                                >
                                  {courtLabel}
                                </div>
                              ))}
                              {session.slots.map((slot) => {
                                const firstEntry =
                                  slot.courts.find((entry) => entry != null) ??
                                  null;
                                const isEvent = firstEntry?.kind === "event";
                                return (
                                  <Fragment key={slot.number}>
                                    <div className="flex items-center justify-center border-t border-outline-variant/15 bg-surface-container-low/60 px-2 py-3 text-sm font-extrabold text-on-surface">
                                      {slot.number}
                                    </div>
                                    {isEvent && firstEntry ? (
                                      <div
                                        style={{ gridColumn: "2 / -1" }}
                                        className="flex items-center justify-center border-t border-outline-variant/15 bg-[#FFD966] px-3 py-4 text-center text-sm font-extrabold uppercase tracking-wide text-black"
                                      >
                                        {firstEntry.title}
                                      </div>
                                    ) : (
                                      slot.courts
                                        .map((entry, courtIndex) => ({
                                          entry,
                                          courtLabel: `Court ${courtIndex + 1}`,
                                        }))
                                        .map(({ entry, courtLabel }) => (
                                          <div
                                            key={`${slot.number}-${courtLabel}`}
                                            className="border-l border-t border-outline-variant/15 p-1.5"
                                          >
                                            {entry && entry.kind === "match" ? (
                                              <div
                                                className={`h-full rounded-md p-2 ${oopCategoryClasses(entry.category)}`}
                                              >
                                                <p className="text-[11px] font-extrabold leading-4">
                                                  {entry.matchLabel}
                                                </p>
                                                <p className="text-[10px] font-bold opacity-70">
                                                  {entry.stageLabel}
                                                </p>
                                                <div className="mt-1.5 space-y-1">
                                                  {entry.matchIds.map(
                                                    (matchId) => {
                                                      const match =
                                                        matches.find(
                                                          (item) =>
                                                            item.id === matchId,
                                                        );
                                                      if (!match) return null;
                                                      return (
                                                        <button
                                                          key={matchId}
                                                          type="button"
                                                          onClick={() => {
                                                            setSelectedMatchId(
                                                              matchId,
                                                            );
                                                            setActiveTab(
                                                              "matches",
                                                            );
                                                          }}
                                                          className="block w-full rounded bg-white/55 px-1.5 py-1 text-left text-[10px] font-semibold leading-3.5 text-black transition-colors hover:bg-white"
                                                        >
                                                          {getTeamName(
                                                            teams,
                                                            match.teamAId,
                                                          )}{" "}
                                                          vs{" "}
                                                          {getTeamName(
                                                            teams,
                                                            match.teamBId,
                                                          )}
                                                          <span className="opacity-60">
                                                            {" "}
                                                            ·{" "}
                                                            {
                                                              matchStatusMeta[
                                                                match.status
                                                              ].label
                                                            }
                                                            {match.score
                                                              ? ` · ${match.score}`
                                                              : ""}
                                                          </span>
                                                        </button>
                                                      );
                                                    },
                                                  )}
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="h-full min-h-9" />
                                            )}
                                          </div>
                                        ))
                                    )}
                                  </Fragment>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "setup" && (
                <div className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                  <h2 className="text-lg font-extrabold text-on-surface">
                    Tournament setup
                  </h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Tournament name
                      </span>
                      <input
                        value={settings.name ?? ""}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Jakarta Summer Open"
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                      <span className="mt-1 block text-xs text-on-surface-variant">
                        Renaming keeps the public tournament URL unchanged.
                      </span>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Venue
                      </span>
                      <input
                        value={settings.venue ?? ""}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            venue: event.target.value,
                          }))
                        }
                        placeholder="Main Arena"
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <div className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Date range
                      </span>
                      <DateRangePicker
                        startsAt={settings.startsAt ?? ""}
                        endsAt={settings.endsAt ?? ""}
                        onChange={(startsAt, endsAt) =>
                          setSettings((current) => ({
                            ...current,
                            startsAt,
                            endsAt,
                          }))
                        }
                      />
                    </div>
                    <label className="block md:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Description
                      </span>
                      <textarea
                        value={settings.description ?? ""}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Describe tournament purpose and operating notes."
                        className="mt-2 w-full resize-none rounded-lg border border-outline-variant/50 bg-white px-3 py-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
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
                        Teams per group
                      </span>
                      <input
                        type="number"
                        min="2"
                        max="16"
                        value={settings.groupSize}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            groupSize: Number(event.target.value),
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                      <span className="mt-1 block text-xs text-on-surface-variant">
                        Every group plays a full round robin. Regenerate the
                        draw to apply.
                      </span>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Knockout size
                      </span>
                      <select
                        value={settings.qualifierCount}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            qualifierCount: Number(event.target.value),
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      >
                        <option value={8}>8 teams (Quarter-finals)</option>
                        <option value={16}>16 teams (Round of 16)</option>
                        <option value={24}>24 teams (Round of 24)</option>
                        <option value={32}>32 teams (Round of 32)</option>
                      </select>
                      <span className="mt-1 block text-xs text-on-surface-variant">
                        Group winners qualify first, then the best runner-ups
                        fill the bracket. Example: 9 groups + 16 slots = 9
                        winners + 7 best runner-ups.
                      </span>
                    </label>
                    <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4 md:col-span-2">
                      <h3 className="text-sm font-extrabold text-on-surface">
                        Group stage projection
                      </h3>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Based on teams that are approved and paid right now.
                        Generating the draw splits each division into groups
                        using its own group size below.
                      </p>
                      {drawPreview.length === 0 ? (
                        <p className="mt-3 text-sm font-semibold text-on-surface-variant">
                          No eligible teams yet. Approve and mark teams as paid
                          to see the group projection.
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-2">
                          {drawPreview.map((preview) => (
                            <li
                              key={preview.division}
                              className="rounded-lg border border-outline-variant/20 bg-white px-4 py-3 text-sm"
                            >
                              <span className="font-extrabold text-on-surface">
                                {preview.division}
                              </span>
                              <span className="text-on-surface-variant">
                                {" "}
                                — {preview.teamCount} teams →{" "}
                                {preview.groups > 0
                                  ? `${preview.groups} groups of ${preview.groupSize}`
                                  : "no draw"}{" "}
                                → {preview.advancement}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4 md:col-span-2">
                      <h3 className="text-sm font-extrabold text-on-surface">
                        Per-division format
                      </h3>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Override the group size and knockout size for a single
                        division. Leave a value on "Default" to use the
                        tournament-wide setting above. Regenerate the draw to
                        apply.
                      </p>
                      {settings.categories.length === 0 ? (
                        <p className="mt-3 text-sm font-semibold text-on-surface-variant">
                          Add a match division to configure its format.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {settings.categories.map((division) => {
                            const override =
                              settings.divisionSettings?.[division] ?? {};
                            return (
                              <div
                                key={division}
                                className="rounded-lg border border-outline-variant/20 bg-white p-4"
                              >
                                <p className="text-sm font-extrabold text-on-surface">
                                  {division}
                                </p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <label className="block">
                                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                      Teams per group
                                    </span>
                                    <select
                                      value={override.groupSize ?? ""}
                                      onChange={(event) =>
                                        setDivisionOverride(
                                          division,
                                          "groupSize",
                                          event.target.value === ""
                                            ? null
                                            : Number(event.target.value),
                                        )
                                      }
                                      className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    >
                                      <option value="">
                                        Default ({settings.groupSize})
                                      </option>
                                      {[2, 3, 4, 5, 6, 7, 8].map((size) => (
                                        <option key={size} value={size}>
                                          {size} teams
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className="block">
                                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                      Knockout size
                                    </span>
                                    <select
                                      value={override.knockoutSize ?? ""}
                                      onChange={(event) =>
                                        setDivisionOverride(
                                          division,
                                          "knockoutSize",
                                          event.target.value === ""
                                            ? null
                                            : Number(event.target.value),
                                        )
                                      }
                                      className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    >
                                      <option value="">
                                        Default ({settings.qualifierCount})
                                      </option>
                                      <option value={8}>
                                        8 teams (Quarter-finals)
                                      </option>
                                      <option value={16}>
                                        16 teams (Round of 16)
                                      </option>
                                      <option value={24}>
                                        24 teams (Round of 24)
                                      </option>
                                      <option value={32}>
                                        32 teams (Round of 32)
                                      </option>
                                    </select>
                                  </label>
                                </div>
                                <label className="mt-3 flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={override.bronzeMatch === true}
                                    onChange={(event) =>
                                      setDivisionBronze(
                                        division,
                                        event.target.checked,
                                      )
                                    }
                                    className="h-4 w-4 accent-primary"
                                  />
                                  <span className="text-sm font-semibold text-on-surface">
                                    Bronze match (3rd place play-off)
                                  </span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4 md:col-span-2">
                      <h3 className="text-sm font-extrabold text-on-surface">
                        Order of Play (OOP) sessions
                      </h3>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Session times, special events and the knockout order
                        used by the Draw &amp; Schedule tab and the .xlsx
                        export. Save setup to apply.
                      </p>
                      {!settings.oop ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSettings((current) => ({
                              ...current,
                              oop: padelCahOopTemplate(current.categories),
                            }))
                          }
                          className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
                        >
                          <span className="material-symbols-outlined text-lg">
                            magic_button
                          </span>
                          Load PadelCah! session plan
                        </button>
                      ) : (
                        <div className="mt-3 space-y-4">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                First session start
                              </span>
                              <input
                                value={settings.oop.startTime}
                                onChange={(event) =>
                                  updateOopSettings((oop) => ({
                                    ...oop,
                                    startTime: event.target.value,
                                  }))
                                }
                                placeholder="09:00"
                                className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                Slots per session
                              </span>
                              <input
                                type="number"
                                min="1"
                                max="12"
                                value={settings.oop.slotsPerSession}
                                onChange={(event) =>
                                  updateOopSettings((oop) => ({
                                    ...oop,
                                    slotsPerSession: Math.max(
                                      1,
                                      Number(event.target.value) || 1,
                                    ),
                                  }))
                                }
                                className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                              />
                            </label>
                            <div className="block">
                              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                Groups fill courts first
                              </span>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {settings.categories.map((division) => {
                                  const active =
                                    settings.oop?.categoryOrder.includes(
                                      division,
                                    ) ?? false;
                                  return (
                                    <button
                                      key={division}
                                      type="button"
                                      onClick={() =>
                                        updateOopSettings((oop) => ({
                                          ...oop,
                                          categoryOrder: active
                                            ? oop.categoryOrder.filter(
                                                (item) => item !== division,
                                              )
                                            : [...oop.categoryOrder, division],
                                        }))
                                      }
                                      className={`h-9 rounded-lg border px-2.5 text-xs font-bold transition-colors ${
                                        active
                                          ? "border-primary/30 bg-primary/10 text-primary"
                                          : "border-outline-variant/50 bg-white text-on-surface-variant hover:border-primary/30"
                                      }`}
                                    >
                                      {division}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {settings.oop.sessions.map((session, index) => (
                              <div
                                key={`${session.time}-${index}`}
                                className="grid items-end gap-2 rounded-lg border border-outline-variant/20 bg-white p-3 sm:grid-cols-[110px_auto_110px_1fr_auto]"
                              >
                                <label className="block">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                    Time
                                  </span>
                                  <input
                                    value={session.time}
                                    onChange={(event) =>
                                      updateOopSettings((oop) => ({
                                        ...oop,
                                        sessions: oop.sessions.map((item, i) =>
                                          i === index
                                            ? {
                                                ...item,
                                                time: event.target.value,
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                    placeholder="11:00"
                                    className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none focus:border-primary"
                                  />
                                </label>
                                <label className="flex h-10 items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={session.notBefore}
                                    onChange={(event) =>
                                      updateOopSettings((oop) => ({
                                        ...oop,
                                        sessions: oop.sessions.map((item, i) =>
                                          i === index
                                            ? {
                                                ...item,
                                                notBefore: event.target.checked,
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                    className="h-4 w-4 accent-primary"
                                  />
                                  <span className="text-xs font-bold text-on-surface">
                                    Not before
                                  </span>
                                </label>
                                <label className="block">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                    Capacity
                                  </span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={session.capacity ?? ""}
                                    placeholder="Auto"
                                    onChange={(event) =>
                                      updateOopSettings((oop) => ({
                                        ...oop,
                                        sessions: oop.sessions.map((item, i) =>
                                          i === index
                                            ? {
                                                ...item,
                                                capacity:
                                                  event.target.value === ""
                                                    ? null
                                                    : Math.max(
                                                        1,
                                                        Number(
                                                          event.target.value,
                                                        ) || 1,
                                                      ),
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                    className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none focus:border-primary"
                                  />
                                </label>
                                <div className="grid gap-2 sm:grid-cols-3">
                                  <label className="block">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                      Events before
                                    </span>
                                    <input
                                      value={(session.eventsBefore ?? []).join(
                                        ", ",
                                      )}
                                      onChange={(event) =>
                                        updateOopSettings((oop) => ({
                                          ...oop,
                                          sessions: oop.sessions.map(
                                            (item, i) =>
                                              i === index
                                                ? {
                                                    ...item,
                                                    eventsBefore:
                                                      event.target.value
                                                        .split(",")
                                                        .map((s) => s.trim())
                                                        .filter(Boolean),
                                                  }
                                                : item,
                                          ),
                                        }))
                                      }
                                      placeholder="OPENING CEREMONY"
                                      className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-2 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                      Events mid (Title@slot)
                                    </span>
                                    <input
                                      value={(session.eventsMid ?? [])
                                        .map(
                                          (item) =>
                                            `${item.title}@${item.afterSlot}`,
                                        )
                                        .join(", ")}
                                      onChange={(event) =>
                                        updateOopSettings((oop) => ({
                                          ...oop,
                                          sessions: oop.sessions.map(
                                            (item, i) =>
                                              i === index
                                                ? {
                                                    ...item,
                                                    eventsMid:
                                                      event.target.value
                                                        .split(",")
                                                        .map((raw) => {
                                                          const [title, slot] =
                                                            raw
                                                              .trim()
                                                              .split("@");
                                                          return {
                                                            title: (
                                                              title ?? ""
                                                            ).trim(),
                                                            afterSlot:
                                                              Number(slot) || 1,
                                                          };
                                                        })
                                                        .filter(
                                                          (item) => item.title,
                                                        ),
                                                  }
                                                : item,
                                          ),
                                        }))
                                      }
                                      placeholder="GAMES@1"
                                      className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-2 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                      Events after
                                    </span>
                                    <input
                                      value={(session.eventsAfter ?? []).join(
                                        ", ",
                                      )}
                                      onChange={(event) =>
                                        updateOopSettings((oop) => ({
                                          ...oop,
                                          sessions: oop.sessions.map(
                                            (item, i) =>
                                              i === index
                                                ? {
                                                    ...item,
                                                    eventsAfter:
                                                      event.target.value
                                                        .split(",")
                                                        .map((s) => s.trim())
                                                        .filter(Boolean),
                                                  }
                                                : item,
                                          ),
                                        }))
                                      }
                                      placeholder="AWARDING"
                                      className="mt-1 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-2 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                                    />
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateOopSettings((oop) => ({
                                      ...oop,
                                      sessions: oop.sessions.filter(
                                        (_, i) => i !== index,
                                      ),
                                    }))
                                  }
                                  aria-label={`Remove session ${session.time}`}
                                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant/50 text-on-surface-variant transition-colors hover:border-error/40 hover:text-error"
                                >
                                  <span className="material-symbols-outlined text-lg">
                                    delete
                                  </span>
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                updateOopSettings((oop) => ({
                                  ...oop,
                                  sessions: [
                                    ...oop.sessions,
                                    { time: "", notBefore: true },
                                  ],
                                }))
                              }
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-outline-variant/60 px-3 text-xs font-bold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                add
                              </span>
                              Add session
                            </button>
                          </div>

                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                              Knockout order
                            </span>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {settings.oop.knockoutOrder.length === 0 ? (
                                <span className="text-xs font-semibold text-on-surface-variant">
                                  Empty — rounds are scheduled automatically in
                                  division order.
                                </span>
                              ) : (
                                settings.oop.knockoutOrder.map(
                                  (entry, index) => (
                                    <span
                                      key={`${entry.category}-${index}`}
                                      className="inline-flex items-center rounded-lg border border-outline-variant/40 bg-white px-2.5 py-1 text-[11px] font-bold text-on-surface"
                                    >
                                      {entry.category.replace(
                                        /\s*[—–-]\s*/g,
                                        " ",
                                      )}
                                      {" · "}
                                      {typeof entry.stage === "number"
                                        ? `Round ${entry.stage}`
                                        : entry.stage === "3rd-place"
                                          ? "3rd Place"
                                          : entry.stage}
                                    </span>
                                  ),
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Match format
                      </span>
                      <select
                        value={settings.format}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            format: event.target.value,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                      >
                        <option>Group stage + knockout</option>
                        <option>Single elimination</option>
                        <option>Round robin</option>
                        <option>Swiss pairing</option>
                      </select>
                    </label>
                    <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4 md:col-span-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-on-surface">
                          Match divisions
                        </h3>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Each division combines match category and skill level.
                          Existing divisions cannot be removed after teams or
                          matches use them.
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {settings.categories.map((division) => {
                          const isInUse =
                            teams.some((team) => team.category === division) ||
                            matches.some(
                              (match) => match.category === division,
                            );
                          return (
                            <span
                              key={division}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-sm font-bold text-primary"
                            >
                              {division}
                              <button
                                type="button"
                                onClick={() => removeDivision(division)}
                                disabled={isInUse}
                                aria-label={`Remove ${division}`}
                                title={
                                  isInUse
                                    ? "Move its registrations and matches before removing this division."
                                    : `Remove ${division}`
                                }
                                className="flex h-5 w-5 items-center justify-center rounded-full text-primary/60 transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  close
                                </span>
                              </button>
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input
                          value={newDivisionName}
                          onChange={(event) =>
                            setNewDivisionName(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addDivision();
                            }
                          }}
                          placeholder="e.g. Mixed Doubles"
                          className="h-10 min-w-[180px] flex-1 rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                        <select
                          value={newDivisionLevel}
                          onChange={(event) =>
                            setNewDivisionLevel(
                              event.target.value as DivisionSkillLevel,
                            )
                          }
                          className="h-10 w-[160px] max-w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface"
                        >
                          {DIVISION_SKILL_LEVELS.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={addDivision}
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            add
                          </span>
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {activeTab === "matches" && (
              <aside className="flex min-w-0">
                <div className="h-full min-w-0 w-full overflow-hidden rounded-lg border border-outline-variant/30 bg-white p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
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
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                          {selectedMatch.category || "Open Division"}
                        </p>
                        <p className="break-all text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          {selectedMatch.id} - {selectedMatch.round}
                        </p>
                        <h3 className="mt-2 break-words text-lg font-extrabold text-on-surface">
                          {getTeamName(teams, selectedMatch.teamAId)}
                        </h3>
                        <p className="my-2 text-xs font-bold uppercase tracking-wider text-primary">
                          versus
                        </p>
                        <h3 className="break-words text-lg font-extrabold text-on-surface">
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
                                updateMatch(selectedMatch.id, {
                                  status: "live",
                                })
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
                                    className="flex min-w-0 items-center gap-1.5 rounded-lg bg-surface-container-low p-2.5 sm:gap-2 sm:p-3"
                                  >
                                    <span className="w-6 shrink-0 text-xs font-bold uppercase text-on-surface-variant sm:w-8">
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
                                      className={`h-10 w-12 min-w-0 rounded-lg border bg-white text-center text-base font-extrabold tabular-nums outline-none transition-colors focus:ring-2 focus:ring-primary/10 sm:w-16 sm:text-lg ${
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
                                      className={`h-10 w-12 min-w-0 rounded-lg border bg-white text-center text-base font-extrabold tabular-nums outline-none transition-colors focus:ring-2 focus:ring-primary/10 sm:w-16 sm:text-lg ${
                                        bWins
                                          ? "border-secondary/40 bg-secondary/5 text-secondary"
                                          : "border-outline-variant/50 text-on-surface"
                                      }`}
                                    />
                                    {(aWins || bWins) && (
                                      <span className="material-symbols-outlined hidden text-base text-secondary sm:inline-block">
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

                      {/* ── Completed state (editable) ── */}
                      {selectedMatch.status === "completed" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <StatusBadge {...matchStatusMeta.completed} />
                            <button
                              type="button"
                              onClick={() =>
                                updateMatch(selectedMatch.id, {
                                  status: "live",
                                  winnerTeamId: null,
                                })
                              }
                              className="ml-auto inline-flex h-8 items-center gap-1 rounded-lg border border-outline-variant/50 px-2.5 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
                            >
                              <span className="material-symbols-outlined text-sm">
                                replay
                              </span>
                              Reopen
                            </button>
                          </div>

                          {/* Winner banner — editable */}
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

                          {/* Editable score sets */}
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
                                    className="flex min-w-0 items-center gap-1.5 rounded-lg bg-surface-container-low p-2.5 sm:gap-2 sm:p-3"
                                  >
                                    <span className="w-6 shrink-0 text-xs font-bold uppercase text-on-surface-variant sm:w-8">
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
                                      className={`h-10 w-12 min-w-0 rounded-lg border bg-white text-center text-base font-extrabold tabular-nums outline-none transition-colors focus:ring-2 focus:ring-primary/10 sm:w-16 sm:text-lg ${
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
                                      className={`h-10 w-12 min-w-0 rounded-lg border bg-white text-center text-base font-extrabold tabular-nums outline-none transition-colors focus:ring-2 focus:ring-primary/10 sm:w-16 sm:text-lg ${
                                        bWins
                                          ? "border-secondary/40 bg-secondary/5 text-secondary"
                                          : "border-outline-variant/50 text-on-surface"
                                      }`}
                                    />
                                    {(aWins || bWins) && (
                                      <span className="material-symbols-outlined hidden text-base text-secondary sm:inline-block">
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

                          {/* Change winner */}
                          <label className="block">
                            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                              Winner
                            </span>
                            <select
                              value={selectedMatch.winnerTeamId ?? ""}
                              onChange={(event) =>
                                updateMatch(selectedMatch.id, {
                                  winnerTeamId: event.target.value || null,
                                })
                              }
                              className="mt-2 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface"
                            >
                              <option value="">No winner</option>
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

                          {/* Save score changes */}
                          <button
                            type="button"
                            onClick={() =>
                              updateMatch(selectedMatch.id, {
                                scoreSets: draftSets,
                                score: computeScoreString(draftSets),
                              })
                            }
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-on-primary shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-colors hover:bg-primary/90"
                          >
                            <span className="material-symbols-outlined text-lg">
                              save
                            </span>
                            Save changes
                          </button>
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
                          className="mt-2 h-10 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </aside>
            )}
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
              {hasImportedDraw
                ? "An official draw is imported: groups and seeds are kept, and matches are rebuilt around them."
                : "This will rebuild group matches and knockout placeholders from approved paid teams."}
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
                onClick={() =>
                  generateDraw("group", {
                    useExistingGroups: hasImportedDraw,
                  })
                }
                className="h-10 rounded-lg bg-secondary px-4 text-sm font-bold text-on-secondary transition-colors hover:bg-secondary/90"
              >
                Groups only
              </button>
              <button
                type="button"
                onClick={() =>
                  generateDraw("all", { useExistingGroups: hasImportedDraw })
                }
                className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
              >
                Generate all
              </button>
            </div>
          </div>
        </div>
      )}

      {importPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/45 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-draw-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-[0px_24px_80px_rgba(17,24,39,0.22)]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">upload_file</span>
            </div>
            <h2
              id="import-draw-title"
              className="text-xl font-extrabold text-on-surface"
            >
              Import official draw
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              {importFileName}: matched{" "}
              <span className="font-bold text-on-surface">
                {importPreview.assignments.length}
              </span>{" "}
              of {rawTeams.length} registered teams against the workbook rows.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {Object.entries(importPreview.byCategory).map(
                ([category, count]) => (
                  <div
                    key={category}
                    className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm font-bold text-on-surface"
                  >
                    {category}
                    <span className="float-right text-primary">
                      {count} teams
                    </span>
                  </div>
                ),
              )}
            </div>

            {importPreview.warnings.length > 0 && (
              <div className="mt-4 rounded-lg border border-tertiary/30 bg-tertiary/10 p-3">
                <p className="text-xs font-extrabold uppercase tracking-wider text-tertiary">
                  Warnings
                </p>
                <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto text-xs font-semibold text-on-surface-variant">
                  {importPreview.warnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {importPreview.unmatched.length > 0 && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/10 p-3">
                <p className="text-xs font-extrabold uppercase tracking-wider text-error">
                  Unmatched rows — fix registration names before importing
                </p>
                <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto text-xs font-semibold text-on-surface-variant">
                  {importPreview.unmatched.map((row) => (
                    <li key={`${row.sheetName}-${row.no}`}>
                      • {row.sheetName} #{row.no}: {row.player1}
                      {row.player2 ? ` / ${row.player2}` : ""} (Group{" "}
                      {row.group || "?"})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportPreview(null);
                  setImportFileName("");
                }}
                disabled={importBusy}
                className="h-10 rounded-lg border border-outline-variant/50 px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-wait disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmImportDraw()}
                disabled={
                  importBusy ||
                  importPreview.assignments.length === 0 ||
                  importPreview.unmatched.length > 0
                }
                className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importBusy
                  ? "Importing..."
                  : "Import draw & regenerate matches"}
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
                  <div>
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

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Match division *
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
                  <option value="">Select match division</option>
                  {settings.categories.map((division) => (
                    <option key={division} value={division}>
                      {division}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-on-surface-variant">
                  The division sets the competition level for both players.
                </p>
              </label>

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
