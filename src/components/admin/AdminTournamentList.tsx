"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminTournament } from "@/lib/adminTournaments";
import { listTournaments, type Tournament } from "@/lib/tuwagaApi";

type BadgeTone = "blue" | "green" | "magenta" | "red" | "neutral";

const badgeToneStyles: Record<BadgeTone, string> = {
  blue: "border-primary/20 bg-primary/8 text-primary",
  green: "border-secondary/20 bg-secondary/10 text-secondary",
  magenta: "border-tertiary/20 bg-tertiary/10 text-tertiary",
  red: "border-error/20 bg-error/10 text-error",
  neutral:
    "border-outline-variant/50 bg-surface-container-low text-on-surface-variant",
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
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold ${badgeToneStyles[tone]}`}
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
    },
  };
}

function TournamentCard({ tournament }: { tournament: AdminTournament }) {
  return (
    <Link
      href={`/admin/tournaments/${tournament.id}`}
      className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0px_18px_50px_rgba(17,24,39,0.1)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-extrabold text-on-surface">
              {tournament.name}
            </p>
          </div>
          <p className="mt-1 text-sm font-semibold text-on-surface-variant">
            {tournament.venue} - {tournament.date}
          </p>
        </div>
        <StatusBadge {...statusMeta[tournament.status]} />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
        {tournament.description}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-lg font-extrabold text-on-surface">
            {tournament.settings.maxPlayers}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Max
          </p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-lg font-extrabold text-on-surface">
            {tournament.settings.courts}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Courts
          </p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-lg font-extrabold text-on-surface">
            {tournament.settings.matchDuration}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Mins
          </p>
        </div>
      </div>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
        Open control room
        <span className="material-symbols-outlined text-lg">arrow_forward</span>
      </div>
    </Link>
  );
}

export default function AdminTournamentList() {
  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-8 md:px-10">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-on-surface">
            Tournament rooms
          </h2>
          <p className="text-sm text-on-surface-variant">
            Open an existing tournament or create a new control room draft.
          </p>
        </div>
        <Link
          href="/admin/tournaments/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New tournament
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
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
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
      </div>
    </section>
  );
}
