"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import ScoreCard from "@/components/ScoreCard";
import {
  getCurrentTournament,
  getLive,
  type LiveResponse,
  type Tournament,
} from "@/lib/tuwagaApi";

function CountdownBadge({ time }: { time: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const today = new Date();
  const target = new Date(today);
  target.setHours(hours, minutes, 0, 0);

  const diffMs = target.getTime() - now;
  if (diffMs <= 0) return null;

  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin > 120) return null;

  return (
    <span className="border-2 border-[#07142f] bg-yellow-200 px-2 py-0.5 text-[11px] font-black text-[#07142f] shadow-[2px_2px_0_#07142f]">
      in ~{diffMin} min
    </span>
  );
}

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
      <main className="neo-public min-h-screen pt-16">
        <section className="public-hero">
          <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-10 md:py-16">
            <PageBreadcrumb
              parentLabel="Home"
              parentHref="/"
              current="Live Scores"
            />
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="public-kicker">Live scores</p>
                <h1 className="public-title mt-5 max-w-4xl text-4xl text-white md:text-6xl">
                  {tournament?.name ?? "Tournament Live Scores"}
                </h1>
                <p className="mt-4 border-l-4 border-cyan-300 pl-4 text-sm font-bold text-white">
                  {tournament
                    ? `${tournament.venue} · ${tournament.dateLabel}`
                    : "Loading backend tournament data."}
                </p>
              </div>
              <div className="public-stat bg-white px-4 py-3 text-sm font-black uppercase text-[#07142f]">
                {loading
                  ? "Syncing…"
                  : `${live?.activeMatches.length ?? 0} active matches`}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1440px] px-6 py-10 md:px-10">
          {error && (
            <div className="rounded-lg border border-error/20 bg-error-container p-5 text-sm font-semibold text-on-error-container">
              {error}
            </div>
          )}

          {!error && (
            <div className="grid gap-7 lg:grid-cols-[1fr_380px]">
              {/* Live now — using ScoreCard */}
              <section className="space-y-4">
                <h2 className="public-title text-3xl text-slate-950">
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
                  <ScoreCard
                    key={match.id}
                    courtLabel={`${match.court} — ${match.courtLabel}`}
                    setInfo={match.setInfo}
                    status="live"
                    teamA={match.teamA}
                    teamB={match.teamB}
                  />
                ))}
              </section>

              <aside className="space-y-6">
                {/* Next up with EST countdown */}
                <section className="public-panel bg-white p-5">
                  <h2 className="text-lg font-extrabold text-on-surface">
                    Next up
                  </h2>
                  <div className="mt-4 space-y-3">
                    {live?.nextUp.map((match) => (
                      <div
                        key={match.id}
                        className="rounded-lg border-2 border-[#07142f] bg-blue-50 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold uppercase text-primary">
                            {match.day} — {match.time}
                          </p>
                          <CountdownBadge time={match.time} />
                        </div>
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

                {/* Recent results */}
                <section className="public-panel bg-white p-5">
                  <h2 className="text-lg font-extrabold text-on-surface">
                    Recent results
                  </h2>
                  <div className="mt-4 space-y-3">
                    {live?.recentResults.map((result) => (
                      <div
                        key={result.id}
                        className="rounded-lg border-2 border-[#07142f] bg-cyan-50 p-3"
                      >
                        <p className="text-sm font-bold text-on-surface">
                          {result.winner}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          def. {result.loser} — {result.score}
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
        </div>
      </main>
      <Footer />
    </>
  );
}
