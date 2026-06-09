"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PageBreadcrumb from "@/components/PageBreadcrumb";

// ── Data ───────────────────────────────────────────────────────────────────────

const liveMatches = [
  {
    id: "court-1",
    court: "Court 1",
    courtLabel: "Main Arena",
    accentColor: "bg-primary",
    badgeBg: "bg-primary",
    badgeText: "text-on-primary",
    setInfo: "Set 2 • 45'",
    teamA: {
      player1: "R. Federer",
      player2: "S. Tsitsipas",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCOpm-oQljzYf-QK7Dno-0WRkmR968irN1EDJUykn6RpY7GlWruavN3MNLkMITyO5F_FHy7RcsgaS3QP_yaDfDmlALYqNJYUVshHxZAwwjKWZfBSaYwTvnU45AxuYfpeZOIpenFdKHop4WtiTLlqMVhE412WCz3x7_z38dNM9ccIF0VHKutDoWe471Q2Qgh-B4Q5aHIuVSRnA73sUhXcf3vkdNIjLbX_xrbMicfIVdtg1rMjFRhz679h-otl_S8QE60SrwtKFT-tBVw",
      scores: [6, 3],
    },
    teamB: {
      player1: "R. Nadal",
      player2: "C. Alcaraz",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAxn_ICdhFw5ZDRVzBAObr6F1HMTmp5NJtcsWD2y8_B47XVTF5O05P0lKbymUq2d4ZytV7CtjoFJhXbHu9tLJ9LbHFkRtjbSJ2VanIBK4DFUKHHrb5rdeb2nr9biaHwuZagFKha_9AoswSEu8idx6P4SwPDX7sZW7HHAjkPVBh41ekadC6ApVj797CzjqZY3vAx2ewNbWkmcR6L7QefbYF7ceKho9KEEg2XHgs6I7d3gO1SzDD53wK3t4ZtiI9R2myMachCu4t4pEZu",
      scores: [4, 2],
    },
  },
  {
    id: "court-2",
    court: "Court 2",
    courtLabel: "South Wing",
    accentColor: "bg-secondary",
    badgeBg: "bg-secondary-container",
    badgeText: "text-on-secondary-container",
    setInfo: "Set 1 • 12'",
    serving: "Sabalenka",
    teamA: {
      player1: "M. Sakkari",
      player2: "P. Badosa",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBzN4dq3MbGfUAdwsj6QmIntDXXNSiWBnjQdfOMhI2yKRfwNC2XbLsczpgRsl5AIdGsHUlGzM7pkwiXw51qeM17KNh1fZlUURrOW8fOtC3j25KR1kpDXhYqjV9QzaWgpcMcoUNDLcg_mo_n-lxrwiS5LEVPcc-3fzDk_SbDA0L-Z4n7k1nJ7f2UIluXASa73EWbip3OwwiTsWQ4momngxNoLVfoV_BrNCKoItm5MiSy5JmR4U6Ynp8vV1_HVUtVXjeudoOM5qK8tr1L",
      scores: [1],
    },
    teamB: {
      player1: "A. Sabalenka",
      player2: "E. Rybakina",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAcyi_GowGzvlQao7jepMXwY-zvfRlwzoQrQf3J1chA_OuGJ_cmtMwh2wPN4N4JIj6I5VIVuL8Ok8H0mq_Nz_vNgh8nEZvDhjGjSjarbynJ82vVpSLvqk5Rry7FULqPzcBOf9DvHZIerTAnw78UqIo-wwY92LMrj9DDKoCE4CoKR30MNwVXDPYA8Lm7rWd4QVaNP1dxTtiKic4p0D4dAynur3KMWmxyE2BmT5Q2ODVgkCm8iYVSY6huXsfXskp0zBotPNSEo1cC2TdJ",
      scores: [3],
    },
  },
];

const nextUpMatches = [
  {
    time: "14:30",
    day: "Today",
    teamA: "D. Thiem / A. Zverev",
    teamB: "N. Djokovic / G. Monfils",
    venue: "Court 3 • East Wing",
    highlight: true,
  },
  {
    time: "15:00",
    day: "Today",
    teamA: "I. Swiatek / J. Pegula",
    teamB: "O. Jabeur / C. Gauff",
    venue: "Court 1 • Main Arena",
    highlight: false,
  },
];

const recentResults = [
  {
    winner: "Belasteguín / Sanyo",
    loser: "Galán / Lebrón",
    score: "6-3, 7-5",
    label: "Semi-Final",
    labelBg: "bg-primary/10",
    labelText: "text-primary",
  },
  {
    winner: "Navarro / Di Nenno",
    loser: "Chingotto / Tello",
    score: "3-6, 6-4, 6-2",
    label: "Quarter-Final",
    labelBg: "bg-secondary-container",
    labelText: "text-on-secondary-container",
  },
  {
    winner: "Sakkari / Badosa",
    loser: "Swiatek / Pegula",
    score: "6-1, 6-4",
    label: "Round of 16",
    labelBg: "bg-surface-container-high",
    labelText: "text-on-surface-variant",
  },
];

// ── Page ────────────────────────────────────────────────────────────────────────

export default function LiveScoresPage() {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen pt-16">
        <main className="flex-1 p-6 md:px-[40px] md:py-12 max-w-[1440px] mx-auto">
          {/* Header Section */}
          <PageBreadcrumb
            parentLabel="Home"
            parentHref="/"
            current="Live Scores"
          />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-primary text-[14px] font-medium tracking-[0.01em] font-bold tracking-widest uppercase">
                TUWAGA
              </span>
              <h1 className="text-[32px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface mt-1">
                Tournament Live Scores
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-full shadow-md hover:bg-primary/90 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">map</span>
                <span className="text-[14px] font-medium font-bold">
                  Court Map
                </span>
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
                <span className="w-2 h-2 bg-error rounded-full animate-pulse" />
                <span className="text-[14px] font-medium text-on-surface-variant">
                  {liveMatches.length} Active Matches
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Live Now */}
            <div className="lg:col-span-8 space-y-8">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[24px] font-semibold leading-[1.4] text-on-surface flex items-center gap-2">
                    <span className="w-2 h-8 bg-primary rounded-full" />
                    Live Now
                  </h2>
                  <button
                    type="button"
                    className="text-primary text-[14px] font-medium font-bold hover:underline cursor-pointer"
                  >
                    View All Courts
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {liveMatches.map((match) => (
                    <div
                      key={match.id}
                      className="bg-white rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-[#F1F5F9] relative overflow-hidden group"
                    >
                      <div
                        className={`absolute top-0 left-0 w-1.5 h-full ${match.accentColor}`}
                      />
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <span
                            className={`${match.badgeBg} ${match.badgeText} text-xs font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm`}
                          >
                            {match.court}
                          </span>
                          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                            {match.courtLabel}
                          </span>
                        </div>
                        <span className="text-on-surface-variant text-[12px] font-semibold bg-surface-container px-2 py-0.5 rounded">
                          {match.setInfo}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {/* Team A */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border border-outline-variant/30">
                              <Image
                                src={match.teamA.avatar}
                                alt={match.teamA.player1}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                            <div>
                              <p className="text-[14px] font-medium font-bold text-on-surface">
                                {match.teamA.player1}
                              </p>
                              <p className="text-[10px] text-on-surface-variant">
                                {match.teamA.player2}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {match.teamA.scores.map((s, i) => (
                              <span
                                key={`${match.id}-team-a-set-${i}-${s}`}
                                className={`text-[24px] font-semibold font-bold ${
                                  i < match.teamA.scores.length - 1
                                    ? "text-on-surface-variant/40"
                                    : "text-primary"
                                }`}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="h-[1px] bg-outline-variant/30 mx-[-24px]" />
                        {/* Team B */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border border-outline-variant/30">
                              <Image
                                src={match.teamB.avatar}
                                alt={match.teamB.player1}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                            <div>
                              <p className="text-[14px] font-medium font-bold text-on-surface">
                                {match.teamB.player1}
                              </p>
                              <p className="text-[10px] text-on-surface-variant">
                                {match.teamB.player2}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {match.teamB.scores.map((s, i) => (
                              <span
                                key={`${match.id}-team-b-set-${i}-${s}`}
                                className={`text-[24px] font-semibold font-extrabold ${
                                  i < match.teamB.scores.length - 1
                                    ? "text-on-surface-variant/40"
                                    : "text-on-surface"
                                }`}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-outline-variant/30 flex justify-between items-center">
                        {match.serving ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-secondary uppercase tracking-widest">
                            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                            Serving: {match.serving}
                          </span>
                        ) : (
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-secondary-container" />
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-primary-container" />
                          </div>
                        )}
                        <button
                          type="button"
                          className="flex items-center gap-1 text-primary text-[14px] font-medium font-bold group-hover:translate-x-1 transition-transform cursor-pointer"
                        >
                          Watch Live{" "}
                          <span className="material-symbols-outlined text-sm">
                            arrow_forward_ios
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Next Up Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[24px] font-semibold leading-[1.4] text-on-surface flex items-center gap-2">
                    <span className="w-2 h-8 bg-surface-variant rounded-full" />
                    Next Up
                  </h2>
                  <button
                    type="button"
                    className="text-on-surface-variant text-[14px] font-medium hover:text-primary cursor-pointer"
                  >
                    Full Schedule
                  </button>
                </div>
                <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-[#F1F5F9] overflow-hidden">
                  <div className="divide-y divide-outline-variant/30">
                    {nextUpMatches.map((match) => (
                      <div
                        key={`${match.time}-${match.teamA}`}
                        className="p-6 hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-center gap-6 group"
                      >
                        <div
                          className={`md:w-20 flex flex-col items-center justify-center bg-surface-container-high rounded-xl p-3 md:p-4 shrink-0 ${
                            !match.highlight ? "opacity-60" : ""
                          }`}
                        >
                          <span
                            className={`text-[24px] font-semibold font-extrabold ${
                              match.highlight
                                ? "text-primary"
                                : "text-on-surface-variant"
                            }`}
                          >
                            {match.time}
                          </span>
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                            {match.day}
                          </span>
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 bg-surface-bright p-3 rounded-lg border border-outline-variant/10">
                            <span className="text-primary material-symbols-outlined text-xl">
                              group
                            </span>
                            <span className="text-[16px] font-bold text-on-surface">
                              {match.teamA}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 bg-surface-bright p-3 rounded-lg border border-outline-variant/10">
                            <span className="text-primary material-symbols-outlined text-xl">
                              group
                            </span>
                            <span className="text-[16px] font-bold text-on-surface">
                              {match.teamB}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-xs font-black text-on-surface bg-surface-variant/40 px-4 py-2 rounded-full border border-outline-variant/20 uppercase tracking-tighter">
                            {match.venue}
                          </span>
                          <button
                            type="button"
                            className="text-[10px] font-bold text-primary uppercase underline opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Recent Results & Stats */}
            <div className="lg:col-span-4 space-y-8">
              {/* Recent Results */}
              <section>
                <h2 className="text-[24px] font-semibold leading-[1.4] text-on-surface mb-6 flex items-center gap-2">
                  <span className="w-2 h-8 bg-surface-dim rounded-full" />
                  Recent Results
                </h2>
                <div className="space-y-4">
                  {recentResults.map((result) => (
                    <div
                      key={`${result.label}-${result.winner}`}
                      className="bg-white rounded-2xl p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-[#F1F5F9] hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span
                          className={`${result.labelBg} ${result.labelText} text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider`}
                        >
                          {result.label}
                        </span>
                        <span className="text-[14px] font-bold text-on-surface">
                          {result.score}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="material-symbols-outlined text-primary text-sm"
                            style={{
                              fontVariationSettings: "'FILL' 1",
                            }}
                          >
                            emoji_events
                          </span>
                          <span className="text-[14px] font-bold text-on-surface">
                            {result.winner}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 opacity-50">
                          <span className="material-symbols-outlined text-on-surface-variant text-sm">
                            close
                          </span>
                          <span className="text-[14px] font-medium text-on-surface">
                            {result.loser}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Stats */}
              <section>
                <h2 className="text-[24px] font-semibold leading-[1.4] text-on-surface mb-6 flex items-center gap-2">
                  <span className="w-2 h-8 bg-primary-container rounded-full" />
                  Quick Stats
                </h2>
                <div className="bg-white rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-[#F1F5F9] space-y-6">
                  {[
                    {
                      icon: "sports_tennis",
                      label: "Total Matches",
                      value: "32",
                      sub: "8 remaining",
                    },
                    {
                      icon: "timer",
                      label: "Avg. Match Duration",
                      value: "1h 24m",
                      sub: "across all courts",
                    },
                    {
                      icon: "trending_up",
                      label: "Longest Rally",
                      value: "42 shots",
                      sub: "Federer vs Nadal",
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary">
                          {stat.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">
                          {stat.label}
                        </p>
                        <p className="text-[24px] font-bold text-on-surface leading-tight">
                          {stat.value}
                        </p>
                        <p className="text-[12px] text-on-surface-variant">
                          {stat.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex md:hidden justify-center items-center px-4 py-2 bg-surface shadow-[0px_-4px_20px_rgba(0,0,0,0.04)]">
        <Link
          href="/"
          className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="text-[12px] font-semibold">Home</span>
        </Link>
      </nav>
    </>
  );
}
