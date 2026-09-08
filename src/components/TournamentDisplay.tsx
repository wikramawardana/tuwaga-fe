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
      <div className="max-w-xl rounded-2xl border border-[#E6E3DA] bg-white p-8 text-center shadow-xs">
        <span className="material-symbols-outlined text-6xl text-[#0C0D11]">
          {icon}
        </span>
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-[#0C0D11]">
          {title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[#5A5751]">
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
          <span className="inline-flex items-center rounded-full border border-[#E6E3DA] bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#0C0D11]">
            Scene 01 · Group stage
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0C0D11] md:text-4xl">
            Road to qualification
          </h2>
        </div>
        <p className="hidden rounded-full border border-[#e6e3da] bg-[#faf9f6] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700 sm:block">
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
            className="overflow-hidden rounded-2xl border border-[#e6e3da] bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-[#e6e3da] bg-[#0c0d11] px-5 py-3 text-white">
              <h3 className="text-base font-bold text-white">
                {group.group.includes(" · ")
                  ? group.group
                  : `Group ${group.group}`}
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#f5eedb]/80">
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
                            "inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold",
                            team.qualified
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : "border-[#e6e3da] bg-white text-slate-600",
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
          <span className="inline-flex items-center rounded-full border border-[#E6E3DA] bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#0C0D11]">
            Scene 02 · Order of Play
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0C0D11] md:text-4xl">
            {publicOopTimeLabel(session.timeLabel)}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider">
          <span className="rounded-md border border-[#E6E3DA] bg-white px-3 py-1.5 text-[#0C0D11]">
            Session {sessionIndex + 1}/{plan.sessions.length}
          </span>
          <span className="rounded-md border border-[#E6E3DA] bg-[#FAF9F6] px-3 py-1.5 text-[#0C0D11]">
            {matchCount} matches
          </span>
          <span className="rounded-md border border-[#E6E3DA] bg-[#FAF9F6] px-3 py-1.5 text-[#0C0D11]">
            {plan.courts} courts
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E6E3DA] bg-white shadow-xs">
        <div className="overflow-auto" data-display-scroll>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `70px repeat(${plan.courts}, minmax(230px, 1fr))`,
              minWidth: `${String(70 + plan.courts * 230)}px`,
            }}
          >
            <div className="sticky left-0 z-20 flex items-center justify-center border-b border-[#e6e3da] bg-[#faf9f6] py-3 text-[10px] font-bold uppercase text-slate-700">
              Run
            </div>
            {Array.from({ length: plan.courts }, (_, index) => index + 1).map(
              (court) => (
                <div
                  key={court}
                  className="border-b border-l border-[#e6e3da] bg-[#faf9f6] px-3 py-3 text-center text-xs font-bold uppercase text-slate-800"
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
                    <div className="sticky left-0 z-10 flex items-center justify-center border-t border-[#e6e3da] bg-[#faf9f6] text-xs font-bold text-slate-700">
                      {String(slot.number).padStart(2, "0")}
                    </div>
                    <div
                      style={{ gridColumn: "2 / -1" }}
                      className="flex items-center justify-center gap-3 border-l border-t border-[#e6e3da] bg-[#f5eedb]/60 px-5 py-4 text-sm font-bold uppercase text-[#0c0d11]"
                    >
                      <span className="material-symbols-outlined text-base">
                        campaign
                      </span>
                      {firstEntry.title}
                    </div>
                  </Fragment>
                );
              }

              return (
                <Fragment key={slot.number}>
                  <div className="sticky left-0 z-10 flex items-center justify-center border-t border-[#e6e3da] bg-[#faf9f6] text-xs font-bold text-slate-700">
                    {String(slot.number).padStart(2, "0")}
                  </div>
                  {slot.courts.map((entry, courtIndex) => (
                    <div
                      key={`${slot.number}-${courtIndex}`}
                      className="min-h-24 border-l border-t border-[#e6e3da] bg-white p-2"
                    >
                      {entry?.kind === "match" ? (
                        <div
                          className={cx(
                            "h-full rounded-xl border border-[#e6e3da] p-2.5 bg-[#faf9f6]",
                            categoryTone(entry.category),
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[10px] font-bold uppercase tracking-wide text-[#0c0d11]">
                              {entry.stageLabel}
                            </p>
                            <span className="text-[9px] font-semibold text-slate-400">
                              {entry.matchLabel}
                            </span>
                          </div>
                          <div className="mt-1.5 space-y-1">
                            {entry.matchIds.map((id) => {
                              const match = matchesById.get(id);
                              return (
                                <div
                                  key={id}
                                  className="rounded-lg border border-[#e6e3da] bg-white px-2 py-1.5"
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
          <span className="inline-flex items-center rounded-full border border-[#E6E3DA] bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#0C0D11]">
            Scene 03 · Knockout
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0C0D11] md:text-4xl">
            Win or go home
          </h2>
        </div>
        <p className="hidden rounded-full border border-[#e6e3da] bg-[#faf9f6] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700 sm:block">
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
              className="relative overflow-hidden rounded-2xl border border-[#e6e3da] bg-white shadow-sm"
            >
              {roundIndex > 0 && (
                <span className="material-symbols-outlined absolute -left-5 top-1/2 hidden -translate-y-1/2 text-4xl text-slate-400 xl:block">
                  arrow_forward
                </span>
              )}
              <div className="border-b border-[#e6e3da] bg-[#0c0d11] px-4 py-3 text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-white">
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
                        "relative rounded-xl border border-[#e6e3da] p-3",
                        live ? "bg-rose-50/50" : "bg-[#faf9f6]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-700">
                          {bracketMatch.label}
                        </p>
                        <span
                          className={cx(
                            "text-[9px] font-semibold uppercase",
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
                                  "flex items-center gap-2 rounded-lg border border-[#e6e3da] px-2 py-1.5",
                                  winner ? "bg-[#f5eedb]" : "bg-white",
                                )}
                              >
                                <span className="w-5 text-center text-[10px] font-bold text-slate-400">
                                  {team?.seed ?? "—"}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#0c0d11]">
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
                        <p className="mt-2 text-right text-xs font-bold text-slate-700">
                          {match.score}
                        </p>
                      )}
                    </div>
                  );
                })}
                {round.matches.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs font-semibold uppercase text-slate-400">
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
        <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-xl border border-[#e6e3da] bg-[#0c0d11] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#f5eedb] shadow-sm">
          <span className="material-symbols-outlined text-base">
            emoji_events
          </span>
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
      <main className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-6 text-[#0C0D11]">
        <div className="text-center">
          <span className="material-symbols-outlined admin-spin text-5xl text-[#0C0D11]">
            progress_activity
          </span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[#8C877D]">
            Opening tournament display
          </p>
        </div>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-6">
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
      className="flex min-h-screen flex-col overflow-x-hidden bg-[#FAF9F6] pb-20"
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
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c0d11] text-white shadow-sm">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/tournaments/bracket"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Exit tournament display"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold uppercase tracking-wide">
                  {tournament.name}
                </p>
                <span className="hidden rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-[#f5eedb] sm:inline-flex">
                  Live display
                </span>
              </div>
              <p className="truncate text-xs font-medium text-white/70">
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
                    "flex h-9 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-semibold uppercase tracking-wider transition",
                    selected
                      ? "border-white bg-white text-[#0c0d11]"
                      : "border-white/20 bg-white/10 text-white hover:bg-white/15",
                  )}
                >
                  <span className="material-symbols-outlined text-base">
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

      <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e6e3da] bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {slides.map((slide, index) => (
              <button
                key={`${slide.scene}-${slide.page}`}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={cx(
                  "relative h-2 min-w-4 flex-1 overflow-hidden rounded-full border border-[#e6e3da]",
                  index === activeSlide ? "bg-[#f5eedb]" : "bg-slate-100",
                )}
                aria-label={`${sceneMeta[slide.scene].label}, slide ${slide.page + 1}`}
              >
                {index === activeSlide && !paused && (
                  <span
                    className="display-progress absolute inset-y-0 left-0 bg-[#0c0d11]"
                    style={{
                      animationDuration: `${String(intervalSeconds)}s`,
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <span className="mr-2 hidden text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:block">
              {sceneMeta[active.scene].label} · {activeSlide + 1}/
              {slides.length}
            </span>
            <button
              type="button"
              onClick={previousSlide}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e6e3da] bg-white text-[#0c0d11] transition hover:bg-slate-50 active:scale-95"
              aria-label="Previous slide"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaused((current) => !current)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-[#0c0d11] bg-[#0c0d11] px-3.5 text-xs font-semibold uppercase tracking-wider text-[#f5eedb] transition hover:bg-black active:scale-95"
            >
              <span className="material-symbols-outlined text-base">
                {paused ? "play_arrow" : "pause"}
              </span>
              {paused ? "Play" : "Pause"}
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e6e3da] bg-white text-[#0c0d11] transition hover:bg-slate-50 active:scale-95"
              aria-label="Next slide"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e6e3da] bg-white text-[#0c0d11] transition hover:bg-slate-50 active:scale-95"
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <span className="material-symbols-outlined text-lg">
                {fullscreen ? "fullscreen_exit" : "fullscreen"}
              </span>
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
