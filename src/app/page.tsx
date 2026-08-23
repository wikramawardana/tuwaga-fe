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
  const sectionsRef = useRef<HTMLElement[]>([]);
  const parallaxRef = useRef<HTMLElement[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

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

    listTournaments()
      .then((items) => {
        if (active) setTournaments(items.filter((t) => t.status !== "setup"));
      })
      .catch(() => {
        if (active) setTournaments([]);
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

      <main className="neo-public pt-16">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="public-hero">
          <div
            ref={(el) => addParallaxRef(el, 0)}
            data-speed="0.04"
            className="parallax-layer public-dots pointer-events-none absolute inset-x-0 top-0 h-full opacity-20"
          >
            <div className="absolute -bottom-20 left-[42%] h-56 w-56 -rotate-12 border-4 border-[#07142f] bg-[#ffe45c]" />
          </div>
          <div className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 md:py-28">
            <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
              {/* Left — Copy */}
              <div className="relative z-10">
                <div className="public-kicker hero-reveal hero-reveal-1 mb-7 motion-chip">
                  <span className="h-2 w-2 rounded-full bg-[#07142f]" />
                  Indonesia&apos;s tournament playground
                </div>

                <h1 className="public-title hero-reveal hero-reveal-2 mb-7 text-5xl uppercase text-white md:text-7xl xl:text-8xl">
                  Your match.
                  <span className="mt-2 block w-fit -rotate-1 border-4 border-[#07142f] bg-[#55dfff] px-3 py-2 text-[#07142f] shadow-[7px_7px_0_#07142f]">
                    Live now.
                  </span>
                </h1>

                <p className="hero-reveal hero-reveal-3 mb-8 max-w-xl border-l-4 border-[#ffe45c] pl-5 text-base font-bold leading-relaxed text-white md:text-lg">
                  Follow scores, see who plays next, track the bracket, and
                  register your team from one loud, clear tournament hub.
                </p>
                <div className="hero-reveal hero-reveal-3 flex flex-wrap gap-3">
                  <Link
                    href="/tournaments/live"
                    className="public-button inline-flex h-12 items-center gap-2 bg-[#ffe45c] px-5 text-sm font-black uppercase text-[#07142f]"
                  >
                    <span className="material-symbols-outlined">sensors</span>
                    Watch live
                  </Link>
                  <Link
                    href="/register"
                    className="public-button inline-flex h-12 items-center gap-2 bg-white px-5 text-sm font-black uppercase text-[#07142f]"
                  >
                    Register team
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>

              {/* Right — Hero image */}
              <div
                ref={(el) => addParallaxRef(el, 1)}
                data-speed="-0.075"
                className="parallax-layer relative z-10"
              >
                <div className="public-image-frame hero-image-reveal relative overflow-hidden animate-hero-card">
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
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/15 via-transparent to-cyan-300/10" />
                </div>
                <div className="motion-float motion-pop-in absolute -left-5 top-8 hidden rotate-[-3deg] border-3 border-[#07142f] bg-white px-4 py-3 text-[#07142f] shadow-[5px_5px_0_#07142f] md:block">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Live court
                  </p>
                  <p className="mt-1 text-2xl font-black text-blue-700">
                    24 - 21
                  </p>
                </div>
                <div className="motion-float motion-float-delay motion-pop-in motion-pop-delay absolute -right-3 bottom-8 hidden rotate-2 border-3 border-[#07142f] bg-[#ffe45c] px-4 py-3 text-[#07142f] shadow-[5px_5px_0_#07142f] md:block">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Bracket
                  </p>
                  <p className="mt-1 text-sm font-black">Final ready</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Current Tournament ─────────────────────────────────── */}
        <section ref={(el) => addRef(el, 0)} className="py-20 md:py-28">
          <div className="mx-auto max-w-[1400px] px-6 md:px-10">
            <div className="mb-10">
              <div>
                <p className="public-kicker mb-4">Tournaments</p>
                <h2 className="public-title text-4xl text-slate-950 md:text-5xl">
                  Available tournament rooms
                </h2>
                <p className="text-base leading-relaxed text-on-surface-variant mt-3 max-w-2xl">
                  Browse every tournament currently available from the backend
                  and jump into registration, live scoring, or bracket view.
                </p>
              </div>
            </div>

            {tournaments.length === 0 ? (
              <div className="public-panel bg-white p-8 text-sm font-bold text-slate-600">
                No tournament loaded from the backend yet.
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {tournaments.map((tournament, index) => (
                  <div
                    key={tournament.id}
                    ref={(el) => addParallaxRef(el, 2 + index)}
                    data-speed="-0.035"
                    className="public-panel parallax-layer overflow-hidden bg-white motion-card"
                  >
                    <div className="relative min-h-56 overflow-hidden border-b-3 border-[#07142f]">
                      <Image
                        src={tournament.heroImageUrl ?? "/arena.png"}
                        alt={tournament.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                      <span className="absolute left-4 top-4 border-2 border-[#07142f] bg-[#55dfff] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#07142f] shadow-[3px_3px_0_#07142f]">
                        {tournament.status}
                      </span>
                    </div>

                    <div className="p-6 md:p-7">
                      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">
                          calendar_today
                        </span>
                        {tournament.dateLabel}
                      </div>
                      <h4 className="mb-2 text-2xl font-extrabold leading-tight text-on-surface">
                        {tournament.name}
                      </h4>
                      <p className="mb-5 flex items-center gap-1 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">
                          location_on
                        </span>
                        {tournament.venue}
                      </p>

                      <div className="mb-6 grid grid-cols-1 gap-3">
                        <div className="public-stat bg-blue-50 p-4">
                          <span className="material-symbols-outlined mb-2 text-secondary">
                            verified
                          </span>
                          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Format
                          </p>
                          <p className="text-lg font-bold text-on-surface">
                            {tournament.settings.format}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                          href="/tournaments/live"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black uppercase text-white hover:bg-blue-700"
                        >
                          <span className="material-symbols-outlined text-lg">
                            scoreboard
                          </span>
                          Live Scoring
                        </Link>
                        <Link
                          href="/tournaments/bracket"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-200 px-5 text-sm font-black uppercase text-[#07142f] hover:bg-cyan-300"
                        >
                          <span className="material-symbols-outlined text-lg">
                            account_tree
                          </span>
                          Bracket
                        </Link>
                        <Link
                          href="/register"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-yellow-200 px-5 text-sm font-black uppercase text-[#07142f] hover:bg-yellow-300"
                        >
                          <span className="material-symbols-outlined text-lg">
                            how_to_reg
                          </span>
                          Register
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Platform Workflow ──────────────────────────────────── */}
        <section
          ref={(el) => addRef(el, 1)}
          className="border-y-4 border-[#07142f] bg-[#ffe45c] py-20 md:py-28"
        >
          <div className="mx-auto max-w-[1400px] px-6 md:px-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="public-kicker mb-4 bg-cyan-200">How it works</p>
              <h2 className="public-title mb-4 text-4xl text-slate-950 md:text-5xl">
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
                  className="public-panel group relative bg-white p-8 text-center transition-all duration-200 hover:-translate-y-1 motion-card"
                >
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded border-3 border-[#07142f] bg-cyan-100 transition-colors group-hover:bg-cyan-200">
                      <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform duration-300">
                        {s.icon}
                      </span>
                    </div>
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center border-2 border-[#07142f] bg-blue-600 text-[10px] font-black text-white shadow-[2px_2px_0_#07142f]">
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
