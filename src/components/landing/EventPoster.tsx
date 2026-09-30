"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import SportBadge from "@/components/SportBadge";
import {
  formatFee,
  posterDate,
  statusCopy,
  tournamentEnd,
  tournamentStart,
} from "@/lib/featuredTournament";
import { useFeaturedTournament } from "./FeaturedTournamentContext";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Ticks once a second after mount; null during SSR so markup hydrates cleanly. */
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), SECOND);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function Countdown({ target, now }: { target: number; now: number | null }) {
  const remaining = now === null ? null : Math.max(0, target - now);
  const cells = [
    {
      label: "Hari",
      value: remaining === null ? null : Math.floor(remaining / DAY),
    },
    {
      label: "Jam",
      value: remaining === null ? null : Math.floor(remaining / HOUR) % 24,
    },
    {
      label: "Menit",
      value: remaining === null ? null : Math.floor(remaining / MINUTE) % 60,
    },
    {
      label: "Detik",
      value: remaining === null ? null : Math.floor(remaining / SECOND) % 60,
    },
  ];

  return (
    <div>
      <p className="eyebrow text-[10px] text-cream-100/45">Mulai dalam</p>
      <div
        className="mt-2.5 grid grid-cols-4 gap-2"
        role="timer"
        aria-live="off"
      >
        {cells.map((cell, index) => (
          <div
            key={cell.label}
            className="rounded-xl border border-cream-200/10 bg-ink-950/60 px-1 py-3 text-center"
          >
            <span
              className={`block font-mono text-3xl leading-none tabular-nums sm:text-[2.5rem] ${
                index === 0 ? "text-brand-500" : "text-cream-50"
              }`}
            >
              {cell.value === null ? "--" : String(cell.value).padStart(2, "0")}
            </span>
            <span className="eyebrow mt-2 block text-[9px] text-cream-100/45">
              {cell.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-3xl border border-cream-200/10 bg-ink-900/70 text-center backdrop-blur-md">
      <Image
        src="/tuwaga-logo-cream.png"
        alt="TUWAGA SKOR"
        width={255}
        height={60}
        unoptimized
        className="h-[60px] w-auto"
      />
      <p className="eyebrow mt-5 text-brand-500">Control the Game</p>
    </div>
  );
}

/** Hero visual: the featured tournament as an event poster. */
export default function EventPoster() {
  const { tournament, loading } = useFeaturedTournament();
  const now = useNow();

  if (loading) {
    return (
      <div className="aspect-[4/5] w-full animate-pulse rounded-3xl border border-cream-200/10 bg-ink-900/60" />
    );
  }
  if (!tournament) return <BrandPanel />;

  const status = statusCopy[tournament.status] ?? statusCopy.setup;
  const date = posterDate(tournament);
  const start = tournamentStart(tournament)?.getTime() ?? null;
  const end = tournamentEnd(tournament)?.getTime() ?? null;
  const isUpcoming =
    tournament.status !== "completed" &&
    start !== null &&
    (now === null || now < start);
  const isUnderway =
    tournament.status === "live" ||
    (tournament.status !== "completed" &&
      start !== null &&
      end !== null &&
      now !== null &&
      now >= start &&
      now <= end);
  const categories = tournament.settings?.categories ?? [];
  const fee =
    tournament.entryFeePerPair || tournament.settings?.entryFeePerPair;

  const facts = [
    { label: "Divisi", value: String(categories.length).padStart(2, "0") },
    { label: "Format", value: tournament.settings?.teamSize || "—" },
    {
      label: "Biaya / tim",
      value: fee ? formatFee(fee, tournament.currency) : "—",
    },
  ];

  return (
    <Link
      href={`/tournaments/${tournament.slug}`}
      aria-label={`${tournament.name}: lihat detail turnamen`}
      className="group relative block overflow-hidden rounded-3xl border border-cream-200/15 bg-ink-900/85 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cream-200/30"
    >
      <div className="texture-halftone pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_100%_0%,black,transparent_55%)]" />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="eyebrow flex items-center gap-2.5 text-cream-100">
            {status.live ? (
              <span className="live-dot" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-cream-200/30" />
            )}
            {isUnderway ? "Sedang berlangsung" : status.label}
          </span>
          <SportBadge sport={tournament.settings?.sport} tone="dark" />
        </div>

        <p className="eyebrow mt-10 text-[10px] text-cream-100/45">
          {tournament.status === "completed"
            ? "Turnamen terakhir"
            : "Upcoming tournament"}
        </p>
        <h2 className="mt-3 text-[clamp(2.5rem,4.6vw,4rem)] font-semibold uppercase leading-[0.9] tracking-[-0.04em] text-cream-50">
          {tournament.name}
        </h2>

        {date && (
          <div className="mt-8 flex items-end gap-4 border-t border-cream-200/10 pt-6">
            <span className="font-mono text-[clamp(2.75rem,5vw,3.75rem)] leading-none tabular-nums text-brand-500">
              {date.days}
            </span>
            <span className="min-w-0 pb-1 text-sm leading-snug text-cream-100/65">
              <span className="block font-semibold uppercase tracking-wide text-cream-50">
                {date.label}
              </span>
              <span className="block truncate">{tournament.venue}</span>
            </span>
          </div>
        )}

        {isUpcoming && start !== null && (
          <div className="mt-7">
            <Countdown target={start} now={now} />
          </div>
        )}

        <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-cream-200/10 pt-5">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="eyebrow text-[9px] text-cream-100/45">
                {fact.label}
              </dt>
              <dd className="mt-1.5 truncate text-sm font-semibold text-cream-50">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative flex items-center justify-between gap-4 border-t border-cream-200/10 bg-ink-950/40 px-6 py-4 sm:px-8">
        <span className="flex items-center gap-3 text-xs text-cream-100/50">
          Live scoring & bagan oleh
          <Image
            src="/tuwaga-logo-cream.png"
            alt="TUWAGA SKOR"
            width={85}
            height={20}
            unoptimized
            className="h-5 w-auto"
          />
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cream-200/15 text-cream-100 transition-colors group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-ink-950">
          <ArrowUpRightIcon weight="bold" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
