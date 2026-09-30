"use client";

import {
  ArrowRightIcon,
  CalendarDotsIcon,
  PingPongIcon,
  RacquetIcon,
  SealCheckIcon,
  ShuffleIcon,
  TelevisionIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import {
  type AppIcon,
  PadelRacketIcon,
  ShuttlecockIcon,
} from "@/components/icons/SportIcons";
import FeaturedTournament, {
  FeaturedTournamentSkeleton,
} from "@/components/landing/FeaturedTournament";
import HeroConsole from "@/components/landing/HeroConsole";
import RadarArt from "@/components/landing/RadarArt";
import Reveal from "@/components/landing/Reveal";
import {
  BracketVisual,
  LiveBoardVisual,
  RefereeVisual,
} from "@/components/landing/StepVisuals";
import Navbar from "@/components/Navbar";
import { SUPPORT_URL } from "@/lib/site";
import { listTournaments, type Tournament } from "@/lib/tuwagaApi";

// ─── Content ──────────────────────────────────────────────────────────────

const steps: {
  step: string;
  title: string;
  description: string;
  visual: ReactNode;
}[] = [
  {
    step: "01",
    title: "Referee scoring",
    description:
      "Court officials get a focused scoring surface for points, sets, match status, and match flow.",
    visual: <RefereeVisual />,
  },
  {
    step: "02",
    title: "Live scoreboards",
    description:
      "Every point is published in real time, so organizers, players, and spectators share one source of truth.",
    visual: <LiveBoardVisual />,
  },
  {
    step: "03",
    title: "Bracket tracking",
    description:
      "Winners advance automatically, from group standings to the final, without manual recaps.",
    visual: <BracketVisual />,
  },
];

const capabilities: { icon: AppIcon; title: string; description: string }[] = [
  {
    icon: CalendarDotsIcon,
    title: "Order of play",
    description:
      "Plan sessions court by court and keep every division on schedule.",
  },
  {
    icon: TelevisionIcon,
    title: "Venue display",
    description:
      "Rotate standings, schedules, and brackets on the big screen automatically.",
  },
  {
    icon: SealCheckIcon,
    title: "Team registration",
    description:
      "Teams sign up online, upload proof of payment, and track their approval.",
  },
  {
    icon: ShuffleIcon,
    title: "Transparent draws",
    description:
      "Run the technical-meeting draw live, with results everyone can verify.",
  },
];

const tickerItems: { label: string; icon?: AppIcon }[] = [
  { label: "Padel", icon: PadelRacketIcon },
  { label: "Live scoring" },
  { label: "Tennis", icon: RacquetIcon },
  { label: "Order of play" },
  { label: "Badminton", icon: ShuttlecockIcon },
  { label: "Knockout brackets" },
  { label: "Table tennis", icon: PingPongIcon },
  { label: "Venue display" },
];

const statusPriority: Record<string, number> = {
  live: 4,
  registration: 3,
  setup: 2,
  completed: 1,
};

function pickFeatured(tournaments: Tournament[]) {
  return (
    [...tournaments].sort(
      (a, b) =>
        (statusPriority[b.status] ?? 0) - (statusPriority[a.status] ?? 0),
    )[0] ?? null
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [featured, setFeatured] = useState<Tournament | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    let active = true;
    listTournaments()
      .then((tournaments) => {
        if (active) setFeatured(pickFeatured(tournaments));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingFeatured(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden bg-ink-950 pt-16 text-cream-100">
          <div className="texture-grain pointer-events-none absolute inset-0 -z-10 opacity-60" />
          <div className="pointer-events-none absolute -bottom-40 right-0 -z-10 h-96 w-[40rem] rounded-full bg-brand-500/10 blur-3xl" />

          <div className="container-page grid items-center gap-16 pb-24 pt-16 md:pb-28 md:pt-24 lg:min-h-[720px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-32">
            <div className="relative">
              <p className="eyebrow hero-reveal hero-reveal-1 flex items-center gap-2.5 text-cream-100/60">
                <span className="h-1.5 w-1.5 bg-brand-500" />
                Tuwaga Skor — Tournament operations
              </p>

              <h1 className="hero-reveal hero-reveal-2 mt-7 text-[clamp(3.25rem,9vw,6.75rem)] font-medium leading-[0.9] tracking-[-0.05em] text-cream-50">
                Control
                <br />
                the game<span className="text-brand-500">.</span>
              </h1>

              <p className="hero-reveal hero-reveal-3 mt-7 max-w-md text-base leading-relaxed text-cream-100/65 md:text-lg">
                Live scoring, brackets, order of play, and referee tools. One
                control room for every court, from first serve to final point.
              </p>

              <div className="cta-row hero-reveal hero-reveal-4 mt-10">
                <Link
                  href="/tournaments/live"
                  className="btn btn-lg btn-primary"
                >
                  Watch live scores
                  <ArrowRightIcon weight="bold" aria-hidden="true" />
                </Link>
                <Link
                  href="/tournaments/bracket"
                  className="btn btn-lg btn-outline-dark"
                >
                  Explore brackets
                </Link>
              </div>

              <p className="hero-reveal hero-reveal-4 mt-6 text-sm text-cream-100/50">
                Running a tournament?{" "}
                <Link
                  href="/login?callbackUrl=/admin"
                  className="font-medium text-cream-100 underline decoration-cream-200/30 underline-offset-4 transition hover:decoration-brand-500"
                >
                  Sign in to the organizer workspace
                </Link>
              </p>
            </div>

            <div className="relative lg:pl-6">
              <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[56rem] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-90 max-md:w-[40rem] max-md:opacity-60 max-md:[&_text]:hidden">
                <RadarArt className="h-auto w-full" />
              </div>
              <div className="animate-hero-card">
                <HeroConsole />
              </div>
            </div>
          </div>
        </section>

        {/* ── Featured tournament (live data) ──────────────────────── */}
        {(loadingFeatured || featured) && (
          <section
            aria-label="Featured tournament"
            className="relative overflow-hidden bg-cream-200 text-ink-950"
          >
            <div className="texture-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
            <div className="relative">
              {featured ? (
                <Reveal>
                  <FeaturedTournament tournament={featured} />
                </Reveal>
              ) : (
                <FeaturedTournamentSkeleton />
              )}
            </div>
          </section>
        )}

        {/* ── Ticker ───────────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          className="overflow-hidden border-y border-cream-200/10 bg-ink-950 py-5 text-cream-100"
        >
          <div className="marquee-track flex w-max items-center">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center">
                {tickerItems.map(({ label, icon: Icon }) => (
                  <span
                    key={`${copy}-${label}`}
                    className="flex items-center gap-3 px-7 text-sm font-medium tracking-tight text-cream-100/70"
                  >
                    {Icon ? (
                      <Icon
                        className="text-xl text-brand-500"
                        weight="duotone"
                      />
                    ) : (
                      <span className="h-1.5 w-1.5 rotate-45 bg-cream-200/30" />
                    )}
                    {label}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── How it works ─────────────────────────────────────────── */}
        <section className="bg-canvas py-20 md:py-28">
          <div className="container-page">
            <Reveal className="grid items-end gap-6 md:grid-cols-2">
              <div>
                <p className="eyebrow text-brand-600">How it works</p>
                <h2 className="mt-4 max-w-lg text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1] tracking-[-0.035em] text-ink-950">
                  Built for tournament operations.
                </h2>
              </div>
              <p className="max-w-md text-base leading-relaxed text-ink-600 md:justify-self-end">
                Referees score from the court, spectators follow every point,
                and brackets advance on their own. No spreadsheets, no manual
                recaps.
              </p>
            </Reveal>

            <ol className="mt-14 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.step}>
                  <Reveal delay={index * 90} className="h-full">
                    <article className="motion-card flex h-full flex-col rounded-2xl border border-ink-200 bg-white p-2">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-950">
                        <div className="texture-halftone pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
                        <div className="relative h-full">{step.visual}</div>
                      </div>
                      <div className="flex flex-1 flex-col px-4 pb-5 pt-5">
                        <span className="eyebrow text-ink-400">
                          Step {step.step}
                        </span>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink-950">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-600">
                          {step.description}
                        </p>
                      </div>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ol>

            <Reveal className="mt-20 grid gap-10 border-t border-ink-200 pt-12 lg:grid-cols-[0.8fr_2fr]">
              <div>
                <p className="eyebrow text-brand-600">Match day, covered</p>
                <p className="mt-4 max-w-xs text-2xl font-semibold leading-tight tracking-tight text-ink-950">
                  Everything the tournament desk needs, in one place.
                </p>
              </div>
              <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
                {capabilities.map(({ icon: Icon, title, description }) => (
                  <li key={title}>
                    <Icon
                      className="text-3xl text-brand-500"
                      weight="duotone"
                      aria-hidden="true"
                    />
                    <h3 className="mt-4 text-base font-semibold text-ink-950">
                      {title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                      {description}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ── Call to action ───────────────────────────────────────── */}
        <section className="bg-canvas pb-20 md:pb-28">
          <div className="container-page">
            <Reveal>
              <div className="relative isolate overflow-hidden rounded-3xl bg-brand-500 px-6 py-14 text-ink-950 sm:px-10 md:px-14 md:py-20">
                <svg
                  viewBox="0 0 400 400"
                  fill="none"
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-24 top-1/2 -z-10 w-[34rem] -translate-y-1/2 max-md:opacity-50"
                >
                  {[40, 80, 120, 160, 196].map((r) => (
                    <circle
                      key={r}
                      cx="200"
                      cy="200"
                      r={r}
                      stroke="#171717"
                      strokeOpacity="0.14"
                    />
                  ))}
                  <line
                    x1="0"
                    y1="200"
                    x2="400"
                    y2="200"
                    stroke="#171717"
                    strokeOpacity="0.12"
                  />
                  <line
                    x1="200"
                    y1="0"
                    x2="200"
                    y2="400"
                    stroke="#171717"
                    strokeOpacity="0.12"
                  />
                </svg>

                <p className="eyebrow text-ink-950/70">Ready for match day</p>
                <h2 className="mt-5 max-w-2xl text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
                  Run your next tournament from one control room.
                </h2>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-950/75 md:text-lg">
                  Empower your referees, keep players informed, and broadcast
                  live scores to every screen at the venue.
                </p>
                <div className="cta-row mt-10">
                  <Link
                    href="/login?callbackUrl=/admin"
                    className="btn btn-lg btn-dark"
                  >
                    Sign in to workspace
                    <ArrowRightIcon weight="bold" aria-hidden="true" />
                  </Link>
                  <Link
                    href={SUPPORT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-lg btn-outline-ink"
                  >
                    <WhatsappLogoIcon weight="bold" aria-hidden="true" />
                    Talk with the Tuwaga team
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
