"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import {
  type BracketResponse,
  getBracket,
  getCurrentTournament,
  getStandings,
  type StandingsResponse,
  type Tournament,
} from "@/lib/tuwagaApi";

export default function TournamentBracketPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [bracket, setBracket] = useState<BracketResponse | null>(null);
  const [activeView, setActiveView] = useState<"groups" | "bracket">("groups");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBracket() {
      setLoading(true);
      try {
        const current = await getCurrentTournament();
        if (!current) {
          setError("No tournament found in the backend.");
          return;
        }

        const [standingsData, bracketData] = await Promise.all([
          getStandings(current.id),
          getBracket(current.id),
        ]);

        if (!active) return;
        setTournament(current);
        setStandings(standingsData);
        setBracket(bracketData);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to load bracket.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBracket();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-[1440px] px-6 py-10 pt-24 md:px-10">
        <PageBreadcrumb parentLabel="Home" parentHref="/" current="Bracket" />

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Tournament bracket
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-on-surface md:text-4xl">
              {tournament?.name ?? "Loading tournament"}
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              {tournament
                ? `${tournament.venue} - ${tournament.dateLabel}`
                : "Reading standings and bracket from the backend."}
            </p>
          </div>
          <div className="inline-flex rounded-lg bg-surface-container-low p-1">
            {(["groups", "bracket"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`h-10 rounded-md px-4 text-sm font-bold capitalize transition-colors ${
                  activeView === view
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-white hover:text-primary"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="h-48 animate-pulse rounded-lg border border-outline-variant/30 bg-white" />
        )}

        {error && (
          <div className="rounded-lg border border-error/20 bg-error-container p-5 text-sm font-semibold text-on-error-container">
            {error}
          </div>
        )}

        {!loading && !error && activeView === "groups" && (
          <section className="grid gap-5 lg:grid-cols-2">
            {standings?.groups.map((group) => (
              <article
                key={group.group}
                className="rounded-lg border border-outline-variant/30 bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.04)]"
              >
                <div className="border-b border-outline-variant/20 px-5 py-4">
                  <h2 className="text-lg font-extrabold text-on-surface">
                    {group.group.includes(" · ")
                      ? group.group
                      : `Group ${group.group}`}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-surface-container-low text-xs font-bold uppercase text-on-surface-variant">
                      <tr>
                        <th className="px-5 py-3">Team</th>
                        <th className="px-3 py-3 text-center">P</th>
                        <th className="px-3 py-3 text-center">W</th>
                        <th className="px-3 py-3 text-center">L</th>
                        <th
                          className="px-3 py-3 text-center"
                          title="Score Difference (Games Won - Games Lost)"
                        >
                          SD
                        </th>
                        <th className="px-3 py-3 text-center">Pts</th>
                        <th className="px-5 py-3 text-right">Rank</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {group.teams.map((team) => (
                        <tr key={team.teamId}>
                          <td className="px-5 py-4 font-bold text-on-surface">
                            {team.teamName}
                            {team.qualified && (
                              <span
                                title="Qualified for knockout"
                                className="ml-2 inline-flex items-center rounded-md bg-secondary/10 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-secondary"
                              >
                                Q
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-center">
                            {team.played}
                          </td>
                          <td className="px-3 py-4 text-center">{team.wins}</td>
                          <td className="px-3 py-4 text-center">
                            {team.losses}
                          </td>
                          <td className="px-3 py-4 text-center font-bold text-on-surface-variant">
                            {team.diff > 0 ? `+${team.diff}` : team.diff}
                          </td>
                          <td className="px-3 py-4 text-center font-bold text-primary">
                            {team.points}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="rounded-md bg-surface-container-low px-2 py-1 text-xs font-bold">
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
              <div className="rounded-lg border border-outline-variant/30 bg-white p-5 text-sm font-semibold text-on-surface-variant lg:col-span-2">
                No standings yet. Add approved teams and generate a draw first.
              </div>
            )}
          </section>
        )}

        {!loading && !error && activeView === "bracket" && (
          <section className="grid gap-5 xl:grid-cols-4">
            {bracket?.rounds.map((round) => (
              <article
                key={round.name}
                className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]"
              >
                <h2 className="text-lg font-extrabold text-on-surface">
                  {round.name}
                </h2>
                <div className="mt-4 space-y-3">
                  {round.matches.map((match) => (
                    <div
                      key={match.id}
                      className="rounded-lg bg-surface-container-low p-4"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        {match.label}
                      </p>
                      {match.division && (
                        <p className="mt-1 text-[11px] font-semibold text-on-surface-variant">
                          {match.division}
                        </p>
                      )}
                      <p className="mt-3 font-bold text-on-surface">
                        {match.teamA?.teamName ?? "TBD"}
                      </p>
                      <p className="my-1 text-xs font-bold uppercase text-on-surface-variant">
                        vs
                      </p>
                      <p className="font-bold text-on-surface">
                        {match.teamB?.teamName ?? "TBD"}
                      </p>
                    </div>
                  ))}
                  {round.matches.length === 0 && (
                    <p className="text-sm text-on-surface-variant">
                      Waiting for qualifiers.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
