"use client";

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { sportMeta } from "@/components/SportBadge";
import { divisionTag, primaryAction } from "@/lib/featuredTournament";
import { useFeaturedTournament } from "./FeaturedTournamentContext";
import Reveal from "./Reveal";

/** Cream band under the hero: the featured tournament's divisions. */
export default function TournamentDetails() {
  const { tournament, loading } = useFeaturedTournament();

  if (!tournament) {
    if (!loading) return null;
    return (
      <section aria-hidden="true" className="bg-cream-200">
        <div className="container-page grid animate-pulse gap-10 py-16 md:py-24 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <div className="h-3 w-40 rounded bg-ink-950/10" />
            <div className="h-14 w-3/4 rounded-lg bg-ink-950/10" />
            <div className="h-4 w-2/3 rounded bg-ink-950/10" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-36 rounded-2xl bg-ink-950/10" />
            <div className="h-36 rounded-2xl bg-ink-950/10" />
          </div>
        </div>
      </section>
    );
  }

  const sport = sportMeta(tournament.settings?.sport);
  const SportIcon = sport.icon;
  const action = primaryAction(tournament);
  const categories = tournament.settings?.categories ?? [];
  const teamSize = tournament.settings?.teamSize;
  const format = tournament.settings?.format;

  return (
    <section
      aria-labelledby="featured-divisions"
      className="relative overflow-hidden bg-cream-200 text-ink-950"
    >
      <div className="texture-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />

      <div className="container-page relative grid gap-12 py-16 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow flex items-center gap-2 text-ink-950/60">
            <SportIcon className="text-sm" weight="bold" aria-hidden="true" />
            {tournament.name} · Kategori
          </p>
          <h2
            id="featured-divisions"
            className="mt-5 text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[0.95] tracking-[-0.035em]"
          >
            Pilih divisimu.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-950/70">
            {categories.length} divisi dibuka
            {format ? ` dengan format ${format.toLowerCase()}` : ""}
            {teamSize ? `, dimainkan ${teamSize.toLowerCase()}` : ""}. Satu akun
            untuk mendaftar, mengunggah bukti bayar, dan memantau status tim
            hingga jadwal rilis.
          </p>

          <div className="cta-row mt-9">
            <Link href={action.href} className="btn btn-lg btn-primary">
              {action.label}
              <ArrowRightIcon weight="bold" aria-hidden="true" />
            </Link>
            <Link
              href={`/tournaments/${tournament.slug}`}
              className="btn btn-lg btn-outline-ink"
            >
              Portal & Cek Status
            </Link>
            <Link
              href={`/tournaments/bracket?tournament=${tournament.slug}`}
              className="link-arrow text-ink-950/75 hover:text-ink-950"
            >
              Bagan & Hasil
              <ArrowRightIcon weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {categories.map((category, index) => (
              <li
                key={category}
                className="flex min-h-32 flex-col justify-between gap-6 rounded-2xl border border-ink-950/10 bg-cream-50/70 p-4 sm:min-h-36 sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-ink-950/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="eyebrow rounded-full border border-ink-950/10 px-2 py-0.5 text-[10px] text-ink-950/60">
                    {divisionTag(category)}
                  </span>
                </div>
                <div>
                  <p className="text-base font-semibold leading-tight tracking-tight sm:text-xl">
                    {category}
                  </p>
                  {teamSize && (
                    <p className="mt-1 text-xs text-ink-950/55 sm:text-sm">
                      {teamSize}
                    </p>
                  )}
                </div>
              </li>
            ))}
            {categories.length % 2 === 1 && (
              <li>
                <Link
                  href={`/tournaments/${tournament.slug}?tab=categories`}
                  className="group flex h-full min-h-32 flex-col justify-between gap-6 rounded-2xl bg-ink-950 p-4 text-cream-100 transition-colors hover:bg-ink-900 sm:min-h-36 sm:p-5"
                >
                  <span className="flex items-center justify-between">
                    <span className="eyebrow text-[10px] text-cream-100/50">
                      Kuota & syarat
                    </span>
                    <ArrowUpRightIcon
                      className="text-cream-100/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      weight="bold"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-base font-semibold leading-tight tracking-tight text-cream-50 sm:text-xl">
                    Cek kuota & syarat kualifikasi
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
