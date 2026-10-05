"use client";

import {
  ArrowRightIcon,
  BroadcastIcon,
  CheckCircleIcon,
  DiceFiveIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  TrashIcon,
  UserCheckIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type AppIcon, ScoreboardIcon } from "@/components/icons/SportIcons";
import type { AdminTournament } from "@/lib/adminTournaments";
import { useSession } from "@/lib/auth-client";
import {
  deleteTournament,
  listTournaments,
  type Tournament,
} from "@/lib/tuwagaApi";
import AiDirectorCopilot from "./AiDirectorCopilot";

type BadgeTone = "blue" | "green" | "magenta" | "red" | "neutral";

const badgeToneStyles: Record<BadgeTone, string> = {
  blue: "border-brand-200 bg-brand-50 text-brand-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  magenta: "border-cream-200 bg-cream-50 text-cream-800",
  red: "border-rose-200 bg-rose-50 text-rose-800",
  neutral: "border-ink-200 bg-ink-50 text-ink-700",
};

const statusMeta = {
  setup: { label: "Setup", icon: SlidersHorizontalIcon, tone: "blue" },
  registration: { label: "Registration", icon: UserCheckIcon, tone: "green" },
  live: { label: "Live", icon: BroadcastIcon, tone: "red" },
  completed: { label: "Completed", icon: CheckCircleIcon, tone: "neutral" },
} satisfies Record<
  AdminTournament["status"],
  { label: string; icon: AppIcon; tone: BadgeTone }
>;

function StatusBadge({
  label,
  icon: BadgeIcon,
  tone,
}: {
  label: string;
  icon: AppIcon;
  tone: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold uppercase tracking-wider ${badgeToneStyles[tone]}`}
    >
      <BadgeIcon className="text-[13px]" weight="bold" aria-hidden="true" />
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
    <article className="admin-rise group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ink-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-black tracking-tight text-ink-900">
                {tournament.name}
              </p>
            </div>
            <p className="mt-1 text-xs font-medium text-ink-500">
              {tournament.venue} · {tournament.date}
            </p>
          </div>
          <StatusBadge {...statusMeta[tournament.status]} />
        </div>
        <p className="mt-3 min-h-10 text-xs leading-relaxed text-ink-600">
          {tournament.description}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-ink-100 bg-ink-50 p-3">
            <p className="font-mono text-xl tabular-nums text-ink-950">
              {tournament.settings.maxPlayers}
            </p>
            <p className="eyebrow mt-0.5 text-[10px] text-ink-500">Max</p>
          </div>
          <div className="rounded-xl border border-ink-100 bg-ink-50 p-3">
            <p className="font-mono text-xl tabular-nums text-ink-950">
              {tournament.settings.courts}
            </p>
            <p className="eyebrow mt-0.5 text-[10px] text-ink-500">Courts</p>
          </div>
          <div className="rounded-xl border border-ink-100 bg-ink-50 p-3">
            <p className="font-mono text-xl tabular-nums text-ink-950">
              {tournament.settings.matchDuration}
            </p>
            <p className="eyebrow mt-0.5 text-[10px] text-ink-500">Mins</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-ink-100 pt-3">
          <Link
            href={`/admin/tournaments/${tournament.id}?section=registrations`}
            className="inline-flex items-center gap-1 rounded-lg border border-ink-200/80 bg-ink-50 px-2.5 py-1 text-[11px] font-bold text-ink-700 transition hover:border-ink-300 hover:bg-ink-100"
          >
            <UsersIcon
              className="text-[13px] text-ink-500"
              aria-hidden="true"
              weight="bold"
            />
            Tim & Kurasi
          </Link>
          <Link
            href={`/verification/${encodeURIComponent(tournament.id)}`}
            className="btn btn-sm btn-outline"
          >
            Verifikasi EO
          </Link>
          <Link
            href={`/admin/tournaments/${tournament.id}?section=technical-meeting`}
            className="inline-flex items-center gap-1 rounded-lg border border-cream-200/80 bg-cream-50/70 px-2.5 py-1 text-[11px] font-bold text-cream-700 transition hover:border-cream-300 hover:bg-cream-100"
          >
            <DiceFiveIcon
              className="text-[13px] text-cream-500"
              aria-hidden="true"
              weight="bold"
            />
            TM Drawing
          </Link>
          <Link
            href={`/admin/tournaments/${tournament.id}?section=operations`}
            className="inline-flex items-center gap-1 rounded-lg border border-ink-200/80 bg-ink-50 px-2.5 py-1 text-[11px] font-bold text-ink-700 transition hover:border-ink-300 hover:bg-ink-100"
          >
            <ScoreboardIcon
              className="text-[13px] text-ink-500"
              aria-hidden="true"
              weight="bold"
            />
            Jadwal & Skor
          </Link>
          <Link
            href={`/admin/tournaments/${tournament.id}?section=setup`}
            className="inline-flex items-center gap-1 rounded-lg border border-ink-200/80 bg-ink-50 px-2.5 py-1 text-[11px] font-bold text-ink-700 transition hover:border-ink-300 hover:bg-ink-100"
          >
            <SlidersHorizontalIcon
              className="text-[13px] text-ink-500"
              aria-hidden="true"
              weight="bold"
            />
            Pengaturan
          </Link>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Link
          href={`/admin/tournaments/${tournament.id}`}
          className="btn btn-dark flex-1"
        >
          Open control room
          <ArrowRightIcon
            className="text-lg"
            aria-hidden="true"
            weight="bold"
          />
        </Link>
        <button
          type="button"
          onClick={() => onRequestDelete(tournament)}
          disabled={deleting}
          aria-label={`Delete ${tournament.name}`}
          title="Delete"
          className="group relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-600/30 text-rose-600 transition-colors hover:bg-rose-600/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <TrashIcon className="text-lg" aria-hidden="true" weight="bold" />
          <span className="pointer-events-none absolute -top-9 right-0 rounded-md bg-ink-950 px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
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
  const { data: session } = useSession();
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
    <section className="container-wide py-8 md:py-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-600">
            Your workspace
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-ink-950 sm:text-3xl">
            Tournament command centers
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Resume operations or start a new tournament from a guided setup.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {session?.user?.role === "admin" && (
            <Link
              href="/admin/users"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-bold text-ink-700 shadow-sm transition hover:bg-ink-50"
            >
              <UsersIcon
                className="text-base"
                aria-hidden="true"
                weight="bold"
              />
              Crew & Roles
            </Link>
          )}
          <Link
            href="/admin/tournaments/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-extrabold text-ink-950 shadow-lg shadow-ink-950/10 transition hover:-translate-y-0.5 hover:bg-brand-400"
          >
            <PlusIcon className="text-lg" aria-hidden="true" weight="bold" />
            New tournament
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {loading &&
          ["loading-a", "loading-b", "loading-c"].map((key) => (
            <div
              key={key}
              className="h-64 animate-pulse rounded-lg border border-ink-300/30 bg-white"
            />
          ))}

        {!loading && error && (
          <div className="rounded-lg border border-rose-600/20 bg-rose-100 p-5 text-sm font-semibold text-rose-900 lg:col-span-3">
            {error}
          </div>
        )}

        {!loading && !error && tournaments.length === 0 && (
          <div className="rounded-lg border border-ink-300/30 bg-white p-5 text-sm font-semibold text-ink-600 lg:col-span-3">
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
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-rose-600/10 text-rose-600">
              <TrashIcon aria-hidden="true" weight="bold" />
            </div>
            <h3
              id="delete-tournament-title"
              className="text-xl font-extrabold text-ink-950"
            >
              Delete tournament?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              This will remove {deleteTarget.name}, including its registrations
              and matches.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget.id}
                className="h-10 rounded-lg border border-ink-300/50 px-4 text-sm font-bold text-ink-950 transition-colors hover:bg-ink-100 disabled:cursor-wait disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingId === deleteTarget.id}
                className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-bold text-white transition-colors hover:bg-rose-600/90 disabled:cursor-wait disabled:opacity-70"
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
