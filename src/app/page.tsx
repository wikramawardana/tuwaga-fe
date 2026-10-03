import {
  ArrowRightIcon,
  LinkSimpleIcon,
  PingPongIcon,
  RacquetIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Footer from "@/components/Footer";
import {
  type AppIcon,
  PadelRacketIcon,
  ShuttlecockIcon,
} from "@/components/icons/SportIcons";
import HeroPlatformVisual from "@/components/landing/HeroPlatformVisual";
import PlatformPillars from "@/components/landing/PlatformPillars";
import RadarArt from "@/components/landing/RadarArt";
import Reveal from "@/components/landing/Reveal";
import SportEngineShowcase from "@/components/landing/SportEngineShowcase";
import TournamentLinkLookup from "@/components/landing/TournamentLinkLookup";
import Navbar from "@/components/Navbar";
import { SUPPORT_URL } from "@/lib/site";

const tickerItems: { label: string; icon?: AppIcon }[] = [
  { label: "Padel", icon: PadelRacketIcon },
  { label: "Court-Side Referee Scoring" },
  { label: "Tennis", icon: RacquetIcon },
  { label: "Private Invite Links" },
  { label: "Badminton", icon: ShuttlecockIcon },
  { label: "Automated Knockout Bagan" },
  { label: "Table Tennis", icon: PingPongIcon },
  { label: "Venue Kiosk TV Display" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero: The Platform Control Room ───────────────────────── */}
        <section className="relative isolate overflow-hidden bg-ink-950 pt-16 text-cream-100">
          <div className="texture-grain pointer-events-none absolute inset-0 -z-10 opacity-60" />
          <div className="pointer-events-none absolute -bottom-40 right-0 -z-10 h-96 w-[40rem] rounded-full bg-brand-500/10 blur-3xl" />

          <div className="container-page grid items-center gap-14 pb-20 pt-14 md:pb-28 md:pt-20 lg:min-h-[720px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-32">
            <div className="relative">
              <p className="eyebrow hero-reveal hero-reveal-1 flex items-center gap-2.5 text-cream-100/60">
                <span className="h-1.5 w-1.5 bg-brand-500" />
                Tuwaga Skor — Tournament Operations Platform
              </p>

              <h1 className="hero-reveal hero-reveal-2 mt-6 text-[clamp(3.25rem,8.5vw,6.5rem)] font-medium leading-[0.9] tracking-[-0.05em] text-cream-50">
                Control
                <br />
                the game<span className="text-brand-500">.</span>
              </h1>

              <p className="hero-reveal hero-reveal-3 mt-6 max-w-lg text-base leading-relaxed text-cream-100/70 md:text-lg">
                The all-in-one tournament operating platform for racquet sports.
                Private player registration links, automated bracket draws,
                court-side referee scoring, and live venue displays from first
                serve to championship point.
              </p>

              <div className="hero-reveal hero-reveal-4 mt-9">
                <div className="cta-row">
                  <Link
                    href="/login?callbackUrl=/admin"
                    className="btn btn-lg btn-primary"
                  >
                    Organizer Workspace
                    <ArrowRightIcon weight="bold" aria-hidden="true" />
                  </Link>
                  <a href="#lookup" className="btn btn-lg btn-outline-dark">
                    <LinkSimpleIcon weight="bold" aria-hidden="true" />
                    Enter Tournament Link
                  </a>
                </div>
              </div>

              <div className="hero-reveal hero-reveal-4 mt-8 flex flex-wrap items-center gap-6 border-t border-cream-200/10 pt-6 text-xs text-cream-100/50">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Invitation-Based Events
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  Zero-Latency Live Sync
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cream-200/40" />4
                  Core Sports
                </span>
              </div>
            </div>

            <div className="relative lg:pl-6">
              <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[54rem] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-80 max-md:w-[38rem] max-md:opacity-40">
                <RadarArt className="h-auto w-full" showCourts={false} />
              </div>
              <div className="animate-hero-card">
                <HeroPlatformVisual />
              </div>
            </div>
          </div>
        </section>

        {/* ── Marquee Ticker ────────────────────────────────────────── */}
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
                    className="flex items-center gap-3 px-8 text-sm font-medium tracking-tight text-cream-100/70"
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

        {/* ── Multi-Sport Scoring Engine ────────────────────────────── */}
        <SportEngineShowcase />

        {/* ── Four Operating Pillars ─────────────────────────────────── */}
        <PlatformPillars />

        {/* ── Private Tournament Link Direct Lookup ─────────────────── */}
        <TournamentLinkLookup />

        {/* ── Organizer Call to action ──────────────────────────────── */}
        <section className="bg-canvas pb-20 pt-10 md:pb-28">
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

                <p className="eyebrow text-ink-950/70">Ready for Match Day</p>
                <h2 className="mt-5 max-w-2xl text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
                  Run your tournament from one automated control room.
                </h2>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-950/75 md:text-lg">
                  Empower your referees, verify player payments with confidence,
                  and broadcast live scores to every screen at the venue.
                </p>
                <div className="cta-row mt-10">
                  <Link
                    href="/login?callbackUrl=/admin"
                    className="btn btn-lg btn-dark"
                  >
                    Sign in to Organizer Workspace
                    <ArrowRightIcon weight="bold" aria-hidden="true" />
                  </Link>
                  <Link
                    href={SUPPORT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-lg btn-outline-ink"
                  >
                    <WhatsappLogoIcon weight="bold" aria-hidden="true" />
                    Consult with the Tuwaga Team
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
