"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import type { AdminTournament } from "@/lib/adminTournaments";

const storageKey = "tuwaga-admin-tournaments";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readStoredTournaments(): AdminTournament[] {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];

    return JSON.parse(stored) as AdminTournament[];
  } catch {
    return [];
  }
}

export default function NewTournamentPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    venue: "",
    date: "",
    description: "",
    maxPlayers: 64,
    waitlistLimit: 12,
    courts: 4,
    matchDuration: 30,
    teamSize: "Doubles",
    format: "Group stage + knockout",
  });

  const updateForm = (field: keyof typeof form, value: string | number) => {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const createTournament = () => {
    const id = slugify(form.name);

    if (!id || !form.venue.trim() || !form.date.trim()) {
      setError("Tournament name, venue, and date are required.");
      return;
    }

    const storedTournaments = readStoredTournaments();
    const tournament: AdminTournament = {
      id,
      name: form.name.trim(),
      venue: form.venue.trim(),
      date: form.date.trim(),
      status: "setup",
      description:
        form.description.trim() ||
        "New tournament control room ready for registration setup.",
      settings: {
        maxPlayers: form.maxPlayers,
        waitlistLimit: form.waitlistLimit,
        courts: form.courts,
        matchDuration: form.matchDuration,
        teamSize: form.teamSize,
        format: form.format,
      },
    };

    window.localStorage.setItem(
      storageKey,
      JSON.stringify([
        tournament,
        ...storedTournaments.filter((item) => item.id !== tournament.id),
      ]),
    );

    router.push(`/admin/tournaments/${tournament.id}`);
  };

  return (
    <>
      <Navbar active="admin" />

      <main className="min-h-screen bg-background pt-16">
        <section className="border-b border-outline-variant/20 bg-white">
          <div className="mx-auto max-w-[960px] px-6 py-10 md:px-10">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
              Create tournament
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant md:text-base">
              Start a new tournament control room with registration capacity,
              court allocation, and match rules.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[960px] px-6 py-8 md:px-10">
          {error && (
            <div className="mb-5 rounded-lg border border-error/20 bg-error-container p-4 text-sm font-semibold text-on-error-container">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-lg">error</span>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
              <h2 className="text-lg font-extrabold text-on-surface">
                Tournament details
              </h2>
              <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Tournament name
                  </span>
                  <input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Jakarta Summer Open"
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Venue
                    </span>
                    <input
                      value={form.venue}
                      onChange={(event) =>
                        updateForm("venue", event.target.value)
                      }
                      placeholder="Main Arena"
                      className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Date
                    </span>
                    <input
                      value={form.date}
                      onChange={(event) =>
                        updateForm("date", event.target.value)
                      }
                      placeholder="July 2026"
                      className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Description
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    rows={4}
                    placeholder="Describe tournament purpose and operating notes."
                    className="mt-2 w-full resize-none rounded-lg border border-outline-variant/50 bg-white px-3 py-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>
              </div>
            </div>

            <aside className="rounded-lg border border-outline-variant/30 bg-white p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
              <h2 className="text-lg font-extrabold text-on-surface">
                Match setup
              </h2>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Maximum players
                  </span>
                  <input
                    type="number"
                    min="8"
                    max="256"
                    value={form.maxPlayers}
                    onChange={(event) =>
                      updateForm("maxPlayers", Number(event.target.value))
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Waitlist limit
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="128"
                    value={form.waitlistLimit}
                    onChange={(event) =>
                      updateForm("waitlistLimit", Number(event.target.value))
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Active courts
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={form.courts}
                    onChange={(event) =>
                      updateForm("courts", Number(event.target.value))
                    }
                    className="mt-3 w-full accent-primary"
                  />
                  <span className="mt-1 block text-sm font-bold text-primary">
                    {form.courts} courts
                  </span>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Match duration
                  </span>
                  <select
                    value={form.matchDuration}
                    onChange={(event) =>
                      updateForm("matchDuration", Number(event.target.value))
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Match format
                  </span>
                  <select
                    value={form.format}
                    onChange={(event) =>
                      updateForm("format", event.target.value)
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option>Group stage + knockout</option>
                    <option>Single elimination</option>
                    <option>Round robin</option>
                    <option>Swiss pairing</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={createTournament}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Create control room
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
