"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import ScoreCard from "@/components/ScoreCard";
import {
  getCurrentTournament,
  getLive,
  listTournaments,
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
    <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
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
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar active="live" />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-10 pt-24 md:px-10">
        <PageBreadcrumb
          parentLabel="Home"
          parentHref="/"
          current="Live Scores"
        />

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
              {tournament?.name ?? (loading ? "Loading live scores…" : "Live Scores")}
            </h1>

            <p className="mt-1.5 text-sm text-on-surface-variant">
              {tournament
                ? `${tournament.venue} · ${tournament.dateLabel}`
                : "Real-time match scoring and upcoming order of play."}
            </p>

            {/* Tournament switcher if multiple exist */}
            {allTournaments.length > 1 && (
              <div className="mt-3 inline-flex items-center gap-2">
                <label
                  htmlFor="live-tournament-switcher"
                  className="text-xs font-semibold text-slate-500"
                >
                  Switch tournament:
                </label>
                <select
                  id="live-tournament-switcher"
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

          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {loading
              ? "Syncing…"
              : `${live?.activeMatches.length ?? 0} active matches`}
          </div>
        </div>

        <div>
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

          {!error && (
            <div className="grid gap-7 lg:grid-cols-[1fr_380px]">
              {/* Live now — using ScoreCard */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-on-surface">Live now</h2>
                {loading && !live && (
                  <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
                )}
                {live?.activeMatches.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
                    <span className="material-symbols-outlined text-3xl text-slate-400">
                      schedule
                    </span>
                    <p className="mt-2 text-slate-700 font-bold">No active matches right now</p>
                    <p className="text-xs text-slate-400 mt-1">Live scores will stream here once matches are marked in play.</p>
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
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Next up
                  </h2>
                  <div className="mt-4 space-y-3">
                    {live?.nextUp.map((match) => (
                      <div
                        key={match.id}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-3"
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
                      <p className="text-sm text-slate-500">
                        No scheduled matches.
                      </p>
                    )}
                  </div>
                </section>

                {/* Recent results */}
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Recent results
                  </h2>
                  <div className="mt-4 space-y-3">
                    {live?.recentResults.map((result) => (
                      <div
                        key={result.id}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-3"
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
                      <p className="text-sm text-slate-500">
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
    </div>
  );
}

export default function LiveScoresPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <LiveScoresContent />
    </Suspense>
  );
}
