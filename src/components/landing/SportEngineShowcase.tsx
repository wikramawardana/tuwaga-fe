"use client";

import { PingPongIcon, RacquetIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import {
  type AppIcon,
  PadelRacketIcon,
  ShuttlecockIcon,
} from "@/components/icons/SportIcons";
import Reveal from "./Reveal";

type SportConfig = {
  id: string;
  name: string;
  subtitle: string;
  icon: AppIcon;
  badge: string;
  sets: string;
  points: string;
  deuceRule: string;
  tiebreak: string;
  format: string;
  demoScore: {
    teamA: string;
    teamB: string;
    sets: Array<{ id: string; a: string; b: string }>;
    current: string;
    callout: string;
  };
};

const sports: SportConfig[] = [
  {
    id: "padel",
    name: "Padel",
    subtitle: "Federation & Community Tournaments",
    icon: PadelRacketIcon,
    badge: "Most Popular",
    sets: "Best of 3 Sets",
    points: "Traditional 15 - 30 - 40",
    deuceRule: "Golden Point (Punto de Oro)",
    tiebreak: "7-Point Tiebreak at 6-6",
    format: "Doubles (Pairing)",
    demoScore: {
      teamA: "Team Alpha",
      teamB: "Team Bravo",
      sets: [
        { id: "set-1", a: "6", b: "4" },
        { id: "set-2", a: "4", b: "6" },
        { id: "set-3", a: "5", b: "5" },
      ],
      current: "40 - 40",
      callout: "Golden Point — Receiver elects side",
    },
  },
  {
    id: "badminton",
    name: "Badminton",
    subtitle: "BWF Standard Scoring Rules",
    icon: ShuttlecockIcon,
    badge: "National Standard",
    sets: "Best of 3 Games",
    points: "21 Rally Points",
    deuceRule: "Win by 2, capped at 30 points",
    tiebreak: "Interval at 11 points",
    format: "Singles & Doubles",
    demoScore: {
      teamA: "Team Apex",
      teamB: "Team Vortex",
      sets: [
        { id: "set-1", a: "21", b: "18" },
        { id: "set-2", a: "19", b: "21" },
        { id: "set-3", a: "20", b: "20" },
      ],
      current: "Setting 20 - 20",
      callout: "Deuce — Win by 2 points (max 30)",
    },
  },
  {
    id: "tennis",
    name: "Tennis",
    subtitle: "ITF & Club Tournament Operations",
    icon: RacquetIcon,
    badge: "Tour Standard",
    sets: "Best of 3 / Pro Set 8",
    points: "15 - 30 - 40 - Ad",
    deuceRule: "Advantage or No-Ad Option",
    tiebreak: "7-Point or Super Tiebreak (10)",
    format: "Singles & Doubles",
    demoScore: {
      teamA: "Team Titan",
      teamB: "Team Eclipse",
      sets: [
        { id: "set-1", a: "7", b: "6" },
        { id: "set-2", a: "4", b: "6" },
        { id: "set-3", a: "4", b: "3" },
      ],
      current: "Ad - 40",
      callout: "Break Point Advantage Team A",
    },
  },
  {
    id: "table_tennis",
    name: "Table Tennis",
    subtitle: "Fast-Paced Knockout & League Play",
    icon: PingPongIcon,
    badge: "ITTF Rules",
    sets: "Best of 5 or 7 Games",
    points: "11 Points per Game",
    deuceRule: "Win by 2 at 10-10",
    tiebreak: "Service rotates every 2 points",
    format: "Singles & Doubles",
    demoScore: {
      teamA: "Team Pulse",
      teamB: "Team Nova",
      sets: [
        { id: "set-1", a: "11", b: "9" },
        { id: "set-2", a: "8", b: "11" },
        { id: "set-3", a: "12", b: "10" },
        { id: "set-4", a: "10", b: "10" },
      ],
      current: "Deuce 10 - 10",
      callout: "Single service alternation",
    },
  },
];

export default function SportEngineShowcase() {
  const [activeSport, setActiveSport] = useState<SportConfig>(sports[0]);

  return (
    <section className="relative overflow-hidden bg-cream-200 py-20 text-ink-950 md:py-28">
      <div className="texture-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

      <div className="container-page relative">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-brand-700">
            Multi-Sport Scoring Architecture
          </p>
          <h2 className="mt-4 text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
            Built with dynamic scoring rules for every racquet sport.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-700 md:text-lg">
            No spreadsheets, no manual calculations. Tuwaga handles
            sport-specific tiebreak logic, deuce caps, interval pauses, and set
            structures automatically.
          </p>
        </Reveal>

        {/* Sport Switcher Tabs */}
        <Reveal delay={80} className="mt-10">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-ink-950/10 bg-cream-100/70 p-2 sm:inline-flex">
            {sports.map((sport) => {
              const Icon = sport.icon;
              const isActive = activeSport.id === sport.id;
              return (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => setActiveSport(sport)}
                  className={`flex h-11 items-center gap-2.5 rounded-xl px-5 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-ink-950 text-cream-50 shadow-md scale-100"
                      : "text-ink-700 hover:bg-cream-300/40 hover:text-ink-950"
                  }`}
                >
                  <Icon
                    className={`text-lg ${isActive ? "text-brand-500" : "text-ink-600"}`}
                    weight="duotone"
                  />
                  <span>{sport.name}</span>
                  {isActive && (
                    <span className="hidden rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-brand-400 sm:inline">
                      {sport.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Active Sport Dashboard Card */}
        <Reveal delay={160} className="mt-8">
          <div className="grid gap-6 rounded-3xl border border-ink-950/15 bg-white p-6 shadow-xl lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            {/* Left: Engine Rules Specs */}
            <div className="space-y-6">
              <div className="border-b border-ink-100 pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-ink-950 font-bold">
                    <activeSport.icon className="text-2xl" weight="duotone" />
                  </span>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-ink-950">
                      {activeSport.name} Engine
                    </h3>
                    <p className="text-xs font-mono text-ink-500">
                      {activeSport.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-ink-100 bg-canvas/60 p-4">
                  <span className="eyebrow text-[10px] text-ink-500">
                    Match Duration & Sets
                  </span>
                  <p className="mt-1 font-bold text-ink-950">
                    {activeSport.sets}
                  </p>
                  <p className="text-xs text-ink-600 mt-0.5">
                    {activeSport.points}
                  </p>
                </div>

                <div className="rounded-xl border border-ink-100 bg-canvas/60 p-4">
                  <span className="eyebrow text-[10px] text-ink-500">
                    Deuce & Tiebreak Logic
                  </span>
                  <p className="mt-1 font-bold text-ink-950">
                    {activeSport.deuceRule}
                  </p>
                  <p className="text-xs text-ink-600 mt-0.5">
                    {activeSport.tiebreak}
                  </p>
                </div>

                <div className="rounded-xl border border-ink-100 bg-canvas/60 p-4">
                  <span className="eyebrow text-[10px] text-ink-500">
                    Format & Team Size
                  </span>
                  <p className="mt-1 font-bold text-ink-950">
                    {activeSport.format}
                  </p>
                  <p className="text-xs text-ink-600 mt-0.5">
                    Single-elimination, Group-stage + Knockout
                  </p>
                </div>

                <div className="rounded-xl border border-ink-100 bg-canvas/60 p-4">
                  <span className="eyebrow text-[10px] text-ink-500">
                    Court Ops Integration
                  </span>
                  <p className="mt-1 font-bold text-ink-950">
                    Zero-Latency Sync
                  </p>
                  <p className="text-xs text-ink-600 mt-0.5">
                    Mobile referee console + live TV kiosk
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Live Simulated Scoreboard Mockup */}
            <div className="flex flex-col justify-between rounded-2xl border border-cream-200/20 bg-ink-950 p-6 text-cream-50">
              <div>
                <div className="flex items-center justify-between border-b border-cream-200/10 pb-3">
                  <span className="eyebrow flex items-center gap-2 text-brand-400">
                    <span className="live-dot" />
                    Simulated Referee View
                  </span>
                  <span className="font-mono text-xs text-cream-100/50">
                    Court 01 · Finals
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg text-cream-50">
                        {activeSport.demoScore.teamA}
                      </p>
                      <p className="text-xs font-mono text-cream-100/40">
                        Team A
                      </p>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      {activeSport.demoScore.sets.map((set) => (
                        <span
                          key={set.id}
                          className="rounded bg-ink-900 px-2 py-1 text-xs text-cream-100/70"
                        >
                          {set.a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-cream-200/10 pt-4">
                    <div>
                      <p className="font-semibold text-lg text-cream-50">
                        {activeSport.demoScore.teamB}
                      </p>
                      <p className="text-xs font-mono text-cream-100/40">
                        Team B
                      </p>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      {activeSport.demoScore.sets.map((set) => (
                        <span
                          key={set.id}
                          className="rounded bg-ink-900 px-2 py-1 text-xs text-cream-100/70"
                        >
                          {set.b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-brand-500/30 bg-brand-500/10 p-3.5 text-center">
                <p className="font-mono text-xs font-bold text-brand-400 uppercase tracking-wider">
                  {activeSport.demoScore.current}
                </p>
                <p className="text-xs text-cream-100/70 mt-1">
                  {activeSport.demoScore.callout}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
