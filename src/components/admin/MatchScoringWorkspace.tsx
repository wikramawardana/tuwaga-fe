"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getTournament,
  listMatches,
  listRegistrations,
  type Match,
  type RegistrationTeam,
  type Tournament,
  updateMatch,
} from "@/lib/tuwagaApi";

type SetScore = { teamA: number; teamB: number };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function displayTeam(team: RegistrationTeam | undefined, fallback: string) {
  if (!team) return { name: fallback, player: fallback, partner: "" };
  return {
    name: team.partner ? `${team.player} / ${team.partner}` : team.player,
    player: team.player,
    partner: team.partner ?? "",
  };
}

function scoreLabel(sets: SetScore[]) {
  return sets.map((set) => `${set.teamA}-${set.teamB}`).join(", ");
}

function MatchScoringSkeleton() {
  return (
    <div className="neo-admin flex min-h-screen items-center justify-center !bg-[#246bfe] !bg-none px-6 text-white">
      <div className="text-center">
        <span className="material-symbols-outlined admin-spin text-5xl text-blue-400">
          progress_activity
        </span>
        <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.2em] text-blue-200">
          Opening scoring room
        </p>
      </div>
    </div>
  );
}

export default function MatchScoringWorkspace({
  tournamentId,
  matchId,
}: {
  tournamentId: string;
  matchId: string;
}) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<RegistrationTeam[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [sets, setSets] = useState<SetScore[]>([{ teamA: 0, teamB: 0 }]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("Score room is ready.");
  const [winnerDialog, setWinnerDialog] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [nextTournament, nextTeams, nextMatches] = await Promise.all([
          getTournament(tournamentId),
          listRegistrations(tournamentId),
          listMatches(tournamentId),
        ]);
        if (!active) return;
        const nextMatch =
          nextMatches.find((item) => item.id === matchId) ?? null;
        setTournament(nextTournament);
        setTeams(nextTeams);
        setMatches(nextMatches);
        setMatch(nextMatch);
        setSets(
          nextMatch?.scoreSets.length
            ? nextMatch.scoreSets
            : [{ teamA: 0, teamB: 0 }],
        );
        setMessage(
          nextMatch
            ? "Live data loaded. Score changes autosave after five seconds."
            : "Match was not found in this tournament.",
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to open scoring room.",
        );
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [matchId, tournamentId]);

  const teamARecord = teams.find((team) => team.id === match?.teamAId);
  const teamBRecord = teams.find((team) => team.id === match?.teamBId);
  const teamA = displayTeam(teamARecord, "Team A pending");
  const teamB = displayTeam(teamBRecord, "Team B pending");
  const otherActiveMatches = matches.filter(
    (item) => item.status === "live" && item.id !== matchId,
  );

  const setWins = useMemo(
    () => ({
      teamA: sets.filter((set) => set.teamA > set.teamB).length,
      teamB: sets.filter((set) => set.teamB > set.teamA).length,
    }),
    [sets],
  );

  const persist = useCallback(
    async (patch: Partial<Match>, successMessage: string) => {
      if (!match) return null;
      setSaving(true);
      try {
        const updated = await updateMatch(tournamentId, match.id, patch);
        setMatch(updated);
        setMatches((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        setDirty(false);
        setMessage(successMessage);
        return updated;
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Unable to save match.",
        );
        return null;
      } finally {
        setSaving(false);
      }
    },
    [match, tournamentId],
  );

  useEffect(() => {
    if (!dirty || match?.status !== "live") return;
    const timer = window.setTimeout(() => {
      persist(
        { scoreSets: sets, score: scoreLabel(sets) },
        "Score autosaved at " +
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }) +
          ".",
      );
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [dirty, match?.status, persist, sets]);

  function updateScore(index: number, side: keyof SetScore, amount: number) {
    setSets((current) =>
      current.map((set, setIndex) =>
        setIndex === index
          ? { ...set, [side]: Math.max(0, Math.min(99, set[side] + amount)) }
          : set,
      ),
    );
    setDirty(true);
  }

  function setExactScore(index: number, side: keyof SetScore, value: number) {
    setSets((current) =>
      current.map((set, setIndex) =>
        setIndex === index
          ? { ...set, [side]: Math.max(0, Math.min(99, value || 0)) }
          : set,
      ),
    );
    setDirty(true);
  }

  function addSet() {
    setSets((current) => [...current, { teamA: 0, teamB: 0 }]);
    setDirty(true);
  }

  function removeSet(index: number) {
    if (sets.length === 1) return;
    setSets((current) => current.filter((_, setIndex) => setIndex !== index));
    setDirty(true);
  }

  async function startMatch() {
    await persist(
      { status: "live", scoreSets: sets, score: scoreLabel(sets) },
      "Match is live. The public scoreboard can now follow this court.",
    );
  }

  async function finishMatch(winnerTeamId: string) {
    const updated = await persist(
      {
        status: "completed",
        winnerTeamId,
        scoreSets: sets,
        score: scoreLabel(sets),
      },
      "Match completed and final score published.",
    );
    if (updated) setWinnerDialog(false);
  }

  if (!tournament && !match) return <MatchScoringSkeleton />;

  if (!match) {
    return (
      <main className="neo-admin flex min-h-screen items-center justify-center !bg-[#246bfe] !bg-none px-6 text-white">
        <div className="max-w-md text-center">
          <span className="material-symbols-outlined text-6xl text-blue-300">
            search_off
          </span>
          <h1 className="mt-5 text-3xl font-black">Match not found</h1>
          <p className="mt-3 text-blue-100/70">{message}</p>
          <Link
            href={`/admin/tournaments/${tournamentId}`}
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-blue-500 px-5 text-sm font-extrabold text-white"
          >
            Back to operations
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="neo-admin min-h-screen text-slate-950">
      <header className="sticky top-0 z-40 border-b-4 border-[#07142f] bg-[#246bfe] text-white shadow-[0_6px_0_#07142f]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.opener) window.close();
                else window.history.back();
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-blue-100 transition hover:bg-white/10"
              aria-label="Close scoring workspace"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-black">
                  {tournament?.name}
                </p>
                <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-200">
                  #{match.id}
                </span>
              </div>
              <p className="truncate text-xs text-blue-200/60">
                {match.category} · {match.group ? `${match.group} · ` : ""}
                {match.round}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <span className="hidden shrink-0 text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-200/60 sm:block">
              Other live courts
            </span>
            {otherActiveMatches.length === 0 ? (
              <span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-blue-100/60">
                No other live match
              </span>
            ) : (
              otherActiveMatches.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/tournaments/${tournamentId}/matches/${item.id}`}
                  target="_blank"
                  className="shrink-0 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-extrabold text-rose-100 transition hover:bg-rose-500/20"
                >
                  Court {item.courtId ?? "—"} · {item.id}
                </Link>
              ))
            )}
            <Link
              href={`/admin/tournaments/${tournamentId}`}
              className="shrink-0 rounded-lg bg-blue-500 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-blue-400"
            >
              Operations board
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1500px] gap-3 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1fr_180px_180px_1fr]">
          <div className="flex items-center gap-3">
            <span
              className={cx(
                "admin-live-dot h-3 w-3 rounded-full",
                match.status === "live"
                  ? "bg-rose-500"
                  : match.status === "completed"
                    ? "bg-emerald-500"
                    : "bg-blue-500",
              )}
            />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Match state
              </p>
              <p className="text-sm font-black capitalize text-slate-800">
                {match.status}
              </p>
            </div>
          </div>
          <label>
            <span className="admin-label">Court</span>
            <select
              value={match.courtId ?? ""}
              onChange={(event) =>
                persist(
                  {
                    courtId: event.target.value
                      ? Number(event.target.value)
                      : null,
                  },
                  "Court assignment updated.",
                )
              }
              className="admin-input"
            >
              <option value="">Unassigned</option>
              {Array.from(
                { length: tournament?.settings.courts ?? 0 },
                (_, index) => index + 1,
              ).map((court) => (
                <option key={court} value={court}>
                  Court {court}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="admin-label">Scheduled</span>
            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
              {match.time || "Not set"}
            </div>
          </div>
          <label>
            <span className="admin-label">Referee</span>
            <input
              defaultValue={match.referee}
              onBlur={(event) =>
                persist({ referee: event.target.value }, "Referee updated.")
              }
              className="admin-input"
            />
          </label>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:py-8">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={cx(
                "material-symbols-outlined mt-0.5 text-xl",
                saving
                  ? "admin-spin text-blue-600"
                  : dirty
                    ? "text-amber-500"
                    : "text-emerald-500",
              )}
            >
              {saving
                ? "progress_activity"
                : dirty
                  ? "edit_note"
                  : "cloud_done"}
            </span>
            <div>
              <p className="text-sm font-extrabold text-blue-950">
                {saving
                  ? "Saving score…"
                  : dirty
                    ? "Score changed · autosave in 5 seconds"
                    : message}
              </p>
              <p className="mt-0.5 text-xs text-blue-700/60">
                Large controls are designed for quick court-side input. You can
                still type an exact score.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              persist(
                { scoreSets: sets, score: scoreLabel(sets) },
                "Score saved manually.",
              )
            }
            disabled={!dirty || saving}
            className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-extrabold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save now
          </button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="neo-panel overflow-hidden bg-white">
            <div className="border-b-4 border-[#07142f] bg-[#246bfe] px-5 py-5 text-center text-white">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-200">
                {match.category}
              </p>
              <div className="mt-2 flex items-center justify-center gap-4">
                <span className="text-4xl font-black">{setWins.teamA}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-blue-100">
                  SETS
                </span>
                <span className="text-4xl font-black">{setWins.teamB}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 border-b border-slate-200">
              <div className="border-r border-slate-200 p-4 text-center sm:p-6">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-200">
                  A
                </span>
                <h1 className="mt-4 text-lg font-black leading-tight text-slate-950 sm:text-2xl">
                  {teamA.name}
                </h1>
                <p className="mt-1 text-xs text-slate-400">
                  {teamARecord?.id ?? "Team pending"}
                </p>
              </div>
              <div className="p-4 text-center sm:p-6">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500 text-xl font-black text-white shadow-lg shadow-cyan-200">
                  B
                </span>
                <h1 className="mt-4 text-lg font-black leading-tight text-slate-950 sm:text-2xl">
                  {teamB.name}
                </h1>
                <p className="mt-1 text-xs text-slate-400">
                  {teamBRecord?.id ?? "Team pending"}
                </p>
              </div>
            </div>
            <div className="space-y-4 p-4 sm:p-6">
              {sets.map((set, index) => (
                <div
                  key={String(index)}
                  className="admin-rise overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
                    <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">
                      Set {index + 1}
                    </p>
                    {sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSet(index)}
                        className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <span className="material-symbols-outlined text-base">
                          delete
                        </span>
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-slate-200">
                    <div className="p-3 sm:p-5">
                      <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateScore(index, "teamA", -1)}
                          className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-700 transition active:scale-90 hover:bg-blue-50"
                          aria-label={`Subtract one point from ${teamA.name}`}
                        >
                          <span className="material-symbols-outlined">
                            remove
                          </span>
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={set.teamA}
                          onChange={(event) =>
                            setExactScore(
                              index,
                              "teamA",
                              Number(event.target.value),
                            )
                          }
                          className="h-20 min-w-0 w-full rounded-2xl border-2 border-blue-100 bg-white text-center text-4xl font-black text-blue-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-24 sm:text-6xl"
                          aria-label={`${teamA.name} set ${String(index + 1)} score`}
                        />
                        <button
                          type="button"
                          onClick={() => updateScore(index, "teamA", 1)}
                          className="flex h-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200 transition active:scale-90 hover:bg-blue-700"
                          aria-label={`Add one point to ${teamA.name}`}
                        >
                          <span className="material-symbols-outlined">add</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-3 sm:p-5">
                      <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateScore(index, "teamB", -1)}
                          className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-cyan-700 transition active:scale-90 hover:bg-cyan-50"
                          aria-label={`Subtract one point from ${teamB.name}`}
                        >
                          <span className="material-symbols-outlined">
                            remove
                          </span>
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={set.teamB}
                          onChange={(event) =>
                            setExactScore(
                              index,
                              "teamB",
                              Number(event.target.value),
                            )
                          }
                          className="h-20 min-w-0 w-full rounded-2xl border-2 border-cyan-100 bg-white text-center text-4xl font-black text-cyan-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:h-24 sm:text-6xl"
                          aria-label={`${teamB.name} set ${String(index + 1)} score`}
                        />
                        <button
                          type="button"
                          onClick={() => updateScore(index, "teamB", 1)}
                          className="flex h-11 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-md shadow-cyan-200 transition active:scale-90 hover:bg-cyan-600"
                          aria-label={`Add one point to ${teamB.name}`}
                        >
                          <span className="material-symbols-outlined">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addSet}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 text-sm font-extrabold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50"
              >
                <span className="material-symbols-outlined">add_circle</span>Add
                another set
              </button>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
                Match actions
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-950">
                Control this court
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Status changes publish immediately to the public live view.
              </p>
              <div className="mt-5 space-y-2">
                {match.status === "scheduled" && (
                  <button
                    type="button"
                    onClick={startMatch}
                    disabled={!match.teamAId || !match.teamBId || saving}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined">
                      play_circle
                    </span>
                    Start match
                  </button>
                )}
                {match.status === "live" && (
                  <button
                    type="button"
                    onClick={() => setWinnerDialog(true)}
                    disabled={!match.teamAId || !match.teamBId || saving}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined">
                      emoji_events
                    </span>
                    Finish match
                  </button>
                )}
                {match.status === "completed" && (
                  <button
                    type="button"
                    onClick={() =>
                      persist(
                        { status: "live", winnerTeamId: null },
                        "Match reopened for score correction.",
                      )
                    }
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                  >
                    <span className="material-symbols-outlined">
                      edit_square
                    </span>
                    Reopen scoring
                  </button>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Score summary
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-blue-700">
                {scoreLabel(sets)}
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sets recorded</span>
                  <span className="font-black text-slate-800">
                    {sets.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Team A sets</span>
                  <span className="font-black text-blue-700">
                    {setWins.teamA}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Team B sets</span>
                  <span className="font-black text-cyan-700">
                    {setWins.teamB}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-[#071c4d] p-5 text-white">
              <span className="material-symbols-outlined text-blue-300">
                lightbulb
              </span>
              <p className="mt-3 text-sm font-black">Multi-court workflow</p>
              <p className="mt-2 text-xs leading-5 text-blue-100/70">
                Use the live-court links in the top bar to open another match in
                a new tab. Every tab autosaves independently.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {winnerDialog && (
        <div className="admin-modal fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="admin-dialog-enter w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_100px_rgba(15,23,42,0.4)]"
          >
            <div className="bg-[#071c4d] p-6 text-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-blue-950/30">
                <span className="material-symbols-outlined">emoji_events</span>
              </span>
              <h2 className="mt-4 text-2xl font-black">Choose the winner</h2>
              <p className="mt-2 text-sm text-blue-100/70">
                Final score: {scoreLabel(sets)}. Confirming completes this
                match.
              </p>
            </div>
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => match.teamAId && finishMatch(match.teamAId)}
                className="rounded-2xl border-2 border-blue-100 p-5 text-left transition hover:border-blue-500 hover:bg-blue-50"
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500">
                  Team A wins
                </span>
                <span className="mt-2 block text-lg font-black text-slate-950">
                  {teamA.name}
                </span>
                <span className="mt-2 block text-3xl font-black text-blue-700">
                  {setWins.teamA} sets
                </span>
              </button>
              <button
                type="button"
                onClick={() => match.teamBId && finishMatch(match.teamBId)}
                className="rounded-2xl border-2 border-cyan-100 p-5 text-left transition hover:border-cyan-500 hover:bg-cyan-50"
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-600">
                  Team B wins
                </span>
                <span className="mt-2 block text-lg font-black text-slate-950">
                  {teamB.name}
                </span>
                <span className="mt-2 block text-3xl font-black text-cyan-700">
                  {setWins.teamB} sets
                </span>
              </button>
              <button
                type="button"
                onClick={() => setWinnerDialog(false)}
                className="h-11 rounded-xl text-sm font-extrabold text-slate-500 transition hover:bg-slate-100 sm:col-span-2"
              >
                Back to scoring
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
