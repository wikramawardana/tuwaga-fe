"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminTournament } from "@/lib/adminTournaments";
import {
  deleteTournament,
  listTournaments,
  type Tournament,
} from "@/lib/tuwagaApi";
import AiDirectorCopilot from "./AiDirectorCopilot";

type BadgeTone = "blue" | "green" | "magenta" | "red" | "neutral";

const badgeToneStyles: Record<BadgeTone, string> = {
  blue: "border-[#07142f] bg-blue-100 text-blue-800",
  green: "border-[#07142f] bg-emerald-200 text-emerald-950",
  magenta: "border-[#07142f] bg-fuchsia-200 text-fuchsia-950",
  red: "border-[#07142f] bg-rose-200 text-rose-950",
  neutral: "border-[#07142f] bg-slate-200 text-slate-950",
};

const statusMeta = {
  setup: { label: "Setup", icon: "tune", tone: "blue" },
  registration: { label: "Registration", icon: "how_to_reg", tone: "green" },
  live: { label: "Live", icon: "sensors", tone: "red" },
  completed: { label: "Completed", icon: "check_circle", tone: "neutral" },
} satisfies Record<
  AdminTournament["status"],
  { label: string; icon: string; tone: BadgeTone }
>;

function StatusBadge({
  label,
  icon,
  tone,
}: {
  label: string;
  icon: string;
  tone: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded border-2 px-2.5 text-xs font-black uppercase shadow-[2px_2px_0_#07142f] ${badgeToneStyles[tone]}`}
    >
      <span className="material-symbols-outlined text-[15px]">{icon}</span>
      {label}
    </span>
  );
}

function toAdminTournament(tournament: Tournament): AdminTournament {
  return {
    id: tournament.id,
    name: tournament.name,
    venue: tournament.venue,
    date: tournament.dateLabel,
    status: tournament.status,
    description: tournament.description,
    settings: {
      maxPlayers: tournament.settings.maxPlayers,
      waitlistLimit: tournament.settings.waitlistLimit,
      courts: tournament.settings.courts,
      matchDuration: tournament.settings.matchDuration,
      teamSize: tournament.settings.teamSize,
      format: tournament.settings.format,
      groupSize: tournament.settings.groupSize,
      qualifierCount: tournament.settings.qualifierCount,
      status: tournament.status,
      categories: tournament.settings.categories ?? [],
    },
  };
}

function TournamentCard({
  tournament,
  deleting,
  onRequestDelete,
}: {
  tournament: AdminTournament;
  deleting: boolean;
  onRequestDelete: (tournament: AdminTournament) => void;
}) {
  return (
    <article className="neo-panel admin-rise group relative overflow-hidden bg-white p-5 transition-all duration-200 hover:-translate-y-1">
      <div className="absolute inset-x-0 top-0 h-2 border-b-2 border-[#07142f] bg-cyan-300" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-black tracking-tight text-slate-950">
              {tournament.name}
            </p>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {tournament.venue} · {tournament.date}
          </p>
        </div>
        <StatusBadge {...statusMeta[tournament.status]} />
      </div>
      <p className="mt-4 min-h-12 text-sm leading-relaxed text-slate-500">
        {tournament.description}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded border-2 border-[#07142f] bg-blue-100 p-3">
          <p className="text-lg font-black text-blue-800">
            {tournament.settings.maxPlayers}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Max
          </p>
        </div>
        <div className="rounded border-2 border-[#07142f] bg-cyan-100 p-3">
          <p className="text-lg font-black text-blue-800">
            {tournament.settings.courts}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Courts
          </p>
        </div>
        <div className="rounded border-2 border-[#07142f] bg-yellow-100 p-3">
          <p className="text-lg font-black text-blue-800">
            {tournament.settings.matchDuration}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Mins
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Link
          href={`/admin/tournaments/${tournament.id}`}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black uppercase text-white hover:bg-blue-700"
        >
          Open control room
          <span className="material-symbols-outlined text-lg">
            arrow_forward
          </span>
        </Link>
        <button
          type="button"
          onClick={() => onRequestDelete(tournament)}
          disabled={deleting}
          aria-label={`Delete ${tournament.name}`}
          title="Delete"
          className="group relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-error/30 text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
          <span className="pointer-events-none absolute -top-9 right-0 rounded-md bg-on-surface px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {deleting ? "Deleting..." : "Delete"}
          </span>
        </button>
      </div>
      <Link href={`/admin/tournaments/${tournament.id}`} className="sr-only">
        Open control room
      </Link>
    </article>
  );
}

export default function AdminTournamentList() {
  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminTournament | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    listTournaments()
      .then((items) => {
        if (!active) return;
        setTournaments(items.map(toAdminTournament));
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to load tournaments.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    setError("");

    try {
      await deleteTournament(deleteTarget.id);
      setTournaments((items) =>
        items.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete tournament.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 md:py-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="neo-sticker rotate-1">Your workspace</p>
          <h2 className="neo-title mt-4 text-3xl font-black text-slate-950">
            Tournament command centers
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Resume operations or start a new tournament from a guided setup.
          </p>
        </div>
        <Link
          href="/admin/tournaments/new"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black uppercase text-white hover:bg-blue-700"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New tournament
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {loading &&
          ["loading-a", "loading-b", "loading-c"].map((key) => (
            <div
              key={key}
              className="h-64 animate-pulse rounded-lg border border-outline-variant/30 bg-white"
            />
          ))}

        {!loading && error && (
          <div className="rounded-lg border border-error/20 bg-error-container p-5 text-sm font-semibold text-on-error-container lg:col-span-3">
            {error}
          </div>
        )}

        {!loading && !error && tournaments.length === 0 && (
          <div className="rounded-lg border border-outline-variant/30 bg-white p-5 text-sm font-semibold text-on-surface-variant lg:col-span-3">
            No tournaments found. Create the first control room.
          </div>
        )}

        {!loading &&
          !error &&
          tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              deleting={deletingId === tournament.id}
              onRequestDelete={setDeleteTarget}
            />
          ))}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-inverse-surface/45 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-tournament-title"
            className="w-full max-w-md bg-white p-6"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-error/10 text-error">
              <span className="material-symbols-outlined">delete</span>
            </div>
            <h3
              id="delete-tournament-title"
              className="text-xl font-extrabold text-on-surface"
            >
              Delete tournament?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              This will remove {deleteTarget.name}, including its registrations
              and matches.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget.id}
                className="h-10 rounded-lg border border-outline-variant/50 px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-wait disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingId === deleteTarget.id}
                className="h-10 rounded-lg bg-error px-4 text-sm font-bold text-on-error transition-colors hover:bg-error/90 disabled:cursor-wait disabled:opacity-70"
              >
                {deletingId === deleteTarget.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AiDirectorCopilot />
    </section>
  );
}
