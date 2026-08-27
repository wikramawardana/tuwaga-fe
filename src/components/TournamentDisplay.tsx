"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type BracketResponse,
  getBracket,
  getOop,
  getStandings,
  getTournamentBySlug,
  listMatches,
  type Match,
  type OopPlan,
  type OopPlanSession,
  type StandingsResponse,
  type Tournament,
} from "@/lib/tuwagaApi";

type DisplayScene = "groups" | "oop" | "bracket";
type DisplaySlide = { scene: DisplayScene; page: number };
type DisplayBracketRound = BracketResponse["rounds"][number] & {
  continuedFromPrevious?: boolean;
};
type DisplayBracketPage = { rounds: DisplayBracketRound[] };

const sceneMeta: Record<
  DisplayScene,
  { label: string; shortLabel: string; icon: string }
> = {
  groups: {
    label: "Group standings",
    shortLabel: "Groups",
    icon: "leaderboard",
  },
  oop: {
    label: "Order of Play",
    shortLabel: "OOP",
    icon: "calendar_view_week",
  },
  bracket: {
    label: "Knockout bracket",
    shortLabel: "Bracket",
    icon: "account_tree",
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function chunk<T>(items: T[], size: number) {
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }
  return pages.length ? pages : [[]];
}

function publicOopTimeLabel(value: string) {
  const isFlexible = /^not before\s+/i.test(value);
  const time = value
    .replace(/^not before\s+/i, "")
    .replace(/(\d{1,2})\.(\d{2})$/, "$1:$2");
  return isFlexible ? `Earliest start · ${time}` : time;
}

function categoryTone(category: string) {
  const value = category.toLowerCase();
  if (value.includes("women")) return "bg-violet-200";
  if (value.includes("men")) return "bg-blue-200";
  return "bg-emerald-200";
}

function EmptyDisplay({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="display-scene-enter flex min-h-[55vh] items-center justify-center">
      <div className="public-panel max-w-xl bg-white p-8 text-center">
        <span className="material-symbols-outlined text-6xl text-blue-600">
          {icon}
        </span>
        <h2 className="public-title mt-5 text-4xl text-slate-950">{title}</h2>
        <p className="mt-4 text-base font-semibold leading-7 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function GroupsScene({
  groups,
  page,
  totalPages,
}: {
  groups: StandingsResponse["groups"];
  page: number;
  totalPages: number;
}) {
  if (groups.length === 0) {
    return (
      <EmptyDisplay
        icon="leaderboard"
        title="Standings are warming up"
        description="Group rankings will appear here as soon as the draw and match results are available."
      />
    );
  }

  return (
    <section className="display-scene-enter">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="public-kicker">Scene 01 · Group stage</p>
          <h2 className="public-title mt-4 text-4xl text-slate-950 md:text-5xl">
            Road to qualification
          </h2>
        </div>
        <p className="hidden border-2 border-[#07142f] bg-white px-3 py-2 text-xs font-black uppercase shadow-[3px_3px_0_#07142f] sm:block">
          Page {page + 1} / {totalPages}
        </p>
      </div>

      <div
        className={cx(
          "grid gap-5",
          groups.length === 1 ? "mx-auto max-w-4xl" : "lg:grid-cols-2",
        )}
      >
        {groups.map((group) => (
          <article
            key={group.group}
            className="public-panel overflow-hidden bg-white"
          >
            <div className="flex items-center justify-between border-b-3 border-[#07142f] bg-yellow-200 px-5 py-3">
              <h3 className="text-lg font-black text-[#07142f]">
                {group.group.includes(" · ")
                  ? group.group
                  : `Group ${group.group}`}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider">
                Top teams advance
              </span>
            </div>
            <div className="overflow-x-auto" data-display-scroll>
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="text-[10px] font-black uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Rank</th>
                    <th className="px-4 py-2.5">Team</th>
                    <th className="px-2 py-2.5 text-center">P</th>
                    <th className="px-2 py-2.5 text-center">W</th>
                    <th className="px-2 py-2.5 text-center">L</th>
                    <th className="px-2 py-2.5 text-center">GW</th>
                    <th className="px-2 py-2.5 text-center">GL</th>
                    <th className="px-2 py-2.5 text-center">SD</th>
                    <th className="px-4 py-2.5 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {group.teams.map((team) => (
                    <tr
                      key={team.teamId}
                      className={team.qualified ? "bg-emerald-50" : "bg-white"}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={cx(
                            "inline-flex h-8 w-8 items-center justify-center border-2 border-[#07142f] text-xs font-black shadow-[2px_2px_0_#07142f]",
                            team.qualified
                              ? "bg-emerald-300 text-emerald-950"
                              : "bg-white text-slate-600",
                          )}
                        >
                          {team.groupRank}
                        </span>
                      </td>
                      <td className="max-w-56 truncate px-4 py-3 font-black text-slate-950">
                        {team.teamName}
                        {team.qualified && (
                          <span className="ml-2 bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black text-white">
                            Q
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center font-bold">
                        {team.played}
                      </td>
                      <td className="px-2 py-3 text-center font-bold">
                        {team.wins}
                      </td>
                      <td className="px-2 py-3 text-center font-bold">
                        {team.losses}
                      </td>
                      <td className="px-2 py-3 text-center font-bold">
                        {team.gamesWon ?? "—"}
                      </td>
                      <td className="px-2 py-3 text-center font-bold">
                        {team.gamesLost ?? "—"}
                      </td>
                      <td className="px-2 py-3 text-center font-bold">
                        {team.diff}
                      </td>
                      <td className="px-4 py-3 text-center text-lg font-black text-blue-700">
                        {team.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function OopScene({
  plan,
  session,
  sessionIndex,
  matchesById,
}: {
  plan: OopPlan;
  session: OopPlanSession | null;
  sessionIndex: number;
  matchesById: Map<string, Match>;
}) {
  if (!session) {
    return (
      <EmptyDisplay
        icon="calendar_view_week"
        title="Order of Play is not published"
        description="The official court and session sequence will appear here after the tournament draw is generated."
      />
    );
  }

  const matchCount = session.slots.reduce(
    (count, slot) =>
      count +
      slot.courts.reduce(
        (courtCount, entry) =>
          courtCount + (entry?.kind === "match" ? entry.matchIds.length : 0),
        0,
      ),
    0,
  );

  return (
    <section className="display-scene-enter">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="public-kicker">Scene 02 · Order of Play</p>
          <h2 className="public-title mt-4 text-4xl text-slate-950 md:text-5xl">
            {publicOopTimeLabel(session.timeLabel)}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
          <span className="public-stat bg-white px-3 py-2">
            Session {sessionIndex + 1}/{plan.sessions.length}
          </span>
          <span className="public-stat bg-cyan-100 px-3 py-2">
            {matchCount} matches
          </span>
          <span className="public-stat bg-yellow-100 px-3 py-2">
            {plan.courts} courts
          </span>
        </div>
      </div>

      <div className="public-panel overflow-hidden bg-white">
        <div className="overflow-auto" data-display-scroll>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `70px repeat(${plan.courts}, minmax(230px, 1fr))`,
              minWidth: `${String(70 + plan.courts * 230)}px`,
            }}
          >
            <div className="sticky left-0 z-20 flex items-center justify-center border-b-3 border-[#07142f] bg-yellow-200 py-3 text-[10px] font-black uppercase">
              Run
            </div>
            {Array.from({ length: plan.courts }, (_, index) => index + 1).map(
              (court) => (
                <div
                  key={court}
                  className="border-b-3 border-l-3 border-[#07142f] bg-cyan-200 px-3 py-3 text-center text-sm font-black uppercase"
                >
                  Court {court}
                </div>
              ),
            )}

            {session.slots.map((slot) => {
              const firstEntry = slot.courts.find(Boolean) ?? null;
              if (firstEntry?.kind === "event") {
                return (
                  <Fragment key={slot.number}>
                    <div className="sticky left-0 z-10 flex items-center justify-center border-t-3 border-[#07142f] bg-yellow-100 text-sm font-black">
                      {String(slot.number).padStart(2, "0")}
                    </div>
                    <div
                      style={{ gridColumn: "2 / -1" }}
                      className="flex items-center justify-center gap-3 border-l-3 border-t-3 border-[#07142f] bg-amber-200 px-5 py-5 text-lg font-black uppercase"
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
                  <div className="sticky left-0 z-10 flex items-center justify-center border-t-3 border-[#07142f] bg-yellow-100 text-sm font-black">
                    {String(slot.number).padStart(2, "0")}
                  </div>
                  {slot.courts.map((entry, courtIndex) => (
                    <div
                      key={`${slot.number}-${courtIndex}`}
                      className="min-h-24 border-l-3 border-t-3 border-[#07142f] bg-white p-2"
                    >
                      {entry?.kind === "match" ? (
                        <div
                          className={cx(
                            "h-full border-2 border-[#07142f] p-2.5 shadow-[2px_2px_0_#07142f]",
                            categoryTone(entry.category),
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[10px] font-black uppercase tracking-wide opacity-65">
                              {entry.stageLabel}
                            </p>
                            <span className="text-[9px] font-black opacity-50">
                              {entry.matchLabel}
                            </span>
                          </div>
                          <div className="mt-1.5 space-y-1">
                            {entry.matchIds.map((id) => {
                              const match = matchesById.get(id);
                              return (
                                <div
                                  key={id}
                                  className="border border-[#07142f]/30 bg-white/85 px-2 py-1.5"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cx(
                                        "h-2.5 w-2.5 shrink-0 rounded-full",
                                        match?.status === "live"
                                          ? "admin-live-dot bg-rose-500"
                                          : match?.status === "completed"
                                            ? "bg-emerald-500"
                                            : "bg-blue-500",
                                      )}
                                    />
                                    <p className="min-w-0 flex-1 truncate text-[10px] font-black">
                                      {match?.teamAName || "TBD"} vs{" "}
                                      {match?.teamBName || "TBD"}
                                    </p>
                                    {match?.score && (
                                      <span className="shrink-0 text-[10px] font-black text-blue-800">
                                        {match.score}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full min-h-16 items-center justify-center border-2 border-dashed border-slate-200 text-[10px] font-black uppercase text-slate-300">
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
    </section>
  );
}

function BracketScene({
  rounds,
  matchesById,
  championTeamId,
  page,
  totalPages,
}: {
  rounds: DisplayBracketRound[];
  matchesById: Map<string, Match>;
  championTeamId: string | null;
  page: number;
  totalPages: number;
}) {
  if (rounds.length === 0) {
    return (
      <EmptyDisplay
        icon="account_tree"
        title="The bracket is waiting"
        description="Knockout rounds will populate as qualifiers are confirmed from the group stage."
      />
    );
  }

  return (
    <section className="display-scene-enter">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="public-kicker">Scene 03 · Knockout</p>
          <h2 className="public-title mt-4 text-4xl text-slate-950 md:text-5xl">
            Win or go home
          </h2>
        </div>
        <p className="hidden border-2 border-[#07142f] bg-white px-3 py-2 text-xs font-black uppercase shadow-[3px_3px_0_#07142f] sm:block">
          Bracket {page + 1} / {totalPages}
        </p>
      </div>

      <div className="overflow-x-auto pb-2" data-display-scroll>
        <div
          className="grid items-start gap-5"
          style={{
            gridTemplateColumns: `repeat(${Math.min(rounds.length, 4)}, minmax(250px, 1fr))`,
            minWidth: `${String(Math.min(rounds.length, 4) * 270)}px`,
          }}
        >
          {rounds.map((round, roundIndex) => (
            <article
              key={round.name}
              className="public-panel relative overflow-hidden bg-white"
            >
              {roundIndex > 0 && (
                <span className="material-symbols-outlined absolute -left-5 top-1/2 hidden -translate-y-1/2 text-4xl text-blue-600 xl:block">
                  arrow_forward
                </span>
              )}
              <div className="border-b-3 border-[#07142f] bg-blue-600 px-4 py-3 text-white">
                <p className="text-sm font-black uppercase tracking-wider">
                  {round.name}
                </p>
              </div>
              <div className="max-h-[62vh] space-y-2.5 overflow-y-auto p-3">
                {round.matches.map((bracketMatch) => {
                  const match = matchesById.get(bracketMatch.id);
                  const live = match?.status === "live";
                  return (
                    <div
                      key={bracketMatch.id}
                      className={cx(
                        "relative border-2 border-[#07142f] p-3 shadow-[2px_2px_0_#07142f]",
                        live ? "bg-rose-100" : "bg-blue-50",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[9px] font-black uppercase tracking-wider text-blue-700">
                          {bracketMatch.label}
                        </p>
                        <span
                          className={cx(
                            "text-[9px] font-black uppercase",
                            live ? "text-rose-600" : "text-slate-400",
                          )}
                        >
                          {live ? "● Live" : (match?.status ?? "Pending")}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {[bracketMatch.teamA, bracketMatch.teamB].map(
                          (team, teamIndex) => {
                            const winner =
                              !!team &&
                              bracketMatch.winnerTeamId === team.teamId;
                            return (
                              <div
                                key={`${bracketMatch.id}-${teamIndex}`}
                                className={cx(
                                  "flex items-center gap-2 border border-[#07142f]/25 px-2 py-1.5",
                                  winner ? "bg-yellow-200" : "bg-white",
                                )}
                              >
                                <span className="w-5 text-center text-[10px] font-black text-slate-400">
                                  {team?.seed ?? "—"}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-xs font-black text-slate-950">
                                  {team?.teamName ?? "TBD"}
                                </span>
                                {winner && (
                                  <span className="material-symbols-outlined text-base text-amber-700">
                                    trophy
                                  </span>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                      {match?.score && (
                        <p className="mt-2 text-right text-xs font-black text-blue-800">
                          {match.score}
                        </p>
                      )}
                    </div>
                  );
                })}
                {round.matches.length === 0 && (
                  <div className="border-2 border-dashed border-slate-300 p-5 text-center text-xs font-black uppercase text-slate-400">
                    {round.continuedFromPrevious
                      ? "Shown on previous screen"
                      : "Waiting for qualifiers"}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {championTeamId && (
        <div className="mx-auto mt-5 flex w-fit items-center gap-2 border-3 border-[#07142f] bg-yellow-200 px-5 py-2 text-sm font-black uppercase shadow-[5px_5px_0_#07142f]">
          <span className="material-symbols-outlined">emoji_events</span>
          Champion confirmed
        </div>
      )}
    </section>
  );
}

export default function TournamentDisplay({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [oop, setOop] = useState<OopPlan | null>(null);
  const [bracket, setBracket] = useState<BracketResponse | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [clock, setClock] = useState(() => new Date());
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(
    () => searchParams.get("autoplay") === "0",
  );
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const initialSceneApplied = useRef(false);

  const intervalSeconds = Math.min(
    60,
    Math.max(6, Number(searchParams.get("interval") ?? "12") || 12),
  );

  const refresh = useCallback(
    async (silent = false) => {
      if (silent) setSyncing(true);
      else setLoading(true);

      try {
        const nextTournament = await getTournamentBySlug(slug);
        const emptyOop: OopPlan = {
          title: "Order of Play",
          courts: nextTournament.settings.courts,
          sessions: [],
        };
        const [nextStandings, nextOop, nextBracket, nextMatches] =
          await Promise.all([
            getStandings(nextTournament.id).catch(
              (): StandingsResponse => ({ qualifierCount: 0, groups: [] }),
            ),
            getOop(nextTournament.id).catch(() => emptyOop),
            getBracket(nextTournament.id).catch(
              (): BracketResponse => ({
                rounds: [],
                championTeamId: null,
              }),
            ),
            listMatches(nextTournament.id).catch((): Match[] => []),
          ]);

        setTournament(nextTournament);
        setStandings(nextStandings);
        setOop(nextOop);
        setBracket(nextBracket);
        setMatches(nextMatches);
        setLastUpdated(new Date());
        setError("");
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "Unable to load tournament display.",
        );
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    void refresh();
    const refreshTimer = window.setInterval(() => void refresh(true), 10_000);
    const clockTimer = window.setInterval(() => setClock(new Date()), 1_000);
    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, [refresh]);

  const groupPages = useMemo(
    () => chunk(standings?.groups ?? [], 4),
    [standings],
  );
  const oopSessions = useMemo(
    () => (oop?.sessions.length ? oop.sessions : [null]),
    [oop],
  );
  const bracketPages = useMemo<DisplayBracketPage[]>(() => {
    const roundGroups = chunk(bracket?.rounds ?? [], 4);
    return roundGroups.flatMap((rounds) => {
      const pageCount = Math.max(
        1,
        ...rounds.map((round) => Math.ceil(round.matches.length / 5)),
      );
      return Array.from({ length: pageCount }, (_, page) => ({
        rounds: rounds.map((round) => ({
          ...round,
          matches: round.matches.slice(page * 5, page * 5 + 5),
          continuedFromPrevious:
            page > 0 &&
            round.matches.length > 0 &&
            page * 5 >= round.matches.length,
        })),
      }));
    });
  }, [bracket]);
  const slides = useMemo<DisplaySlide[]>(
    () => [
      ...groupPages.map((_, page) => ({ scene: "groups" as const, page })),
      ...oopSessions.map((_, page) => ({ scene: "oop" as const, page })),
      ...bracketPages.map((_, page) => ({ scene: "bracket" as const, page })),
    ],
    [bracketPages, groupPages, oopSessions],
  );

  useEffect(() => {
    setActiveSlide((current) => Math.min(current, slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    if (initialSceneApplied.current || loading) return;
    initialSceneApplied.current = true;
    const requestedScene = searchParams.get("scene") as DisplayScene | null;
    if (!requestedScene || !sceneMeta[requestedScene]) return;
    const requestedIndex = slides.findIndex(
      (slide) => slide.scene === requestedScene,
    );
    if (requestedIndex >= 0) setActiveSlide(requestedIndex);
  }, [loading, searchParams, slides]);

  const nextSlide = useCallback(() => {
    setActiveSlide((current) => (current + 1) % slides.length);
  }, [slides.length]);

  const previousSlide = useCallback(() => {
    setActiveSlide((current) =>
      current === 0 ? slides.length - 1 : current - 1,
    );
  }, [slides.length]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: changing slides intentionally restarts the autoplay countdown.
  useEffect(() => {
    if (paused || loading || error) return;
    const timer = window.setTimeout(nextSlide, intervalSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [activeSlide, error, intervalSeconds, loading, nextSlide, paused]);

  useEffect(() => {
    const onFullscreenChange = () =>
      setFullscreen(!!document.fullscreenElement);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") nextSlide();
      if (event.key === "ArrowLeft") previousSlide();
      if (event.key === " ") {
        event.preventDefault();
        setPaused((current) => !current);
      }
      if (event.key.toLowerCase() === "f") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen();
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [nextSlide, previousSlide]);

  const active = slides[activeSlide] ?? { scene: "groups", page: 0 };
  const matchesById = useMemo(
    () => new Map(matches.map((match) => [match.id, match])),
    [matches],
  );

  const jumpToScene = (scene: DisplayScene) => {
    const index = slides.findIndex((slide) => slide.scene === scene);
    if (index >= 0) setActiveSlide(index);
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  };

  if (loading && !tournament) {
    return (
      <main className="neo-public flex min-h-screen items-center justify-center !bg-[#246bfe] !bg-none p-6 text-white">
        <div className="text-center">
          <span className="material-symbols-outlined admin-spin text-6xl text-cyan-300">
            progress_activity
          </span>
          <p className="mt-5 text-sm font-black uppercase tracking-[0.2em]">
            Opening tournament display
          </p>
        </div>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="neo-public flex min-h-screen items-center justify-center p-6">
        <EmptyDisplay
          icon="tv_off"
          title="Display unavailable"
          description={error || "This tournament could not be found."}
        />
      </main>
    );
  }

  return (
    <main
      className="neo-public flex min-h-screen flex-col overflow-x-hidden pb-20"
      onTouchStart={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("[data-display-scroll]")
        ) {
          touchStartX.current = null;
          return;
        }
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStartX.current === null) return;
        const distance =
          (event.changedTouches[0]?.clientX ?? touchStartX.current) -
          touchStartX.current;
        if (Math.abs(distance) > 60) {
          if (distance < 0) nextSlide();
          else previousSlide();
        }
        touchStartX.current = null;
      }}
    >
      <header className="sticky top-0 z-50 border-b-4 border-[#07142f] bg-[#246bfe] text-white shadow-[0_6px_0_#07142f]">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/tournaments/bracket"
              className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#07142f] bg-white text-[#07142f] shadow-[3px_3px_0_#07142f]"
              aria-label="Exit tournament display"
            >
              <span className="material-symbols-outlined">close</span>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-black uppercase">
                  {tournament.name}
                </p>
                <span className="hidden border-2 border-[#07142f] bg-yellow-200 px-2 py-0.5 text-[9px] font-black uppercase text-[#07142f] sm:inline-flex">
                  Live display
                </span>
              </div>
              <p className="truncate text-xs font-bold text-blue-100/80">
                {tournament.venue} · {tournament.dateLabel}
              </p>
            </div>
          </div>

          <nav
            className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0"
            aria-label="Display scenes"
          >
            {(Object.keys(sceneMeta) as DisplayScene[]).map((scene) => {
              const selected = active.scene === scene;
              return (
                <button
                  key={scene}
                  type="button"
                  onClick={() => jumpToScene(scene)}
                  className={cx(
                    "flex h-10 shrink-0 items-center gap-2 border-2 border-[#07142f] px-3 text-xs font-black uppercase shadow-[3px_3px_0_#07142f]",
                    selected
                      ? "bg-cyan-300 text-[#07142f]"
                      : "bg-white text-[#07142f] hover:bg-blue-50",
                  )}
                >
                  <span className="material-symbols-outlined text-lg">
                    {sceneMeta[scene].icon}
                  </span>
                  {sceneMeta[scene].shortLabel}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <span
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-blue-100"
              title={
                lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString("en-GB")}`
                  : "Waiting for first update"
              }
            >
              <span
                className={cx(
                  "h-2.5 w-2.5 rounded-full",
                  error
                    ? "bg-rose-400"
                    : syncing
                      ? "admin-live-dot bg-yellow-300"
                      : "admin-live-dot bg-emerald-300",
                )}
              />
              {error ? "Reconnecting" : syncing ? "Syncing" : "Live data"}
            </span>
            <span className="font-mono text-lg font-black tabular-nums">
              {clock.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <div key={`${active.scene}-${active.page}`}>
          {active.scene === "groups" && (
            <GroupsScene
              groups={groupPages[active.page] ?? []}
              page={active.page}
              totalPages={groupPages.length}
            />
          )}
          {active.scene === "oop" && oop && (
            <OopScene
              plan={oop}
              session={oopSessions[active.page] ?? null}
              sessionIndex={active.page}
              matchesById={matchesById}
            />
          )}
          {active.scene === "bracket" && (
            <BracketScene
              rounds={bracketPages[active.page]?.rounds ?? []}
              matchesById={matchesById}
              championTeamId={bracket?.championTeamId ?? null}
              page={active.page}
              totalPages={bracketPages.length}
            />
          )}
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-[#07142f] bg-white px-4 py-3 shadow-[0_-6px_0_#07142f] sm:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {slides.map((slide, index) => (
              <button
                key={`${slide.scene}-${slide.page}`}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={cx(
                  "relative h-3 min-w-4 flex-1 overflow-hidden border border-[#07142f]",
                  index === activeSlide ? "bg-blue-100" : "bg-slate-200",
                )}
                aria-label={`${sceneMeta[slide.scene].label}, slide ${slide.page + 1}`}
              >
                {index === activeSlide && !paused && (
                  <span
                    className="display-progress absolute inset-y-0 left-0 bg-blue-600"
                    style={{
                      animationDuration: `${String(intervalSeconds)}s`,
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <span className="mr-2 hidden text-[10px] font-black uppercase tracking-wider text-slate-500 md:block">
              {sceneMeta[active.scene].label} · {activeSlide + 1}/
              {slides.length}
            </span>
            <button
              type="button"
              onClick={previousSlide}
              className="flex h-10 w-10 items-center justify-center border-2 border-[#07142f] bg-white shadow-[2px_2px_0_#07142f] hover:bg-cyan-100"
              aria-label="Previous slide"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <button
              type="button"
              onClick={() => setPaused((current) => !current)}
              className="flex h-10 items-center gap-2 border-2 border-[#07142f] bg-yellow-200 px-4 text-xs font-black uppercase shadow-[2px_2px_0_#07142f] hover:bg-yellow-300"
            >
              <span className="material-symbols-outlined text-lg">
                {paused ? "play_arrow" : "pause"}
              </span>
              {paused ? "Play" : "Pause"}
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="flex h-10 w-10 items-center justify-center border-2 border-[#07142f] bg-blue-600 text-white shadow-[2px_2px_0_#07142f] hover:bg-blue-700"
              aria-label="Next slide"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="flex h-10 w-10 items-center justify-center border-2 border-[#07142f] bg-cyan-200 shadow-[2px_2px_0_#07142f] hover:bg-cyan-300"
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <span className="material-symbols-outlined">
                {fullscreen ? "fullscreen_exit" : "fullscreen"}
              </span>
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
