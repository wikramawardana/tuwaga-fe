"use client";

import {
  ArrowCounterClockwiseIcon,
  ArrowSquareOutIcon,
  BankIcon,
  BroadcastIcon,
  BuildingsIcon,
  CalendarDotsIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  ClockIcon,
  DiceFiveIcon,
  DotsThreeCircleIcon,
  DownloadSimpleIcon,
  EyeIcon,
  FileArrowUpIcon,
  FlagCheckeredIcon,
  FloppyDiskIcon,
  GearSixIcon,
  IdentificationBadgeIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassPlusIcon,
  MegaphoneIcon,
  MoneyIcon,
  PercentIcon,
  PlayIcon,
  RacquetIcon,
  RankingIcon,
  ReceiptIcon,
  RocketLaunchIcon,
  SealCheckIcon,
  ShapesIcon,
  ShuffleIcon,
  SlidersHorizontalIcon,
  SquaresFourIcon,
  TelevisionIcon,
  TrashIcon,
  TreeStructureIcon,
  TrophyIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AiDirectorCopilot from "@/components/admin/AiDirectorCopilot";
import TechnicalMeetingDrawing from "@/components/admin/TechnicalMeetingDrawing";
import TournamentOverview from "@/components/admin/TournamentOverview";
import DateRangePicker, { formatDateRange } from "@/components/DateRangePicker";
import Footer from "@/components/Footer";
import { type AppIcon, ScoreboardIcon } from "@/components/icons/SportIcons";
import Navbar from "@/components/Navbar";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import {
  createDivisionLabel,
  DIVISION_SKILL_LEVELS,
  type DivisionSkillLevel,
  divisionSkillLevel,
} from "@/lib/matchDivisions";
import { formatMatchScore } from "@/lib/matchScore";
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
  type PartnerDetail,
  type Phase,
  type PlayerDetail,
  type RegistrationTeam,
  type ScoringRules,
  type SportType,
  type TeamStatus,
  type Tournament,
  type TournamentFormat,
  type TournamentSettings,
  type TournamentStatus,
  updateMatch,
  updateRegistration,
  updateSettings,
  uploadFile,
} from "@/lib/tuwagaApi";

const SPORT_OPTIONS: Array<{
  value: SportType;
  label: string;
  badge: string;
  defaultRules: ScoringRules;
}> = [
  {
    value: "badminton",
    label: "Badminton",
    badge: "BWF Standard (21 pts, cap 30)",
    defaultRules: {
      sport: "badminton",
      pointsPerSet: 21,
      setsToWin: 2,
      winByTwo: true,
      goldenPoint: false,
      maxPointCap: 30,
      bronzeMatch: false,
    },
  },
  {
    value: "padel",
    label: "Padel",
    badge: "FIP / WPT (6 games, Punto de Oro)",
    defaultRules: {
      sport: "padel",
      pointsPerSet: 6,
      setsToWin: 2,
      winByTwo: false,
      goldenPoint: true,
      tiebreakAt: 6,
      tiebreakPoints: 7,
      bronzeMatch: false,
    },
  },
  {
    value: "tennis",
    label: "Tennis",
    badge: "ITF Standard (6 games, deuce/adv)",
    defaultRules: {
      sport: "tennis",
      pointsPerSet: 6,
      setsToWin: 2,
      winByTwo: true,
      goldenPoint: false,
      tiebreakAt: 6,
      tiebreakPoints: 7,
      bronzeMatch: false,
    },
  },
  {
    value: "table_tennis",
    label: "Table Tennis",
    badge: "ITTF Standard (11 pts, deuce +2)",
    defaultRules: {
      sport: "table_tennis",
      pointsPerSet: 11,
      setsToWin: 3,
      winByTwo: true,
      goldenPoint: false,
      bronzeMatch: false,
    },
  },
];

export type AdminSection =
  | "overview"
  | "registrations"
  | "technical-meeting"
  | "operations"
  | "results"
  | "setup";

function parseSectionParam(param: string | null): AdminSection | null {
  if (!param) return null;
  const normalized = param.toLowerCase().trim();
  if (
    normalized === "overview" ||
    normalized === "dashboard" ||
    normalized === "hub" ||
    normalized === "00"
  )
    return "overview";
  if (
    normalized === "registrations" ||
    normalized === "teams" ||
    normalized === "01"
  )
    return "registrations";
  if (
    normalized === "technical-meeting" ||
    normalized === "tm" ||
    normalized === "drawing" ||
    normalized === "draw" ||
    normalized === "wheel" ||
    normalized === "02"
  )
    return "technical-meeting";
  if (
    normalized === "operations" ||
    normalized === "matches" ||
    normalized === "schedule" ||
    normalized === "03"
  )
    return "operations";
  if (
    normalized === "results" ||
    normalized === "standings" ||
    normalized === "scores" ||
    normalized === "04"
  )
    return "results";
  if (normalized === "setup" || normalized === "05") return "setup";
  return null;
}

function defaultSectionForStatus(_status?: TournamentStatus): AdminSection {
  return "overview";
}

type SetupTab = "general" | "registration" | "format" | "oop";

const SETUP_TABS: {
  id: SetupTab;
  label: string;
  icon: AppIcon;
  hint: string;
}[] = [
  {
    id: "general",
    label: "Umum & Tempat",
    icon: BuildingsIcon,
    hint: "Identitas turnamen, lokasi venue, tanggal pelaksanaan, dan kapasitas",
  },
  {
    id: "registration",
    label: "Pendaftaran & Rekening",
    icon: BankIcon,
    hint: "Biaya pendaftaran, rekening bank panitia, kontak CP, dan syarat pendaftaran",
  },
  {
    id: "format",
    label: "Divisi & Format",
    icon: ShapesIcon,
    hint: "Cabang olahraga, format kompetisi, dan aturan per divisi",
  },
  {
    id: "oop",
    label: "Order of Play (OOP)",
    icon: CalendarDotsIcon,
    hint: "Pengaturan sesi jadwal, kapasitas lapangan, dan urutan kategori",
  },
];
type RegistrationFilter = "all" | Exclude<TeamStatus, "rejected">;
export type EditableSettings = TournamentSettings & {
  status: TournamentStatus;
  name: string;
  venue: string;
  dateLabel: string;
  startsAt: string;
  endsAt: string;
  description: string;
};

const emptySettings: EditableSettings = {
  sport: "badminton",
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
  bankName: "",
  accountNumber: "",
  accountHolder: "",
  paymentInstructions: "",
  contactPerson: "",
  registrationNotes: "",
  disclaimerText: "",
  registrationClosedAt: "",
  jerseySizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  entryFeePerPair: 600000,
};

const sectionItems: Array<{
  id: AdminSection;
  step: string;
  label: string;
  description: string;
  icon: AppIcon;
}> = [
  {
    id: "overview",
    step: "00",
    label: "Overview",
    description: "Ringkasan & status turnamen",
    icon: SquaresFourIcon,
  },
  {
    id: "registrations",
    step: "01",
    label: "Tim & Pendaftaran",
    description: "Review berkas & pembayaran",
    icon: UsersThreeIcon,
  },
  {
    id: "technical-meeting",
    step: "02",
    label: "Technical Meeting",
    description: "Live wheel & undian grup",
    icon: DiceFiveIcon,
  },
  {
    id: "operations",
    step: "03",
    label: "Match Operations",
    description: "Jadwal OOP & live scoring",
    icon: SquaresFourIcon,
  },
  {
    id: "results",
    step: "04",
    label: "Hasil & Bagan",
    description: "Klasemen & bracket knockout",
    icon: TrophyIcon,
  },
  {
    id: "setup",
    step: "05",
    label: "Pengaturan",
    description: "Identitas, divisi & format",
    icon: SlidersHorizontalIcon,
  },
];

const statusStyle: Record<TournamentStatus, string> = {
  setup: "border-ink-200 bg-ink-100 text-ink-700",
  registration: "border-brand-200 bg-brand-50 text-brand-700",
  live: "border-rose-200 bg-rose-50 text-rose-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const matchStatusStyle: Record<MatchStatus, string> = {
  scheduled: "border-brand-200 bg-brand-50 text-brand-700",
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
  if (value.includes("women")) return "bg-cream-100 text-cream-950";
  if (value.includes("men")) return "bg-brand-100 text-ink-950";
  return "bg-emerald-100 text-emerald-950";
}

function adminOopTimeLabel(value: string) {
  const isFlexible = /^not before\s+/i.test(value);
  const time = value
    .replace(/^not before\s+/i, "")
    .replace(/(\d{1,2})\.(\d{2})$/, "$1:$2");
  return isFlexible ? `Earliest start · ${time}` : time;
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
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-600">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-ink-950 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  icon: StatIcon,
  label,
  value,
  detail,
  accent = "blue",
}: {
  icon: AppIcon;
  label: string;
  value: string | number;
  detail: string;
  accent?: "blue" | "rose" | "emerald" | "amber";
}) {
  const tones = {
    blue: "bg-brand-50 text-brand-600 ring-1 ring-brand-100",
    rose: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  };
  return (
    <div className="admin-rise group rounded-2xl border border-ink-200/80 bg-white p-4 shadow-[0_14px_40px_rgba(23,23,23,0.05)] transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_18px_50px_rgba(23,23,23,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-ink-950">
            {value}
          </p>
          <p className="mt-1 text-xs font-medium text-ink-500">{detail}</p>
        </div>
        <span
          className={cx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110",
            tones[accent],
          )}
        >
          <StatIcon
            className="text-[22px]"
            weight="duotone"
            aria-hidden="true"
          />
        </span>
      </div>
    </div>
  );
}

function EmptyState({
  icon: EmptyIcon,
  title,
  description,
}: {
  icon: AppIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-gradient-to-br from-brand-50/80 to-white px-6 py-14 text-center">
      <span className="admin-float mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-ink-950 shadow-lg shadow-ink-950/10">
        <EmptyIcon className="text-3xl" weight="duotone" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-black text-ink-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [settings, setSettings] = useState<EditableSettings>(emptySettings);
  const [teams, setTeams] = useState<RegistrationTeam[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [setupTab, setSetupTab] = useState<SetupTab>("general");
  const explicitSectionFromParams = parseSectionParam(
    searchParams.get("section") ?? searchParams.get("tab"),
  );
  const explicitSectionRef = useRef(explicitSectionFromParams);
  explicitSectionRef.current = explicitSectionFromParams;
  const [activeSection, setActiveSection] = useState<AdminSection>(
    () => explicitSectionFromParams ?? "overview",
  );
  const [mediaLightbox, setMediaLightbox] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [uploadingIdCard, setUploadingIdCard] = useState<
    "player1" | "player2" | null
  >(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMediaLightbox(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Loading tournament command center…");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<RegistrationFilter>(() => {
    const filterParam = (searchParams.get("teamFilter") ??
      searchParams.get("filter") ??
      "all") as RegistrationFilter;
    return ["all", "pending", "approved", "waitlist"].includes(filterParam)
      ? filterParam
      : "all";
  });
  const [teamDivision, setTeamDivision] = useState(() => {
    return (
      searchParams.get("teamDivision") ?? searchParams.get("division") ?? "all"
    );
  });
  const [matchSearch, setMatchSearch] = useState("");
  const [matchStatus, setMatchStatus] = useState<"all" | MatchStatus>(() => {
    const val = searchParams.get("matchStatus") ?? searchParams.get("status");
    return val === "live" || val === "scheduled" || val === "completed"
      ? val
      : "all";
  });
  const [matchPhase, setMatchPhase] = useState<"all" | Phase>(() => {
    const val = searchParams.get("matchPhase") ?? searchParams.get("phase");
    return val === "group" || val === "knockout" ? val : "all";
  });
  const [matchDivision, setMatchDivision] = useState(() => {
    return (
      searchParams.get("matchDivision") ?? searchParams.get("division") ?? "all"
    );
  });
  const [resultsDivision, setResultsDivision] = useState(() => {
    return (
      searchParams.get("resultsDivision") ??
      searchParams.get("division") ??
      "all"
    );
  });
  const [newDivision, setNewDivision] = useState("");
  const [newDivisionLevel, setNewDivisionLevel] =
    useState<DivisionSkillLevel>("intermediate");
  const [drawDialog, setDrawDialog] = useState(false);
  const [insertDialog, setInsertDialog] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<RegistrationTeam | null>(
    null,
  );
  const [viewingTeam, setViewingTeam] = useState<RegistrationTeam | null>(null);
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

  const changeSection = useCallback(
    (nextSection: AdminSection) => {
      setActiveSection(nextSection);
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", nextSection);
      params.delete("tab");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const fromUrl = parseSectionParam(
      searchParams.get("section") ?? searchParams.get("tab"),
    );
    if (fromUrl && fromUrl !== activeSection) {
      setActiveSection(fromUrl);
    }
  }, [searchParams, activeSection]);

  const handleTeamFilterChange = useCallback(
    (filter: RegistrationFilter) => {
      setTeamFilter(filter);
      const params = new URLSearchParams(searchParams.toString());
      if (filter === "all") params.delete("filter");
      else params.set("filter", filter);
      params.delete("teamFilter");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleTeamDivisionChange = useCallback(
    (division: string) => {
      setTeamDivision(division);
      const params = new URLSearchParams(searchParams.toString());
      if (division === "all") params.delete("division");
      else params.set("division", division);
      params.delete("teamDivision");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleMatchStatusChange = useCallback(
    (status: "all" | MatchStatus) => {
      setMatchStatus(status);
      const params = new URLSearchParams(searchParams.toString());
      if (status === "all") params.delete("status");
      else params.set("status", status);
      params.delete("matchStatus");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleMatchPhaseChange = useCallback(
    (phase: "all" | Phase) => {
      setMatchPhase(phase);
      const params = new URLSearchParams(searchParams.toString());
      if (phase === "all") params.delete("phase");
      else params.set("phase", phase);
      params.delete("matchPhase");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleMatchDivisionChange = useCallback(
    (division: string) => {
      setMatchDivision(division);
      const params = new URLSearchParams(searchParams.toString());
      if (division === "all") params.delete("division");
      else params.set("division", division);
      params.delete("matchDivision");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleResultsDivisionChange = useCallback(
    (division: string) => {
      setResultsDivision(division);
      const params = new URLSearchParams(searchParams.toString());
      if (division === "all") params.delete("division");
      else params.set("division", division);
      params.delete("resultsDivision");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

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
          entryFeePerPair:
            nextTournament.entryFeePerPair ??
            nextTournament.settings.entryFeePerPair ??
            600000,
        });

        // Smart section landing: if no explicit section in URL query, land on section matching tournament lifecycle
        if (!explicitSectionRef.current && nextTournament?.status) {
          setActiveSection(defaultSectionForStatus(nextTournament.status));
        }

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
      .sort((a, b) => {
        const oopA = oopOrderMap.get(a.id) ?? 99999;
        const oopB = oopOrderMap.get(b.id) ?? 99999;
        if (oopA !== oopB) return oopA - oopB;
        if (a.time && b.time && a.time !== b.time) {
          return a.time.localeCompare(b.time);
        }
        if ((a.courtId ?? 0) !== (b.courtId ?? 0)) {
          return (a.courtId ?? 0) - (b.courtId ?? 0);
        }
        return a.id.localeCompare(b.id);
      });
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
        groups:
          settings.format === "Round robin"
            ? teamCount >= 2
              ? 1
              : 0
            : settings.format === "Single elimination"
              ? 0
              : countGroups(teamCount, groupSize),
        knockoutSize: effectiveKnockoutSize(settings, division),
        roundRobinMatches: (teamCount * (teamCount - 1)) / 2,
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
        entryFeePerPair:
          refreshed.entryFeePerPair ??
          refreshed.settings.entryFeePerPair ??
          600000,
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

  async function handleUpdateStatus(nextStatus: TournamentStatus) {
    try {
      const payload = { ...settings, status: nextStatus };
      await updateSettings(tournamentId, payload);
      const refreshed = await getTournament(tournamentId);
      setTournament(refreshed);
      setSettings((prev) => ({
        ...prev,
        status: nextStatus,
      }));
      setMessage(
        `Status turnamen berhasil diperbarui menjadi ${nextStatus.toUpperCase()}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal memperbarui status.",
      );
    }
  }

  async function handleApplyDrawing(
    assignments: Array<{ teamId: string; group: string; seed: number | null }>,
  ) {
    try {
      await importDrawRequest(tournamentId, assignments);
      await generateDraw("all", { useExistingGroups: true });
      await refreshOperations();
      setMessage("Hasil undian TM berhasil diterapkan ke jadwal pertandingan.");
      changeSection("operations");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal menerapkan hasil undian.",
      );
      throw error;
    }
  }

  const tournamentCategories = useMemo(() => {
    if (settings.categories && settings.categories.length > 0) {
      return settings.categories;
    }
    const fromTeams = Array.from(
      new Set(teams.map((t) => t.category).filter(Boolean)),
    );
    return fromTeams.length > 0 ? fromTeams : ["Open"];
  }, [settings.categories, teams]);

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
    value: DivisionSettings[keyof DivisionSettings],
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
    patch: Partial<
      Pick<
        RegistrationTeam,
        | "paid"
        | "status"
        | "group"
        | "entryFee"
        | "playerDetails"
        | "partnerDetails"
      >
    >,
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
      setViewingTeam((current) =>
        current && current.id === team.id ? updated : current,
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
      changeSection("operations");
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

  const completedMatches = useMemo(
    () => matches.filter((match) => match.status === "completed"),
    [matches],
  );

  const filteredResultsStandings = useMemo(() => {
    if (resultsDivision === "all") return groupStandings;
    return groupStandings.filter(({ group }) =>
      group.toLowerCase().includes(resultsDivision.toLowerCase()),
    );
  }, [groupStandings, resultsDivision]);

  const filteredCompletedMatches = useMemo(() => {
    if (resultsDivision === "all") return completedMatches;
    return completedMatches.filter(
      (match) =>
        match.category?.toLowerCase() === resultsDivision.toLowerCase(),
    );
  }, [completedMatches, resultsDivision]);

  const progress = matches.length
    ? Math.round((totals.completed / matches.length) * 100)
    : 0;

  return (
    <>
      <Navbar active="admin" />
      <main className="min-h-screen bg-canvas pt-16 text-ink-950">
        <section className="border-b border-ink-200 bg-white">
          <div className="container-wide relative py-8">
            <PageBreadcrumb
              parentLabel="Admin"
              parentHref="/admin"
              current={tournament?.name ?? "Tournament"}
            />
            <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    Tournament control room
                  </span>
                  <span
                    className={cx(
                      "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                      statusStyle[settings.status],
                    )}
                  >
                    {settings.status}
                  </span>
                </div>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                  {tournament?.name ?? "Loading tournament"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600 sm:text-base">
                  {tournament?.venue || "Venue not set"} ·{" "}
                  {tournament?.dateLabel || "Date not set"}. Run the full
                  tournament from one calm, shared operations surface.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/tournaments/live?tournament=${tournament?.slug || tournamentId}`}
                  target="_blank"
                  className="btn btn-sm btn-outline"
                >
                  <BroadcastIcon
                    className="text-lg text-ink-500"
                    aria-hidden="true"
                    weight="bold"
                  />
                  Public live
                  <ArrowSquareOutIcon
                    className="text-sm text-ink-400"
                    aria-hidden="true"
                    weight="bold"
                  />
                </Link>
                <Link
                  href={`/tournaments/bracket?tournament=${tournament?.slug || tournamentId}&view=bracket`}
                  target="_blank"
                  className="btn btn-sm btn-outline"
                >
                  <TreeStructureIcon
                    className="text-lg"
                    aria-hidden="true"
                    weight="bold"
                  />
                  Public bracket
                  <ArrowSquareOutIcon
                    className="text-sm opacity-80"
                    aria-hidden="true"
                    weight="bold"
                  />
                </Link>
                <Link
                  href={`/tournaments/${tournament?.slug || tournamentId}/display?scene=bracket`}
                  target="_blank"
                  className="btn btn-sm btn-outline"
                >
                  <TelevisionIcon
                    className="text-lg text-ink-500"
                    aria-hidden="true"
                    weight="bold"
                  />
                  TV display
                  <ArrowSquareOutIcon
                    className="text-sm text-ink-400"
                    aria-hidden="true"
                    weight="bold"
                  />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="container-wide py-6 lg:py-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={UsersThreeIcon}
              label="Approved teams"
              value={totals.approved}
              detail={`${totals.eligible} draw-ready`}
            />
            <MetricCard
              icon={BroadcastIcon}
              label="Live courts"
              value={totals.live}
              detail={`${settings.courts} courts configured`}
              accent="rose"
            />
            <MetricCard
              icon={CalendarDotsIcon}
              label="Queued matches"
              value={totals.scheduled}
              detail={`${matches.length} matches total`}
              accent="amber"
            />
            <MetricCard
              icon={CheckCircleIcon}
              label="Tournament progress"
              value={`${progress}%`}
              detail={`${totals.completed} matches completed`}
              accent="emerald"
            />
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/80 px-4 py-3 text-sm text-ink-950 shadow-sm">
            {loading ? (
              <CircleNotchIcon
                className="admin-spin mt-0.5 shrink-0 text-xl text-brand-600"
                weight="bold"
                aria-hidden="true"
              />
            ) : (
              <InfoIcon
                className="mt-0.5 shrink-0 text-xl text-brand-600"
                weight="duotone"
                aria-hidden="true"
              />
            )}
            <p className="min-w-0 flex-1 font-semibold leading-6">{message}</p>
            <span className="hidden shrink-0 text-xs font-bold uppercase tracking-wider text-brand-500 sm:block">
              Live workspace
            </span>
          </div>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="sticky top-20 z-20 overflow-hidden rounded-2xl border border-ink-200 bg-white p-2 shadow-[0_16px_50px_rgba(23,23,23,0.07)]">
              <div className="px-3 pb-3 pt-2">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink-400">
                  Tournament workflow
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-ink-700 transition-all duration-700"
                    style={{
                      width:
                        activeSection === "overview"
                          ? "16%"
                          : activeSection === "registrations"
                            ? "33%"
                            : activeSection === "technical-meeting"
                              ? "50%"
                              : activeSection === "operations"
                                ? "67%"
                                : activeSection === "results"
                                  ? "84%"
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
                      onClick={() => changeSection(item.id)}
                      className={cx(
                        "group relative flex min-h-20 items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition duration-300",
                        active
                          ? "bg-brand-500 text-ink-950 shadow-lg shadow-ink-950/10"
                          : "text-ink-600 hover:bg-brand-50 hover:text-brand-800",
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
                            : "bg-ink-100 text-ink-500 group-hover:bg-brand-100 group-hover:text-brand-700",
                        )}
                      >
                        <item.icon
                          className="text-xl"
                          weight={active ? "fill" : "duotone"}
                          aria-hidden="true"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                          Step {item.step}
                        </span>
                        <span className="block truncate text-xs font-black tracking-tight sm:text-sm">
                          {item.label}
                        </span>
                        <span className="hidden truncate text-[11px] opacity-75 sm:block">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>
              <div className="m-2 hidden rounded-xl border border-brand-100 bg-brand-50/70 p-4 text-ink-800 lg:block">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-600">
                  Operating tip
                </p>
                <p className="mt-1.5 text-xs leading-5 text-ink-600">
                  Open each scoring workspace in a new tab. Keep this board open
                  as the shared tournament overview.
                </p>
              </div>
            </aside>

            <section
              key={activeSection}
              className="admin-section-enter min-w-0"
            >
              {activeSection === "overview" && tournament && (
                <TournamentOverview
                  tournament={tournament}
                  settings={settings}
                  teams={teams}
                  matches={matches}
                  totals={totals}
                  onNavigateSection={changeSection}
                  onViewTeam={setViewingTeam}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}

              {activeSection === "technical-meeting" && tournament && (
                <TechnicalMeetingDrawing
                  tournament={tournament}
                  teams={teams}
                  categories={tournamentCategories}
                  defaultGroupSize={settings.groupSize ?? 4}
                  onApplyDraw={handleApplyDrawing}
                />
              )}

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
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-extrabold text-ink-950 shadow-lg shadow-ink-950/10 transition hover:-translate-y-0.5 hover:bg-brand-400 disabled:cursor-wait disabled:opacity-60"
                      >
                        {saving ? (
                          <CircleNotchIcon
                            className="admin-spin text-lg"
                            weight="bold"
                            aria-hidden="true"
                          />
                        ) : (
                          <FloppyDiskIcon
                            className="text-lg"
                            weight="bold"
                            aria-hidden="true"
                          />
                        )}
                        {saving ? "Saving…" : "Save setup"}
                      </button>
                    }
                  />

                  {/* Setup Sub-Tabs Navigation */}
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink-200 bg-white p-2 shadow-xs">
                    {SETUP_TABS.map((tab) => {
                      const isActive = setupTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSetupTab(tab.id)}
                          className={cx(
                            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition",
                            isActive
                              ? "bg-brand-500 text-ink-950 shadow-md shadow-ink-950/10"
                              : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                          )}
                        >
                          <tab.icon
                            className="text-lg"
                            weight="bold"
                            aria-hidden="true"
                          />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* SUBTAB 1: UMUM & TEMPAT */}
                  {setupTab === "general" && (
                    <div className="grid gap-5 xl:grid-cols-2">
                      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                            <IdentificationBadgeIcon
                              aria-hidden="true"
                              weight="bold"
                            />
                          </span>
                          <div>
                            <h3 className="font-black text-ink-950">
                              Tournament identity
                            </h3>
                            <p className="text-xs text-ink-500">
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
                            <span className="admin-label">
                              Lifecycle status
                            </span>
                            <select
                              value={settings.status}
                              onChange={(event) =>
                                setSettings((current) => ({
                                  ...current,
                                  status: event.target
                                    .value as TournamentStatus,
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
                            <span className="admin-label">
                              Tournament dates
                            </span>
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

                      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-200 text-ink-900">
                            <GearSixIcon aria-hidden="true" weight="bold" />
                          </span>
                          <div>
                            <h3 className="font-black text-ink-950">
                              Operations capacity
                            </h3>
                            <p className="text-xs text-ink-500">
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
                          <label className="sm:col-span-2">
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
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 2: PENDAFTARAN & REKENING */}
                  {setupTab === "registration" && (
                    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                          <BankIcon aria-hidden="true" weight="bold" />
                        </span>
                        <div>
                          <h3 className="font-black text-ink-950">
                            Registration & Bank Transfer
                          </h3>
                          <p className="text-xs text-ink-500">
                            Bank details, entry fees, deadline, and screening
                            disclaimer
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <label>
                          <span className="admin-label">
                            Entry Fee per Pair (IDR)
                          </span>
                          <input
                            type="number"
                            value={settings.entryFeePerPair ?? 600000}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                entryFeePerPair: Number(event.target.value),
                              }))
                            }
                            className="admin-input"
                          />
                        </label>
                        <label>
                          <span className="admin-label">Bank Name</span>
                          <input
                            placeholder="e.g. BNI, BCA, Mandiri"
                            value={settings.bankName ?? ""}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                bankName: event.target.value,
                              }))
                            }
                            className="admin-input"
                          />
                        </label>
                        <label>
                          <span className="admin-label">Account Number</span>
                          <input
                            placeholder="e.g. 1984042386"
                            value={settings.accountNumber ?? ""}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                accountNumber: event.target.value,
                              }))
                            }
                            className="admin-input font-mono"
                          />
                        </label>
                        <label>
                          <span className="admin-label">
                            Account Holder (Atas Nama)
                          </span>
                          <input
                            placeholder="e.g. PT. LOKA TAMA KREASI"
                            value={settings.accountHolder ?? ""}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                accountHolder: event.target.value,
                              }))
                            }
                            className="admin-input uppercase"
                          />
                        </label>
                        <label>
                          <span className="admin-label">
                            Contact Person (CP)
                          </span>
                          <input
                            placeholder="e.g. Richard (0881025139999)"
                            value={settings.contactPerson ?? ""}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                contactPerson: event.target.value,
                              }))
                            }
                            className="admin-input"
                          />
                        </label>
                        <label>
                          <span className="admin-label">
                            Registration Deadline
                          </span>
                          <input
                            placeholder="e.g. 11 Agustus 2026"
                            value={settings.registrationClosedAt ?? ""}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                registrationClosedAt: event.target.value,
                              }))
                            }
                            className="admin-input"
                          />
                        </label>
                        <label className="sm:col-span-2">
                          <span className="admin-label">
                            Payment Instructions (Berita Transfer)
                          </span>
                          <input
                            placeholder="e.g. Format berita: [Nama 1] & [Nama 2] / [Kategori]"
                            value={settings.paymentInstructions ?? ""}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                paymentInstructions: event.target.value,
                              }))
                            }
                            className="admin-input"
                          />
                        </label>
                        <label className="sm:col-span-2">
                          <span className="admin-label">
                            Jersey Sizes (comma separated)
                          </span>
                          <input
                            placeholder="XS, S, M, L, XL, XXL, XXXL"
                            value={(
                              settings.jerseySizes ?? [
                                "XS",
                                "S",
                                "M",
                                "L",
                                "XL",
                                "XXL",
                                "XXXL",
                              ]
                            ).join(", ")}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                jerseySizes: event.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              }))
                            }
                            className="admin-input"
                          />
                        </label>
                        <label className="sm:col-span-2">
                          <span className="admin-label">
                            Registration Notes / Screening Rules
                          </span>
                          <textarea
                            rows={2}
                            placeholder="Kriteria peserta, screening level, atau kebijakan refund..."
                            value={settings.registrationNotes ?? ""}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                registrationNotes: event.target.value,
                              }))
                            }
                            className="admin-input h-auto py-2.5"
                          />
                        </label>
                        <label className="sm:col-span-2">
                          <span className="admin-label">
                            Disclaimer & Self-Assessment Text
                          </span>
                          <textarea
                            rows={3}
                            placeholder="Teks pernyataan yang wajib disetujui saat pendaftar mengonfirmasi form..."
                            value={settings.disclaimerText ?? ""}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                disclaimerText: event.target.value,
                              }))
                            }
                            className="admin-input h-auto py-2.5"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 3: DIVISI & FORMAT */}
                  {setupTab === "format" && (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                            <RacquetIcon aria-hidden="true" weight="bold" />
                          </span>
                          <div>
                            <h3 className="font-black text-ink-950">
                              Competition format & scoring rules
                            </h3>
                            <p className="text-xs text-ink-500">
                              Tournament structure and default scoring preset
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <label>
                            <span className="admin-label">
                              Racket Sport / Discipline
                            </span>
                            <select
                              value={settings.sport ?? "badminton"}
                              onChange={(event) => {
                                const selectedSport = event.target
                                  .value as SportType;
                                const preset = SPORT_OPTIONS.find(
                                  (s) => s.value === selectedSport,
                                )?.defaultRules;
                                setSettings((current) => ({
                                  ...current,
                                  sport: selectedSport,
                                  scoringRules: preset
                                    ? {
                                        ...preset,
                                        bronzeMatch:
                                          current.scoringRules?.bronzeMatch ??
                                          false,
                                      }
                                    : current.scoringRules,
                                }));
                              }}
                              className="admin-input font-bold"
                            >
                              {SPORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label} — {opt.badge}
                                </option>
                              ))}
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
                                  format: event.target
                                    .value as TournamentFormat,
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
                              disabled={
                                settings.format !== "Group stage + knockout"
                              }
                              value={settings.groupSize}
                              onChange={(event) =>
                                setSettings((current) => ({
                                  ...current,
                                  groupSize: Number(event.target.value),
                                }))
                              }
                              className="admin-input disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </label>
                          <label>
                            <span className="admin-label">
                              Default knockout size
                            </span>
                            <select
                              value={settings.qualifierCount}
                              disabled={
                                settings.format !== "Group stage + knockout"
                              }
                              onChange={(event) =>
                                setSettings((current) => ({
                                  ...current,
                                  qualifierCount: Number(event.target.value),
                                }))
                              }
                              className="admin-input disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value={8}>Top 8</option>
                              <option value={16}>Top 16</option>
                              <option value={24}>Top 24</option>
                              <option value={32}>Top 32</option>
                            </select>
                          </label>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                          <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-600">
                              Match divisions
                            </p>
                            <h3 className="mt-1 text-xl font-black text-ink-950">
                              Division-specific draw rules
                            </h3>
                            <p className="mt-1 text-sm text-ink-500">
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
                              className="h-11 rounded-xl bg-brand-500 px-4 text-sm font-extrabold text-ink-950 transition hover:bg-brand-400"
                            >
                              Add division
                            </button>
                          </div>
                        </div>
                        <div className="mt-5 grid gap-3 xl:grid-cols-2">
                          {settings.categories.length === 0 ? (
                            <div className="xl:col-span-2">
                              <EmptyState
                                icon={ShapesIcon}
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
                                  className="group rounded-2xl border border-ink-200 bg-ink-50/70 p-4 transition hover:border-brand-200 hover:bg-brand-50/40"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-extrabold text-ink-950">
                                        {division}
                                      </p>
                                      <p className="mt-1 text-xs text-ink-500">
                                        {
                                          teams.filter(
                                            (team) =>
                                              team.category === division,
                                          ).length
                                        }{" "}
                                        registered teams
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeDivision(division)}
                                      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                                      aria-label={`Remove ${division}`}
                                    >
                                      <TrashIcon
                                        className="text-lg"
                                        aria-hidden="true"
                                        weight="bold"
                                      />
                                    </button>
                                  </div>
                                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                    <label>
                                      <span className="admin-label">
                                        Format override
                                      </span>
                                      <select
                                        value={override.format ?? ""}
                                        onChange={(event) =>
                                          setDivisionOverride(
                                            division,
                                            "format",
                                            (event.target
                                              .value as TournamentFormat) ||
                                              undefined,
                                          )
                                        }
                                        className="admin-input font-bold"
                                      >
                                        <option value="">
                                          Default ({settings.format})
                                        </option>
                                        <option value="Group stage + knockout">
                                          Group stage + knockout
                                        </option>
                                        <option value="Single elimination">
                                          Single elimination
                                        </option>
                                        <option value="Round robin">
                                          Round robin
                                        </option>
                                      </select>
                                    </label>
                                    <label>
                                      <span className="admin-label">
                                        Teams per group
                                      </span>
                                      <select
                                        value={override.groupSize ?? ""}
                                        disabled={
                                          (override.format ??
                                            settings.format) ===
                                          "Single elimination"
                                        }
                                        onChange={(event) =>
                                          setDivisionOverride(
                                            division,
                                            "groupSize",
                                            event.target.value
                                              ? Number(event.target.value)
                                              : undefined,
                                          )
                                        }
                                        className="admin-input disabled:cursor-not-allowed disabled:opacity-50"
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
                                        disabled={
                                          (override.format ??
                                            settings.format) === "Round robin"
                                        }
                                        onChange={(event) =>
                                          setDivisionOverride(
                                            division,
                                            "knockoutSize",
                                            event.target.value
                                              ? Number(event.target.value)
                                              : undefined,
                                          )
                                        }
                                        className="admin-input disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <option value="">
                                          Default ({settings.qualifierCount})
                                        </option>
                                        {[2, 4, 8, 16, 24, 32, 64].map(
                                          (value) => (
                                            <option key={value} value={value}>
                                              Top {value}
                                            </option>
                                          ),
                                        )}
                                      </select>
                                    </label>
                                  </div>
                                  <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-bold text-ink-700">
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
                                      className="h-4 w-4 accent-brand-500"
                                    />
                                    Include a 3rd-place (bronze) match
                                  </label>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 4: ORDER OF PLAY (OOP) */}
                  {setupTab === "oop" && (
                    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-600">
                            Order of Play
                          </p>
                          <h3 className="mt-1 text-xl font-black text-ink-950">
                            Session and court sequencing
                          </h3>
                          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-500">
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
                            className="h-11 shrink-0 rounded-xl bg-brand-500 px-4 text-sm font-extrabold text-ink-950 shadow-lg shadow-ink-950/10"
                          >
                            Use Padel CAH template
                          </button>
                        )}
                      </div>

                      {settings.oop ? (
                        <div className="mt-5 space-y-5">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label>
                              <span className="admin-label">
                                Day start time
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
                                        ? "border-brand-300 bg-brand-50 text-brand-700"
                                        : "border-ink-200 bg-white text-ink-500 hover:border-brand-200",
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
                                className="rounded-2xl border border-ink-200 bg-ink-50/60 p-4"
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
                                    <span className="admin-label">
                                      Capacity
                                    </span>
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
                                                      ? Number(
                                                          event.target.value,
                                                        )
                                                      : null,
                                                  }
                                                : item,
                                          ),
                                        }))
                                      }
                                      className="admin-input"
                                    />
                                  </label>
                                  <label className="flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 text-sm font-bold text-ink-700">
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
                                      className="h-4 w-4 accent-brand-500"
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
                                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink-200 text-ink-400 hover:border-rose-200 hover:text-rose-600"
                                    aria-label={`Remove session ${session.time}`}
                                  >
                                    <TrashIcon
                                      aria-hidden="true"
                                      weight="bold"
                                    />
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
                                                          (entry) =>
                                                            entry.title,
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
                              className="h-10 rounded-xl border border-dashed border-brand-300 px-4 text-xs font-extrabold text-brand-700 hover:bg-brand-50"
                            >
                              + Add OOP session
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-5 text-sm font-semibold text-brand-800">
                          Enable the template to configure OOP sessions, events,
                          category order and court capacity.
                        </div>
                      )}
                    </div>
                  )}
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
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-extrabold text-ink-950 shadow-lg shadow-ink-950/10 transition hover:-translate-y-0.5 hover:bg-brand-400"
                      >
                        <UserPlusIcon
                          className="text-lg"
                          aria-hidden="true"
                          weight="bold"
                        />
                        Add team
                      </button>
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MetricCard
                      icon={SealCheckIcon}
                      label="Approved"
                      value={totals.approved}
                      detail={`${teams.length} total registrations`}
                    />
                    <MetricCard
                      icon={MoneyIcon}
                      label="Paid"
                      value={totals.paid}
                      detail={`${teams.length - totals.paid} awaiting payment`}
                      accent="emerald"
                    />
                    <MetricCard
                      icon={RocketLaunchIcon}
                      label="Draw-ready"
                      value={totals.eligible}
                      detail="Approved and paid"
                      accent="amber"
                    />
                  </div>
                  <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_180px_220px]">
                      <div className="relative block sm:col-span-2 lg:col-span-1">
                        <MagnifyingGlassIcon
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-lg text-ink-400"
                          aria-hidden="true"
                          weight="bold"
                        />
                        <input
                          type="text"
                          value={teamSearch}
                          onChange={(event) =>
                            setTeamSearch(event.target.value)
                          }
                          placeholder="Search team, city or ID..."
                          className="admin-input admin-input-icon !pl-10 pr-9"
                        />
                        {teamSearch && (
                          <button
                            type="button"
                            onClick={() => setTeamSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
                            title="Clear search"
                          >
                            <XIcon
                              className="block text-base leading-none"
                              aria-hidden="true"
                              weight="bold"
                            />
                          </button>
                        )}
                      </div>
                      <select
                        value={teamFilter}
                        onChange={(event) =>
                          handleTeamFilterChange(
                            event.target.value as RegistrationFilter,
                          )
                        }
                        className="admin-input cursor-pointer"
                      >
                        <option value="all">All statuses</option>
                        <option value="pending">Needs review</option>
                        <option value="approved">Approved</option>
                        <option value="waitlist">Waitlist</option>
                      </select>
                      <select
                        value={teamDivision}
                        onChange={(event) =>
                          handleTeamDivisionChange(event.target.value)
                        }
                        className="admin-input cursor-pointer"
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
                      icon={UsersThreeIcon}
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
                          className="admin-rise rounded-2xl border border-ink-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md sm:p-5"
                        >
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-black text-white shadow-md shadow-ink-950/10">
                                {team.player.charAt(0).toUpperCase()}
                                {team.partner?.charAt(0).toUpperCase() ?? ""}
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate font-black text-ink-950">
                                    {teamName(team)}
                                  </h3>
                                  <span className="rounded-md bg-ink-100 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ink-500">
                                    {team.id}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-brand-700">
                                  {team.category}
                                </p>
                                <p className="mt-1 text-xs text-ink-400">
                                  {team.city} · Registered{" "}
                                  {new Date(
                                    team.registeredAt,
                                  ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  {team.paymentProofUrl && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                      <ReceiptIcon
                                        className="text-xs"
                                        aria-hidden="true"
                                        weight="bold"
                                      />
                                      Bukti Transfer Ada
                                    </span>
                                  )}
                                  {(() => {
                                    const p1Ktp = team.playerDetails?.idCardUrl;
                                    const p2Ktp =
                                      team.partnerDetails?.idCardUrl;
                                    if (p1Ktp && p2Ktp) {
                                      return (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 border border-teal-200">
                                          <IdentificationBadgeIcon
                                            className="text-xs"
                                            aria-hidden="true"
                                            weight="bold"
                                          />
                                          KTP Lengkap (2/2)
                                        </span>
                                      );
                                    }
                                    if (p1Ktp || p2Ktp) {
                                      return (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                                          <IdentificationBadgeIcon
                                            className="text-xs"
                                            aria-hidden="true"
                                            weight="bold"
                                          />
                                          KTP (1/2)
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
                                        <IdentificationBadgeIcon
                                          className="text-xs"
                                          aria-hidden="true"
                                          weight="bold"
                                        />
                                        KTP: Belum Ada
                                      </span>
                                    );
                                  })()}
                                  {team.playerDetails?.jerseySize && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-bold text-ink-600">
                                      Jersey: {team.playerDetails.jerseySize} /{" "}
                                      {team.partnerDetails?.jerseySize ?? "-"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-end gap-2.5 xl:shrink-0">
                              <div className="grid grid-cols-3 gap-2 w-full sm:w-[480px]">
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
                                        status: event.target
                                          .value as TeamStatus,
                                      })
                                    }
                                    className="admin-input"
                                  >
                                    <option value="pending">
                                      Needs review
                                    </option>
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
                                    {team.status === "approved" && team.paid ? (
                                      <CheckCircleIcon
                                        className="text-base"
                                        weight="bold"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <DotsThreeCircleIcon
                                        className="text-base"
                                        weight="bold"
                                        aria-hidden="true"
                                      />
                                    )}
                                    {team.status === "approved" && team.paid
                                      ? "Draw-ready"
                                      : "Action needed"}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setViewingTeam(team)}
                                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50/70 px-3.5 text-xs font-extrabold text-brand-700 transition hover:bg-brand-100"
                                >
                                  <EyeIcon
                                    className="text-base"
                                    aria-hidden="true"
                                    weight="bold"
                                  />
                                  Detail
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRemoveTarget(team)}
                                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 px-3 text-xs font-extrabold text-ink-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <UserMinusIcon
                                    className="text-base"
                                    aria-hidden="true"
                                    weight="bold"
                                  />
                                  Remove
                                </button>
                              </div>
                            </div>
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
                          className="inline-flex h-11 items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 text-xs font-extrabold text-brand-700 hover:bg-brand-50"
                        >
                          <FileArrowUpIcon
                            className="text-lg"
                            aria-hidden="true"
                            weight="bold"
                          />
                          Import draw
                        </button>
                        <button
                          type="button"
                          onClick={() => void exportOopFile()}
                          disabled={exportingOop || !oopPlan}
                          className="inline-flex h-11 items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 text-xs font-extrabold text-brand-700 hover:bg-brand-50 disabled:opacity-40"
                        >
                          <DownloadSimpleIcon
                            className="text-lg"
                            aria-hidden="true"
                            weight="bold"
                          />
                          {exportingOop ? "Exporting…" : "Export OOP"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrawDialog(true)}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-extrabold text-ink-950 shadow-lg shadow-ink-950/10 transition hover:-translate-y-0.5 hover:bg-brand-400"
                        >
                          <ShuffleIcon
                            className="text-lg"
                            aria-hidden="true"
                            weight="bold"
                          />
                          {matches.length ? "Regenerate draw" : "Generate draw"}
                        </button>
                      </div>
                    }
                  />

                  <div className="overflow-hidden rounded-2xl bg-ink-950 p-5 text-white shadow-xl shadow-ink-950/10 sm:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="admin-live-dot h-2.5 w-2.5 rounded-full bg-ink-700" />
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-cream-200">
                            Court control
                          </p>
                        </div>
                        <h3 className="mt-2 text-xl font-black">
                          {totals.live
                            ? `${totals.live} matches live now`
                            : "All courts are calm"}
                        </h3>
                        <p className="mt-1 text-sm text-cream-100/70">
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
                              <p className="text-[10px] font-bold uppercase tracking-wider text-cream-200">
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
                      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                          <div>
                            <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-800">
                              Order of Play
                            </span>
                            <h3 className="mt-4 text-2xl font-black text-ink-950">
                              {oopPlan.title}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-500">
                              Focus on one session at a time. Switch to detailed
                              view only when you need teams and live match
                              state.
                            </p>
                          </div>
                          <div className="flex items-center self-start rounded-xl border border-ink-200 bg-ink-100 p-1">
                            <button
                              type="button"
                              aria-pressed={oopCompact}
                              onClick={() => setOopCompact(true)}
                              className={cx(
                                "h-8 rounded-lg px-3 text-xs font-bold uppercase tracking-wider transition",
                                oopCompact
                                  ? "bg-white text-brand-600 shadow-sm"
                                  : "text-ink-600 hover:text-ink-950",
                              )}
                            >
                              Compact
                            </button>
                            <button
                              type="button"
                              aria-pressed={!oopCompact}
                              onClick={() => setOopCompact(false)}
                              className={cx(
                                "h-8 rounded-lg px-3 text-xs font-bold uppercase tracking-wider transition",
                                !oopCompact
                                  ? "bg-white text-brand-600 shadow-sm"
                                  : "text-ink-600 hover:text-ink-950",
                              )}
                            >
                              Detailed
                            </button>
                          </div>
                        </div>

                        <div className="mt-6 border-y border-ink-200 bg-ink-50/50 px-2 py-3">
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
                                    "min-w-[170px] shrink-0 rounded-xl px-4 py-3 text-left border transition",
                                    selected
                                      ? "border-brand-500 bg-brand-500 text-ink-950 shadow-md shadow-ink-950/10"
                                      : "border-ink-200 bg-white text-ink-800 hover:bg-ink-50",
                                  )}
                                >
                                  <span className="block text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
                                    Session {sessionIndex + 1}
                                  </span>
                                  <span className="mt-1 block text-base font-black">
                                    {adminOopTimeLabel(session.timeLabel)}
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

                        <div className="mt-5 overflow-hidden rounded-2xl border border-ink-200">
                          <div className="flex flex-wrap items-center gap-3 border-b border-ink-950/20 bg-ink-950 px-4 py-3 text-white">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-cream-200">
                              <ClockIcon
                                className="text-base"
                                aria-hidden="true"
                                weight="bold"
                              />
                            </span>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-cream-200/70">
                                Now viewing
                              </p>
                              <p className="text-sm font-bold uppercase tracking-wide text-white">
                                {adminOopTimeLabel(activeOopSession.timeLabel)}
                              </p>
                            </div>
                            <div className="ml-auto flex flex-wrap gap-2 text-[10px] font-bold uppercase">
                              <span className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-white/90">
                                {oopSessionSummaries[selectedOopSession]
                                  ?.matchCount ?? 0}{" "}
                                matches
                              </span>
                              <span className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-white/90">
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
                              <div className="sticky left-0 z-20 flex items-center justify-center border-b border-ink-200 bg-ink-50 px-2 py-3 text-[10px] font-bold uppercase text-ink-700">
                                Run
                              </div>
                              {Array.from(
                                { length: oopPlan.courts },
                                (_, index) => index + 1,
                              ).map((court) => (
                                <div
                                  key={court}
                                  className="border-b border-l border-ink-200 bg-ink-50 px-2 py-3 text-center text-[11px] font-bold uppercase text-ink-800"
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
                                      <div className="sticky left-0 z-10 flex items-center justify-center border-t border-ink-200 bg-ink-50 text-xs font-bold text-ink-700">
                                        {String(slot.number).padStart(2, "0")}
                                      </div>
                                      <div
                                        style={{ gridColumn: "2 / -1" }}
                                        className="flex items-center justify-center gap-2 border-l border-t border-ink-200 bg-brand-50/80 px-4 py-4 text-xs font-bold uppercase tracking-wider text-ink-900"
                                      >
                                        <MegaphoneIcon
                                          className="text-base"
                                          aria-hidden="true"
                                          weight="bold"
                                        />
                                        {firstEntry.title}
                                      </div>
                                    </Fragment>
                                  );
                                }

                                return (
                                  <Fragment key={slot.number}>
                                    <div className="sticky left-0 z-10 flex items-center justify-center border-t border-ink-200 bg-ink-50 text-xs font-bold text-ink-700">
                                      {String(slot.number).padStart(2, "0")}
                                    </div>
                                    {slot.courts.map((entry, courtIndex) => (
                                      <div
                                        key={`${slot.number}-${courtIndex}`}
                                        className={cx(
                                          "border-l border-t border-ink-200 bg-white p-2",
                                          oopCompact ? "min-h-20" : "min-h-32",
                                        )}
                                      >
                                        {entry?.kind === "match" ? (
                                          <div
                                            className={cx(
                                              "h-full rounded-xl border border-ink-200 p-2 bg-ink-50/70",
                                              oopCategoryClasses(
                                                entry.category,
                                              ),
                                            )}
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="min-w-0">
                                                <p className="truncate text-[11px] font-bold text-ink-900">
                                                  {entry.matchLabel}
                                                </p>
                                                <p className="mt-0.5 truncate text-[9px] font-semibold uppercase text-ink-500">
                                                  {entry.stageLabel}
                                                </p>
                                              </div>
                                              <span className="shrink-0 text-[9px] font-semibold text-ink-400">
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
                                                    className="block rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-ink-900 transition hover:bg-ink-50"
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
                                                              : "bg-brand-500",
                                                        )}
                                                      />
                                                      <span className="truncate">
                                                        {id}
                                                      </span>
                                                      <ArrowSquareOutIcon
                                                        className="ml-auto text-xs"
                                                        aria-hidden="true"
                                                        weight="bold"
                                                      />
                                                    </span>
                                                    {!oopCompact && item && (
                                                      <span className="mt-1 block truncate border-t border-ink-100 pt-1 text-[9px] font-medium text-ink-500">
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
                                          <div className="flex h-full min-h-14 items-center justify-center border-2 border-dashed border-ink-200 text-[10px] font-bold uppercase text-ink-300">
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

                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-black uppercase tracking-wider text-ink-500">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
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
                          <span className="ml-auto hidden text-ink-400 sm:block">
                            Swipe horizontally to see every court
                          </span>
                        </div>
                      </div>
                    )}

                  {matches.length === 0 && drawPreview.length > 0 && (
                    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-600">
                        Draw preview
                      </p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {drawPreview.map((preview) => (
                          <div
                            key={preview.division}
                            className="rounded-xl border border-brand-100 bg-white p-4"
                          >
                            <p className="font-extrabold text-ink-950">
                              {preview.division}
                            </p>
                            <div
                              className={`mt-3 grid gap-2 text-center ${
                                settings.format === "Group stage + knockout"
                                  ? "grid-cols-4"
                                  : "grid-cols-2"
                              }`}
                            >
                              <div>
                                <p className="text-lg font-black text-brand-700">
                                  {preview.teamCount}
                                </p>
                                <p className="text-[10px] font-bold uppercase text-ink-400">
                                  Teams
                                </p>
                              </div>
                              {settings.format === "Single elimination" ? (
                                <div>
                                  <p className="text-lg font-black text-brand-700">
                                    {preview.teamCount >= 2
                                      ? preview.teamCount
                                      : 0}
                                  </p>
                                  <p className="text-[10px] font-bold uppercase text-ink-400">
                                    Knockout field
                                  </p>
                                </div>
                              ) : settings.format === "Round robin" ? (
                                <div>
                                  <p className="text-lg font-black text-brand-700">
                                    {preview.roundRobinMatches}
                                  </p>
                                  <p className="text-[10px] font-bold uppercase text-ink-400">
                                    Total matches
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <p className="text-lg font-black text-brand-700">
                                      {preview.groups}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase text-ink-400">
                                      Groups
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-black text-brand-700">
                                      {preview.groupSize}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase text-ink-400">
                                      Per group
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-black text-brand-700">
                                      {preview.knockoutSize}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase text-ink-400">
                                      Knockout
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-800">
                        Match control
                      </span>
                      <h3 className="mt-4 text-2xl font-black text-ink-950">
                        Find and operate a match
                      </h3>
                      <p className="mt-1 text-sm text-ink-500">
                        The focused list below follows the official OOP
                        sequence.
                      </p>
                    </div>
                    <span className="self-start rounded-full border border-ink-200 bg-ink-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink-700 sm:self-auto">
                      {filteredMatches.length} visible
                    </span>
                  </div>

                  <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_160px_160px_200px]">
                      <div className="relative block sm:col-span-2 lg:col-span-1">
                        <MagnifyingGlassIcon
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-lg text-ink-400"
                          aria-hidden="true"
                          weight="bold"
                        />
                        <input
                          type="text"
                          value={matchSearch}
                          onChange={(event) =>
                            setMatchSearch(event.target.value)
                          }
                          placeholder="Search match, team or player..."
                          className="admin-input admin-input-icon !pl-10 pr-9"
                        />
                        {matchSearch && (
                          <button
                            type="button"
                            onClick={() => setMatchSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
                            title="Clear search"
                          >
                            <XIcon
                              className="block text-base leading-none"
                              aria-hidden="true"
                              weight="bold"
                            />
                          </button>
                        )}
                      </div>
                      <select
                        value={matchStatus}
                        onChange={(event) =>
                          handleMatchStatusChange(
                            event.target.value as "all" | MatchStatus,
                          )
                        }
                        className="admin-input cursor-pointer"
                      >
                        <option value="all">All states</option>
                        <option value="live">Live</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                      </select>
                      <select
                        value={matchPhase}
                        onChange={(event) =>
                          handleMatchPhaseChange(
                            event.target.value as "all" | Phase,
                          )
                        }
                        className="admin-input cursor-pointer"
                      >
                        <option value="all">All phases</option>
                        <option value="group">Group stage</option>
                        <option value="knockout">Knockout</option>
                      </select>
                      <select
                        value={matchDivision}
                        onChange={(event) =>
                          handleMatchDivisionChange(event.target.value)
                        }
                        className="admin-input cursor-pointer"
                      >
                        <option value="all">All divisions</option>
                        {settings.categories.map((division) => (
                          <option key={division} value={division}>
                            {division}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(matchSearch ||
                      matchStatus !== "all" ||
                      matchPhase !== "all" ||
                      matchDivision !== "all") && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3 text-xs">
                        <span className="font-bold text-ink-500">
                          Active filters:
                        </span>
                        {matchSearch && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 font-semibold text-brand-700">
                            Search: &quot;{matchSearch}&quot;
                            <button
                              type="button"
                              onClick={() => setMatchSearch("")}
                              className="hover:text-ink-900"
                            >
                              <XIcon
                                className="text-xs"
                                aria-hidden="true"
                                weight="bold"
                              />
                            </button>
                          </span>
                        )}
                        {matchStatus !== "all" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 font-semibold text-brand-700">
                            State: {matchStatus}
                            <button
                              type="button"
                              onClick={() => handleMatchStatusChange("all")}
                              className="hover:text-ink-900"
                            >
                              <XIcon
                                className="text-xs"
                                aria-hidden="true"
                                weight="bold"
                              />
                            </button>
                          </span>
                        )}
                        {matchPhase !== "all" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 font-semibold text-brand-700">
                            Phase: {matchPhase}
                            <button
                              type="button"
                              onClick={() => handleMatchPhaseChange("all")}
                              className="hover:text-ink-900"
                            >
                              <XIcon
                                className="text-xs"
                                aria-hidden="true"
                                weight="bold"
                              />
                            </button>
                          </span>
                        )}
                        {matchDivision !== "all" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 font-semibold text-brand-700">
                            Division: {matchDivision}
                            <button
                              type="button"
                              onClick={() => handleMatchDivisionChange("all")}
                              className="hover:text-ink-900"
                            >
                              <XIcon
                                className="text-xs"
                                aria-hidden="true"
                                weight="bold"
                              />
                            </button>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setMatchSearch("");
                            handleMatchStatusChange("all");
                            handleMatchPhaseChange("all");
                            handleMatchDivisionChange("all");
                          }}
                          className="ml-auto text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
                        >
                          Reset all filters
                        </button>
                      </div>
                    )}
                  </div>

                  {filteredMatches.length === 0 ? (
                    <EmptyState
                      icon={FlagCheckeredIcon}
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
                    <div className="grid gap-4 xl:grid-cols-2">
                      {filteredMatches.map((match, index) => {
                        const teamA = teams.find(
                          (item) => item.id === match.teamAId,
                        );
                        const teamB = teams.find(
                          (item) => item.id === match.teamBId,
                        );
                        return (
                          <article
                            key={match.id}
                            style={{
                              animationDelay: `${String(Math.min(index * 35, 280))}ms`,
                            }}
                            className={cx(
                              "admin-rise group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg",
                              match.status === "live"
                                ? "border-rose-200 ring-2 ring-rose-100"
                                : "border-ink-200 hover:border-brand-200",
                            )}
                          >
                            {match.status === "live" && (
                              <div className="admin-live-sweep absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-brand-400 to-rose-500" />
                            )}
                            <div className="p-5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={cx(
                                    "rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                                    matchStatusStyle[match.status],
                                  )}
                                >
                                  {match.status}
                                </span>
                                <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink-600">
                                  {match.phase}
                                </span>
                                {match.time && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50/80 px-2.5 py-0.5 text-[10px] font-extrabold text-brand-700">
                                    <ClockIcon
                                      className="text-[12px] leading-none"
                                      aria-hidden="true"
                                      weight="bold"
                                    />
                                    {match.time}
                                  </span>
                                )}
                                {match.courtId && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/80 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800">
                                    <RacquetIcon
                                      className="text-[12px] leading-none"
                                      aria-hidden="true"
                                      weight="bold"
                                    />
                                    {settings.sport === "table_tennis"
                                      ? `Meja ${match.courtId}`
                                      : `Court ${match.courtId}`}
                                  </span>
                                )}
                                <span className="ml-auto font-mono text-[11px] font-extrabold text-ink-400">
                                  #{match.id.replace(`${tournamentId}-`, "")}
                                </span>
                              </div>

                              <div className="mt-3 flex items-baseline justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="truncate text-base font-black text-ink-950">
                                    {match.category}
                                  </h3>
                                  <p className="mt-0.5 text-xs font-semibold text-ink-500">
                                    {match.group ? `${match.group} · ` : ""}
                                    {match.round}
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-2xl font-black tracking-tight text-brand-700">
                                    {formatMatchScore(
                                      match.score,
                                      match.scoreSets,
                                    ).primary || "0-0"}
                                  </p>
                                  {formatMatchScore(
                                    match.score,
                                    match.scoreSets,
                                  ).details && (
                                    <p className="text-[10px] font-semibold text-ink-400">
                                      {
                                        formatMatchScore(
                                          match.score,
                                          match.scoreSets,
                                        ).details
                                      }
                                    </p>
                                  )}
                                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-ink-400">
                                    Current score
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 rounded-2xl border border-ink-100 bg-ink-50/80 p-3.5 sm:gap-3 sm:p-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-500">
                                      Team A
                                    </p>
                                    {teamA?.seed && (
                                      <span className="rounded bg-brand-100 px-1.5 py-0.2 text-[9px] font-black text-brand-700">
                                        #{teamA.seed}
                                      </span>
                                    )}
                                  </div>
                                  <p
                                    className="mt-1 truncate text-sm font-black leading-snug text-ink-950"
                                    title={
                                      teamA
                                        ? teamName(teamA)
                                        : "Waiting for team"
                                    }
                                  >
                                    {teamA
                                      ? teamName(teamA)
                                      : "Waiting for team"}
                                  </p>
                                </div>
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-[10px] font-black text-ink-400 shadow-sm">
                                  VS
                                </span>
                                <div className="min-w-0 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {teamB?.seed && (
                                      <span className="rounded bg-brand-100 px-1.5 py-0.2 text-[9px] font-black text-brand-700">
                                        #{teamB.seed}
                                      </span>
                                    )}
                                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-500">
                                      Team B
                                    </p>
                                  </div>
                                  <p
                                    className="mt-1 truncate text-sm font-black leading-snug text-ink-950"
                                    title={
                                      teamB
                                        ? teamName(teamB)
                                        : "Waiting for team"
                                    }
                                  >
                                    {teamB
                                      ? teamName(teamB)
                                      : "Waiting for team"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <label className="block">
                                  <span className="admin-label">
                                    {settings.sport === "table_tennis"
                                      ? "Meja"
                                      : "Court"}
                                  </span>
                                  <select
                                    value={match.courtId ?? ""}
                                    onChange={(event) =>
                                      quickMatchUpdate(match, {
                                        courtId: event.target.value
                                          ? Number(event.target.value)
                                          : null,
                                      })
                                    }
                                    className="admin-input cursor-pointer"
                                  >
                                    <option value="">Unassigned</option>
                                    {Array.from(
                                      { length: settings.courts },
                                      (_, court) => court + 1,
                                    ).map((court) => (
                                      <option key={court} value={court}>
                                        {settings.sport === "table_tennis"
                                          ? `Meja ${court}`
                                          : `Court ${court}`}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block">
                                  <span className="admin-label">
                                    Match state
                                  </span>
                                  <select
                                    value={match.status}
                                    onChange={(event) =>
                                      quickMatchUpdate(match, {
                                        status: event.target
                                          .value as MatchStatus,
                                      })
                                    }
                                    className="admin-input cursor-pointer"
                                  >
                                    <option value="scheduled">Scheduled</option>
                                    <option value="live">Live</option>
                                    {match.status === "completed" && (
                                      <option value="completed">
                                        Completed
                                      </option>
                                    )}
                                  </select>
                                </label>
                                <div>
                                  <span className="admin-label">Referee</span>
                                  <div className="flex h-11 items-center truncate rounded-xl border border-ink-200 bg-ink-50 px-3 text-sm font-semibold text-ink-600">
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
                                    "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-extrabold shadow-md transition hover:-translate-y-0.5",
                                    match.status === "live"
                                      ? "bg-rose-500 text-white shadow-ink-950/10 hover:bg-rose-600"
                                      : "bg-brand-500 text-ink-950 shadow-ink-950/10 hover:bg-brand-400",
                                  )}
                                >
                                  <ScoreboardIcon
                                    className="text-lg"
                                    aria-hidden="true"
                                    weight="bold"
                                  />
                                  {match.status === "completed"
                                    ? "Review scoring"
                                    : "Open scoring"}
                                  <ArrowSquareOutIcon
                                    className="text-sm"
                                    aria-hidden="true"
                                    weight="bold"
                                  />
                                </Link>
                                {match.status === "scheduled" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      quickMatchUpdate(match, {
                                        status: "live",
                                      })
                                    }
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-extrabold text-brand-700 transition hover:bg-brand-100"
                                  >
                                    <PlayIcon
                                      className="text-lg"
                                      aria-hidden="true"
                                      weight="bold"
                                    />
                                    Start match
                                  </button>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
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
                        href={`/tournaments/bracket?tournament=${tournament?.slug || tournamentId}&view=bracket`}
                        target="_blank"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-extrabold text-ink-950 shadow-lg shadow-ink-950/10 transition hover:-translate-y-0.5 hover:bg-brand-400"
                      >
                        <TreeStructureIcon
                          className="text-lg"
                          aria-hidden="true"
                          weight="bold"
                        />
                        Open public bracket
                      </Link>
                    }
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard
                      icon={CheckCircleIcon}
                      label="Completed"
                      value={totals.completed}
                      detail={`${matches.length} total matches`}
                      accent="emerald"
                    />
                    <MetricCard
                      icon={PercentIcon}
                      label="Progress"
                      value={`${progress}%`}
                      detail={`${totals.scheduled + totals.live} remaining`}
                    />
                    <MetricCard
                      icon={TrophyIcon}
                      label="Divisions"
                      value={settings.categories.length}
                      detail="Separate competition tracks"
                      accent="amber"
                    />
                  </div>

                  {settings.categories.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink-200 bg-white p-3 shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                        Division:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResultsDivisionChange("all")}
                        className={cx(
                          "rounded-xl border px-3.5 py-1.5 text-xs font-bold transition",
                          resultsDivision === "all"
                            ? "border-brand-500 bg-brand-500 text-ink-950 shadow-sm"
                            : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
                        )}
                      >
                        All divisions ({settings.categories.length})
                      </button>
                      {settings.categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleResultsDivisionChange(cat)}
                          className={cx(
                            "rounded-xl border px-3.5 py-1.5 text-xs font-bold transition",
                            resultsDivision === cat
                              ? "border-brand-500 bg-brand-500 text-ink-950 shadow-sm"
                              : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {groupStandings.length === 0 ? (
                    <EmptyState
                      icon={RankingIcon}
                      title="Standings will appear after the draw"
                      description="Complete group matches and points will be calculated here automatically."
                    />
                  ) : filteredResultsStandings.length === 0 ? (
                    <EmptyState
                      icon={RankingIcon}
                      title={`No standings for ${resultsDivision}`}
                      description="No group stages or matches found in this division."
                    />
                  ) : (
                    <div>
                      <h3 className="mb-3 text-lg font-black text-ink-950">
                        Group standings
                        {resultsDivision !== "all" && ` · ${resultsDivision}`}
                      </h3>
                      <div className="grid gap-4 xl:grid-cols-2">
                        {filteredResultsStandings.map(({ group, rows }) => (
                          <div
                            key={group}
                            className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm"
                          >
                            <div className="border-b border-ink-100 bg-brand-50/70 px-4 py-3">
                              <p className="font-extrabold text-ink-950">
                                {group}
                              </p>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[680px] text-left text-sm">
                                <thead>
                                  <tr className="text-[10px] font-extrabold uppercase tracking-wider text-ink-400">
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
                                      className="border-t border-ink-100"
                                    >
                                      <td className="px-4 py-3">
                                        <span
                                          className={cx(
                                            "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black",
                                            index < 2
                                              ? "bg-brand-500 text-ink-950"
                                              : "bg-ink-100 text-ink-500",
                                          )}
                                        >
                                          {index + 1}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 font-bold text-ink-800">
                                        {row.name}
                                      </td>
                                      <td className="px-3 py-3 text-center text-ink-500">
                                        {row.played}
                                      </td>
                                      <td className="px-3 py-3 text-center text-ink-500">
                                        {row.wins}
                                      </td>
                                      <td className="px-3 py-3 text-center text-ink-500">
                                        {row.losses}
                                      </td>
                                      <td className="px-3 py-3 text-center text-ink-500">
                                        {row.gamesWon}
                                      </td>
                                      <td className="px-3 py-3 text-center text-ink-500">
                                        {row.gamesLost}
                                      </td>
                                      <td className="px-3 py-3 text-center font-bold text-ink-700">
                                        {row.diff}
                                      </td>
                                      <td className="px-4 py-3 text-center font-black text-brand-700">
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
                    <h3 className="mb-3 text-lg font-black text-ink-950">
                      Completed matches
                      {resultsDivision !== "all" && ` · ${resultsDivision}`}
                    </h3>
                    {completedMatches.length === 0 ? (
                      <EmptyState
                        icon={ScoreboardIcon}
                        title="No final scores yet"
                        description="Finished matches will collect here with their winner and set scores."
                      />
                    ) : filteredCompletedMatches.length === 0 ? (
                      <EmptyState
                        icon={ScoreboardIcon}
                        title={`No completed matches for ${resultsDivision}`}
                        description="Matches in this division are either scheduled or not yet scored."
                      />
                    ) : (
                      <div className="grid gap-3 xl:grid-cols-2">
                        {filteredCompletedMatches.map((match) => (
                          <div
                            key={match.id}
                            className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600">
                                  {match.category} · {match.round}
                                </p>
                                <p className="mt-2 text-sm font-bold text-ink-800">
                                  {getTeamName(teams, match.teamAId)}
                                </p>
                                <p className="mt-1 text-sm font-bold text-ink-800">
                                  {getTeamName(teams, match.teamBId)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-brand-700">
                                  {
                                    formatMatchScore(
                                      match.score,
                                      match.scoreSets,
                                    ).primary
                                  }
                                </p>
                                {formatMatchScore(match.score, match.scoreSets)
                                  .details && (
                                  <p className="mt-0.5 text-[11px] font-semibold text-ink-400">
                                    {
                                      formatMatchScore(
                                        match.score,
                                        match.scoreSets,
                                      ).details
                                    }
                                  </p>
                                )}
                                <Link
                                  href={
                                    "/admin/tournaments/" +
                                    tournamentId +
                                    "/matches/" +
                                    match.id
                                  }
                                  target="_blank"
                                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-extrabold text-brand-600 hover:text-brand-800"
                                >
                                  Review{" "}
                                  <ArrowSquareOutIcon
                                    className="text-sm"
                                    aria-hidden="true"
                                    weight="bold"
                                  />
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
          className="admin-modal fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/55 px-4 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="draw-title"
            className="admin-dialog-enter w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_30px_100px_rgba(23,23,23,0.35)]"
          >
            <div className="bg-ink-950 p-6 text-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-ink-950 shadow-lg shadow-ink-950/10">
                <TreeStructureIcon aria-hidden="true" weight="bold" />
              </span>
              <h2 id="draw-title" className="mt-5 text-2xl font-black">
                Build the match board
              </h2>
              <p className="mt-2 text-sm leading-6 text-cream-100/75">
                {settings.format === "Single elimination"
                  ? `The draw seeds ${totals.eligible} approved, paid teams directly into knockout brackets without groups.`
                  : settings.format === "Round robin"
                    ? `The draw creates an all-play-all table from approved, paid teams in each division.`
                    : `The draw uses ${totals.eligible} approved, paid teams and keeps every match division separate.`}
              </p>
            </div>
            <div className="p-6">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
                <span className="font-black">Heads up:</span> generating again
                rebuilds the selected phases and their existing matches.
              </div>
              <div
                className={`mt-5 grid gap-2 ${
                  settings.format === "Group stage + knockout"
                    ? "sm:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
                {settings.format === "Group stage + knockout" && (
                  <>
                    <button
                      type="button"
                      onClick={() => generateDraw("group")}
                      className="h-12 rounded-xl border border-brand-200 bg-brand-50 text-sm font-extrabold text-brand-700 transition hover:bg-brand-100"
                    >
                      Groups only
                    </button>
                    <button
                      type="button"
                      onClick={() => generateDraw("knockout")}
                      className="h-12 rounded-xl border border-brand-200 bg-brand-50 text-sm font-extrabold text-brand-700 transition hover:bg-brand-100"
                    >
                      Knockout only
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => generateDraw("all")}
                  className="h-12 rounded-xl bg-brand-500 text-sm font-extrabold text-ink-950 shadow-lg shadow-ink-950/10 transition hover:bg-brand-400"
                >
                  {settings.format === "Single elimination"
                    ? "Generate knockout"
                    : settings.format === "Round robin"
                      ? "Generate round robin"
                      : "Full draw"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDrawDialog(false)}
                className="mt-3 h-11 w-full rounded-xl text-sm font-extrabold text-ink-500 transition hover:bg-ink-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {importPreview && (
        <div className="admin-modal fixed inset-0 z-[110] flex items-center justify-center bg-ink-950/60 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
            className="admin-dialog-enter max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-[0_30px_100px_rgba(23,23,23,0.4)]"
          >
            <div className="bg-ink-950 p-6 text-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-ink-950">
                <FileArrowUpIcon aria-hidden="true" weight="bold" />
              </span>
              <h2 id="import-title" className="mt-4 text-2xl font-black">
                Review official draw
              </h2>
              <p className="mt-2 text-sm text-cream-100/70">
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
                      className="rounded-xl border border-brand-100 bg-brand-50 p-3"
                    >
                      <p className="text-sm font-black text-ink-950">
                        {category}
                      </p>
                      <p className="mt-1 text-xs font-bold text-brand-600">
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
                  className="h-11 flex-1 rounded-xl border border-ink-200 text-sm font-extrabold text-ink-600"
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
                  className="h-11 flex-1 rounded-xl bg-brand-500 text-sm font-extrabold text-ink-950 shadow-lg shadow-ink-950/10 disabled:opacity-40"
                >
                  {importBusy ? "Importing…" : "Import & regenerate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {removeTarget && (
        <div className="admin-modal fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/55 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="admin-dialog-enter w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_100px_rgba(23,23,23,0.35)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <UserMinusIcon aria-hidden="true" weight="bold" />
            </span>
            <h2 className="mt-5 text-2xl font-black text-ink-950">
              Remove this team?
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              <span className="font-bold text-ink-800">
                {teamName(removeTarget)}
              </span>{" "}
              will be permanently removed from this tournament.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                className="h-11 flex-1 rounded-xl border border-ink-200 text-sm font-extrabold text-ink-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={removeTeam}
                className="h-11 flex-1 rounded-xl bg-rose-600 text-sm font-extrabold text-white shadow-lg shadow-ink-950/10"
              >
                Remove team
              </button>
            </div>
          </div>
        </div>
      )}

      {insertDialog && (
        <div className="admin-modal fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/55 px-4 py-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="admin-dialog-enter max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-[0_30px_100px_rgba(23,23,23,0.35)]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white/95 p-5 backdrop-blur">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-600">
                  Manual registration
                </p>
                <h2 className="mt-1 text-xl font-black text-ink-950">
                  Add a team
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInsertDialog(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-500"
              >
                <XIcon aria-hidden="true" weight="bold" />
              </button>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <fieldset className="rounded-2xl border border-ink-200 p-4">
                <legend className="px-2 text-sm font-black text-ink-800">
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
              <fieldset className="rounded-2xl border border-ink-200 p-4">
                <legend className="px-2 text-sm font-black text-ink-800">
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
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-brand-50 p-4 text-sm font-bold text-ink-900">
                <input
                  type="checkbox"
                  checked={insertForm.paid}
                  onChange={(event) =>
                    setInsertForm((current) => ({
                      ...current,
                      paid: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-brand-500"
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
                  className="h-11 flex-1 rounded-xl border border-ink-200 text-sm font-extrabold text-ink-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitTeam}
                  disabled={submittingTeam}
                  className="h-11 flex-1 rounded-xl bg-brand-500 text-sm font-extrabold text-ink-950 shadow-lg shadow-ink-950/10 disabled:opacity-60"
                >
                  {submittingTeam ? "Adding…" : "Add team"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-ink-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-ink-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <IdentificationBadgeIcon
                    className="text-2xl"
                    aria-hidden="true"
                    weight="duotone"
                  />
                </span>
                <div>
                  <h3 className="text-lg font-black text-ink-950">
                    Detail Registrasi Tim: {teamName(viewingTeam)}
                  </h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                    <span className="font-bold text-brand-700">
                      {viewingTeam.category}
                    </span>
                    <span>·</span>
                    <span>ID: {viewingTeam.id}</span>
                    <span>·</span>
                    <span
                      className={`font-bold uppercase ${
                        viewingTeam.status === "approved"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {viewingTeam.status}
                    </span>
                    <span>·</span>
                    <span
                      className={`font-bold ${
                        viewingTeam.paid ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {viewingTeam.paid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingTeam(null)}
                className="rounded-full p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
              >
                <XIcon
                  className="block text-xl"
                  aria-hidden="true"
                  weight="duotone"
                />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {(() => {
                const p1 = viewingTeam.playerDetails;
                const p1Name = p1?.fullName || viewingTeam.player;
                const p1Photo = p1?.photoUrl || null;
                const p1IdCard = p1?.idCardUrl || null;
                const p1Jersey = p1?.jerseySize || null;
                const p1City = p1?.city || viewingTeam.city || "-";
                const p1Phone = p1?.phone || null;
                const p1Instagram = p1?.instagram || "-";
                const p1Community = p1?.community || "-";
                const p1Reclub = p1?.reclub || "-";
                const p1Level = p1?.skillLevel || viewingTeam.level || "-";

                const p2 = viewingTeam.partnerDetails;
                const p2Name = p2?.fullName || viewingTeam.partner || "-";
                const p2Photo = p2?.photoUrl || null;
                const p2IdCard = p2?.idCardUrl || null;
                const p2Jersey = p2?.jerseySize || null;
                const p2City = p2?.city || "-";
                const p2Phone = p2?.phone || null;
                const p2Instagram = p2?.instagram || "-";
                const p2Community = p2?.community || "-";
                const p2Reclub = p2?.reclub || "-";
                const p2Level = p2?.skillLevel || "-";

                return (
                  <>
                    {/* Verification Summary Banner */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 rounded-2xl border border-ink-200 bg-ink-50/60 p-3">
                      <div className="flex items-center gap-2.5 rounded-xl border border-ink-200/80 bg-white p-2.5 shadow-2xs">
                        <IdentificationBadgeIcon
                          className={`text-xl shrink-0 ${
                            p1IdCard ? "text-emerald-600" : "text-amber-500"
                          }`}
                          weight="bold"
                        />
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-400">
                            KTP Pemain 1
                          </span>
                          <span
                            className={`text-xs font-black ${
                              p1IdCard ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            {p1IdCard ? "✓ Terunggah" : "⚠️ Belum Diunggah"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 rounded-xl border border-ink-200/80 bg-white p-2.5 shadow-2xs">
                        <IdentificationBadgeIcon
                          className={`text-xl shrink-0 ${
                            p2IdCard ? "text-emerald-600" : "text-amber-500"
                          }`}
                          weight="bold"
                        />
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-400">
                            KTP Pemain 2
                          </span>
                          <span
                            className={`text-xs font-black ${
                              p2IdCard ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            {p2IdCard ? "✓ Terunggah" : "⚠️ Belum Diunggah"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 rounded-xl border border-ink-200/80 bg-white p-2.5 shadow-2xs">
                        <ReceiptIcon
                          className={`text-xl shrink-0 ${
                            viewingTeam.paid
                              ? "text-emerald-600"
                              : viewingTeam.paymentProofUrl
                                ? "text-brand-600"
                                : "text-rose-500"
                          }`}
                          weight="bold"
                        />
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-400">
                            Status Pembayaran
                          </span>
                          <span
                            className={`text-xs font-black ${
                              viewingTeam.paid
                                ? "text-emerald-700"
                                : viewingTeam.paymentProofUrl
                                  ? "text-brand-700"
                                  : "text-rose-700"
                            }`}
                          >
                            {viewingTeam.paid
                              ? "✓ Lunas (Paid)"
                              : viewingTeam.paymentProofUrl
                                ? "Ada Bukti Transfer"
                                : "Belum Bayar"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Player 1 Details */}
                    <div className="rounded-2xl border border-ink-200 bg-ink-50/70 p-4 sm:p-5">
                      <div className="flex items-center justify-between border-b border-ink-200/60 pb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-ink-800">
                            Pemain 1 (Utama)
                          </h4>
                          <span className="rounded-md bg-ink-200/70 px-2 py-0.5 text-[10px] font-extrabold text-ink-700">
                            Level: {p1Level}
                          </span>
                        </div>
                        {p1Jersey && (
                          <span className="rounded-md bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-800">
                            Jersey: {p1Jersey}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          {p1Photo ? (
                            <button
                              type="button"
                              onClick={() =>
                                setMediaLightbox({
                                  url: p1Photo,
                                  title: `Foto Selfie Pemain 1 · ${p1Name}`,
                                })
                              }
                              className="group relative h-24 w-24 shrink-0 cursor-zoom-in overflow-hidden rounded-2xl border-2 border-ink-200 bg-white transition hover:border-brand-500 shadow-2xs"
                              title="Klik untuk memperbesar foto selfie"
                            >
                              <Image
                                src={p1Photo}
                                alt={`Foto ${p1Name}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-ink-950/25 opacity-0 transition group-hover:opacity-100">
                                <MagnifyingGlassPlusIcon
                                  className="text-white text-base"
                                  weight="bold"
                                />
                              </div>
                            </button>
                          ) : (
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-ink-200 text-2xl font-black text-ink-600 shadow-inner">
                              {p1Name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-ink-400">
                            Foto Wajah
                          </span>
                        </div>

                        <div className="grid flex-1 gap-2.5 text-xs sm:grid-cols-2">
                          <div>
                            <span className="text-[11px] font-semibold text-ink-400">
                              Nama Lengkap:
                            </span>
                            <p className="font-extrabold text-ink-950 text-sm">
                              {p1Name}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-ink-400">
                              Asal Kota:
                            </span>
                            <p className="font-bold text-ink-800">{p1City}</p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-ink-400">
                              WhatsApp / HP:
                            </span>
                            <p className="font-bold text-ink-800">
                              {p1Phone ? (
                                <a
                                  href={`https://wa.me/${p1Phone.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-brand-600 hover:underline inline-flex items-center gap-1"
                                >
                                  +62 {p1Phone} ↗
                                </a>
                              ) : (
                                "-"
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-ink-400">
                              Instagram:
                            </span>
                            <p className="font-bold text-ink-800">
                              {p1Instagram}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-ink-400">
                              Komunitas / Klub:
                            </span>
                            <p className="font-bold text-ink-800">
                              {p1Community}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-ink-400">
                              Reclub:
                            </span>
                            <p className="font-bold text-ink-800">{p1Reclub}</p>
                          </div>
                        </div>
                      </div>

                      {/* KTP Document Verification Sub-Card */}
                      <div className="mt-4 rounded-xl border border-ink-200 bg-white p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-ink-100 pb-2">
                          <div className="flex items-center gap-2">
                            <IdentificationBadgeIcon
                              className="text-base text-brand-600"
                              aria-hidden="true"
                              weight="bold"
                            />
                            <span className="text-xs font-black text-ink-900">
                              Kartu Identitas (KTP / SIM / Pelajar) Pemain 1
                            </span>
                          </div>
                          {p1IdCard ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircleIcon
                                className="text-xs"
                                weight="bold"
                              />
                              Dokumen Terunggah
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                              <InfoIcon className="text-xs" weight="bold" />
                              Belum Diunggah
                            </span>
                          )}
                        </div>

                        {p1IdCard ? (
                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <button
                              type="button"
                              onClick={() =>
                                setMediaLightbox({
                                  url: p1IdCard,
                                  title: `Kartu Identitas (KTP/SIM/Pelajar) · ${p1Name} (Pemain 1)`,
                                })
                              }
                              className="group relative h-28 w-48 shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-ink-200 bg-ink-50 transition hover:border-brand-500"
                              title="Klik untuk memperbesar dokumen kartu identitas"
                            >
                              <Image
                                src={p1IdCard}
                                alt={`KTP ${p1Name}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-ink-950/30 opacity-0 transition group-hover:opacity-100">
                                <span className="inline-flex items-center gap-1 rounded-full bg-ink-900/90 px-2.5 py-1 text-[11px] font-bold text-white shadow">
                                  <MagnifyingGlassPlusIcon
                                    className="text-xs"
                                    weight="bold"
                                  />
                                  Perbesar
                                </span>
                              </div>
                            </button>
                            <div className="space-y-2 text-xs">
                              <p className="text-ink-600">
                                Periksa kesesuaian nama{" "}
                                <strong className="text-ink-900">
                                  {p1Name}
                                </strong>{" "}
                                dan foto wajah pemain dengan kartu identitas
                                resmi.
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMediaLightbox({
                                      url: p1IdCard,
                                      title: `Kartu Identitas (KTP/SIM/Pelajar) · ${p1Name} (Pemain 1)`,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-bold text-ink-700 hover:bg-ink-100 hover:text-ink-900 transition"
                                >
                                  <MagnifyingGlassPlusIcon
                                    className="text-xs"
                                    weight="bold"
                                  />
                                  Lihat Ukuran Penuh
                                </button>
                                <a
                                  href={p1IdCard}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100 transition"
                                >
                                  <ArrowSquareOutIcon
                                    className="text-xs"
                                    weight="bold"
                                  />
                                  Buka di Tab Baru ↗
                                </a>
                                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-bold text-ink-700 hover:bg-ink-50 transition">
                                  <FileArrowUpIcon
                                    className="text-xs"
                                    weight="bold"
                                  />
                                  <span>
                                    {uploadingIdCard === "player1"
                                      ? "Mengunggah..."
                                      : "Ganti File KTP"}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    disabled={uploadingIdCard === "player1"}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        setUploadingIdCard("player1");
                                        const res = await uploadFile(file);
                                        const updatedDetails: PlayerDetail = {
                                          fullName: p1Name,
                                          email:
                                            viewingTeam.playerDetails?.email ||
                                            "",
                                          phone: p1Phone || "",
                                          skillLevel: p1Level,
                                          idCardUrl: res.url,
                                          city: viewingTeam.playerDetails?.city,
                                          photoUrl:
                                            viewingTeam.playerDetails?.photoUrl,
                                          instagram:
                                            viewingTeam.playerDetails
                                              ?.instagram,
                                          community:
                                            viewingTeam.playerDetails
                                              ?.community,
                                          reclub:
                                            viewingTeam.playerDetails?.reclub,
                                          jerseySize:
                                            viewingTeam.playerDetails
                                              ?.jerseySize,
                                        };
                                        await patchTeam(viewingTeam, {
                                          playerDetails: updatedDetails,
                                        });
                                        setMessage(
                                          "KTP Pemain 1 berhasil diperbarui.",
                                        );
                                      } catch (err) {
                                        setMessage(
                                          err instanceof Error
                                            ? err.message
                                            : "Gagal mengunggah KTP.",
                                        );
                                      } finally {
                                        setUploadingIdCard(null);
                                        e.target.value = "";
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-2.5 text-xs text-amber-800">
                            <div className="flex items-center gap-2">
                              <InfoIcon
                                className="text-base shrink-0 text-amber-600"
                                weight="bold"
                              />
                              <span>
                                Peserta belum mengunggah foto kartu identitas
                                (KTP/SIM/Pelajar) saat pendaftaran.
                              </span>
                            </div>
                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-bold text-amber-800 shadow-2xs hover:bg-amber-50 shrink-0 transition">
                              <FileArrowUpIcon
                                className="text-xs"
                                weight="bold"
                              />
                              <span>
                                {uploadingIdCard === "player1"
                                  ? "Mengunggah..."
                                  : "Unggah KTP Pemain 1"}
                              </span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                disabled={uploadingIdCard === "player1"}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    setUploadingIdCard("player1");
                                    const res = await uploadFile(file);
                                    const updatedDetails: PlayerDetail = {
                                      fullName: p1Name,
                                      email:
                                        viewingTeam.playerDetails?.email || "",
                                      phone: p1Phone || "",
                                      skillLevel: p1Level,
                                      idCardUrl: res.url,
                                      city: viewingTeam.playerDetails?.city,
                                      photoUrl:
                                        viewingTeam.playerDetails?.photoUrl,
                                      instagram:
                                        viewingTeam.playerDetails?.instagram,
                                      community:
                                        viewingTeam.playerDetails?.community,
                                      reclub: viewingTeam.playerDetails?.reclub,
                                      jerseySize:
                                        viewingTeam.playerDetails?.jerseySize,
                                    };
                                    await patchTeam(viewingTeam, {
                                      playerDetails: updatedDetails,
                                    });
                                    setMessage(
                                      "KTP Pemain 1 berhasil diunggah.",
                                    );
                                  } catch (err) {
                                    setMessage(
                                      err instanceof Error
                                        ? err.message
                                        : "Gagal mengunggah KTP.",
                                    );
                                  } finally {
                                    setUploadingIdCard(null);
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Player 2 Details */}
                    <div className="rounded-2xl border border-ink-200 bg-ink-50/70 p-4 sm:p-5">
                      <div className="flex items-center justify-between border-b border-ink-200/60 pb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-ink-800">
                            Pemain 2 (Pasangan)
                          </h4>
                          <span className="rounded-md bg-ink-200/70 px-2 py-0.5 text-[10px] font-extrabold text-ink-700">
                            Level: {p2Level}
                          </span>
                        </div>
                        {p2Jersey && (
                          <span className="rounded-md bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-800">
                            Jersey: {p2Jersey}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          {p2Photo ? (
                            <button
                              type="button"
                              onClick={() =>
                                setMediaLightbox({
                                  url: p2Photo,
                                  title: `Foto Selfie Pemain 2 · ${p2Name}`,
                                })
                              }
                              className="group relative h-24 w-24 shrink-0 cursor-zoom-in overflow-hidden rounded-2xl border-2 border-ink-200 bg-white transition hover:border-brand-500 shadow-2xs"
                              title="Klik untuk memperbesar foto selfie"
                            >
                              <Image
                                src={p2Photo}
                                alt={`Foto ${p2Name}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-ink-950/25 opacity-0 transition group-hover:opacity-100">
                                <MagnifyingGlassPlusIcon
                                  className="text-white text-base"
                                  weight="bold"
                                />
                              </div>
                            </button>
                          ) : (
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-ink-200 text-2xl font-black text-ink-600 shadow-inner">
                              {p2Name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-ink-400">
                            Foto Wajah
                          </span>
                        </div>

                        <div className="grid flex-1 gap-2.5 text-xs sm:grid-cols-2">
                          <div>
                            <span className="text-[11px] font-semibold text-ink-400">
                              Nama Lengkap:
                            </span>
                            <p className="font-extrabold text-ink-950 text-sm">
                              {p2Name}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-ink-400">
                              Asal Kota:
                            </span>
                            <p className="font-bold text-ink-800">{p2City}</p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-ink-400">
                              WhatsApp / HP:
                            </span>
                            <p className="font-bold text-ink-800">
                              {p2Phone ? (
                                <a
                                  href={`https://wa.me/${p2Phone.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-brand-600 hover:underline inline-flex items-center gap-1"
                                >
                                  +62 {p2Phone} ↗
                                </a>
                              ) : (
                                "-"
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-ink-400">
                              Instagram:
                            </span>
                            <p className="font-bold text-ink-800">
                              {p2Instagram}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-ink-400">
                              Komunitas / Klub:
                            </span>
                            <p className="font-bold text-ink-800">
                              {p2Community}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-ink-400">
                              Reclub:
                            </span>
                            <p className="font-bold text-ink-800">{p2Reclub}</p>
                          </div>
                        </div>
                      </div>

                      {/* KTP Document Verification Sub-Card */}
                      <div className="mt-4 rounded-xl border border-ink-200 bg-white p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-ink-100 pb-2">
                          <div className="flex items-center gap-2">
                            <IdentificationBadgeIcon
                              className="text-base text-brand-600"
                              aria-hidden="true"
                              weight="bold"
                            />
                            <span className="text-xs font-black text-ink-900">
                              Kartu Identitas (KTP / SIM / Pelajar) Pemain 2
                            </span>
                          </div>
                          {p2IdCard ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircleIcon
                                className="text-xs"
                                weight="bold"
                              />
                              Dokumen Terunggah
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                              <InfoIcon className="text-xs" weight="bold" />
                              Belum Diunggah
                            </span>
                          )}
                        </div>

                        {p2IdCard ? (
                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <button
                              type="button"
                              onClick={() =>
                                setMediaLightbox({
                                  url: p2IdCard,
                                  title: `Kartu Identitas (KTP/SIM/Pelajar) · ${p2Name} (Pemain 2)`,
                                })
                              }
                              className="group relative h-28 w-48 shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-ink-200 bg-ink-50 transition hover:border-brand-500"
                              title="Klik untuk memperbesar dokumen kartu identitas"
                            >
                              <Image
                                src={p2IdCard}
                                alt={`KTP ${p2Name}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-ink-950/30 opacity-0 transition group-hover:opacity-100">
                                <span className="inline-flex items-center gap-1 rounded-full bg-ink-900/90 px-2.5 py-1 text-[11px] font-bold text-white shadow">
                                  <MagnifyingGlassPlusIcon
                                    className="text-xs"
                                    weight="bold"
                                  />
                                  Perbesar
                                </span>
                              </div>
                            </button>
                            <div className="space-y-2 text-xs">
                              <p className="text-ink-600">
                                Periksa kesesuaian nama{" "}
                                <strong className="text-ink-900">
                                  {p2Name}
                                </strong>{" "}
                                dan foto wajah pemain dengan kartu identitas
                                resmi.
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMediaLightbox({
                                      url: p2IdCard,
                                      title: `Kartu Identitas (KTP/SIM/Pelajar) · ${p2Name} (Pemain 2)`,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-bold text-ink-700 hover:bg-ink-100 hover:text-ink-900 transition"
                                >
                                  <MagnifyingGlassPlusIcon
                                    className="text-xs"
                                    weight="bold"
                                  />
                                  Lihat Ukuran Penuh
                                </button>
                                <a
                                  href={p2IdCard}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100 transition"
                                >
                                  <ArrowSquareOutIcon
                                    className="text-xs"
                                    weight="bold"
                                  />
                                  Buka di Tab Baru ↗
                                </a>
                                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-bold text-ink-700 hover:bg-ink-50 transition">
                                  <FileArrowUpIcon
                                    className="text-xs"
                                    weight="bold"
                                  />
                                  <span>
                                    {uploadingIdCard === "player2"
                                      ? "Mengunggah..."
                                      : "Ganti File KTP"}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    disabled={uploadingIdCard === "player2"}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        setUploadingIdCard("player2");
                                        const res = await uploadFile(file);
                                        const updatedDetails: PartnerDetail = {
                                          fullName: p2Name,
                                          email:
                                            viewingTeam.partnerDetails?.email,
                                          phone: p2Phone,
                                          skillLevel: p2Level,
                                          idCardUrl: res.url,
                                          city: viewingTeam.partnerDetails
                                            ?.city,
                                          photoUrl:
                                            viewingTeam.partnerDetails
                                              ?.photoUrl,
                                          instagram:
                                            viewingTeam.partnerDetails
                                              ?.instagram,
                                          community:
                                            viewingTeam.partnerDetails
                                              ?.community,
                                          reclub:
                                            viewingTeam.partnerDetails?.reclub,
                                          jerseySize:
                                            viewingTeam.partnerDetails
                                              ?.jerseySize,
                                        };
                                        await patchTeam(viewingTeam, {
                                          partnerDetails: updatedDetails,
                                        });
                                        setMessage(
                                          "KTP Pemain 2 berhasil diperbarui.",
                                        );
                                      } catch (err) {
                                        setMessage(
                                          err instanceof Error
                                            ? err.message
                                            : "Gagal mengunggah KTP.",
                                        );
                                      } finally {
                                        setUploadingIdCard(null);
                                        e.target.value = "";
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-2.5 text-xs text-amber-800">
                            <div className="flex items-center gap-2">
                              <InfoIcon
                                className="text-base shrink-0 text-amber-600"
                                weight="bold"
                              />
                              <span>
                                Peserta belum mengunggah foto kartu identitas
                                (KTP/SIM/Pelajar) saat pendaftaran.
                              </span>
                            </div>
                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-bold text-amber-800 shadow-2xs hover:bg-amber-50 shrink-0 transition">
                              <FileArrowUpIcon
                                className="text-xs"
                                weight="bold"
                              />
                              <span>
                                {uploadingIdCard === "player2"
                                  ? "Mengunggah..."
                                  : "Unggah KTP Pemain 2"}
                              </span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                disabled={uploadingIdCard === "player2"}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    setUploadingIdCard("player2");
                                    const res = await uploadFile(file);
                                    const updatedDetails: PartnerDetail = {
                                      fullName: p2Name,
                                      email: viewingTeam.partnerDetails?.email,
                                      phone: p2Phone,
                                      skillLevel: p2Level,
                                      idCardUrl: res.url,
                                      city: viewingTeam.partnerDetails?.city,
                                      photoUrl:
                                        viewingTeam.partnerDetails?.photoUrl,
                                      instagram:
                                        viewingTeam.partnerDetails?.instagram,
                                      community:
                                        viewingTeam.partnerDetails?.community,
                                      reclub:
                                        viewingTeam.partnerDetails?.reclub,
                                      jerseySize:
                                        viewingTeam.partnerDetails?.jerseySize,
                                    };
                                    await patchTeam(viewingTeam, {
                                      partnerDetails: updatedDetails,
                                    });
                                    setMessage(
                                      "KTP Pemain 2 berhasil diunggah.",
                                    );
                                  } catch (err) {
                                    setMessage(
                                      err instanceof Error
                                        ? err.message
                                        : "Gagal mengunggah KTP.",
                                    );
                                  } finally {
                                    setUploadingIdCard(null);
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nominal Biaya Pendaftaran Setting for this team */}
                    <div className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-ink-700">
                          Nominal Biaya Pendaftaran Tim (IDR)
                        </span>
                        <span className="text-[11px] font-semibold text-ink-500">
                          Default turnamen: Rp{" "}
                          {(
                            tournament?.entryFeePerPair ?? 600000
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2.5">
                        <div className="flex h-11 flex-1 items-center overflow-hidden rounded-xl border border-ink-200 bg-white shadow-2xs transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                          <span className="flex h-full items-center border-r border-ink-200 bg-ink-50 px-3.5 text-xs font-extrabold text-ink-600 select-none">
                            Rp
                          </span>
                          <input
                            type="number"
                            placeholder={`${tournament?.entryFeePerPair ?? 600000}`}
                            value={viewingTeam.entryFee ?? ""}
                            onChange={(e) => {
                              const val = e.target.value
                                ? Number(e.target.value)
                                : null;
                              setViewingTeam((prev) =>
                                prev ? { ...prev, entryFee: val } : null,
                              );
                            }}
                            className="h-full w-full bg-transparent px-3 font-mono text-sm font-bold text-ink-950 outline-none placeholder:text-ink-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await patchTeam(viewingTeam, {
                              entryFee: viewingTeam.entryFee ?? undefined,
                            });
                            setMessage(
                              "Nominal pendaftaran tim berhasil diperbarui.",
                            );
                          }}
                          className="inline-flex h-11 items-center rounded-xl bg-ink-900 px-4 text-xs font-bold text-white hover:bg-ink-800 transition shadow-2xs"
                        >
                          Simpan Nominal
                        </button>
                      </div>
                    </div>

                    {/* Payment Proof Card */}
                    <div className="rounded-2xl border border-ink-200 bg-ink-50/70 p-4 sm:p-5">
                      <div className="flex items-center justify-between border-b border-ink-200/60 pb-3">
                        <div className="flex items-center gap-2">
                          <ReceiptIcon
                            className="text-base text-brand-600"
                            weight="bold"
                          />
                          <h4 className="text-xs font-black uppercase tracking-wider text-ink-800">
                            Bukti Pembayaran & Transfer
                          </h4>
                        </div>
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${
                            viewingTeam.paid
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {viewingTeam.paid
                            ? "Sudah Dibayar (Paid)"
                            : "Belum Bayar"}
                        </span>
                      </div>
                      <div className="mt-4">
                        {viewingTeam.paymentProofUrl ? (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() =>
                                setMediaLightbox({
                                  url: viewingTeam.paymentProofUrl ?? "",
                                  title: `Bukti Transfer · ${teamName(viewingTeam)}`,
                                })
                              }
                              className="group relative h-64 w-full cursor-zoom-in overflow-hidden rounded-xl border border-ink-300 bg-white transition hover:border-brand-400 focus:outline-none"
                              title="Klik untuk memperbesar gambar"
                            >
                              <Image
                                src={viewingTeam.paymentProofUrl}
                                alt="Bukti Transfer"
                                fill
                                className="object-contain"
                                unoptimized
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-ink-950/25 opacity-0 transition group-hover:opacity-100">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900/80 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg">
                                  <MagnifyingGlassPlusIcon
                                    className="text-sm"
                                    aria-hidden="true"
                                    weight="bold"
                                  />
                                  Lihat Gambar Penuh
                                </span>
                              </div>
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setMediaLightbox({
                                    url: viewingTeam.paymentProofUrl ?? "",
                                    title: `Bukti Transfer · ${teamName(viewingTeam)}`,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800 hover:underline"
                              >
                                <MagnifyingGlassPlusIcon
                                  className="text-sm"
                                  aria-hidden="true"
                                  weight="bold"
                                />
                                Buka Gambar Ukuran Penuh
                              </button>
                              <span className="text-ink-300">·</span>
                              <a
                                href={viewingTeam.paymentProofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-ink-600 hover:text-ink-900 hover:underline"
                              >
                                <ArrowSquareOutIcon
                                  className="text-sm"
                                  weight="bold"
                                />
                                Buka di Tab Baru ↗
                              </a>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-ink-500 italic">
                            Tidak ada bukti transfer yang diunggah.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Quick Actions Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
              <button
                type="button"
                onClick={() => setViewingTeam(null)}
                className="h-10 rounded-xl border border-ink-200 px-4 text-xs font-extrabold text-ink-600 hover:bg-ink-50"
              >
                Tutup
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await patchTeam(viewingTeam, {
                      paid: !viewingTeam.paid,
                    });
                    setViewingTeam((prev) =>
                      prev ? { ...prev, paid: !prev.paid } : null,
                    );
                  }}
                  className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-4 text-xs font-extrabold transition ${
                    viewingTeam.paid
                      ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  <MoneyIcon
                    className="text-base"
                    aria-hidden="true"
                    weight="bold"
                  />
                  {viewingTeam.paid ? "Tandai Unpaid" : "Tandai Lunas (Paid)"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const nextStatus =
                      viewingTeam.status === "approved"
                        ? "pending"
                        : "approved";
                    await patchTeam(viewingTeam, {
                      status: nextStatus,
                    });
                    setViewingTeam((prev) =>
                      prev ? { ...prev, status: nextStatus } : null,
                    );
                  }}
                  className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-xs font-extrabold shadow-md transition ${
                    viewingTeam.status === "approved"
                      ? "bg-ink-700 text-white hover:bg-ink-800"
                      : "bg-brand-500 text-ink-950 shadow-ink-950/10 hover:bg-brand-400"
                  }`}
                >
                  {viewingTeam.status === "approved" ? (
                    <ArrowCounterClockwiseIcon
                      className="text-base"
                      weight="bold"
                      aria-hidden="true"
                    />
                  ) : (
                    <SealCheckIcon
                      className="text-base"
                      weight="bold"
                      aria-hidden="true"
                    />
                  )}
                  {viewingTeam.status === "approved"
                    ? "Batal Approve"
                    : "Approve Tim"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mediaLightbox && (
        <div
          className="admin-modal fixed inset-0 z-[150] flex flex-col items-center justify-center bg-ink-950/85 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="fixed inset-0 h-full w-full cursor-default bg-transparent"
            onClick={() => setMediaLightbox(null)}
            aria-label="Tutup preview"
          />
          <div className="relative z-10 flex max-h-[92vh] max-w-4xl w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-5 py-3.5">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <IdentificationBadgeIcon
                  className="text-brand-600 shrink-0 text-base"
                  aria-hidden="true"
                  weight="bold"
                />
                <p className="truncate text-sm font-black text-ink-900">
                  {mediaLightbox.title}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={mediaLightbox.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 items-center gap-1 rounded-xl border border-ink-200 bg-white px-2.5 text-xs font-bold text-ink-700 hover:bg-ink-100 transition"
                  title="Buka gambar di tab baru"
                >
                  <ArrowSquareOutIcon className="text-sm" weight="bold" />
                  Buka Asli
                </a>
                <button
                  type="button"
                  onClick={() => setMediaLightbox(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-400 hover:bg-ink-200 hover:text-ink-700 transition"
                  aria-label="Tutup"
                >
                  <XIcon
                    className="text-xl"
                    aria-hidden="true"
                    weight="duotone"
                  />
                </button>
              </div>
            </div>
            <div className="relative max-h-[82vh] overflow-auto p-4 bg-ink-100/60 flex items-center justify-center">
              <Image
                src={mediaLightbox.url}
                alt={mediaLightbox.title}
                width={1200}
                height={1200}
                className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain shadow-md"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      <AiDirectorCopilot
        tournament={tournament}
        onSettingsUpdated={() => window.location.reload()}
      />
    </>
  );
}
