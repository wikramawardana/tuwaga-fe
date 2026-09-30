"use client";

import { ClockIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import EventHeader from "@/components/EventHeader";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScoreCard from "@/components/ScoreCard";
import { simplifyScore } from "@/lib/matchScore";
import {
  getCurrentTournament,
  getLive,
  type LiveResponse,
  listTournaments,
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
    <span className="rounded-md border border-brand-500/20 bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-600">
      in ~{diffMin} min
    </span>
  );
}

function LiveScoresContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentParam =
    searchParams.get("tournament") || searchParams.get("slug");

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [live, setLive] = useState<LiveResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLiveScores() {
      try {
        const [tournamentsList, current] = await Promise.all([
          listTournaments().catch(() => []),
          getCurrentTournament(tournamentParam),
        ]);

        if (!active) return;
        setAllTournaments(tournamentsList);

        if (!current) {
          setTournament(null);
          setLive(null);
          setError("No tournament found in the backend.");
          setLoading(false);
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
  }, [tournamentParam]);

  function switchTournament(slugOrId: string) {
    router.push(`/tournaments/live?tournament=${slugOrId}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar active="live" />
      <main className="flex-1 pt-16">
        <EventHeader
          section="Live scores"
          tournament={tournament}
          title={
            tournament?.name ??
            (loading ? "Loading live scores…" : "Live Scores")
          }
          subtitle={
            tournament
              ? `${tournament.venue} · ${tournament.dateLabel}`
              : "Real-time match scoring and upcoming order of play."
          }
          tournaments={allTournaments}
          onSwitch={switchTournament}
          switcherId="live-tournament-switcher"
          actions={
            <span className="inline-flex h-9 items-center gap-2.5 rounded-full border border-cream-200/15 px-4 text-xs font-semibold text-cream-100">
              {(live?.activeMatches.length ?? 0) > 0 ? (
                <span className="live-dot" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-cream-200/30" />
              )}
              {loading
                ? "Syncing…"
                : `${live?.activeMatches.length ?? 0} active matches`}
            </span>
          }
        />

        <div className="container-page py-10">
          <div>
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-800">
                <div className="flex items-center gap-2">
                  <WarningCircleIcon
                    className="text-rose-600"
                    aria-hidden="true"
                    weight="bold"
                  />
                  {error}
                </div>
              </div>
            )}

            {!error && (
              <div className="grid gap-7 lg:grid-cols-[1fr_380px]">
                {/* Live now — using ScoreCard */}
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-ink-950">Live now</h2>
                  {loading && !live && (
                    <div className="h-40 animate-pulse rounded-xl border border-ink-200 bg-white" />
                  )}
                  {live?.activeMatches.length === 0 && (
                    <div className="rounded-xl border border-ink-200 bg-white p-8 text-center text-sm font-semibold text-ink-500">
                      <ClockIcon
                        className="text-3xl text-ink-400"
                        aria-hidden="true"
                        weight="duotone"
                      />
                      <p className="mt-2 text-ink-700 font-bold">
                        No active matches right now
                      </p>
                      <p className="text-xs text-ink-400 mt-1">
                        Live scores will stream here once matches are marked in
                        play.
                      </p>
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
                  <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-xs">
                    <h2 className="text-base font-extrabold text-ink-900">
                      Next up
                    </h2>
                    <div className="mt-4 space-y-3">
                      {live?.nextUp.map((match) => (
                        <div
                          key={match.id}
                          className="rounded-lg border border-ink-100 bg-ink-50 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold uppercase text-brand-600">
                              {match.day} — {match.time}
                            </p>
                            <CountdownBadge time={match.time} />
                          </div>
                          <p className="mt-1 text-sm font-bold text-ink-950">
                            {match.teamA} vs {match.teamB}
                          </p>
                          <p className="text-xs text-ink-600">{match.venue}</p>
                        </div>
                      ))}
                      {live?.nextUp.length === 0 && (
                        <p className="text-sm text-ink-500">
                          No scheduled matches.
                        </p>
                      )}
                    </div>
                  </section>

                  {/* Recent results */}
                  <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-xs">
                    <h2 className="text-base font-extrabold text-ink-900">
                      Recent results
                    </h2>
                    <div className="mt-4 space-y-3">
                      {live?.recentResults.map((result) => (
                        <div
                          key={result.id}
                          className="rounded-lg border border-ink-100 bg-ink-50 p-3"
                        >
                          <p className="text-sm font-bold text-ink-950">
                            {result.winner}
                          </p>
                          <p className="text-xs text-ink-600">
                            def. {result.loser} — {simplifyScore(result.score)}
                          </p>
                        </div>
                      ))}
                      {live?.recentResults.length === 0 && (
                        <p className="text-sm text-ink-500">
                          No completed results yet.
                        </p>
                      )}
                    </div>
                  </section>
                </aside>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function LiveScoresPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      }
    >
      <LiveScoresContent />
    </Suspense>
  );
}
