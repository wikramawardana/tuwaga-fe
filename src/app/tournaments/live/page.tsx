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
    <span className="rounded-md border border-[#e6e3da] bg-[#f5eedb] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0c0d11]">
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
      <main className="mx-auto min-h-screen max-w-[1440px] px-6 py-10 pt-24 md:px-10">
        <PageBreadcrumb
          parentLabel="Home"
          parentHref="/"
          current="Live Scores"
        />

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#0C0D11]">
              Live scores
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#0C0D11] md:text-4xl">
              {tournament?.name ?? "Tournament Live Scores"}
            </h1>
            <p className="mt-2 text-sm text-[#5A5751]">
              {tournament
                ? `${tournament.venue} · ${tournament.dateLabel}`
                : "Loading backend tournament data."}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#E6E3DA] bg-white px-4 py-3 text-sm font-semibold text-[#0C0D11] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {loading
              ? "Syncing…"
              : `${live?.activeMatches.length ?? 0} active matches`}
          </div>
        </div>

        <div>
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800">
              {error}
            </div>
          )}

          {!error && (
            <div className="grid gap-7 lg:grid-cols-[1fr_380px]">
              {/* Live now — using ScoreCard */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-[#0C0D11]">Live now</h2>
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
                <section className="rounded-2xl border border-[#e6e3da] bg-white p-5 shadow-sm">
                  <h2 className="text-base font-bold text-[#0c0d11]">
                    Next up
                  </h2>
                  <div className="mt-4 space-y-3">
                    {live?.nextUp.map((match) => (
                      <div
                        key={match.id}
                        className="rounded-xl border border-[#f0ede6] bg-[#faf9f6] p-3"
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
                <section className="rounded-2xl border border-[#e6e3da] bg-white p-5 shadow-sm">
                  <h2 className="text-base font-bold text-[#0c0d11]">
                    Recent results
                  </h2>
                  <div className="mt-4 space-y-3">
                    {live?.recentResults.map((result) => (
                      <div
                        key={result.id}
                        className="rounded-xl border border-[#f0ede6] bg-[#faf9f6] p-3"
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
