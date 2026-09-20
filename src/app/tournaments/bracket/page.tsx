"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import {
  type BracketResponse,
  getBracket,
  getCurrentTournament,
  getStandings,
  listTournaments,
  type StandingsResponse,
  type Tournament,
} from "@/lib/tuwagaApi";

function TournamentBracketContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentParam =
    searchParams.get("tournament") || searchParams.get("slug");
  const viewParam = searchParams.get("view");
  const divisionParam = searchParams.get("division");

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [bracket, setBracket] = useState<BracketResponse | null>(null);
  const [activeView, setActiveView] = useState<"groups" | "bracket">("bracket");
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      try {
        const [tournamentsList, current] = await Promise.all([
          listTournaments().catch(() => []),
          getCurrentTournament(tournamentParam),
        ]);

        if (!active) return;
        setAllTournaments(tournamentsList);

        if (!current) {
          setError("No tournament found in the system.");
          return;
        }

        setTournament(current);

        const [standingsData, bracketData] = await Promise.all([
          getStandings(current.id).catch(() => ({
            groups: [],
            qualifierCount: 0,
          })),
          getBracket(current.id).catch(() => ({
            rounds: [],
            championTeamId: null,
          })),
        ]);

        if (!active) return;
        setStandings(standingsData);
        setBracket(bracketData);
        setError("");

        // Auto-select view based on param or format
        if (viewParam === "groups" && standingsData.groups.length > 0) {
          setActiveView("groups");
        } else if (
          viewParam === "bracket" ||
          current.settings?.format === "Single elimination" ||
          standingsData.groups.length === 0
        ) {
          setActiveView("bracket");
        } else {
          setActiveView("groups");
        }

        if (divisionParam) {
          setSelectedDivision(divisionParam);
        }
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load tournament data.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [tournamentParam, viewParam, divisionParam]);

  const availableDivisions = useMemo(() => {
    const set = new Set<string>();
    bracket?.rounds.forEach((round) => {
      round.matches.forEach((m) => {
        if (m.division) set.add(m.division);
      });
    });
    return Array.from(set);
  }, [bracket]);

  const filteredRounds = useMemo(() => {
    if (!bracket) return [];
    return bracket.rounds
      .map((round) => ({
        ...round,
        matches:
          selectedDivision === "all"
            ? round.matches
            : round.matches.filter(
                (match) => match.division === selectedDivision,
              ),
      }))
      .filter((round) => round.matches.length > 0);
  }, [bracket, selectedDivision]);

  const handleViewChange = (view: "groups" | "bracket") => {
    setActiveView(view);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.replace(`/tournaments/bracket?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleDivisionChange = (division: string) => {
    setSelectedDivision(division);
    const params = new URLSearchParams(searchParams.toString());
    if (division === "all") {
      params.delete("division");
    } else {
      params.set("division", division);
    }
    router.replace(`/tournaments/bracket?${params.toString()}`, {
      scroll: false,
    });
  };

  function switchTournament(slugOrId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tournament", slugOrId);
    params.delete("slug");
    params.set("view", activeView);
    if (selectedDivision !== "all") {
      params.set("division", selectedDivision);
    } else {
      params.delete("division");
    }
    router.push(`/tournaments/bracket?${params.toString()}`);
  }

  const hasGroups = (standings?.groups.length ?? 0) > 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar active="bracket" />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-10 pt-24 md:px-10">
        <PageBreadcrumb parentLabel="Home" parentHref="/" current="Bracket" />

        {/* Tournament Header */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                {tournament?.settings?.sport === "table_tennis"
                  ? "🏓 Table Tennis"
                  : "🎾 Tournament"}
              </span>
              {tournament?.settings?.format && (
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {tournament.settings.format}
                </span>
              )}
            </div>

            <h1 className="mt-2.5 text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
              {tournament?.name ??
                (loading ? "Loading bracket…" : "Tournament")}
            </h1>

            <p className="mt-1.5 text-sm text-on-surface-variant">
              {tournament
                ? `${tournament.venue} · ${tournament.dateLabel}`
                : "Official tournament draw and bracket progression."}
            </p>

            {/* Tournament switcher if multiple exist */}
            {allTournaments.length > 1 && (
              <div className="mt-3 inline-flex items-center gap-2">
                <label
                  htmlFor="tournament-switcher"
                  className="text-xs font-semibold text-slate-500"
                >
                  Switch tournament:
                </label>
                <select
                  id="tournament-switcher"
                  value={tournament?.slug || tournament?.id || ""}
                  onChange={(e) => switchTournament(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 focus:border-primary focus:outline-none"
                >
                  {allTournaments.map((t) => (
                    <option key={t.id} value={t.slug || t.id}>
                      {t.name} ({t.dateLabel})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {/* View Switcher: only show groups toggle if groups exist */}
            {hasGroups && (
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-1">
                <button
                  type="button"
                  onClick={() => handleViewChange("groups")}
                  className={`h-9 rounded-md px-3.5 text-xs font-bold transition-all ${
                    activeView === "groups"
                      ? "bg-white text-primary shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Group Stage
                </button>
                <button
                  type="button"
                  onClick={() => handleViewChange("bracket")}
                  className={`h-9 rounded-md px-3.5 text-xs font-bold transition-all ${
                    activeView === "bracket"
                      ? "bg-white text-primary shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Bracket
                </button>
              </div>
            )}

            {tournament && (
              <Link
                href={`/tournaments/${tournament.slug}/display?scene=bracket`}
                target="_blank"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-base">tv</span>
                TV Display
                <span className="material-symbols-outlined text-xs text-slate-400">
                  open_in_new
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Division Filter Bar (when on bracket view and divisions exist) */}
        {activeView === "bracket" && availableDivisions.length > 1 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-4">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Divisions:
            </span>
            <button
              type="button"
              onClick={() => handleDivisionChange("all")}
              className={`inline-flex h-8 items-center rounded-lg px-3.5 text-xs font-semibold transition ${
                selectedDivision === "all"
                  ? "bg-primary text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              All Divisions
            </button>
            {availableDivisions.map((division) => (
              <button
                key={division}
                type="button"
                onClick={() => handleDivisionChange(division)}
                className={`inline-flex h-8 items-center rounded-lg px-3.5 text-xs font-semibold transition ${
                  selectedDivision === division
                    ? "bg-primary text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {division}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div>
          {loading && (
            <div className="space-y-4">
              <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600">
                  error
                </span>
                {error}
              </div>
            </div>
          )}

          {/* Groups View */}
          {!loading && !error && activeView === "groups" && (
            <section className="grid gap-6 lg:grid-cols-2">
              {standings?.groups.map((group) => (
                <article
                  key={group.group}
                  className="rounded-xl border border-slate-200 bg-white shadow-xs"
                >
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-extrabold text-slate-900">
                      {group.group.includes(" · ")
                        ? group.group
                        : `Group ${group.group}`}
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-3">Team</th>
                          <th className="px-3 py-3 text-center">P</th>
                          <th className="px-3 py-3 text-center">W</th>
                          <th className="px-3 py-3 text-center">L</th>
                          <th
                            className="px-3 py-3 text-center"
                            title="Games Won"
                          >
                            GW
                          </th>
                          <th
                            className="px-3 py-3 text-center"
                            title="Games Lost"
                          >
                            GL
                          </th>
                          <th
                            className="px-3 py-3 text-center"
                            title="Score Difference"
                          >
                            SD
                          </th>
                          <th className="px-3 py-3 text-center">Pts</th>
                          <th className="px-5 py-3 text-right">Rank</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.teams.map((team) => (
                          <tr key={team.teamId}>
                            <td className="px-5 py-3.5 font-bold text-slate-900">
                              {team.teamName}
                              {team.qualified && (
                                <span
                                  title="Qualified for knockout"
                                  className="ml-2 inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700"
                                >
                                  Q
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-center text-slate-700">
                              {team.played}
                            </td>
                            <td className="px-3 py-3.5 text-center font-semibold text-slate-900">
                              {team.wins}
                            </td>
                            <td className="px-3 py-3.5 text-center text-slate-500">
                              {team.losses}
                            </td>
                            <td className="px-3 py-3.5 text-center text-slate-600">
                              {team.gamesWon ?? "—"}
                            </td>
                            <td className="px-3 py-3.5 text-center text-slate-600">
                              {team.gamesLost ?? "—"}
                            </td>
                            <td className="px-3 py-3.5 text-center font-bold text-slate-700">
                              {team.diff > 0 ? `+${team.diff}` : team.diff}
                            </td>
                            <td className="px-3 py-3.5 text-center font-extrabold text-primary">
                              {team.points}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                                #{team.groupRank}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
              {standings?.groups.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 lg:col-span-2">
                  No group stage configured for this tournament.
                </div>
              )}
            </section>
          )}

          {/* Bracket View */}
          {!loading && !error && activeView === "bracket" && (
            <div>
              {filteredRounds.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-400">
                    account_tree
                  </span>
                  <p className="mt-2 text-base font-bold text-slate-800">
                    No matches found for this view
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedDivision !== "all"
                      ? `No bracket matches scheduled under ${selectedDivision}.`
                      : "Tournament draw has not been generated yet."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredRounds.map((round) => (
                    <article
                      key={round.name}
                      className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs"
                    >
                      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <h2 className="text-sm font-extrabold text-slate-900">
                            {round.name}
                          </h2>
                          <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {round.matches.length}{" "}
                            {round.matches.length === 1 ? "match" : "matches"}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3 p-3">
                        {round.matches.map((match) => {
                          const isTeamAWinner =
                            match.winnerTeamId &&
                            match.teamA &&
                            match.winnerTeamId === match.teamA.teamId;
                          const isTeamBWinner =
                            match.winnerTeamId &&
                            match.teamB &&
                            match.winnerTeamId === match.teamB.teamId;

                          return (
                            <div
                              key={match.id}
                              className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 transition hover:border-slate-300"
                            >
                              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                                <span className="font-bold text-primary">
                                  {match.label}
                                </span>
                                {match.division && (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600">
                                    {match.division}
                                  </span>
                                )}
                              </div>

                              {/* Match participants */}
                              <div className="space-y-1.5 text-xs">
                                {/* Team A */}
                                <div
                                  className={`flex items-center justify-between rounded-md px-2 py-1.5 ${
                                    isTeamAWinner
                                      ? "bg-emerald-50 font-bold text-emerald-900 ring-1 ring-emerald-200"
                                      : "bg-white text-slate-800"
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-1.5">
                                    {match.teamA?.seed != null && (
                                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-slate-100 px-1 text-[9px] font-extrabold text-slate-600">
                                        #{match.teamA.seed}
                                      </span>
                                    )}
                                    <span className="truncate font-semibold">
                                      {match.teamA?.teamName || "TBD"}
                                    </span>
                                  </div>
                                  {isTeamAWinner && (
                                    <span className="material-symbols-outlined text-sm text-emerald-600">
                                      check_circle
                                    </span>
                                  )}
                                </div>

                                {/* Team B */}
                                <div
                                  className={`flex items-center justify-between rounded-md px-2 py-1.5 ${
                                    isTeamBWinner
                                      ? "bg-emerald-50 font-bold text-emerald-900 ring-1 ring-emerald-200"
                                      : "bg-white text-slate-800"
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-1.5">
                                    {match.teamB?.seed != null && (
                                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-slate-100 px-1 text-[9px] font-extrabold text-slate-600">
                                        #{match.teamB.seed}
                                      </span>
                                    )}
                                    <span className="truncate font-semibold">
                                      {match.teamB?.teamName || "TBD"}
                                    </span>
                                  </div>
                                  {isTeamBWinner && (
                                    <span className="material-symbols-outlined text-sm text-emerald-600">
                                      check_circle
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function TournamentBracketPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <TournamentBracketContent />
    </Suspense>
  );
}
