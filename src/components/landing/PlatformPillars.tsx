"use client";

import {
  DeviceMobileIcon,
  LinkSimpleIcon,
  SealCheckIcon,
  ShuffleIcon,
  TelevisionIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import Reveal from "./Reveal";

export default function PlatformPillars() {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <section className="bg-canvas py-20 md:py-28">
      <div className="container-page">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-brand-600">The Operating Platform</p>
          <h2 className="mt-4 text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-ink-950">
            Four pillars of seamless tournament operations.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-600 md:text-lg">
            Built from real tournament days. From private link distribution to
            the championship trophy, every role has its own dedicated surface.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {/* ── Pillar 1: Private Links & Direct Registration ───────── */}
          <Reveal delay={60} className="h-full">
            <div className="motion-card flex h-full flex-col justify-between rounded-3xl border border-ink-200 bg-white p-7 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 border border-brand-500/20">
                    <LinkSimpleIcon className="text-2xl" weight="bold" />
                  </span>
                  <span className="eyebrow rounded-full bg-ink-100 px-3 py-1 text-ink-600">
                    Pillar 01
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold text-ink-950">
                  Private Links & Team Curation
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  Your tournament isn't an open public bulletin board.
                  Organizers get a dedicated, private registration link to
                  distribute directly to their community. Players submit partner
                  details, ratings, and proof of payment straight to your
                  dashboard.
                </p>
              </div>

              {/* Interactive Micro Visual: Invitation Link Mockup */}
              <div className="mt-6 rounded-2xl border border-ink-200 bg-canvas/70 p-4">
                <span className="eyebrow text-[10px] text-ink-500">
                  Private Organizer Invite Link
                </span>
                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-mono text-ink-800">
                  <span className="truncate">
                    tuwaga.wikra.my.id/tournaments/your-event-slug
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="shrink-0 rounded-lg bg-ink-950 px-2.5 py-1 text-[11px] font-sans font-semibold text-cream-50 hover:bg-brand-500 hover:text-ink-950 transition"
                  >
                    {copiedLink ? "Copied! ✓" : "Copy"}
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <SealCheckIcon className="text-base" weight="fill" />
                  <span>
                    1-click verification of transfer slips & registration status
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ── Pillar 2: Transparent Draws & Brackets ──────────────── */}
          <Reveal delay={120} className="h-full">
            <div className="motion-card flex h-full flex-col justify-between rounded-3xl border border-ink-200 bg-white p-7 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 border border-brand-500/20">
                    <ShuffleIcon className="text-2xl" weight="bold" />
                  </span>
                  <span className="eyebrow rounded-full bg-ink-100 px-3 py-1 text-ink-600">
                    Pillar 02
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold text-ink-950">
                  Transparent Draws & Bagan
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  Run technical meetings with complete credibility. Automatic
                  bye calculations, balanced seed placements, and group
                  distributions are generated in seconds without formula
                  mistakes or manual Excel rigging.
                </p>
              </div>

              {/* Interactive Micro Visual: Mini Bracket Tree */}
              <div className="mt-6 rounded-2xl border border-ink-200 bg-canvas/70 p-4">
                <span className="eyebrow text-[10px] text-ink-500">
                  Live Drawing Geometry
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-ink-200 bg-white p-2.5 space-y-1">
                    <span className="font-mono text-[10px] text-brand-600 font-bold">
                      Match 01 · QF
                    </span>
                    <div className="flex items-center justify-between font-semibold text-ink-900">
                      <span>#1 Seed (Team Alpha)</span>
                      <span className="text-emerald-600 font-bold">W</span>
                    </div>
                    <div className="text-ink-400">#8 Seed (Team Theta)</div>
                  </div>
                  <div className="rounded-xl border border-brand-500/40 bg-brand-50 p-2.5 space-y-1">
                    <span className="font-mono text-[10px] text-brand-600 font-bold">
                      Semifinal
                    </span>
                    <div className="font-semibold text-ink-900">
                      Team Alpha advances
                    </div>
                    <div className="text-[11px] text-brand-700 font-mono">
                      Auto Seed Flow
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ── Pillar 3: Court-Side Referee Console ────────────────── */}
          <Reveal delay={180} className="h-full">
            <div className="motion-card flex h-full flex-col justify-between rounded-3xl border border-ink-200 bg-white p-7 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 border border-brand-500/20">
                    <DeviceMobileIcon className="text-2xl" weight="bold" />
                  </span>
                  <span className="eyebrow rounded-full bg-ink-100 px-3 py-1 text-ink-600">
                    Pillar 03
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold text-ink-950">
                  Court-Side Referee Scoring
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  Referees score directly from their mobile phones at court
                  side. Big tactile tap targets, zero latency, automatic
                  point-to-game escalation, and instant set transition warnings
                  keep officials focused on the match.
                </p>
              </div>

              {/* Interactive Micro Visual: Referee Keypad */}
              <div className="mt-6 rounded-2xl border border-ink-200 bg-ink-950 p-4 text-cream-50">
                <div className="flex items-center justify-between text-xs border-b border-cream-200/10 pb-2">
                  <span className="eyebrow text-brand-400">
                    Court 01 Umpire
                  </span>
                  <span className="font-mono text-cream-100/50">Match 14</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-ink-900 border border-cream-200/10 p-2">
                    <p className="text-[11px] text-cream-100/50 truncate">
                      Team Alpha
                    </p>
                    <p className="font-mono text-2xl font-bold text-brand-400">
                      40
                    </p>
                  </div>
                  <div className="rounded-xl bg-ink-900 border border-cream-200/10 p-2">
                    <p className="text-[11px] text-cream-100/50 truncate">
                      Team Bravo
                    </p>
                    <p className="font-mono text-2xl font-bold text-cream-50">
                      30
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ── Pillar 4: Venue TV Display & Spectator Board ────────── */}
          <Reveal delay={240} className="h-full">
            <div className="motion-card flex h-full flex-col justify-between rounded-3xl border border-ink-200 bg-white p-7 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 border border-brand-500/20">
                    <TelevisionIcon className="text-2xl" weight="bold" />
                  </span>
                  <span className="eyebrow rounded-full bg-ink-100 px-3 py-1 text-ink-600">
                    Pillar 04
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold text-ink-950">
                  Venue TV Display & Liveboards
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  Broadcast the tournament experience across all screens at the
                  venue. Plug any laptop into the venue TV or LED screen to run
                  full-screen rotating live scores, order of play schedules, and
                  bracket progressions.
                </p>
              </div>

              {/* Interactive Micro Visual: TV Display Preview */}
              <div className="mt-6 rounded-2xl border border-ink-200 bg-ink-950 p-4 text-cream-50">
                <div className="flex items-center justify-between text-xs border-b border-cream-200/10 pb-2">
                  <span className="eyebrow flex items-center gap-1.5 text-cream-100/60">
                    <span className="live-dot" />
                    Kiosk TV Mode (/display)
                  </span>
                  <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-mono text-brand-400 font-bold">
                    1080p / 4K Auto-Fit
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between rounded bg-ink-900 px-2.5 py-1.5">
                    <span className="text-brand-400 font-bold">CT 01</span>
                    <span className="text-cream-50 font-sans font-medium">
                      Team Alpha vs Team Bravo
                    </span>
                    <span className="text-brand-400">5-4 (40-30)</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-ink-900 px-2.5 py-1.5">
                    <span className="text-cream-100/50">CT 02</span>
                    <span className="text-cream-100/70 font-sans font-medium">
                      Team Delta vs Team Echo
                    </span>
                    <span className="text-cream-100/50">Next Up 15:45</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
