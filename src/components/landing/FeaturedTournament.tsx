import {
  ArrowRightIcon,
  CalendarDotsIcon,
  MapPinIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { sportMeta } from "@/components/SportBadge";
import type { Tournament } from "@/lib/tuwagaApi";

const statusCopy: Record<
  Tournament["status"],
  { label: string; live: boolean }
> = {
  registration: { label: "Pendaftaran dibuka", live: true },
  live: { label: "Sedang berlangsung", live: true },
  setup: { label: "Segera dibuka", live: false },
  completed: { label: "Turnamen selesai", live: false },
};

function formatFee(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency || "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("id-ID")}`;
  }
}

function primaryAction(tournament: Tournament) {
  const slug = tournament.slug;
  switch (tournament.status) {
    case "registration":
      return {
        label: "Daftar Tim Sekarang",
        href: `/tournaments/${slug}/register`,
      };
    case "live":
      return {
        label: "Lihat Live Score",
        href: `/tournaments/live?tournament=${slug}`,
      };
    case "completed":
      return {
        label: "Lihat Hasil",
        href: `/tournaments/bracket?tournament=${slug}`,
      };
    default:
      return { label: "Buka Portal Turnamen", href: `/tournaments/${slug}` };
  }
}

export function FeaturedTournamentSkeleton() {
  return (
    <div className="container-page grid animate-pulse gap-10 py-16 md:py-20 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-5">
        <div className="h-3 w-40 rounded bg-ink-950/10" />
        <div className="h-14 w-4/5 rounded-lg bg-ink-950/10" />
        <div className="h-4 w-3/5 rounded bg-ink-950/10" />
        <div className="flex gap-3 pt-4">
          <div className="h-11 w-44 rounded-[10px] bg-ink-950/10" />
          <div className="h-11 w-40 rounded-[10px] bg-ink-950/10" />
        </div>
      </div>
      <div className="h-64 rounded-2xl bg-ink-950/10" />
    </div>
  );
}

export default function FeaturedTournament({
  tournament,
}: {
  tournament: Tournament;
}) {
  const status = statusCopy[tournament.status] ?? statusCopy.setup;
  const sport = sportMeta(tournament.settings?.sport);
  const SportIcon = sport.icon;
  const action = primaryAction(tournament);
  const categories = tournament.settings?.categories ?? [];
  const fee =
    tournament.entryFeePerPair || tournament.settings?.entryFeePerPair;

  const facts = [
    { label: "Format", value: tournament.settings?.format },
    { label: "Tim", value: tournament.settings?.teamSize },
    {
      label: "Lapangan",
      value: tournament.settings?.courts
        ? `${tournament.settings.courts} court`
        : undefined,
    },
    {
      label: "Biaya",
      value: fee ? `${formatFee(fee, tournament.currency)} / tim` : undefined,
    },
  ].filter((fact): fact is { label: string; value: string } =>
    Boolean(fact.value),
  );

  return (
    <div className="container-page grid items-center gap-10 py-16 md:py-20 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
      <div>
        <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-2 text-ink-950/70">
          <span className="inline-flex items-center gap-2">
            {status.live ? (
              <span className="live-dot" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-ink-950/30" />
            )}
            {status.label}
          </span>
          <span className="h-3 w-px bg-ink-950/20" />
          <span className="inline-flex items-center gap-1.5">
            <SportIcon className="text-sm" weight="bold" aria-hidden="true" />
            {sport.label}
          </span>
        </p>

        <h2 className="mt-5 text-[clamp(2.25rem,5.5vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-ink-950">
          {tournament.name}
        </h2>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-950/75">
          <span className="inline-flex items-center gap-2">
            <CalendarDotsIcon
              className="text-base"
              weight="bold"
              aria-hidden="true"
            />
            {tournament.dateLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPinIcon
              className="text-base"
              weight="bold"
              aria-hidden="true"
            />
            {tournament.venue}
          </span>
        </div>

        {categories.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Kategori">
            {categories.map((category) => (
              <li
                key={category}
                className="rounded-full border border-ink-950/15 bg-cream-50/60 px-3 py-1 text-xs font-medium text-ink-900"
              >
                {category}
              </li>
            ))}
          </ul>
        )}

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
      </div>

      <aside className="relative overflow-hidden rounded-2xl bg-ink-950 text-cream-100 shadow-[0_30px_80px_-30px_rgba(23,23,23,0.6)]">
        <div className="texture-halftone pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_100%_0%,black,transparent_70%)]" />
        <div className="relative flex items-center justify-between px-6 pb-5 pt-6">
          <span className="eyebrow text-cream-100/50">Match pass</span>
          <SportIcon
            className="text-2xl text-brand-500"
            weight="duotone"
            aria-hidden="true"
          />
        </div>
        <div className="relative border-t border-dashed border-cream-200/15">
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-cream-200" />
          <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-cream-200" />
        </div>
        <dl className="relative grid grid-cols-2 gap-x-6 gap-y-5 px-6 pb-7 pt-6">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="eyebrow text-[10px] text-cream-100/45">
                {fact.label}
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-cream-50">
                {fact.value}
              </dd>
            </div>
          ))}
          <div className="col-span-2 min-w-0">
            <dt className="eyebrow text-[10px] text-cream-100/45">Kategori</dt>
            <dd className="mt-1.5 font-mono text-3xl tabular-nums text-brand-500">
              {String(categories.length).padStart(2, "0")}
              <span className="ml-2 font-sans text-sm text-cream-100/60">
                divisi dibuka
              </span>
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
