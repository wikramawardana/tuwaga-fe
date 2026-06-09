"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AdminTournament } from "@/lib/adminTournaments";
import { adminTournaments } from "@/lib/adminTournaments";

const storageKey = "tuwaga-admin-tournaments";

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

function readStoredTournaments(): AdminTournament[] {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];

    return JSON.parse(stored) as AdminTournament[];
  } catch {
    return [];
  }
}

function TournamentCard({
  tournament,
  isDraft = false,
}: {
  tournament: AdminTournament;
  isDraft?: boolean;
}) {
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
            {isDraft && (
              <StatusBadge
                icon="edit_note"
                label="Local draft"
                tone="magenta"
              />
            )}
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
  const [storedTournaments, setStoredTournaments] = useState<AdminTournament[]>(
    [],
  );

  useEffect(() => {
    setStoredTournaments(readStoredTournaments());
  }, []);

  const tournaments = useMemo(
    () => [
      ...adminTournaments.map((tournament) => ({
        tournament,
        isDraft: false,
      })),
      ...storedTournaments.map((tournament) => ({
        tournament,
        isDraft: true,
      })),
    ],
    [storedTournaments],
  );

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
        {tournaments.map(({ tournament, isDraft }) => (
          <TournamentCard
            key={tournament.id}
            tournament={tournament}
            isDraft={isDraft}
          />
        ))}
      </div>
    </section>
  );
}
