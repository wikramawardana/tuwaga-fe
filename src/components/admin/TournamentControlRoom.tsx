"use client";

import Link from "next/link";
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
  adminCreateRegistration,
  type DivisionSettings,
  deleteRegistration,
  generateDraw as generateDrawRequest,
  getOop,
  getTournament,
  importDraw as importDrawRequest,
  listMatches,
  listRegistrations,
  type Match,
  type MatchStatus,
  type OopPlan,
  type OopSettings,
  type Phase,
  type RegistrationTeam,
  type TeamStatus,
  type Tournament,
  type TournamentSettings,
  type TournamentStatus,
  updateMatch,
  updateRegistration,
  updateSettings,
} from "@/lib/tuwagaApi";

type AdminSection = "setup" | "registrations" | "operations" | "results";
type RegistrationFilter = "all" | Exclude<TeamStatus, "rejected">;
type EditableSettings = TournamentSettings & {
  status: TournamentStatus;
  name: string;
  venue: string;
  dateLabel: string;
  startsAt: string;
  endsAt: string;
  description: string;
};

const emptySettings: EditableSettings = {
  maxPlayers: 64,
  waitlistLimit: 12,
  courts: 4,
  matchDuration: 30,
  teamSize: "Doubles",
  format: "Group stage + knockout",
  groupSize: 4,
  qualifierCount: 16,
  knockoutSeedMode: "standings",
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

const sectionItems: Array<{
  id: AdminSection;
  step: string;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    id: "setup",
    step: "01",
    label: "Tournament setup",
    description: "Identity, format and divisions",
    icon: "tune",
  },
  {
    id: "registrations",
    step: "02",
    label: "Teams",
    description: "Review readiness and payment",
    icon: "groups",
  },
  {
    id: "operations",
    step: "03",
    label: "Match operations",
    description: "Draw, schedule and scoring",
    icon: "space_dashboard",
  },
  {
    id: "results",
    step: "04",
    label: "Results",
    description: "Standings and completed matches",
    icon: "emoji_events",
  },
];

const statusStyle: Record<TournamentStatus, string> = {
  setup: "border-slate-200 bg-slate-100 text-slate-700",
  registration: "border-blue-200 bg-blue-50 text-blue-700",
  live: "border-rose-200 bg-rose-50 text-rose-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const matchStatusStyle: Record<MatchStatus, string> = {
  scheduled: "border-blue-200 bg-blue-50 text-blue-700",
  live: "border-rose-200 bg-rose-50 text-rose-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function teamName(team: RegistrationTeam) {
  return team.partner ? `${team.player} / ${team.partner}` : team.player;
}

function getTeamName(teams: RegistrationTeam[], id: string | null) {
  if (!id) return "Waiting for team";
  const team = teams.find((item) => item.id === id);
  return team ? teamName(team) : "Waiting for team";
}

function effectiveGroupSize(settings: EditableSettings, division: string) {
  return settings.divisionSettings?.[division]?.groupSize ?? settings.groupSize;
}

function effectiveKnockoutSize(settings: EditableSettings, division: string) {
  return (
    settings.divisionSettings?.[division]?.knockoutSize ??
    settings.qualifierCount
  );
}

function countGroups(teamCount: number, groupSize: number) {
  if (teamCount < 2) return 0;
  const groups = Math.ceil(teamCount / Math.max(2, groupSize));
  return groups > 1 && teamCount % Math.max(2, groupSize) === 1
    ? groups - 1
    : groups;
}

function oopCategoryClasses(category: string) {
  const value = category.toLowerCase();
  if (value.includes("women")) return "bg-violet-100 text-violet-950";
  if (value.includes("men")) return "bg-blue-100 text-blue-950";
  return "bg-emerald-100 text-emerald-950";
}

function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-600">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  accent = "blue",
}: {
  icon: string;
  label: string;
  value: string | number;
  detail: string;
  accent?: "blue" | "rose" | "emerald" | "amber";
}) {
  const tones = {
    blue: "bg-blue-600 text-white shadow-blue-200",
    rose: "bg-rose-500 text-white shadow-rose-200",
    emerald: "bg-emerald-500 text-white shadow-emerald-200",
    amber: "bg-amber-400 text-slate-950 shadow-amber-200",
  };
  return (
    <div className="admin-rise group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_50px_rgba(37,99,235,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
        </div>
        <span
          className={cx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110",
            tones[accent],
          )}
        >
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </span>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-200 bg-gradient-to-br from-blue-50/80 to-white px-6 py-14 text-center">
      <span className="admin-float mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </span>
      <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function TournamentControlRoom({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [settings, setSettings] = useState<EditableSettings>(emptySettings);
  const [teams, setTeams] = useState<RegistrationTeam[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeSection, setActiveSection] = useState<AdminSection>("setup");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Loading tournament command center…");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<RegistrationFilter>("all");
  const [teamDivision, setTeamDivision] = useState("all");
  const [matchSearch, setMatchSearch] = useState("");
  const [matchStatus, setMatchStatus] = useState<"all" | MatchStatus>("all");
  const [matchPhase, setMatchPhase] = useState<"all" | Phase>("all");
  const [matchDivision, setMatchDivision] = useState("all");
  const [newDivision, setNewDivision] = useState("");
  const [newDivisionLevel, setNewDivisionLevel] =
    useState<DivisionSkillLevel>("intermediate");
  const [drawDialog, setDrawDialog] = useState(false);
  const [insertDialog, setInsertDialog] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<RegistrationTeam | null>(
    null,
  );
  const [submittingTeam, setSubmittingTeam] = useState(false);
  const [formError, setFormError] = useState("");
  const [oopPlan, setOopPlan] = useState<OopPlan | null>(null);
  const [selectedOopSession, setSelectedOopSession] = useState(0);
  const [oopCompact, setOopCompact] = useState(true);
  const [importPreview, setImportPreview] = useState<DrawMatchResult | null>(
    null,
  );
  const [importFileName, setImportFileName] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [exportingOop, setExportingOop] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
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
    status: "pending" as Exclude<TeamStatus, "rejected">,
  });

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [nextTournament, nextTeams, nextMatches, nextOop] =
          await Promise.all([
            getTournament(tournamentId),
            listRegistrations(tournamentId),
            listMatches(tournamentId),
            getOop(tournamentId).catch(() => null),
          ]);
        if (!active) return;
        setTournament(nextTournament);
        setTeams(nextTeams);
        setMatches(nextMatches);
        setOopPlan(nextOop);
        setSettings({
          ...nextTournament.settings,
          status: nextTournament.status,
          name: nextTournament.name,
          venue: nextTournament.venue,
          dateLabel: nextTournament.dateLabel,
          startsAt: nextTournament.startsAt ?? "",
          endsAt: nextTournament.endsAt ?? "",
          description: nextTournament.description,
        });
        setMessage("Command center synced with the latest tournament data.");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Unable to load tournament.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [tournamentId]);

  const totals = useMemo(() => {
    const approved = teams.filter((team) => team.status === "approved").length;
    const paid = teams.filter((team) => team.paid).length;
    const eligible = teams.filter(
      (team) => team.status === "approved" && team.paid,
    ).length;
    return {
      approved,
      paid,
      eligible,
      live: matches.filter((match) => match.status === "live").length,
      scheduled: matches.filter((match) => match.status === "scheduled").length,
      completed: matches.filter((match) => match.status === "completed").length,
    };
  }, [matches, teams]);

  const oopSessionSummaries = useMemo(
    () =>
      (oopPlan?.sessions ?? []).map((session) => {
        let matchCount = 0;
        let eventCount = 0;
        for (const slot of session.slots) {
          for (const entry of slot.courts) {
            if (entry?.kind === "match") matchCount += entry.matchIds.length;
            if (entry?.kind === "event") eventCount += 1;
          }
        }
        return { matchCount, eventCount };
      }),
    [oopPlan],
  );

  const activeOopSession = oopPlan?.sessions[selectedOopSession] ?? null;

  useEffect(() => {
    const finalIndex = Math.max(0, (oopPlan?.sessions.length ?? 1) - 1);
    setSelectedOopSession((current) => Math.min(current, finalIndex));
  }, [oopPlan]);

  const filteredTeams = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();
    return teams.filter((team) => {
      const searchable = [team.id, team.player, team.partner, team.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (teamFilter === "all" || team.status === teamFilter) &&
        (teamDivision === "all" || team.category === teamDivision)
      );
    });
  }, [teamDivision, teamFilter, teamSearch, teams]);

  const oopOrderMap = useMemo(() => {
    const order = new Map<string, number>();
    let index = 0;
    for (const session of oopPlan?.sessions ?? []) {
      for (const slot of session.slots) {
        for (const entry of slot.courts) {
          if (entry?.kind !== "match") continue;
          for (const id of entry.matchIds) {
            if (!order.has(id)) order.set(id, index++);
          }
        }
      }
    }
    return order;
  }, [oopPlan]);

  const filteredMatches = useMemo(() => {
    const query = matchSearch.trim().toLowerCase();
    return matches
      .filter((match) => {
        const searchable = [
          match.id,
          match.round,
          match.category,
          getTeamName(teams, match.teamAId),
          getTeamName(teams, match.teamBId),
        ]
          .join(" ")
          .toLowerCase();
        return (
          (!query || searchable.includes(query)) &&
          (matchStatus === "all" || match.status === matchStatus) &&
          (matchPhase === "all" || match.phase === matchPhase) &&
          (matchDivision === "all" || match.category === matchDivision)
        );
      })
      .sort(
        (a, b) =>
          (oopOrderMap.get(a.id) ?? 99999) - (oopOrderMap.get(b.id) ?? 99999),
      );
  }, [
    matchDivision,
    matchPhase,
    matchSearch,
    matchStatus,
    matches,
    oopOrderMap,
    teams,
  ]);

  const drawPreview = useMemo(() => {
    const byDivision = new Map<string, number>();
    teams
      .filter((team) => team.status === "approved" && team.paid)
      .forEach((team) => {
        byDivision.set(team.category, (byDivision.get(team.category) ?? 0) + 1);
      });
    return settings.categories.map((division) => {
      const teamCount = byDivision.get(division) ?? 0;
      const groupSize = effectiveGroupSize(settings, division);
      return {
        division,
        teamCount,
        groupSize,
        groups: countGroups(teamCount, groupSize),
        knockoutSize: effectiveKnockoutSize(settings, division),
      };
    });
  }, [settings, teams]);

  const groupStandings = useMemo(() => {
    type Row = {
      id: string;
      name: string;
      played: number;
      wins: number;
      losses: number;
      gamesWon: number;
      gamesLost: number;
      diff: number;
      points: number;
    };
    const groups = new Map<string, Row[]>();
    matches
      .filter((match) => match.phase === "group")
      .forEach((match) => {
        const group = match.group ?? `${match.category} · Group`;
        const key = `${match.category} · ${group}`;
        const rows = groups.get(key) ?? [];
        [match.teamAId, match.teamBId].forEach((id) => {
          if (!id || rows.some((row) => row.id === id)) return;
          rows.push({
            id,
            name: getTeamName(teams, id),
            played: 0,
            wins: 0,
            losses: 0,
            gamesWon: 0,
            gamesLost: 0,
            diff: 0,
            points: 0,
          });
        });
        if (match.status === "completed") {
          const parsedSets = match.scoreSets.length
            ? match.scoreSets
            : (match.score ?? "")
                .split(/[,;\s]+/)
                .map((token) => token.split(token.includes(":") ? ":" : "-"))
                .filter((parts) => parts.length === 2)
                .map(([teamA, teamB]) => ({
                  teamA: Number.parseInt(teamA, 10) || 0,
                  teamB: Number.parseInt(teamB, 10) || 0,
                }));
          const gamesA = parsedSets.reduce(
            (total, set) => total + set.teamA,
            0,
          );
          const gamesB = parsedSets.reduce(
            (total, set) => total + set.teamB,
            0,
          );
          rows.forEach((row) => {
            if (row.id !== match.teamAId && row.id !== match.teamBId) return;
            row.played += 1;
            if (row.id === match.teamAId) {
              row.gamesWon += gamesA;
              row.gamesLost += gamesB;
            } else {
              row.gamesWon += gamesB;
              row.gamesLost += gamesA;
            }
            row.diff = row.gamesWon;
            if (row.id === match.winnerTeamId) {
              row.wins += 1;
              row.points += 1;
            } else {
              row.losses += 1;
            }
          });
        }
        groups.set(key, rows);
      });
    return [...groups.entries()].map(([group, rows]) => ({
      group,
      rows: rows.sort(
        (a, b) =>
          b.points - a.points ||
          b.diff - a.diff ||
          b.wins - a.wins ||
          a.name.localeCompare(b.name),
      ),
    }));
  }, [matches, teams]);

  async function saveSettings() {
    setSaving(true);
    try {
      const payload = { ...settings };
      if (payload.startsAt && payload.endsAt) {
        payload.dateLabel = formatDateRange(payload.startsAt, payload.endsAt);
      }
      await updateSettings(tournamentId, payload);
      const refreshed = await getTournament(tournamentId);
      setTournament(refreshed);
      setSettings({
        ...refreshed.settings,
        status: refreshed.status,
        name: refreshed.name,
        venue: refreshed.venue,
        dateLabel: refreshed.dateLabel,
        startsAt: refreshed.startsAt ?? "",
        endsAt: refreshed.endsAt ?? "",
        description: refreshed.description,
      });
      setMessage(
        "Tournament settings saved and published to the command center.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  function addDivision() {
    const label = createDivisionLabel(newDivision, newDivisionLevel);
    if (!label || settings.categories.includes(label)) return;
    setSettings((current) => ({
      ...current,
      categories: [...current.categories, label],
    }));
    setNewDivision("");
  }

  function removeDivision(division: string) {
    const used =
      teams.some((team) => team.category === division) ||
      matches.some((match) => match.category === division);
    if (used) {
      setMessage(
        "Move existing registrations and matches before removing " +
          division +
          ".",
      );
      return;
    }
    setSettings((current) => {
      const divisionSettings = { ...(current.divisionSettings ?? {}) };
      delete divisionSettings[division];
      return {
        ...current,
        categories: current.categories.filter((item) => item !== division),
        divisionSettings,
      };
    });
  }

  function setDivisionOverride(
    division: string,
    field: keyof DivisionSettings,
    value: number | boolean | undefined,
  ) {
    setSettings((current) => ({
      ...current,
      divisionSettings: {
        ...(current.divisionSettings ?? {}),
        [division]: {
          ...(current.divisionSettings?.[division] ?? {}),
          [field]: value,
        },
      },
    }));
  }

  function updateOopSettings(updater: (oop: OopSettings) => OopSettings) {
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
  }

  const refreshOperations = useCallback(async () => {
    const [nextTeams, nextMatches, nextOop] = await Promise.all([
      listRegistrations(tournamentId),
      listMatches(tournamentId),
      getOop(tournamentId).catch(() => null),
    ]);
    setTeams(nextTeams);
    setMatches(nextMatches);
    setOopPlan(nextOop);
  }, [tournamentId]);

  async function patchTeam(
    team: RegistrationTeam,
    patch: Partial<Pick<RegistrationTeam, "paid" | "status" | "group">>,
  ) {
    const previous = teams;
    setTeams((current) =>
      current.map((item) =>
        item.id === team.id ? { ...item, ...patch } : item,
      ),
    );
    try {
      const updated = await updateRegistration(tournamentId, team.id, patch);
      setTeams((current) =>
        current.map((item) => (item.id === team.id ? updated : item)),
      );
      setMessage(`${teamName(updated)} is updated.`);
    } catch (error) {
      setTeams(previous);
      setMessage(
        error instanceof Error ? error.message : "Unable to update team.",
      );
    }
  }

  async function removeTeam() {
    if (!removeTarget) return;
    try {
      await deleteRegistration(tournamentId, removeTarget.id);
      setTeams((current) =>
        current.filter((team) => team.id !== removeTarget.id),
      );
      setMessage(`${teamName(removeTarget)} was removed from the tournament.`);
      setRemoveTarget(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to remove team.",
      );
    }
  }

  async function generateDraw(
    phase: "group" | "knockout" | "all",
    options: { useExistingGroups?: boolean } = {},
  ) {
    setDrawDialog(false);
    try {
      const response = await generateDrawRequest(tournamentId, phase, options);
      await refreshOperations();
      setActiveSection("operations");
      setMessage(response.message);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to generate draw.",
      );
    }
  }

  async function exportOopFile() {
    if (!tournament || !oopPlan || oopPlan.sessions.length === 0) {
      setMessage("Generate the draw before exporting the order of play.");
      return;
    }
    setExportingOop(true);
    try {
      const blob = await buildOopWorkbook({ tournament, teams, plan: oopPlan });
      downloadBlob(blob, `OOP ${tournament.name.toUpperCase()}.xlsx`);
      setMessage("Order of play exported as an XLSX workbook.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to export OOP.",
      );
    } finally {
      setExportingOop(false);
    }
  }

  async function handleImportFile(file: File | null) {
    if (!file) return;
    try {
      const parsed = await parseDrawWorkbook(file);
      if (parsed.rows.length === 0) {
        setMessage("No draw rows were found in the selected workbook.");
        return;
      }
      setImportFileName(file.name);
      setImportPreview(matchToTeams(parsed, teams));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to read workbook.",
      );
    }
  }

  async function confirmImportDraw() {
    if (!importPreview?.assignments.length) return;
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
      setMessage("Official draw imported and the OOP was regenerated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to import draw.",
      );
    } finally {
      setImportBusy(false);
    }
  }

  async function quickMatchUpdate(match: Match, patch: Partial<Match>) {
    const previous = matches;
    setMatches((current) =>
      current.map((item) =>
        item.id === match.id ? { ...item, ...patch } : item,
      ),
    );
    try {
      const updated = await updateMatch(tournamentId, match.id, patch);
      setMatches((current) =>
        current.map((item) => (item.id === match.id ? updated : item)),
      );
      setMessage(`Match ${match.id} updated.`);
    } catch (error) {
      setMatches(previous);
      setMessage(
        error instanceof Error ? error.message : "Unable to update match.",
      );
    }
  }

  async function submitTeam() {
    setFormError("");
    if (
      !insertForm.playerFullName.trim() ||
      !insertForm.playerEmail.trim() ||
      !insertForm.playerPhone.trim() ||
      !insertForm.partnerFullName.trim() ||
      !insertForm.partnerEmail.trim() ||
      !insertForm.category
    ) {
      setFormError(
        "Complete the required player, partner and division fields.",
      );
      return;
    }
    setSubmittingTeam(true);
    try {
      const skillLevel = divisionSkillLevel(insertForm.category);
      const input: AdminCreateRegistrationInput = {
        player: {
          fullName: insertForm.playerFullName.trim(),
          email: insertForm.playerEmail.trim(),
          phone: insertForm.playerPhone.trim(),
          nationality: insertForm.playerNationality,
          skillLevel,
          city: insertForm.playerCity.trim() || null,
        },
        partner: {
          fullName: insertForm.partnerFullName.trim(),
          email: insertForm.partnerEmail.trim(),
          skillLevel,
        },
        category: insertForm.category,
        paid: insertForm.paid,
        status: insertForm.status,
      };
      const created = await adminCreateRegistration(tournamentId, input);
      setTeams((current) => [...current, created]);
      setInsertDialog(false);
      setMessage(`${teamName(created)} was added successfully.`);
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
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to add team.",
      );
    } finally {
      setSubmittingTeam(false);
    }
  }

  const completedMatches = matches.filter(
    (match) => match.status === "completed",
  );
  const progress = matches.length
    ? Math.round((totals.completed / matches.length) * 100)
    : 0;

  return (
    <>
      <Navbar active="admin" />
      <main className="neo-admin min-h-screen pt-16 text-slate-950">
        <section className="neo-hero">
          <div className="relative mx-auto max-w-[1520px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <PageBreadcrumb
              parentLabel="Admin"
              parentHref="/admin"
              current={tournament?.name ?? "Tournament"}
            />
            <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="neo-sticker -rotate-1">
                    Tournament control room
                  </span>
                  <span
                    className={cx(
                      "rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em]",
                      statusStyle[settings.status],
                    )}
                  >
                    {settings.status}
                  </span>
                </div>
                <h1 className="neo-title mt-5 text-4xl font-black sm:text-5xl lg:text-6xl">
                  {tournament?.name ?? "Loading tournament"}
                </h1>
                <p className="mt-4 max-w-2xl border-l-4 border-cyan-300 pl-4 text-sm font-semibold leading-6 text-white sm:text-base">
                  {tournament?.venue || "Venue not set"} ·{" "}
                  {tournament?.dateLabel || "Date not set"}. Run the full
                  tournament from one calm, shared operations surface.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/tournaments/live"
                  target="_blank"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  <span className="material-symbols-outlined text-lg">
                    sensors
                  </span>
                  Public live
                  <span className="material-symbols-outlined text-sm">
                    open_in_new
                  </span>
                </Link>
                <Link
                  href="/tournaments/bracket"
                  target="_blank"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-500 px-4 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-400"
                >
                  <span className="material-symbols-outlined text-lg">
                    account_tree
                  </span>
                  Public bracket
                  <span className="material-symbols-outlined text-sm">
                    open_in_new
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1520px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon="groups"
              label="Approved teams"
              value={totals.approved}
              detail={`${totals.eligible} draw-ready`}
            />
            <MetricCard
              icon="sensors"
              label="Live courts"
              value={totals.live}
              detail={`${settings.courts} courts configured`}
              accent="rose"
            />
            <MetricCard
              icon="event_upcoming"
              label="Queued matches"
              value={totals.scheduled}
              detail={`${matches.length} matches total`}
              accent="amber"
            />
            <MetricCard
              icon="task_alt"
              label="Tournament progress"
              value={`${progress}%`}
              detail={`${totals.completed} matches completed`}
              accent="emerald"
            />
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-950 shadow-sm">
            <span
              className={cx(
                "material-symbols-outlined mt-0.5 text-xl text-blue-600",
                loading && "admin-spin",
              )}
            >
              {loading ? "progress_activity" : "info"}
            </span>
            <p className="min-w-0 flex-1 font-semibold leading-6">{message}</p>
            <span className="hidden shrink-0 text-xs font-bold uppercase tracking-wider text-blue-500 sm:block">
              Live workspace
            </span>
          </div>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="sticky top-20 z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_16px_50px_rgba(15,23,42,0.07)]">
              <div className="px-3 pb-3 pt-2">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                  Tournament workflow
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
                    style={{
                      width:
                        activeSection === "setup"
                          ? "25%"
                          : activeSection === "registrations"
                            ? "50%"
                            : activeSection === "operations"
                              ? "75%"
                              : "100%",
                    }}
                  />
                </div>
              </div>
              <nav
                className="grid grid-cols-2 gap-1 lg:grid-cols-1"
                aria-label="Tournament administration"
              >
                {sectionItems.map((item) => {
                  const active = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={cx(
                        "group relative flex min-h-20 items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition duration-300",
                        active
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                          : "text-slate-600 hover:bg-blue-50 hover:text-blue-800",
                      )}
                    >
                      {active && (
                        <span className="admin-nav-glow absolute inset-y-0 -left-10 w-12 rotate-12 bg-white/20 blur-md" />
                      )}
                      <span
                        className={cx(
                          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
                          active
                            ? "bg-white/15 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700",
                        )}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {item.icon}
                        </span>
                      </span>
                      <span className="relative hidden min-w-0 lg:block">
                        <span
                          className={cx(
                            "block text-[10px] font-extrabold uppercase tracking-[0.16em]",
                            active ? "text-blue-100" : "text-slate-400",
                          )}
                        >
                          {item.step}
                        </span>
                        <span className="mt-0.5 block text-sm font-extrabold">
                          {item.label}
                        </span>
                        <span
                          className={cx(
                            "mt-0.5 block truncate text-[11px]",
                            active ? "text-blue-100/75" : "text-slate-400",
                          )}
                        >
                          {item.description}
                        </span>
                      </span>
                      <span className="relative block text-xs font-extrabold lg:hidden">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
              <div className="m-2 hidden rounded-xl bg-[#071c4d] p-4 text-white lg:block">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-200">
                  Operating tip
                </p>
                <p className="mt-2 text-xs leading-5 text-blue-100/80">
                  Open each scoring workspace in a new tab. Keep this board open
                  as the shared tournament overview.
                </p>
              </div>
            </aside>

            <section
              key={activeSection}
              className="admin-section-enter min-w-0"
            >
              {activeSection === "setup" && (
                <div className="space-y-6">
                  <SectionTitle
                    eyebrow="Step 01 · Foundation"
                    title="Set the tournament rules once"
                    description="Keep identity, capacity and competition format together. Changes are saved as one clear configuration."
                    action={
                      <button
                        type="button"
                        onClick={saveSettings}
                        disabled={saving}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                      >
                        <span
                          className={cx(
                            "material-symbols-outlined text-lg",
                            saving && "admin-spin",
                          )}
                        >
                          {saving ? "progress_activity" : "save"}
                        </span>
                        {saving ? "Saving…" : "Save setup"}
                      </button>
                    }
                  />

                  <div className="grid gap-5 xl:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                          <span className="material-symbols-outlined">
                            badge
                          </span>
                        </span>
                        <div>
                          <h3 className="font-black text-slate-950">
                            Tournament identity
                          </h3>
                          <p className="text-xs text-slate-500">
                            What teams and spectators will see
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <label className="sm:col-span-2">
                          <span className="admin-label">Tournament name</span>
                          <input
                            value={settings.name}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            className="admin-input"
                          />
                        </label>
                        <label>
                          <span className="admin-label">Venue</span>
                          <input
                            value={settings.venue}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                venue: event.target.value,
                              }))
                            }
                            className="admin-input"
                          />
                        </label>
                        <label>
                          <span className="admin-label">Lifecycle status</span>
                          <select
                            value={settings.status}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                status: event.target.value as TournamentStatus,
                              }))
                            }
                            className="admin-input"
                          >
                            <option value="setup">Setup</option>
                            <option value="registration">
                              Registration open
                            </option>
                            <option value="live">Live</option>
                            <option value="completed">Completed</option>
                          </select>
                        </label>
                        <div className="sm:col-span-2">
                          <span className="admin-label">Tournament dates</span>
                          <DateRangePicker
                            startsAt={settings.startsAt}
                            endsAt={settings.endsAt}
                            onChange={(startsAt, endsAt) =>
                              setSettings((current) => ({
                                ...current,
                                startsAt,
                                endsAt,
                                dateLabel:
                                  startsAt && endsAt
                                    ? formatDateRange(startsAt, endsAt)
                                    : current.dateLabel,
                              }))
                            }
                          />
                        </div>
                        <label className="sm:col-span-2">
                          <span className="admin-label">Description</span>
                          <textarea
                            rows={4}
                            value={settings.description}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                            className="admin-input h-auto py-3"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                          <span className="material-symbols-outlined">
                            manufacturing
                          </span>
                        </span>
                        <div>
                          <h3 className="font-black text-slate-950">
                            Operations capacity
                          </h3>
                          <p className="text-xs text-slate-500">
                            Resources and tournament pacing
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <label>
                          <span className="admin-label">Maximum teams</span>
                          <input
                            type="number"
                            min={8}
                            max={256}
                            value={settings.maxPlayers}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                maxPlayers: Number(event.target.value),
                              }))
                            }
                            className="admin-input"
                          />
                        </label>
                        <label>
                          <span className="admin-label">Waitlist limit</span>
                          <input
                            type="number"
                            min={0}
                            max={128}
                            value={settings.waitlistLimit}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                waitlistLimit: Number(event.target.value),
                              }))
                            }
                            className="admin-input"
                          />
                        </label>
                        <label>
                          <span className="admin-label">Active courts</span>
                          <input
                            type="number"
                            min={1}
                            max={12}
                            value={settings.courts}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                courts: Number(event.target.value),
                              }))
                            }
                            className="admin-input"
                          />
                        </label>
                        <label>
                          <span className="admin-label">Match duration</span>
                          <select
                            value={settings.matchDuration}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                matchDuration: Number(event.target.value),
                              }))
                            }
                            className="admin-input"
                          >
                            <option value={15}>15 minutes</option>
                            <option value={20}>20 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={45}>45 minutes</option>
                            <option value={60}>60 minutes</option>
                          </select>
                        </label>
                        <label>
                          <span className="admin-label">Team format</span>
                          <select
                            value={settings.teamSize}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                teamSize: event.target.value,
                              }))
                            }
                            className="admin-input"
                          >
                            <option>Doubles</option>
                            <option>Singles</option>
                          </select>
                        </label>
                        <label>
                          <span className="admin-label">
                            Competition format
                          </span>
                          <select
                            value={settings.format}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                format: event.target.value,
                              }))
                            }
                            className="admin-input"
                          >
                            <option>Group stage + knockout</option>
                            <option>Single elimination</option>
                            <option>Round robin</option>
                          </select>
                        </label>
                        <label>
                          <span className="admin-label">
                            Default teams per group
                          </span>
                          <input
                            type="number"
                            min={2}
                            max={16}
                            value={settings.groupSize}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                groupSize: Number(event.target.value),
                              }))
                            }
                            className="admin-input"
                          />
                        </label>
                        <label>
                          <span className="admin-label">
                            Default knockout size
                          </span>
                          <select
                            value={settings.qualifierCount}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                qualifierCount: Number(event.target.value),
                              }))
                            }
                            className="admin-input"
                          >
                            <option value={8}>Top 8</option>
                            <option value={16}>Top 16</option>
                            <option value={24}>Top 24</option>
                            <option value={32}>Top 32</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
                          Match divisions
                        </p>
                        <h3 className="mt-1 text-xl font-black text-slate-950">
                          Division-specific draw rules
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Override group and knockout sizes only where a
                          division needs different rules.
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_150px_auto]">
                        <input
                          value={newDivision}
                          onChange={(event) =>
                            setNewDivision(event.target.value)
                          }
                          placeholder="e.g. Mixed Doubles"
                          className="admin-input"
                        />
                        <select
                          value={newDivisionLevel}
                          onChange={(event) =>
                            setNewDivisionLevel(
                              event.target.value as DivisionSkillLevel,
                            )
                          }
                          className="admin-input"
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
                          className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white transition hover:bg-blue-700"
                        >
                          Add division
                        </button>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 xl:grid-cols-2">
                      {settings.categories.length === 0 ? (
                        <div className="xl:col-span-2">
                          <EmptyState
                            icon="category"
                            title="Add your first match division"
                            description="Divisions keep registrations, draws, standings and brackets separated correctly."
                          />
                        </div>
                      ) : (
                        settings.categories.map((division) => {
                          const override =
                            settings.divisionSettings?.[division] ?? {};
                          return (
                            <div
                              key={division}
                              className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-extrabold text-slate-950">
                                    {division}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {
                                      teams.filter(
                                        (team) => team.category === division,
                                      ).length
                                    }{" "}
                                    registered teams
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeDivision(division)}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                  aria-label={`Remove ${division}`}
                                >
                                  <span className="material-symbols-outlined text-lg">
                                    delete
                                  </span>
                                </button>
                              </div>
                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <label>
                                  <span className="admin-label">
                                    Teams per group
                                  </span>
                                  <select
                                    value={override.groupSize ?? ""}
                                    onChange={(event) =>
                                      setDivisionOverride(
                                        division,
                                        "groupSize",
                                        event.target.value
                                          ? Number(event.target.value)
                                          : undefined,
                                      )
                                    }
                                    className="admin-input"
                                  >
                                    <option value="">
                                      Default ({settings.groupSize})
                                    </option>
                                    {[2, 3, 4, 5, 6, 8].map((value) => (
                                      <option key={value} value={value}>
                                        {value} teams
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label>
                                  <span className="admin-label">
                                    Knockout size
                                  </span>
                                  <select
                                    value={override.knockoutSize ?? ""}
                                    onChange={(event) =>
                                      setDivisionOverride(
                                        division,
                                        "knockoutSize",
                                        event.target.value
                                          ? Number(event.target.value)
                                          : undefined,
                                      )
                                    }
                                    className="admin-input"
                                  >
                                    <option value="">
                                      Default ({settings.qualifierCount})
                                    </option>
                                    {[2, 4, 8, 16, 24, 32].map((value) => (
                                      <option key={value} value={value}>
                                        Top {value}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                              <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={override.bronzeMatch ?? false}
                                  onChange={(event) =>
                                    setDivisionOverride(
                                      division,
                                      "bronzeMatch",
                                      event.target.checked || undefined,
                                    )
                                  }
                                  className="h-4 w-4 accent-blue-600"
                                />
                                Include a third-place match
                              </label>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
                          Order of Play
                        </p>
                        <h3 className="mt-1 text-xl font-black text-slate-950">
                          Session and court sequencing
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                          Configure how group and knockout matches fill every
                          court. The same plan powers the operations grid and
                          XLSX export.
                        </p>
                      </div>
                      {!settings.oop && (
                        <button
                          type="button"
                          onClick={() =>
                            setSettings((current) => ({
                              ...current,
                              oop: padelCahOopTemplate(current.categories),
                            }))
                          }
                          className="h-11 shrink-0 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-200"
                        >
                          Use Padel CAH template
                        </button>
                      )}
                    </div>

                    {settings.oop ? (
                      <div className="mt-5 space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label>
                            <span className="admin-label">Day start time</span>
                            <input
                              value={settings.oop.startTime}
                              onChange={(event) =>
                                updateOopSettings((oop) => ({
                                  ...oop,
                                  startTime: event.target.value,
                                }))
                              }
                              placeholder="09:00"
                              className="admin-input"
                            />
                          </label>
                          <label>
                            <span className="admin-label">
                              Slots per session
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={12}
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
                              className="admin-input"
                            />
                          </label>
                        </div>
                        <div>
                          <span className="admin-label">
                            Groups fill courts in this order
                          </span>
                          <div className="flex flex-wrap gap-2">
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
                                  className={cx(
                                    "rounded-xl border px-3 py-2 text-xs font-extrabold transition",
                                    active
                                      ? "border-blue-300 bg-blue-50 text-blue-700"
                                      : "border-slate-200 bg-white text-slate-500 hover:border-blue-200",
                                  )}
                                >
                                  {division}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {settings.oop.sessions.map((session, index) => (
                            <div
                              key={`${session.time}-${index}`}
                              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                            >
                              <div className="grid items-end gap-3 sm:grid-cols-[130px_130px_1fr_auto]">
                                <label>
                                  <span className="admin-label">
                                    Session time
                                  </span>
                                  <input
                                    value={session.time}
                                    onChange={(event) =>
                                      updateOopSettings((oop) => ({
                                        ...oop,
                                        sessions: oop.sessions.map(
                                          (item, itemIndex) =>
                                            itemIndex === index
                                              ? {
                                                  ...item,
                                                  time: event.target.value,
                                                }
                                              : item,
                                        ),
                                      }))
                                    }
                                    className="admin-input"
                                  />
                                </label>
                                <label>
                                  <span className="admin-label">Capacity</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={session.capacity ?? ""}
                                    placeholder="Auto"
                                    onChange={(event) =>
                                      updateOopSettings((oop) => ({
                                        ...oop,
                                        sessions: oop.sessions.map(
                                          (item, itemIndex) =>
                                            itemIndex === index
                                              ? {
                                                  ...item,
                                                  capacity: event.target.value
                                                    ? Number(event.target.value)
                                                    : null,
                                                }
                                              : item,
                                        ),
                                      }))
                                    }
                                    className="admin-input"
                                  />
                                </label>
                                <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={session.notBefore}
                                    onChange={(event) =>
                                      updateOopSettings((oop) => ({
                                        ...oop,
                                        sessions: oop.sessions.map(
                                          (item, itemIndex) =>
                                            itemIndex === index
                                              ? {
                                                  ...item,
                                                  notBefore:
                                                    event.target.checked,
                                                }
                                              : item,
                                        ),
                                      }))
                                    }
                                    className="h-4 w-4 accent-blue-600"
                                  />
                                  Not before this time
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateOopSettings((oop) => ({
                                      ...oop,
                                      sessions: oop.sessions.filter(
                                        (_, itemIndex) => itemIndex !== index,
                                      ),
                                    }))
                                  }
                                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-600"
                                  aria-label={`Remove session ${session.time}`}
                                >
                                  <span className="material-symbols-outlined">
                                    delete
                                  </span>
                                </button>
                              </div>
                              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                <label>
                                  <span className="admin-label">
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
                                          (item, itemIndex) =>
                                            itemIndex === index
                                              ? {
                                                  ...item,
                                                  eventsBefore:
                                                    event.target.value
                                                      .split(",")
                                                      .map((value) =>
                                                        value.trim(),
                                                      )
                                                      .filter(Boolean),
                                                }
                                              : item,
                                        ),
                                      }))
                                    }
                                    placeholder="Opening ceremony"
                                    className="admin-input"
                                  />
                                </label>
                                <label>
                                  <span className="admin-label">
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
                                          (item, itemIndex) =>
                                            itemIndex === index
                                              ? {
                                                  ...item,
                                                  eventsMid: event.target.value
                                                    .split(",")
                                                    .map((raw) => {
                                                      const [title, slot] = raw
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
                                                      (entry) => entry.title,
                                                    ),
                                                }
                                              : item,
                                        ),
                                      }))
                                    }
                                    placeholder="Games@1"
                                    className="admin-input"
                                  />
                                </label>
                                <label>
                                  <span className="admin-label">
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
                                          (item, itemIndex) =>
                                            itemIndex === index
                                              ? {
                                                  ...item,
                                                  eventsAfter:
                                                    event.target.value
                                                      .split(",")
                                                      .map((value) =>
                                                        value.trim(),
                                                      )
                                                      .filter(Boolean),
                                                }
                                              : item,
                                        ),
                                      }))
                                    }
                                    placeholder="Awarding"
                                    className="admin-input"
                                  />
                                </label>
                              </div>
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
                            className="h-10 rounded-xl border border-dashed border-blue-300 px-4 text-xs font-extrabold text-blue-700 hover:bg-blue-50"
                          >
                            + Add OOP session
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-5 text-sm font-semibold text-blue-800">
                        Enable the template to configure OOP sessions, events,
                        category order and court capacity.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === "registrations" && (
                <div className="space-y-6">
                  <SectionTitle
                    eyebrow="Step 02 · Team readiness"
                    title="Know exactly who can enter the draw"
                    description="Search, approve and confirm payment without losing sight of each pair or division."
                    action={
                      <button
                        type="button"
                        onClick={() => setInsertDialog(true)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
                      >
                        <span className="material-symbols-outlined text-lg">
                          person_add
                        </span>
                        Add team
                      </button>
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MetricCard
                      icon="verified"
                      label="Approved"
                      value={totals.approved}
                      detail={`${teams.length} total registrations`}
                    />
                    <MetricCard
                      icon="payments"
                      label="Paid"
                      value={totals.paid}
                      detail={`${teams.length - totals.paid} awaiting payment`}
                      accent="emerald"
                    />
                    <MetricCard
                      icon="rocket_launch"
                      label="Draw-ready"
                      value={totals.eligible}
                      detail="Approved and paid"
                      accent="amber"
                    />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_220px]">
                      <label className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                          search
                        </span>
                        <input
                          value={teamSearch}
                          onChange={(event) =>
                            setTeamSearch(event.target.value)
                          }
                          placeholder="Search team, city or ID"
                          className="admin-input pl-10"
                        />
                      </label>
                      <select
                        value={teamFilter}
                        onChange={(event) =>
                          setTeamFilter(
                            event.target.value as RegistrationFilter,
                          )
                        }
                        className="admin-input"
                      >
                        <option value="all">All statuses</option>
                        <option value="pending">Needs review</option>
                        <option value="approved">Approved</option>
                        <option value="waitlist">Waitlist</option>
                      </select>
                      <select
                        value={teamDivision}
                        onChange={(event) =>
                          setTeamDivision(event.target.value)
                        }
                        className="admin-input"
                      >
                        <option value="all">All divisions</option>
                        {settings.categories.map((division) => (
                          <option key={division} value={division}>
                            {division}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {filteredTeams.length === 0 ? (
                    <EmptyState
                      icon="group_off"
                      title="No teams match these filters"
                      description="Clear a filter or add a team to continue building the tournament field."
                    />
                  ) : (
                    <div className="space-y-3">
                      {filteredTeams.map((team, index) => (
                        <article
                          key={team.id}
                          style={{
                            animationDelay: `${String(Math.min(index * 40, 320))}ms`,
                          }}
                          className="admin-rise rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5"
                        >
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-sm font-black text-white shadow-md shadow-blue-200">
                                {team.player.charAt(0).toUpperCase()}
                                {team.partner?.charAt(0).toUpperCase() ?? ""}
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate font-black text-slate-950">
                                    {teamName(team)}
                                  </h3>
                                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                    {team.id}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-blue-700">
                                  {team.category}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {team.city} · Registered{" "}
                                  {new Date(
                                    team.registeredAt,
                                  ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3 xl:w-[520px]">
                              <label>
                                <span className="admin-label">
                                  Review status
                                </span>
                                <select
                                  value={
                                    team.status === "rejected"
                                      ? "pending"
                                      : team.status
                                  }
                                  onChange={(event) =>
                                    patchTeam(team, {
                                      status: event.target.value as TeamStatus,
                                    })
                                  }
                                  className="admin-input"
                                >
                                  <option value="pending">Needs review</option>
                                  <option value="approved">Approved</option>
                                  <option value="waitlist">Waitlist</option>
                                </select>
                              </label>
                              <label>
                                <span className="admin-label">Payment</span>
                                <select
                                  value={team.paid ? "paid" : "unpaid"}
                                  onChange={(event) =>
                                    patchTeam(team, {
                                      paid: event.target.value === "paid",
                                    })
                                  }
                                  className="admin-input"
                                >
                                  <option value="unpaid">Unpaid</option>
                                  <option value="paid">Paid</option>
                                </select>
                              </label>
                              <div>
                                <span className="admin-label">Readiness</span>
                                <div
                                  className={cx(
                                    "flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-extrabold",
                                    team.status === "approved" && team.paid
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-amber-200 bg-amber-50 text-amber-700",
                                  )}
                                >
                                  <span className="material-symbols-outlined text-base">
                                    {team.status === "approved" && team.paid
                                      ? "check_circle"
                                      : "pending"}
                                  </span>
                                  {team.status === "approved" && team.paid
                                    ? "Draw-ready"
                                    : "Action needed"}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setRemoveTarget(team)}
                              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <span className="material-symbols-outlined text-base">
                                person_remove
                              </span>
                              Remove
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "operations" && (
                <div className="space-y-6">
                  <SectionTitle
                    eyebrow="Step 03 · One operations board"
                    title="Draw, schedule and matches—together"
                    description="Every match has its context, court and state in one card. Open scoring in separate tabs to run several courts without confusion."
                    action={
                      <div className="flex flex-wrap gap-2">
                        <input
                          ref={importInputRef}
                          type="file"
                          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          className="sr-only"
                          onChange={(event) => {
                            void handleImportFile(
                              event.target.files?.[0] ?? null,
                            );
                            event.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => importInputRef.current?.click()}
                          className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-xs font-extrabold text-blue-700 hover:bg-blue-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            upload_file
                          </span>
                          Import draw
                        </button>
                        <button
                          type="button"
                          onClick={() => void exportOopFile()}
                          disabled={exportingOop || !oopPlan}
                          className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-xs font-extrabold text-blue-700 hover:bg-blue-50 disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-lg">
                            download
                          </span>
                          {exportingOop ? "Exporting…" : "Export OOP"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrawDialog(true)}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
                        >
                          <span className="material-symbols-outlined text-lg">
                            shuffle
                          </span>
                          {matches.length ? "Regenerate draw" : "Generate draw"}
                        </button>
                      </div>
                    }
                  />

                  <div className="overflow-hidden rounded-2xl bg-[#071c4d] p-5 text-white shadow-xl shadow-blue-950/10 sm:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="admin-live-dot h-2.5 w-2.5 rounded-full bg-cyan-400" />
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-200">
                            Court control
                          </p>
                        </div>
                        <h3 className="mt-2 text-xl font-black">
                          {totals.live
                            ? `${totals.live} matches live now`
                            : "All courts are calm"}
                        </h3>
                        <p className="mt-1 text-sm text-blue-100/70">
                          Open each scoring room in a new tab. This operations
                          board stays your source of truth.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(
                          { length: settings.courts },
                          (_, index) => index + 1,
                        ).map((court) => {
                          const live = matches.find(
                            (match) =>
                              match.courtId === court &&
                              match.status === "live",
                          );
                          return (
                            <div
                              key={court}
                              className={cx(
                                "min-w-24 rounded-xl border px-3 py-2",
                                live
                                  ? "border-rose-400/40 bg-rose-500/15"
                                  : "border-white/10 bg-white/5",
                              )}
                            >
                              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                                Court {court}
                              </p>
                              <p
                                className={cx(
                                  "mt-1 text-xs font-extrabold",
                                  live ? "text-rose-200" : "text-white",
                                )}
                              >
                                {live ? `Live · ${live.id}` : "Available"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {oopPlan &&
                    oopPlan.sessions.length > 0 &&
                    activeOopSession && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                          <div>
                            <p className="neo-sticker rotate-1">
                              Order of Play
                            </p>
                            <h3 className="mt-4 text-2xl font-black text-slate-950">
                              {oopPlan.title}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                              Focus on one session at a time. Switch to detailed
                              view only when you need teams and live match
                              state.
                            </p>
                          </div>
                          <div className="flex items-center self-start rounded-lg border-2 border-[#07142f] bg-slate-100 p-1 shadow-[3px_3px_0_#07142f]">
                            <button
                              type="button"
                              aria-pressed={oopCompact}
                              onClick={() => setOopCompact(true)}
                              className={cx(
                                "h-9 rounded px-3 text-xs font-black uppercase transition",
                                oopCompact
                                  ? "bg-blue-600 text-white"
                                  : "text-slate-500 hover:bg-white",
                              )}
                            >
                              Compact
                            </button>
                            <button
                              type="button"
                              aria-pressed={!oopCompact}
                              onClick={() => setOopCompact(false)}
                              className={cx(
                                "h-9 rounded px-3 text-xs font-black uppercase transition",
                                !oopCompact
                                  ? "bg-blue-600 text-white"
                                  : "text-slate-500 hover:bg-white",
                              )}
                            >
                              Detailed
                            </button>
                          </div>
                        </div>

                        <div className="mt-6 border-y-2 border-[#07142f] bg-blue-50 px-2 py-3">
                          <div
                            className="flex gap-3 overflow-x-auto pb-1"
                            role="tablist"
                            aria-label="Order of Play sessions"
                          >
                            {oopPlan.sessions.map((session, sessionIndex) => {
                              const summary = oopSessionSummaries[sessionIndex];
                              const selected =
                                selectedOopSession === sessionIndex;
                              return (
                                <button
                                  key={`${session.timeLabel}-${sessionIndex}`}
                                  type="button"
                                  role="tab"
                                  aria-selected={selected}
                                  onClick={() =>
                                    setSelectedOopSession(sessionIndex)
                                  }
                                  className={cx(
                                    "min-w-[170px] shrink-0 rounded-xl px-4 py-3 text-left",
                                    selected
                                      ? "bg-blue-600 text-white"
                                      : "bg-white text-slate-950 hover:bg-cyan-100",
                                  )}
                                >
                                  <span className="block text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
                                    Session {sessionIndex + 1}
                                  </span>
                                  <span className="mt-1 block text-base font-black">
                                    {session.timeLabel}
                                  </span>
                                  <span className="mt-2 block text-[11px] font-bold opacity-75">
                                    {summary?.matchCount ?? 0} matches ·{" "}
                                    {session.slots.length} runs
                                    {(summary?.eventCount ?? 0) > 0
                                      ? ` · ${String(summary?.eventCount)} events`
                                      : ""}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-lg border-2 border-[#07142f]">
                          <div className="flex flex-wrap items-center gap-3 border-b-2 border-[#07142f] bg-[#071c4d] px-4 py-3 text-white">
                            <span className="flex h-9 w-9 items-center justify-center rounded border-2 border-white/30 bg-blue-600">
                              <span className="material-symbols-outlined text-lg">
                                schedule
                              </span>
                            </span>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                                Now viewing
                              </p>
                              <p className="text-base font-black uppercase tracking-wide">
                                {activeOopSession.timeLabel}
                              </p>
                            </div>
                            <div className="ml-auto flex flex-wrap gap-2 text-[10px] font-black uppercase">
                              <span className="border border-white/30 bg-white/10 px-2 py-1">
                                {oopSessionSummaries[selectedOopSession]
                                  ?.matchCount ?? 0}{" "}
                                matches
                              </span>
                              <span className="border border-white/30 bg-white/10 px-2 py-1">
                                {oopPlan.courts} courts
                              </span>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <div
                              className="grid"
                              style={{
                                gridTemplateColumns: `64px repeat(${oopPlan.courts}, minmax(${oopCompact ? "138px" : "210px"}, 1fr))`,
                                minWidth: `${String(64 + oopPlan.courts * (oopCompact ? 138 : 210))}px`,
                              }}
                            >
                              <div className="sticky left-0 z-20 flex items-center justify-center border-b-2 border-[#07142f] bg-yellow-200 px-2 py-3 text-[10px] font-black uppercase text-slate-950">
                                Run
                              </div>
                              {Array.from(
                                { length: oopPlan.courts },
                                (_, index) => index + 1,
                              ).map((court) => (
                                <div
                                  key={court}
                                  className="border-b-2 border-l-2 border-[#07142f] bg-cyan-100 px-2 py-3 text-center text-[11px] font-black uppercase text-slate-950"
                                >
                                  Court {court}
                                </div>
                              ))}

                              {activeOopSession.slots.map((slot) => {
                                const firstEntry =
                                  slot.courts.find(Boolean) ?? null;
                                if (firstEntry?.kind === "event") {
                                  return (
                                    <Fragment key={slot.number}>
                                      <div className="sticky left-0 z-10 flex items-center justify-center border-t-2 border-[#07142f] bg-yellow-100 text-xs font-black text-slate-950">
                                        {String(slot.number).padStart(2, "0")}
                                      </div>
                                      <div
                                        style={{ gridColumn: "2 / -1" }}
                                        className="flex items-center justify-center gap-2 border-l-2 border-t-2 border-[#07142f] bg-amber-200 px-4 py-4 text-sm font-black uppercase tracking-wider text-amber-950"
                                      >
                                        <span className="material-symbols-outlined">
                                          campaign
                                        </span>
                                        {firstEntry.title}
                                      </div>
                                    </Fragment>
                                  );
                                }

                                return (
                                  <Fragment key={slot.number}>
                                    <div className="sticky left-0 z-10 flex items-center justify-center border-t-2 border-[#07142f] bg-yellow-100 text-xs font-black text-slate-950">
                                      {String(slot.number).padStart(2, "0")}
                                    </div>
                                    {slot.courts.map((entry, courtIndex) => (
                                      <div
                                        key={`${slot.number}-${courtIndex}`}
                                        className={cx(
                                          "border-l-2 border-t-2 border-[#07142f] bg-white p-2",
                                          oopCompact ? "min-h-20" : "min-h-32",
                                        )}
                                      >
                                        {entry?.kind === "match" ? (
                                          <div
                                            className={cx(
                                              "h-full rounded border-2 border-[#07142f] p-2 shadow-[2px_2px_0_#07142f]",
                                              oopCategoryClasses(
                                                entry.category,
                                              ),
                                            )}
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="min-w-0">
                                                <p className="truncate text-[11px] font-black">
                                                  {entry.matchLabel}
                                                </p>
                                                <p className="mt-0.5 truncate text-[9px] font-bold uppercase opacity-65">
                                                  {entry.stageLabel}
                                                </p>
                                              </div>
                                              <span className="shrink-0 text-[9px] font-black opacity-50">
                                                {entry.matchIds.length}×
                                              </span>
                                            </div>
                                            <div className="mt-2 space-y-1.5">
                                              {entry.matchIds.map((id) => {
                                                const item = matches.find(
                                                  (candidate) =>
                                                    candidate.id === id,
                                                );
                                                return (
                                                  <Link
                                                    key={id}
                                                    href={`/admin/tournaments/${tournamentId}/matches/${id}`}
                                                    target="_blank"
                                                    className="block rounded border border-[#07142f]/30 bg-white/80 px-2 py-1.5 text-[10px] font-extrabold transition hover:bg-white"
                                                  >
                                                    <span className="flex items-center gap-1.5">
                                                      <span
                                                        className={cx(
                                                          "h-2 w-2 shrink-0 rounded-full",
                                                          item?.status ===
                                                            "live"
                                                            ? "admin-live-dot bg-rose-500"
                                                            : item?.status ===
                                                                "completed"
                                                              ? "bg-emerald-500"
                                                              : "bg-blue-500",
                                                        )}
                                                      />
                                                      <span className="truncate">
                                                        {id}
                                                      </span>
                                                      <span className="material-symbols-outlined ml-auto text-xs">
                                                        open_in_new
                                                      </span>
                                                    </span>
                                                    {!oopCompact && item && (
                                                      <span className="mt-1 block truncate border-t border-[#07142f]/15 pt-1 text-[9px] font-bold opacity-70">
                                                        {getTeamName(
                                                          teams,
                                                          item.teamAId,
                                                        )}{" "}
                                                        vs{" "}
                                                        {getTeamName(
                                                          teams,
                                                          item.teamBId,
                                                        )}
                                                      </span>
                                                    )}
                                                  </Link>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex h-full min-h-14 items-center justify-center border-2 border-dashed border-slate-200 text-[10px] font-bold uppercase text-slate-300">
                                            Open
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </Fragment>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                            Scheduled
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="admin-live-dot h-2.5 w-2.5 rounded-full bg-rose-500" />
                            Live
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            Completed
                          </span>
                          <span className="ml-auto hidden text-slate-400 sm:block">
                            Swipe horizontally to see every court
                          </span>
                        </div>
                      </div>
                    )}

                  {matches.length === 0 && drawPreview.length > 0 && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
                        Draw preview
                      </p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {drawPreview.map((preview) => (
                          <div
                            key={preview.division}
                            className="rounded-xl border border-blue-100 bg-white p-4"
                          >
                            <p className="font-extrabold text-slate-950">
                              {preview.division}
                            </p>
                            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                              <div>
                                <p className="text-lg font-black text-blue-700">
                                  {preview.teamCount}
                                </p>
                                <p className="text-[10px] font-bold uppercase text-slate-400">
                                  Teams
                                </p>
                              </div>
                              <div>
                                <p className="text-lg font-black text-blue-700">
                                  {preview.groups}
                                </p>
                                <p className="text-[10px] font-bold uppercase text-slate-400">
                                  Groups
                                </p>
                              </div>
                              <div>
                                <p className="text-lg font-black text-blue-700">
                                  {preview.groupSize}
                                </p>
                                <p className="text-[10px] font-bold uppercase text-slate-400">
                                  Per group
                                </p>
                              </div>
                              <div>
                                <p className="text-lg font-black text-blue-700">
                                  {preview.knockoutSize}
                                </p>
                                <p className="text-[10px] font-bold uppercase text-slate-400">
                                  Knockout
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="neo-sticker neo-sticker-cyan">
                        Match control
                      </p>
                      <h3 className="mt-4 text-2xl font-black text-slate-950">
                        Find and operate a match
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        The focused list below follows the official OOP
                        sequence.
                      </p>
                    </div>
                    <span className="self-start border-2 border-[#07142f] bg-white px-3 py-2 text-xs font-black uppercase shadow-[3px_3px_0_#07142f] sm:self-auto">
                      {filteredMatches.length} visible
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_170px_170px_220px]">
                      <label className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                          search
                        </span>
                        <input
                          value={matchSearch}
                          onChange={(event) =>
                            setMatchSearch(event.target.value)
                          }
                          placeholder="Search match or team"
                          className="admin-input pl-10"
                        />
                      </label>
                      <select
                        value={matchStatus}
                        onChange={(event) =>
                          setMatchStatus(
                            event.target.value as "all" | MatchStatus,
                          )
                        }
                        className="admin-input"
                      >
                        <option value="all">All states</option>
                        <option value="live">Live</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                      </select>
                      <select
                        value={matchPhase}
                        onChange={(event) =>
                          setMatchPhase(event.target.value as "all" | Phase)
                        }
                        className="admin-input"
                      >
                        <option value="all">All phases</option>
                        <option value="group">Group stage</option>
                        <option value="knockout">Knockout</option>
                      </select>
                      <select
                        value={matchDivision}
                        onChange={(event) =>
                          setMatchDivision(event.target.value)
                        }
                        className="admin-input"
                      >
                        <option value="all">All divisions</option>
                        {settings.categories.map((division) => (
                          <option key={division} value={division}>
                            {division}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {filteredMatches.length === 0 ? (
                    <EmptyState
                      icon="sports_score"
                      title={
                        matches.length
                          ? "No matches match these filters"
                          : "The match board is waiting for a draw"
                      }
                      description={
                        matches.length
                          ? "Adjust your filters to bring matches back into view."
                          : "Approve and mark teams paid, then generate the group-stage or full tournament draw."
                      }
                    />
                  ) : (
                    <div className="grid gap-4 2xl:grid-cols-2">
                      {filteredMatches.map((match, index) => (
                        <article
                          key={match.id}
                          style={{
                            animationDelay: `${String(Math.min(index * 35, 280))}ms`,
                          }}
                          className={cx(
                            "admin-rise group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg",
                            match.status === "live"
                              ? "border-rose-200 ring-2 ring-rose-100"
                              : "border-slate-200 hover:border-blue-200",
                          )}
                        >
                          {match.status === "live" && (
                            <div className="admin-live-sweep absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-rose-500" />
                          )}
                          <div className="p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={cx(
                                      "rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider",
                                      matchStatusStyle[match.status],
                                    )}
                                  >
                                    {match.status}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                    {match.phase}
                                  </span>
                                  <span className="text-xs font-black text-slate-400">
                                    #{match.id}
                                  </span>
                                </div>
                                <h3 className="mt-3 font-black text-slate-950">
                                  {match.category}
                                </h3>
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  {match.group ? `${match.group} · ` : ""}
                                  {match.round}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black tracking-tight text-blue-700">
                                  {match.score || "0-0"}
                                </p>
                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                  Current score
                                </p>
                              </div>
                            </div>
                            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-slate-50 p-4">
                              <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500">
                                  Team A
                                </p>
                                <p className="mt-1 text-sm font-black leading-5 text-slate-950">
                                  {getTeamName(teams, match.teamAId)}
                                </p>
                              </div>
                              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[10px] font-black text-slate-400 shadow-sm">
                                VS
                              </span>
                              <div className="text-right">
                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500">
                                  Team B
                                </p>
                                <p className="mt-1 text-sm font-black leading-5 text-slate-950">
                                  {getTeamName(teams, match.teamBId)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              <label>
                                <span className="admin-label">Court</span>
                                <select
                                  value={match.courtId ?? ""}
                                  onChange={(event) =>
                                    quickMatchUpdate(match, {
                                      courtId: event.target.value
                                        ? Number(event.target.value)
                                        : null,
                                    })
                                  }
                                  className="admin-input"
                                >
                                  <option value="">Unassigned</option>
                                  {Array.from(
                                    { length: settings.courts },
                                    (_, court) => court + 1,
                                  ).map((court) => (
                                    <option key={court} value={court}>
                                      Court {court}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                <span className="admin-label">Match state</span>
                                <select
                                  value={match.status}
                                  onChange={(event) =>
                                    quickMatchUpdate(match, {
                                      status: event.target.value as MatchStatus,
                                    })
                                  }
                                  className="admin-input"
                                >
                                  <option value="scheduled">Scheduled</option>
                                  <option value="live">Live</option>
                                  {match.status === "completed" && (
                                    <option value="completed">Completed</option>
                                  )}
                                </select>
                              </label>
                              <div>
                                <span className="admin-label">Referee</span>
                                <div className="flex h-11 items-center truncate rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
                                  {match.referee || "Unassigned"}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                              <Link
                                href={
                                  "/admin/tournaments/" +
                                  tournamentId +
                                  "/matches/" +
                                  match.id
                                }
                                target="_blank"
                                className={cx(
                                  "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5",
                                  match.status === "live"
                                    ? "bg-rose-500 shadow-rose-200 hover:bg-rose-600"
                                    : "bg-blue-600 shadow-blue-200 hover:bg-blue-700",
                                )}
                              >
                                <span className="material-symbols-outlined text-lg">
                                  scoreboard
                                </span>
                                {match.status === "completed"
                                  ? "Review scoring"
                                  : "Open scoring"}
                                <span className="material-symbols-outlined text-sm">
                                  open_in_new
                                </span>
                              </Link>
                              {match.status === "scheduled" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    quickMatchUpdate(match, { status: "live" })
                                  }
                                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-extrabold text-blue-700 transition hover:bg-blue-100"
                                >
                                  <span className="material-symbols-outlined text-lg">
                                    play_arrow
                                  </span>
                                  Start match
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "results" && (
                <div className="space-y-6">
                  <SectionTitle
                    eyebrow="Step 04 · Tournament truth"
                    title="Standings and final scores"
                    description="A readable result center for group performance, completed matches and progression."
                    action={
                      <Link
                        href="/tournaments/bracket"
                        target="_blank"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
                      >
                        <span className="material-symbols-outlined text-lg">
                          account_tree
                        </span>
                        Open public bracket
                      </Link>
                    }
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard
                      icon="task_alt"
                      label="Completed"
                      value={totals.completed}
                      detail={`${matches.length} total matches`}
                      accent="emerald"
                    />
                    <MetricCard
                      icon="percent"
                      label="Progress"
                      value={`${progress}%`}
                      detail={`${totals.scheduled + totals.live} remaining`}
                    />
                    <MetricCard
                      icon="emoji_events"
                      label="Divisions"
                      value={settings.categories.length}
                      detail="Separate competition tracks"
                      accent="amber"
                    />
                  </div>
                  {groupStandings.length === 0 ? (
                    <EmptyState
                      icon="leaderboard"
                      title="Standings will appear after the draw"
                      description="Complete group matches and points will be calculated here automatically."
                    />
                  ) : (
                    <div>
                      <h3 className="mb-3 text-lg font-black text-slate-950">
                        Group standings
                      </h3>
                      <div className="grid gap-4 xl:grid-cols-2">
                        {groupStandings.map(({ group, rows }) => (
                          <div
                            key={group}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                          >
                            <div className="border-b border-slate-100 bg-blue-50/70 px-4 py-3">
                              <p className="font-extrabold text-blue-950">
                                {group}
                              </p>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[680px] text-left text-sm">
                                <thead>
                                  <tr className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    <th className="px-4 py-3">#</th>
                                    <th className="px-4 py-3">Team</th>
                                    <th className="px-3 py-3 text-center">P</th>
                                    <th className="px-3 py-3 text-center">W</th>
                                    <th className="px-3 py-3 text-center">L</th>
                                    <th className="px-3 py-3 text-center">
                                      GW
                                    </th>
                                    <th className="px-3 py-3 text-center">
                                      GL
                                    </th>
                                    <th
                                      className="px-3 py-3 text-center"
                                      title="Score difference: total games scored"
                                    >
                                      SD
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                      Pts
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((row, index) => (
                                    <tr
                                      key={row.id}
                                      className="border-t border-slate-100"
                                    >
                                      <td className="px-4 py-3">
                                        <span
                                          className={cx(
                                            "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black",
                                            index < 2
                                              ? "bg-blue-600 text-white"
                                              : "bg-slate-100 text-slate-500",
                                          )}
                                        >
                                          {index + 1}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 font-bold text-slate-800">
                                        {row.name}
                                      </td>
                                      <td className="px-3 py-3 text-center text-slate-500">
                                        {row.played}
                                      </td>
                                      <td className="px-3 py-3 text-center text-slate-500">
                                        {row.wins}
                                      </td>
                                      <td className="px-3 py-3 text-center text-slate-500">
                                        {row.losses}
                                      </td>
                                      <td className="px-3 py-3 text-center text-slate-500">
                                        {row.gamesWon}
                                      </td>
                                      <td className="px-3 py-3 text-center text-slate-500">
                                        {row.gamesLost}
                                      </td>
                                      <td className="px-3 py-3 text-center font-bold text-slate-700">
                                        {row.diff}
                                      </td>
                                      <td className="px-4 py-3 text-center font-black text-blue-700">
                                        {row.points}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="mb-3 text-lg font-black text-slate-950">
                      Completed matches
                    </h3>
                    {completedMatches.length === 0 ? (
                      <EmptyState
                        icon="scoreboard"
                        title="No final scores yet"
                        description="Finished matches will collect here with their winner and set scores."
                      />
                    ) : (
                      <div className="grid gap-3 xl:grid-cols-2">
                        {completedMatches.map((match) => (
                          <div
                            key={match.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                                  {match.category} · {match.round}
                                </p>
                                <p className="mt-2 text-sm font-bold text-slate-800">
                                  {getTeamName(teams, match.teamAId)}
                                </p>
                                <p className="mt-1 text-sm font-bold text-slate-800">
                                  {getTeamName(teams, match.teamBId)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-blue-700">
                                  {match.score}
                                </p>
                                <Link
                                  href={
                                    "/admin/tournaments/" +
                                    tournamentId +
                                    "/matches/" +
                                    match.id
                                  }
                                  target="_blank"
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-800"
                                >
                                  Review{" "}
                                  <span className="material-symbols-outlined text-sm">
                                    open_in_new
                                  </span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />

      {drawDialog && (
        <div
          className="admin-modal fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="draw-title"
            className="admin-dialog-enter w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)]"
          >
            <div className="bg-[#071c4d] p-6 text-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-950/30">
                <span className="material-symbols-outlined">account_tree</span>
              </span>
              <h2 id="draw-title" className="mt-5 text-2xl font-black">
                Build the match board
              </h2>
              <p className="mt-2 text-sm leading-6 text-blue-100/75">
                The draw uses {totals.eligible} approved, paid teams and keeps
                every match division separate.
              </p>
            </div>
            <div className="p-6">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
                <span className="font-black">Heads up:</span> generating again
                rebuilds the selected phases and their existing matches.
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => generateDraw("group")}
                  className="h-12 rounded-xl border border-blue-200 bg-blue-50 text-sm font-extrabold text-blue-700 transition hover:bg-blue-100"
                >
                  Groups only
                </button>
                <button
                  type="button"
                  onClick={() => generateDraw("knockout")}
                  className="h-12 rounded-xl border border-blue-200 bg-blue-50 text-sm font-extrabold text-blue-700 transition hover:bg-blue-100"
                >
                  Knockout only
                </button>
                <button
                  type="button"
                  onClick={() => generateDraw("all")}
                  className="h-12 rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                >
                  Full draw
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDrawDialog(false)}
                className="mt-3 h-11 w-full rounded-xl text-sm font-extrabold text-slate-500 transition hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {importPreview && (
        <div className="admin-modal fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
            className="admin-dialog-enter max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-[0_30px_100px_rgba(15,23,42,0.4)]"
          >
            <div className="bg-[#071c4d] p-6 text-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500">
                <span className="material-symbols-outlined">upload_file</span>
              </span>
              <h2 id="import-title" className="mt-4 text-2xl font-black">
                Review official draw
              </h2>
              <p className="mt-2 text-sm text-blue-100/70">
                {importFileName}: {importPreview.assignments.length} teams
                matched.
              </p>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(importPreview.byCategory).map(
                  ([category, count]) => (
                    <div
                      key={category}
                      className="rounded-xl border border-blue-100 bg-blue-50 p-3"
                    >
                      <p className="text-sm font-black text-blue-950">
                        {category}
                      </p>
                      <p className="mt-1 text-xs font-bold text-blue-600">
                        {count} assignments
                      </p>
                    </div>
                  ),
                )}
              </div>
              {importPreview.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-800">
                    Warnings
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-900">
                    {importPreview.warnings.map((warning) => (
                      <li key={warning}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              {importPreview.unmatched.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-rose-700">
                    Unmatched rows
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-rose-900">
                    {importPreview.unmatched.map((row) => (
                      <li key={`${row.sheetName}-${row.no}`}>
                        • {row.player1} / {row.player2} · {row.group}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImportPreview(null);
                    setImportFileName("");
                  }}
                  disabled={importBusy}
                  className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-600"
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
                  className="h-11 flex-1 rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-lg shadow-blue-200 disabled:opacity-40"
                >
                  {importBusy ? "Importing…" : "Import & regenerate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {removeTarget && (
        <div className="admin-modal fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="admin-dialog-enter w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.35)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <span className="material-symbols-outlined">person_remove</span>
            </span>
            <h2 className="mt-5 text-2xl font-black text-slate-950">
              Remove this team?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              <span className="font-bold text-slate-800">
                {teamName(removeTarget)}
              </span>{" "}
              will be permanently removed from this tournament.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={removeTeam}
                className="h-11 flex-1 rounded-xl bg-rose-600 text-sm font-extrabold text-white shadow-lg shadow-rose-200"
              >
                Remove team
              </button>
            </div>
          </div>
        </div>
      )}

      {insertDialog && (
        <div className="admin-modal fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="admin-dialog-enter max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 p-5 backdrop-blur">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
                  Manual registration
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Add a team
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInsertDialog(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <fieldset className="rounded-2xl border border-slate-200 p-4">
                <legend className="px-2 text-sm font-black text-slate-800">
                  Player
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="admin-label">Full name *</span>
                    <input
                      value={insertForm.playerFullName}
                      onChange={(event) =>
                        setInsertForm((current) => ({
                          ...current,
                          playerFullName: event.target.value,
                        }))
                      }
                      className="admin-input"
                    />
                  </label>
                  <label>
                    <span className="admin-label">Email *</span>
                    <input
                      type="email"
                      value={insertForm.playerEmail}
                      onChange={(event) =>
                        setInsertForm((current) => ({
                          ...current,
                          playerEmail: event.target.value,
                        }))
                      }
                      className="admin-input"
                    />
                  </label>
                  <label>
                    <span className="admin-label">Phone *</span>
                    <input
                      value={insertForm.playerPhone}
                      onChange={(event) =>
                        setInsertForm((current) => ({
                          ...current,
                          playerPhone: event.target.value,
                        }))
                      }
                      className="admin-input"
                    />
                  </label>
                  <label>
                    <span className="admin-label">City</span>
                    <input
                      value={insertForm.playerCity}
                      onChange={(event) =>
                        setInsertForm((current) => ({
                          ...current,
                          playerCity: event.target.value,
                        }))
                      }
                      className="admin-input"
                    />
                  </label>
                </div>
              </fieldset>
              <fieldset className="rounded-2xl border border-slate-200 p-4">
                <legend className="px-2 text-sm font-black text-slate-800">
                  Partner
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="admin-label">Full name *</span>
                    <input
                      value={insertForm.partnerFullName}
                      onChange={(event) =>
                        setInsertForm((current) => ({
                          ...current,
                          partnerFullName: event.target.value,
                        }))
                      }
                      className="admin-input"
                    />
                  </label>
                  <label>
                    <span className="admin-label">Email *</span>
                    <input
                      type="email"
                      value={insertForm.partnerEmail}
                      onChange={(event) =>
                        setInsertForm((current) => ({
                          ...current,
                          partnerEmail: event.target.value,
                        }))
                      }
                      className="admin-input"
                    />
                  </label>
                </div>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="admin-label">Match division *</span>
                  <select
                    value={insertForm.category}
                    onChange={(event) =>
                      setInsertForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className="admin-input"
                  >
                    <option value="">Choose division</option>
                    {settings.categories.map((division) => (
                      <option key={division} value={division}>
                        {division}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="admin-label">Review status</span>
                  <select
                    value={insertForm.status}
                    onChange={(event) =>
                      setInsertForm((current) => ({
                        ...current,
                        status: event.target.value as Exclude<
                          TeamStatus,
                          "rejected"
                        >,
                      }))
                    }
                    className="admin-input"
                  >
                    <option value="pending">Needs review</option>
                    <option value="approved">Approved</option>
                    <option value="waitlist">Waitlist</option>
                  </select>
                </label>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-900">
                <input
                  type="checkbox"
                  checked={insertForm.paid}
                  onChange={(event) =>
                    setInsertForm((current) => ({
                      ...current,
                      paid: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-blue-600"
                />
                Mark this team as paid
              </label>
              {formError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                  {formError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInsertDialog(false)}
                  className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitTeam}
                  disabled={submittingTeam}
                  className="h-11 flex-1 rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-lg shadow-blue-200 disabled:opacity-60"
                >
                  {submittingTeam ? "Adding…" : "Add team"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
