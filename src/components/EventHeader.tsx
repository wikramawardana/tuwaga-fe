import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import RadarArt from "@/components/landing/RadarArt";
import SportBadge from "@/components/SportBadge";
import type { Tournament } from "@/lib/tuwagaApi";

/**
 * Charcoal event band shared by the public live-score and bracket pages:
 * breadcrumb, sport + format chips, title, tournament switcher, and a slot
 * for page actions on the right.
 */
export default function EventHeader({
  section,
  tournament,
  title,
  subtitle,
  tournaments,
  onSwitch,
  switcherId,
  actions,
}: {
  section: string;
  tournament: Tournament | null;
  title: string;
  subtitle: string;
  tournaments: Tournament[];
  onSwitch: (slugOrId: string) => void;
  switcherId: string;
  actions?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 text-cream-100">
      <div className="texture-grain pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="pointer-events-none absolute -right-72 -top-64 -z-10 w-[50rem] opacity-50 max-md:hidden">
        <RadarArt className="h-auto w-full" showCourts={false} />
      </div>

      <div className="container-page pb-10 pt-10 md:pb-12 md:pt-12">
        <nav
          aria-label="Breadcrumb"
          className="eyebrow flex items-center gap-2 text-[10px] text-cream-100/45"
        >
          <Link href="/" className="transition-colors hover:text-cream-50">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-cream-100/80" aria-current="page">
            {section}
          </span>
        </nav>

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1">
            {tournament && (
              <div className="flex flex-wrap items-center gap-2">
                <SportBadge sport={tournament.settings?.sport} tone="dark" />
                {tournament.settings?.format && (
                  <span className="inline-flex h-7 items-center rounded-full border border-cream-200/15 px-2.5 text-xs text-cream-100/65">
                    {tournament.settings.format}
                  </span>
                )}
              </div>
            )}

            <h1 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-cream-50">
              {title}
            </h1>
            <p className="mt-3 text-sm text-cream-100/60">{subtitle}</p>

            {tournaments.length > 1 && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <label
                  htmlFor={switcherId}
                  className="eyebrow text-[10px] text-cream-100/45"
                >
                  Switch tournament
                </label>
                <span className="relative">
                  <select
                    id={switcherId}
                    value={tournament?.slug || tournament?.id || ""}
                    onChange={(event) => onSwitch(event.target.value)}
                    className="h-9 max-w-[18rem] appearance-none truncate rounded-lg border border-cream-200/15 bg-ink-900 pl-3 pr-9 text-xs font-semibold text-cream-50 transition hover:border-cream-200/30 focus:border-brand-500 focus:outline-none"
                  >
                    {tournaments.map((t) => (
                      <option key={t.id} value={t.slug || t.id}>
                        {t.name} ({t.dateLabel})
                      </option>
                    ))}
                  </select>
                  <CaretDownIcon
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cream-100/50"
                    weight="bold"
                    aria-hidden="true"
                  />
                </span>
              </div>
            )}
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-3">{actions}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
