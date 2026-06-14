"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import {
  getCurrentTournament,
  getLive,
  type LiveResponse,
  type Tournament,
} from "@/lib/tuwagaApi";

export default function LiveScoresPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [live, setLive] = useState<LiveResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLiveScores() {
      setLoading(true);
      try {
        const current = await getCurrentTournament();
        if (!current) {
          setTournament(null);
          setLive(null);
          setError("No tournament found in the backend.");
          return;
        }

        const liveData = await getLive(current.id);
        if (!active) return;
        setTournament(current);
        setLive(liveData);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to load live scores.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLiveScores();
    const interval = window.setInterval(loadLiveScores, 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-[1440px] px-6 py-10 pt-24 md:px-10">
        <PageBreadcrumb
          parentLabel="Home"
          parentHref="/"
          current="Live Scores"
        />

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Live scores
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-on-surface md:text-4xl">
              {tournament?.name ?? "Tournament Live Scores"}
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              {tournament
                ? `${tournament.venue} - ${tournament.dateLabel}`
                : "Loading backend tournament data."}
            </p>
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-white px-4 py-3 text-sm font-bold text-on-surface shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            {loading
              ? "Syncing..."
              : `${live?.activeMatches.length ?? 0} active matches`}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error-container p-5 text-sm font-semibold text-on-error-container">
            {error}
          </div>
        )}

        {!error && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-4">
              <h2 className="text-lg font-extrabold text-on-surface">
                Live now
              </h2>
              {loading && !live && (
                <div className="h-40 animate-pulse rounded-lg border border-outline-variant/30 bg-white" />
              )}
              {live?.activeMatches.length === 0 && (
                <div className="rounded-lg border border-outline-variant/30 bg-white p-5 text-sm font-semibold text-on-surface-variant">
                  No active matches right now.
                </div>
              )}
              {live?.activeMatches.map((match) => (
                <article
                  key={match.id}
                  className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        {match.court} - {match.courtLabel}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-on-surface-variant">
                        {match.setInfo}
                      </p>
                    </div>
                    <span className="rounded-full bg-error px-3 py-1 text-xs font-bold uppercase text-on-error">
                      Live
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {[match.teamA, match.teamB].map((team) => (
                      <div
                        key={team.id ?? team.player1}
                        className="rounded-lg bg-surface-container-low p-4"
                      >
                        <p className="font-extrabold text-on-surface">
                          {team.player1}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          {team.player2}
                        </p>
                        <p className="mt-3 text-2xl font-extrabold text-primary">
                          {team.scores.length ? team.scores.join(" - ") : "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>

            <aside className="space-y-6">
              <section className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                <h2 className="text-lg font-extrabold text-on-surface">
                  Next up
                </h2>
                <div className="mt-4 space-y-3">
                  {live?.nextUp.map((match) => (
                    <div
                      key={match.id}
                      className="rounded-lg bg-surface-container-low p-3"
                    >
                      <p className="text-xs font-bold uppercase text-primary">
                        {match.day} - {match.time}
                      </p>
                      <p className="mt-1 text-sm font-bold text-on-surface">
                        {match.teamA} vs {match.teamB}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {match.venue}
                      </p>
                    </div>
                  ))}
                  {live?.nextUp.length === 0 && (
                    <p className="text-sm text-on-surface-variant">
                      No scheduled matches.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                <h2 className="text-lg font-extrabold text-on-surface">
                  Recent results
                </h2>
                <div className="mt-4 space-y-3">
                  {live?.recentResults.map((result) => (
                    <div
                      key={result.id}
                      className="rounded-lg bg-surface-container-low p-3"
                    >
                      <p className="text-sm font-bold text-on-surface">
                        {result.winner}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        def. {result.loser} - {result.score}
                      </p>
                    </div>
                  ))}
                  {live?.recentResults.length === 0 && (
                    <p className="text-sm text-on-surface-variant">
                      No completed results yet.
                    </p>
                  )}
                </div>
              </section>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
