"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getCurrentTournament, type Tournament } from "@/lib/tuwagaApi";

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
  const sectionsRef = useRef<HTMLElement[]>([]);
  const parallaxRef = useRef<HTMLElement[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);

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
    let active = true;

    getCurrentTournament()
      .then((current) => {
        if (active) setTournament(current);
      })
      .catch(() => {
        if (active) setTournament(null);
      });

    return () => {
      active = false;
    };
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
    <>
      <Navbar />

      <main className="pt-16">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white">
          <div
            ref={(el) => addParallaxRef(el, 0)}
            data-speed="0.04"
            className="parallax-layer pointer-events-none absolute inset-x-0 top-0 h-full opacity-70"
          >
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(26,86,219,0.06)_0,rgba(26,86,219,0)_36%),linear-gradient(90deg,rgba(209,213,219,0.35)_1px,transparent_1px),linear-gradient(0deg,rgba(209,213,219,0.28)_1px,transparent_1px)] bg-[size:auto,72px_72px,72px_72px]" />
          </div>
          <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-20 md:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left — Copy */}
              <div className="relative z-10">
                <div className="hero-reveal hero-reveal-1 inline-flex items-center gap-2 bg-primary/[0.06] text-primary px-4 py-1.5 rounded-full mb-6 motion-chip">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs font-semibold tracking-wide uppercase">
                    Tournament operations MVP
                  </span>
                </div>

                <h1 className="hero-reveal hero-reveal-2 text-4xl md:text-[52px] font-extrabold leading-[1.1] tracking-tight text-on-surface mb-6">
                  Live scoring.
                  <br />
                  <span className="text-primary">Brackets. Referees.</span>
                </h1>

                <p className="hero-reveal hero-reveal-3 text-base md:text-lg leading-relaxed text-on-surface-variant max-w-md mb-8">
                  TUWAGA helps organizers run match scoring, bracket updates,
                  and referee workflows from one sport-ready platform.
                </p>
              </div>

              {/* Right — Hero image */}
              <div
                ref={(el) => addParallaxRef(el, 1)}
                data-speed="-0.075"
                className="parallax-layer relative z-10"
              >
                <div className="hero-image-reveal relative overflow-hidden rounded-2xl shadow-[0px_24px_80px_rgba(17,24,39,0.16)] animate-hero-card">
                  <Image
                    src="/tuwaga-hero.png"
                    alt="TUWAGA live tournament operations platform"
                    width={560}
                    height={420}
                    style={{ width: "100%", height: "auto" }}
                    className="object-cover"
                    priority
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10" />
                </div>
                <div className="motion-float motion-pop-in absolute -left-4 top-8 hidden rounded-xl border border-outline-variant/40 bg-white/90 px-4 py-3 shadow-[0px_14px_40px_rgba(17,24,39,0.12)] backdrop-blur md:block">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Live court
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-primary">
                    24 - 21
                  </p>
                </div>
                <div className="motion-float motion-float-delay motion-pop-in motion-pop-delay absolute -right-3 bottom-8 hidden rounded-xl border border-outline-variant/40 bg-white/90 px-4 py-3 shadow-[0px_14px_40px_rgba(17,24,39,0.12)] backdrop-blur md:block">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Bracket
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-on-surface">
                    Final ready
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Current Tournament ─────────────────────────────────── */}
        <section
          ref={(el) => addRef(el, 0)}
          className="py-20 md:py-28 bg-background"
        >
          <div className="max-w-[1200px] mx-auto px-6 md:px-10">
            <div className="mb-10">
              <div>
                <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">
                  Current tournament
                </p>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">
                  One tournament for the MVP
                </h2>
                <p className="text-base leading-relaxed text-on-surface-variant mt-3 max-w-2xl">
                  The tournament list is intentionally paused for now. This
                  single event gives the frontend a stable place for live
                  scoring, brackets, and registration while the CRUD backend is
                  built.
                </p>
              </div>
            </div>

            <div
              ref={(el) => addParallaxRef(el, 2)}
              data-speed="-0.035"
              className="parallax-layer bg-white rounded-xl border border-outline-variant/30 overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.04)] motion-card"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
                <div className="relative min-h-64 overflow-hidden">
                  <Image
                    src={tournament?.heroImageUrl ?? "/arena.png"}
                    alt={tournament?.name ?? "Tournament venue"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 bg-primary text-on-primary px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                    {tournament?.status ?? "No backend tournament"}
                  </span>
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium mb-3">
                    <span className="material-symbols-outlined text-sm">
                      calendar_today
                    </span>
                    {tournament?.dateLabel ?? "Create a tournament in admin"}
                  </div>
                  <h4 className="text-2xl md:text-3xl font-extrabold text-on-surface mb-2 leading-tight">
                    {tournament?.name ?? "No tournament loaded"}
                  </h4>
                  <p className="text-sm text-on-surface-variant flex items-center gap-1 mb-5">
                    <span className="material-symbols-outlined text-sm">
                      location_on
                    </span>
                    {tournament?.venue ?? "Backend data unavailable"}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <div className="rounded-lg bg-surface-container-low p-4">
                      <span className="material-symbols-outlined text-primary mb-2">
                        group
                      </span>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Capacity
                      </p>
                      <p className="text-lg font-bold text-on-surface">
                        {tournament
                          ? `${tournament.settings.maxPlayers} players`
                          : "No data"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-container-low p-4">
                      <span className="material-symbols-outlined text-secondary mb-2">
                        verified
                      </span>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Status
                      </p>
                      <p className="text-lg font-bold text-on-surface">
                        {tournament?.status ?? "Waiting for backend"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/tournaments/live"
                      className="bg-primary text-on-primary h-11 px-5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        scoreboard
                      </span>
                      Live Scoring
                    </Link>
                    <Link
                      href="/tournaments/bracket"
                      className="border border-outline-variant text-on-surface h-11 px-5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        account_tree
                      </span>
                      Bracket
                    </Link>
                    <Link
                      href="/register"
                      className="border border-outline-variant text-on-surface h-11 px-5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        how_to_reg
                      </span>
                      Register
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Platform Workflow ──────────────────────────────────── */}
        <section
          ref={(el) => addRef(el, 1)}
          className="py-20 md:py-28 bg-white border-y border-outline-variant/20"
        >
          <div className="max-w-[1200px] mx-auto px-6 md:px-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">
                How it works
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-4">
                Built for tournament operations
              </h2>
              <p className="text-base leading-relaxed text-on-surface-variant">
                Start with the operational core: referees score matches,
                audiences follow live results, and brackets move forward without
                manual recaps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((s) => (
                <div
                  key={s.step}
                  className="relative bg-background rounded-xl p-8 border border-outline-variant/20 hover:border-primary/20 hover:shadow-md transition-all duration-300 group text-center motion-card"
                >
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-primary/[0.06] rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform duration-300">
                        {s.icon}
                      </span>
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-primary text-on-primary rounded-md flex items-center justify-center text-[10px] font-extrabold">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
