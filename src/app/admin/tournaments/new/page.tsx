"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import DateRangePicker, { formatDateRange } from "@/components/DateRangePicker";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  createDivisionLabel,
  DIVISION_SKILL_LEVELS,
  type DivisionSkillLevel,
} from "@/lib/matchDivisions";
import { createTournament as createTournamentRequest } from "@/lib/tuwagaApi";

function RequiredMark() {
  return (
    <span className="ml-1 text-error" aria-hidden="true">
      *
    </span>
  );
}

export default function NewTournamentPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([
    "Men's Doubles — Intermediate",
    "Women's Doubles — Intermediate",
    "Mixed Doubles — Intermediate",
  ]);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryLevel, setNewCategoryLevel] =
    useState<DivisionSkillLevel>("intermediate");
  const [form, setForm] = useState({
    name: "",
    venue: "",
    startsAt: "",
    endsAt: "",
    description: "",
    entryFeePerPair: 250000,
    currency: "IDR",
    maxPlayers: 64,
    waitlistLimit: 12,
    courts: 4,
    matchDuration: 30,
    teamSize: "Doubles",
    format: "Group stage + knockout",
  });

  const addCategory = () => {
    const division = createDivisionLabel(newCategory, newCategoryLevel);
    if (division && !categories.includes(division)) {
      setCategories((prev) => [...prev, division]);
      setNewCategory("");
    }
  };

  const removeCategory = (cat: string) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
  };

  const updateForm = (field: keyof typeof form, value: string | number) => {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const createTournament = async () => {
    if (
      !form.name.trim() ||
      !form.venue.trim() ||
      !form.startsAt ||
      !form.endsAt
    ) {
      setError(
        "Tournament name, venue, start date, and end date are required.",
      );
      return;
    }

    if (form.endsAt < form.startsAt) {
      setError("End date must be the same as or later than start date.");
      return;
    }

    setSubmitting(true);
    try {
      const tournament = await createTournamentRequest({
        name: form.name.trim(),
        venue: form.venue.trim(),
        dateLabel: formatDateRange(form.startsAt, form.endsAt),
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        description: form.description.trim() || undefined,
        entryFeePerPair: form.entryFeePerPair,
        currency: form.currency,
        maxPlayers: form.maxPlayers,
        waitlistLimit: form.waitlistLimit,
        courts: form.courts,
        matchDuration: form.matchDuration,
        teamSize: form.teamSize,
        format: form.format,
        categories,
      });
      router.push(`/admin/tournaments/${tournament.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create tournament.",
      );
    } finally {
      setSubmitting(false);
    }
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
                    <RequiredMark />
                  </span>
                  <input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Jakarta Summer Open"
                    required
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Venue
                      <RequiredMark />
                    </span>
                    <input
                      value={form.venue}
                      onChange={(event) =>
                        updateForm("venue", event.target.value)
                      }
                      placeholder="Main Arena"
                      required
                      className="mt-2 h-11 w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Date range
                      <RequiredMark />
                    </span>
                    <DateRangePicker
                      startsAt={form.startsAt}
                      endsAt={form.endsAt}
                      onChange={(startsAt, endsAt) => {
                        setError("");
                        setForm((current) => ({
                          ...current,
                          startsAt,
                          endsAt,
                        }));
                      }}
                    />
                  </div>
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
                    Entry price per player
                  </span>
                  <div className="mt-2 grid grid-cols-[86px_1fr] overflow-hidden rounded-lg border border-outline-variant/50 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                    <select
                      value={form.currency}
                      onChange={(event) =>
                        updateForm("currency", event.target.value)
                      }
                      className="h-11 border-outline-variant/50 border-r bg-surface-container-low px-3 text-sm font-bold text-on-surface outline-none"
                    >
                      <option value="IDR">IDR</option>
                      <option value="USD">USD</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={form.entryFeePerPair}
                      onChange={(event) =>
                        updateForm(
                          "entryFeePerPair",
                          Number(event.target.value),
                        )
                      }
                      className="h-11 w-full bg-white px-3 text-sm font-semibold text-on-surface outline-none"
                    />
                  </div>
                </label>

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

                <div className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Match divisions
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/8 px-3 py-1.5 text-sm font-bold text-primary"
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={() => removeCategory(cat)}
                          className="flex h-4 w-4 items-center justify-center rounded-full text-primary/60 transition-colors hover:bg-primary/15 hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            close
                          </span>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      value={newCategory}
                      onChange={(event) => setNewCategory(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCategory();
                        }
                      }}
                      placeholder="e.g. Men's Doubles"
                      className="h-10 min-w-[180px] flex-1 rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                    <select
                      value={newCategoryLevel}
                      onChange={(event) =>
                        setNewCategoryLevel(
                          event.target.value as DivisionSkillLevel,
                        )
                      }
                      className="h-10 w-[160px] max-w-full rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      {DIVISION_SKILL_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addCategory}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                    >
                      <span className="material-symbols-outlined text-lg">
                        add
                      </span>
                      Add
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Each division combines match category and competition level.
                    Teams choose one division during registration.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={createTournament}
                  disabled={submitting}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  {submitting ? "Creating..." : "Create control room"}
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
