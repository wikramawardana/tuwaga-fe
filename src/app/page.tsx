"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { listTournaments, type Tournament } from "@/lib/tuwagaApi";

// ─── Data ────────────────────────────────────────────────────────────────────

const steps = [
  {
    step: "01",
    title: "Referee scoring",
    description:
      "Give court officials a focused scoring surface for points, sets, match status, and match flow.",
    icon: "edit_note",
  },
  {
    step: "02",
    title: "Live scoreboards",
    description:
      "Publish real-time match updates so organizers, players, and spectators see the same source of truth.",
    icon: "scoreboard",
  },
  {
    step: "03",
    title: "Bracket tracking",
    description:
      "Track winners, upcoming rounds, and finals progression from a single tournament bracket.",
    icon: "account_tree",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [latestTournament, setLatestTournament] = useState<Tournament | null>(
    null,
  );
  const sectionsRef = useRef<HTMLElement[]>([]);
  const parallaxRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    let active = true;
    listTournaments()
      .then((tournaments) => {
        if (!active) return;
        const open =
          tournaments.find(
            (t) => t.status === "registration" || t.status === "setup",
          ) ?? tournaments[0];
        setLatestTournament(open ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const sections = sectionsRef.current.filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.08 },
    );
    sections.forEach((s) => {
      s.style.opacity = "0";
      s.style.transform = "translateY(24px)";
      s.style.transition =
        "opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1)";
      observer.observe(s);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) return;

    let frame = 0;
    const updateParallax = () => {
      frame = 0;
      const scrollY = window.scrollY;
      parallaxRef.current.filter(Boolean).forEach((el) => {
        const speed = Number(el.dataset.speed ?? "0.08");
        el.style.setProperty("--parallax-y", `${scrollY * speed}px`);
      });
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const addRef = (el: HTMLElement | null, i: number) => {
    if (el) sectionsRef.current[i] = el;
  };

  const addParallaxRef = (el: HTMLElement | null, i: number) => {
    if (el) parallaxRef.current[i] = el;
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white">
          <div
            ref={(el) => addParallaxRef(el, 0)}
            data-speed="0.04"
            className="parallax-layer pointer-events-none absolute inset-x-0 top-0 h-full opacity-70"
          >
            <div className="hero-grid absolute inset-0" />
          </div>
          <div className="mx-auto max-w-[1200px] px-6 py-20 md:px-10 md:py-28">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
              {/* Left — Copy */}
              <div className="relative z-10">
                <div className="hero-reveal hero-reveal-1 mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.08] px-4 py-1.5 text-primary motion-chip">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Tuwaga Skor · Sports Operations
                  </span>
                </div>

                <h1 className="hero-reveal hero-reveal-2 mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-[54px]">
                  Live scoring.
                  <br />
                  <span className="text-primary">Brackets. Referees.</span>
                </h1>

                <p className="hero-reveal hero-reveal-3 mb-8 max-w-md text-base leading-relaxed text-slate-600 md:text-lg">
                  Tuwaga Skor helps tournament organizers run real-time match
                  scoring, dynamic bracket updates, and referee workflows from
                  one modern, calm platform.
                </p>

                <div className="hero-reveal hero-reveal-3 flex flex-wrap gap-3">
                  <Link
                    href="/tournaments/live"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary/90"
                  >
                    <span className="material-symbols-outlined text-lg">
                      scoreboard
                    </span>
                    Live Scoring
                  </Link>
                  <Link
                    href="/tournaments/bracket"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <span className="material-symbols-outlined text-lg">
                      account_tree
                    </span>
                    Bracket
                  </Link>
                  <Link
                    href="/login?callbackUrl=/admin"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <span className="material-symbols-outlined text-lg">
                      space_dashboard
                    </span>
                    Organizer Workspace
                  </Link>
                </div>

                {latestTournament && (
                  <div className="hero-reveal hero-reveal-3 mt-8 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 p-5 shadow-[0_8px_30px_rgba(37,99,235,0.06)] transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-100/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                        Pendaftaran Dibuka ·{" "}
                        {latestTournament.settings?.sport === "padel"
                          ? "🎾 Padel"
                          : "Turnamen"}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {latestTournament.dateLabel}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-lg font-black text-slate-900">
                      {latestTournament.name}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500">
                      <span className="material-symbols-outlined text-sm text-slate-400">
                        location_on
                      </span>
                      {latestTournament.venue}
                    </p>

                    {latestTournament.settings?.categories &&
                      latestTournament.settings.categories.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {latestTournament.settings.categories.map((cat) => (
                            <span
                              key={cat}
                              className="rounded-md border border-slate-200/80 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-2xs"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}

                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/tournaments/${latestTournament.slug}/register`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                      >
                        <span className="material-symbols-outlined text-base">
                          how_to_reg
                        </span>
                        Daftar Tim Sekarang
                      </Link>
                      <Link
                        href={`/tournaments/bracket?tournament=${latestTournament.slug}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <span className="material-symbols-outlined text-base text-slate-400">
                          account_tree
                        </span>
                        Bagan & Info
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Right — Hero image */}
              <div
                ref={(el) => addParallaxRef(el, 1)}
                data-speed="-0.075"
                className="parallax-layer relative z-10"
              >
                <div className="hero-image-reveal animate-hero-card relative overflow-hidden rounded-2xl shadow-[0px_24px_80px_rgba(17,24,39,0.12)]">
                  <Image
                    src="/tuwaga-hero.png"
                    alt="TUWAGA SKOR live tournament operations platform"
                    width={560}
                    height={420}
                    style={{ width: "100%", height: "auto" }}
                    className="object-cover"
                    priority
                    unoptimized
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10" />
                </div>
                <div className="motion-float motion-pop-in absolute -left-4 top-8 hidden rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0px_14px_40px_rgba(17,24,39,0.1)] backdrop-blur md:block">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Live court
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-primary">
                    24 - 21
                  </p>
                </div>
                <div className="motion-float motion-float-delay motion-pop-in motion-pop-delay absolute -right-3 bottom-8 hidden rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0px_14px_40px_rgba(17,24,39,0.1)] backdrop-blur md:block">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Bracket
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">
                    Final ready
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Platform Workflow ──────────────────────────────────── */}
        <section
          ref={(el) => addRef(el, 0)}
          className="border-t border-slate-200/80 bg-slate-50/60 py-20 md:py-28"
        >
          <div className="mx-auto max-w-[1200px] px-6 md:px-10">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                How it works
              </p>
              <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Built for tournament operations
              </h2>
              <p className="text-base leading-relaxed text-slate-600">
                Tuwaga Skor handles the operational core: referees score matches
                right from the court, spectators follow live results, and
                brackets advance seamlessly without manual recaps.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <div
                  key={s.step}
                  className="motion-card group relative rounded-2xl border border-slate-200 bg-white p-8 text-center transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="relative mb-6 inline-flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/[0.08] transition-colors group-hover:bg-primary/[0.14]">
                      <span className="material-symbols-outlined text-3xl text-primary transition-transform duration-300 group-hover:scale-110">
                        {s.icon}
                      </span>
                    </div>
                    <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-extrabold text-white">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Product Call to Action ──────────────────────────────── */}
        <section
          ref={(el) => addRef(el, 1)}
          className="border-t border-slate-200/80 bg-white py-16 md:py-24"
        >
          <div className="mx-auto max-w-[1200px] px-6 md:px-10">
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/70 to-blue-50/20 p-8 text-center md:p-14">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-xs">
                Ready for match day
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Ready to elevate your tournament experience?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-600">
                Empower your referees, delight your players, and broadcast live
                scores effortlessly with Tuwaga Skor.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/login?callbackUrl=/admin"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-xs transition hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-lg">
                    rocket_launch
                  </span>
                  Sign in to Workspace
                </Link>
                <Link
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <span className="material-symbols-outlined text-lg text-emerald-600">
                    chat
                  </span>
                  Talk with Tuwaga Team
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
