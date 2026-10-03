"use client";

import {
  CheckCircleIcon,
  ClockIcon,
  TrophyIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { PadelRacketIcon } from "@/components/icons/SportIcons";

export default function HeroPlatformVisual() {
  const [scoreA, setScoreA] = useState(40);
  const [scoreB, setScoreB] = useState(30);
  const [servingA, setServingA] = useState(true);
  const [rallyCount, setRallyCount] = useState(14);
  const [isGoldenPoint, setIsGoldenPoint] = useState(false);

  const simulatePoint = (team: "A" | "B") => {
    setRallyCount((r) => r + 1);
    if (team === "A") {
      if (scoreA === 30 && scoreB === 40) {
        setScoreA(40);
        setIsGoldenPoint(true);
      } else if (scoreA === 40) {
        // Game won by team A
        setScoreA(0);
        setScoreB(0);
        setIsGoldenPoint(false);
        setServingA(!servingA);
      } else if (scoreA === 0) setScoreA(15);
      else if (scoreA === 15) setScoreA(30);
      else if (scoreA === 30) setScoreA(40);
    } else {
      if (scoreB === 30 && scoreA === 40) {
        setScoreB(40);
        setIsGoldenPoint(true);
      } else if (scoreB === 40) {
        // Game won by team B
        setScoreA(0);
        setScoreB(0);
        setIsGoldenPoint(false);
        setServingA(!servingA);
      } else if (scoreB === 0) setScoreB(15);
      else if (scoreB === 15) setScoreB(30);
      else if (scoreB === 30) setScoreB(40);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[560px] select-none pt-8 sm:pt-10">
      {/* ── Main Live Court Console Card ───────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-cream-200/20 bg-ink-900/90 p-5 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-7">
        <div className="texture-halftone pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_100%_0%,black,transparent_60%)]" />

        {/* Card Header */}
        <div className="relative flex items-center justify-between border-b border-cream-200/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-400">
              <span className="live-dot" />
              Live · Court 01
            </span>
            <span className="eyebrow hidden text-cream-100/50 sm:inline-block">
              Set 3 (Decider)
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-cream-200/10 bg-ink-950/60 px-2.5 py-1 text-xs font-mono text-cream-100/70">
            <PadelRacketIcon className="text-brand-500" />
            <span>Padel Gold</span>
          </div>
        </div>

        {/* Match Score Display */}
        <div className="relative mt-5 space-y-2.5">
          {/* Team A */}
          <div
            className={`group relative flex items-center justify-between rounded-2xl border p-3.5 transition-all ${
              servingA
                ? "border-brand-500/50 bg-brand-500/10 shadow-[0_0_24px_-6px_rgba(224,109,48,0.25)]"
                : "border-cream-200/10 bg-ink-950/50 hover:border-cream-200/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                  servingA
                    ? "bg-brand-500 text-ink-950"
                    : "border border-cream-200/15 text-cream-100/40"
                }`}
              >
                1
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-cream-50 sm:text-base">
                    Team Alpha
                  </p>
                  {servingA && (
                    <span
                      title="Serving"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-ink-950"
                    >
                      🎾
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-cream-100/50">
                  Seed #1 · Division A
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Set History */}
              <div className="flex items-center gap-1.5 font-mono text-sm text-cream-100/40">
                <span className="w-5 text-center">6</span>
                <span className="w-5 text-center">4</span>
                <span className="w-5 text-center font-bold text-cream-50">
                  5
                </span>
              </div>
              {/* Current Game Point */}
              <button
                type="button"
                onClick={() => simulatePoint("A")}
                title="Tap to score point for Team Alpha"
                className="flex h-11 w-14 items-center justify-center rounded-xl bg-ink-950 border border-brand-500/40 font-mono text-xl font-bold tabular-nums text-brand-400 transition hover:scale-105 active:scale-95"
              >
                {scoreA}
              </button>
            </div>
          </div>

          {/* Team B */}
          <div
            className={`group relative flex items-center justify-between rounded-2xl border p-3.5 transition-all ${
              !servingA
                ? "border-brand-500/50 bg-brand-500/10 shadow-[0_0_24px_-6px_rgba(224,109,48,0.25)]"
                : "border-cream-200/10 bg-ink-950/50 hover:border-cream-200/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                  !servingA
                    ? "bg-brand-500 text-ink-950"
                    : "border border-cream-200/15 text-cream-100/40"
                }`}
              >
                2
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-cream-50 sm:text-base">
                    Team Bravo
                  </p>
                  {!servingA && (
                    <span
                      title="Serving"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-ink-950"
                    >
                      🎾
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-cream-100/50">
                  Seed #2 · Division A
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Set History */}
              <div className="flex items-center gap-1.5 font-mono text-sm text-cream-100/40">
                <span className="w-5 text-center">4</span>
                <span className="w-5 text-center">6</span>
                <span className="w-5 text-center font-bold text-cream-50">
                  4
                </span>
              </div>
              {/* Current Game Point */}
              <button
                type="button"
                onClick={() => simulatePoint("B")}
                title="Tap to score point for Team Bravo"
                className="flex h-11 w-14 items-center justify-center rounded-xl bg-ink-950 border border-brand-500/40 font-mono text-xl font-bold tabular-nums text-brand-400 transition hover:scale-105 active:scale-95"
              >
                {scoreB}
              </button>
            </div>
          </div>
        </div>

        {/* Status Bar / Interactive Controls */}
        <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-cream-200/10 pt-4 text-xs">
          <div className="flex items-center gap-2">
            {isGoldenPoint ? (
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-bold uppercase tracking-wide text-amber-400 animate-pulse">
                ⚡ Golden Point (Sudden Death)
              </span>
            ) : (
              <span className="eyebrow text-cream-100/50">
                Rally #{rallyCount} · Tap points to simulate
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setScoreA(40);
                setScoreB(40);
                setIsGoldenPoint(true);
              }}
              className="rounded-lg border border-cream-200/15 bg-ink-950/70 px-2.5 py-1 text-[11px] font-semibold text-cream-100/70 hover:border-brand-500 hover:text-cream-50"
            >
              Test Deuce 40-40
            </button>
            <button
              type="button"
              onClick={() => {
                setScoreA(0);
                setScoreB(0);
                setIsGoldenPoint(false);
              }}
              className="rounded-lg border border-cream-200/15 bg-ink-950/70 px-2.5 py-1 text-[11px] font-semibold text-cream-100/70 hover:border-brand-500 hover:text-cream-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating Badge 1: Order-Of-Play (OOP) Schedule Queue ─── */}
      <div className="motion-float absolute -bottom-5 -left-3 z-20 hidden rounded-2xl border border-cream-200/20 bg-ink-950/95 p-3.5 shadow-2xl backdrop-blur-md sm:flex items-center gap-3.5 max-w-[280px]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400 border border-brand-500/30">
          <ClockIcon className="text-xl" weight="bold" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="eyebrow text-[9px] text-brand-400">Court 02</span>
            <span className="text-[10px] text-cream-100/40">· Next Up</span>
          </div>
          <p className="truncate text-xs font-semibold text-cream-50 mt-0.5">
            Semifinal: Team Delta vs Echo
          </p>
          <p className="font-mono text-[10px] text-cream-100/50">
            Est. 15:45 · OOP Sync
          </p>
        </div>
      </div>

      {/* ── Floating Badge 2: Knockout Bracket Node Progress ─────── */}
      <div className="motion-float motion-float-delay absolute top-1 right-0 sm:-right-4 z-20 hidden rounded-2xl border border-cream-200/20 bg-ink-950/95 p-3.5 shadow-2xl backdrop-blur-md sm:flex items-center gap-3 max-w-[260px]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <TrophyIcon className="text-xl" weight="bold" />
        </div>
        <div className="min-w-0">
          <span className="eyebrow text-[9px] text-emerald-400">
            Knockout Bagan
          </span>
          <p className="truncate text-xs font-semibold text-cream-50 mt-0.5">
            Winner → Final
          </p>
          <div className="flex items-center gap-1 font-mono text-[10px] text-cream-100/50">
            <CheckCircleIcon className="text-emerald-400" weight="fill" />
            <span>Auto Seed Advancement</span>
          </div>
        </div>
      </div>
    </div>
  );
}
