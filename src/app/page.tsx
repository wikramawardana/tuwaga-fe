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

      <main className="pt-16">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white">
          <div
            ref={(el) => addParallaxRef(el, 0)}
            data-speed="0.04"
            className="hero-grid parallax-layer pointer-events-none absolute inset-x-0 top-0 h-full opacity-60"
          />
          <div className="mx-auto max-w-[1200px] px-6 py-20 md:px-10 md:py-28">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
              {/* Left — Copy */}
              <div className="relative z-10">
                <div className="hero-reveal hero-reveal-1 mb-6 inline-flex items-center gap-2 rounded-full border border-[#E6E3DA] bg-[#0C0D11]/[0.04] px-4 py-1.5 motion-chip">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0D11] animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#0C0D11]">
                    Tournament operations MVP
                  </span>
                </div>

                <h1 className="hero-reveal hero-reveal-2 mb-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-[#0C0D11] md:text-[52px]">
                  Live scoring.
                  <br />
                  <span className="text-[#8C877D]">Brackets. Referees.</span>
                </h1>

                <p className="hero-reveal hero-reveal-3 mb-8 max-w-md text-base leading-relaxed text-[#5A5751] md:text-lg">
                  TUWAGA helps organizers run match scoring, bracket updates,
                  and referee workflows from one sport-ready platform.
                </p>

                <div className="hero-reveal hero-reveal-3 flex flex-wrap gap-3">
                  <Link
                    href="/tournaments/live"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0C0D11] px-6 text-sm font-semibold text-[#F5EEDB] shadow-xs transition-colors hover:bg-neutral-800"
                  >
                    <span className="material-symbols-outlined text-lg">
                      scoreboard
                    </span>
                    Live Scoring
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#E6E3DA] bg-white px-6 text-sm font-semibold text-[#0C0D11] shadow-xs transition-colors hover:bg-[#FAF9F6]"
                  >
                    <span className="material-symbols-outlined text-lg">
                      how_to_reg
                    </span>
                    Register
                  </Link>
                </div>
              </div>

              {/* Right — Hero image */}
              <div
                ref={(el) => addParallaxRef(el, 1)}
                data-speed="-0.075"
                className="parallax-layer relative z-10"
              >
                <div className="hero-image-reveal relative overflow-hidden rounded-2xl border border-[#E6E3DA] bg-white shadow-[0px_20px_50px_rgba(12,13,17,0.08)] animate-hero-card">
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
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0C0D11]/5 via-transparent to-transparent" />
                </div>
                <div className="motion-float motion-pop-in absolute -left-4 top-8 hidden rounded-xl border border-[#E6E3DA] bg-white/95 px-4 py-3 shadow-[0px_10px_30px_rgba(12,13,17,0.06)] backdrop-blur md:block">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C877D]">
                    Live court
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-[#0C0D11]">
                    24 - 21
                  </p>
                </div>
                <div className="motion-float motion-float-delay motion-pop-in motion-pop-delay absolute -right-3 bottom-8 hidden rounded-xl border border-[#E6E3DA] bg-white/95 px-4 py-3 shadow-[0px_10px_30px_rgba(12,13,17,0.06)] backdrop-blur md:block">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C877D]">
                    Bracket
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-[#0C0D11]">
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
          className="border-t border-[#E6E3DA] bg-[#FAF9F6] py-20 md:py-28"
        >
          <div className="mx-auto max-w-[1200px] px-6 md:px-10">
            <div className="mb-10">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#0C0D11]">
                  Tournaments
                </p>
                <h2 className="text-3xl font-extrabold tracking-tight text-[#0C0D11] md:text-4xl">
                  Available tournament rooms
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#5A5751]">
                  Browse every tournament currently available from the backend
                  and jump into registration, live scoring, or bracket view.
                </p>
              </div>
            </div>

            {tournaments.length === 0 ? (
              <div className="rounded-xl border border-[#E6E3DA] bg-white p-8 text-sm font-semibold text-[#5A5751] shadow-xs">
                No tournament loaded from the backend yet.
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {tournaments.map((tournament, index) => (
                  <div
                    key={tournament.id}
                    ref={(el) => addParallaxRef(el, 2 + index)}
                    data-speed="-0.035"
                    className="parallax-layer overflow-hidden rounded-xl border border-[#E6E3DA] bg-white shadow-xs transition-shadow hover:shadow-md motion-card"
                  >
                    <div className="relative min-h-56 overflow-hidden border-b border-[#E6E3DA]">
                      <Image
                        src={tournament.heroImageUrl ?? "/arena.png"}
                        alt={tournament.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                      <span className="absolute left-4 top-4 rounded-md bg-[#0C0D11] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#F5EEDB]">
                        {tournament.status}
                      </span>
                    </div>

                    <div className="p-6 md:p-7">
                      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[#8C877D]">
                        <span className="material-symbols-outlined text-sm">
                          calendar_today
                        </span>
                        {tournament.dateLabel}
                      </div>
                      <h4 className="mb-2 text-2xl font-bold leading-tight text-[#0C0D11]">
                        {tournament.name}
                      </h4>
                      <p className="mb-5 flex items-center gap-1 text-sm text-[#5A5751]">
                        <span className="material-symbols-outlined text-sm">
                          location_on
                        </span>
                        {tournament.venue}
                      </p>

                      <div className="mb-6 grid grid-cols-1 gap-3">
                        <div className="rounded-lg border border-[#E6E3DA] bg-[#FAF9F6] p-4">
                          <span className="material-symbols-outlined mb-2 text-[#0C0D11]">
                            verified
                          </span>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#8C877D]">
                            Format
                          </p>
                          <p className="text-lg font-bold text-[#0C0D11]">
                            {tournament.settings.format}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                          href="/tournaments/live"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0C0D11] px-5 text-sm font-semibold text-[#F5EEDB] transition-colors hover:bg-neutral-800"
                        >
                          <span className="material-symbols-outlined text-lg">
                            scoreboard
                          </span>
                          Live Scoring
                        </Link>
                        <Link
                          href="/tournaments/bracket"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#E6E3DA] bg-white px-5 text-sm font-semibold text-[#0C0D11] shadow-xs transition-colors hover:bg-neutral-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            account_tree
                          </span>
                          Bracket
                        </Link>
                        <Link
                          href="/register"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#E6E3DA] bg-white px-5 text-sm font-semibold text-[#0C0D11] shadow-xs transition-colors hover:bg-neutral-50"
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
          className="border-y border-[#E6E3DA] bg-white py-20 md:py-28"
        >
          <div className="mx-auto max-w-[1200px] px-6 md:px-10">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#0C0D11]">
                How it works
              </p>
              <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-[#0C0D11] md:text-4xl">
                Built for tournament operations
              </h2>
              <p className="text-base leading-relaxed text-[#5A5751]">
                Start with the operational core: referees score matches,
                audiences follow live results, and brackets move forward without
                manual recaps.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <div
                  key={s.step}
                  className="group relative rounded-xl border border-[#E6E3DA] bg-[#FAF9F6] p-8 text-center motion-card transition-all duration-300 hover:border-[#0C0D11]/30 hover:shadow-md"
                >
                  <div className="relative mb-6 inline-flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#0C0D11]/[0.05] transition-colors group-hover:bg-[#0C0D11]/10">
                      <span className="material-symbols-outlined text-3xl text-[#0C0D11] transition-transform duration-300 group-hover:scale-110">
                        {s.icon}
                      </span>
                    </div>
                    <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-[#0C0D11] text-[10px] font-extrabold text-[#F5EEDB]">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#0C0D11]">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#5A5751]">
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
