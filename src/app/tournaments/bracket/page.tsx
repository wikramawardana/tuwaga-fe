"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
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
      <main className="neo-public min-h-screen pt-16">
        <section className="public-hero">
          <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-10 md:py-16">
            <PageBreadcrumb
              parentLabel="Home"
              parentHref="/"
              current="Bracket"
            />
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="public-kicker">Tournament bracket</p>
                <h1 className="public-title mt-5 max-w-4xl text-3xl font-bold tracking-tight text-white md:text-5xl">
                  {tournament?.name ?? "Loading tournament"}
                </h1>
                <p className="mt-4 border-l-2 border-[#f5eedb] pl-4 text-sm font-medium text-white/80">
                  {tournament
                    ? `${tournament.venue} · ${tournament.dateLabel}`
                    : "Reading standings and bracket from the backend."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                <div className="inline-flex rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
                  {(["groups", "bracket"] as const).map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setActiveView(view)}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                        activeView === view
                          ? "bg-white text-[#0c0d11]"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
                {tournament && (
                  <Link
                    href={`/tournaments/${tournament.slug}/display`}
                    target="_blank"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e6e3da] bg-[#f5eedb] px-4 text-xs font-semibold uppercase tracking-wider text-[#0c0d11] transition hover:bg-white active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">
                      tv
                    </span>
                    Open TV display
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1440px] px-6 py-10 md:px-10">
          {loading && (
            <div className="h-48 animate-pulse rounded-2xl border border-outline-variant/30 bg-white" />
          )}

          {error && (
            <div className="rounded-2xl border border-error/20 bg-error-container p-5 text-sm font-semibold text-on-error-container">
              {error}
            </div>
          )}

          {!loading && !error && activeView === "groups" && (
            <section className="grid gap-6 lg:grid-cols-2">
              {standings?.groups.map((group) => (
                <article
                  key={group.group}
                  className="overflow-hidden rounded-2xl border border-[#e6e3da] bg-white shadow-sm"
                >
                  <div className="border-b border-[#e6e3da] bg-[#faf9f6] px-5 py-4">
                    <h2 className="text-base font-bold text-[#0c0d11]">
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
                            title="Score Difference (Total Games Scored)"
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
                            <td className="px-3 py-4 text-center">
                              {team.wins}
                            </td>
                            <td className="px-3 py-4 text-center">
                              {team.losses}
                            </td>
                            <td className="px-3 py-4 text-center font-medium text-on-surface-variant">
                              {team.gamesWon ?? "—"}
                            </td>
                            <td className="px-3 py-4 text-center font-medium text-on-surface-variant">
                              {team.gamesLost ?? "—"}
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
                  No standings yet. Add approved teams and generate a draw
                  first.
                </div>
              )}
            </section>
          )}

          {!loading && !error && activeView === "bracket" && (
            <section className="grid gap-6 xl:grid-cols-4">
              {bracket?.rounds.map((round) => (
                <article
                  key={round.name}
                  className="rounded-2xl border border-[#e6e3da] bg-white p-5 shadow-sm"
                >
                  <h2 className="text-base font-bold text-[#0c0d11]">
                    {round.name}
                  </h2>
                  <div className="mt-4 space-y-3">
                    {round.matches.map((match) => (
                      <div
                        key={match.id}
                        className="rounded-xl border border-[#f0ede6] bg-[#faf9f6] p-4"
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
        </div>
      </main>
      <Footer />
    </>
  );
}
