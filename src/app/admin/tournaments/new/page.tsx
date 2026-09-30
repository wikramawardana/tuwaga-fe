"use client";

import {
  CircleNotchIcon,
  GearSixIcon,
  IdentificationBadgeIcon,
  PlusIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
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
import {
  createTournament as createTournamentRequest,
  type TournamentFormat,
} from "@/lib/tuwagaApi";

function RequiredMark() {
  return (
    <span className="ml-1 text-rose-600" aria-hidden="true">
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
    format: "Group stage + knockout" as TournamentFormat,
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
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar active="admin" />

      <main className="flex-1 pt-16">
        <section className="border-b border-ink-200 bg-white">
          <div className="container-wide relative py-10 md:py-12">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-600">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Guided tournament setup
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">
              Create a new command center
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-ink-600 md:text-base">
              Set the tournament identity, operating capacity and match
              divisions. You can refine every rule later from the setup panel.
            </p>
          </div>
        </section>

        <section className="container-wide py-8 md:py-10">
          {error && (
            <div className="mb-5 rounded-lg border border-rose-600/20 bg-rose-100 p-4 text-sm font-semibold text-rose-900">
              <div className="flex items-start gap-3">
                <WarningCircleIcon
                  className="text-lg"
                  aria-hidden="true"
                  weight="bold"
                />
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="admin-rise rounded-2xl border border-ink-200 bg-white p-5 shadow-[0_16px_50px_rgba(23,23,23,0.06)] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <IdentificationBadgeIcon aria-hidden="true" weight="bold" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-ink-950">
                    Tournament details
                  </h2>
                  <p className="text-xs text-ink-500">
                    Identity and event timing
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    Tournament name
                    <RequiredMark />
                  </span>
                  <input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Jakarta Summer Open"
                    required
                    className="mt-2 h-11 w-full rounded-lg border border-ink-300/50 bg-white px-3 text-sm font-semibold text-ink-950 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
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
                      className="mt-2 h-11 w-full rounded-lg border border-ink-300/50 bg-white px-3 text-sm font-semibold text-ink-950 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    />
                  </label>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
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
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    Description
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    rows={4}
                    placeholder="Describe tournament purpose and operating notes."
                    className="mt-2 w-full resize-none rounded-lg border border-ink-300/50 bg-white px-3 py-3 text-sm font-semibold text-ink-950 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  />
                </label>
              </div>
            </div>

            <aside className="admin-rise sticky top-20 rounded-2xl border border-ink-200 bg-white p-5 shadow-[0_16px_50px_rgba(23,23,23,0.06)] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-200 text-ink-900">
                  <GearSixIcon aria-hidden="true" weight="bold" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-ink-950">
                    Match setup
                  </h2>
                  <p className="text-xs text-ink-500">
                    Capacity and draw defaults
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    Entry price per player
                  </span>
                  <div className="mt-2 grid grid-cols-[86px_1fr] overflow-hidden rounded-lg border border-ink-300/50 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10">
                    <select
                      value={form.currency}
                      onChange={(event) =>
                        updateForm("currency", event.target.value)
                      }
                      className="h-11 border-ink-300/50 border-r bg-ink-100 px-3 text-sm font-bold text-ink-950 outline-none"
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
                      className="h-11 w-full bg-white px-3 text-sm font-semibold text-ink-950 outline-none"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
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
                    className="mt-2 h-11 w-full rounded-lg border border-ink-300/50 bg-white px-3 text-sm font-semibold text-ink-950 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
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
                    className="mt-2 h-11 w-full rounded-lg border border-ink-300/50 bg-white px-3 text-sm font-semibold text-ink-950 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
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
                    className="mt-3 w-full accent-brand-500"
                  />
                  <span className="mt-1 block text-sm font-bold text-brand-600">
                    {form.courts} courts
                  </span>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    Match duration
                  </span>
                  <select
                    value={form.matchDuration}
                    onChange={(event) =>
                      updateForm("matchDuration", Number(event.target.value))
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-ink-300/50 bg-white px-3 text-sm font-semibold text-ink-950 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  >
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    Match format
                  </span>
                  <select
                    value={form.format}
                    onChange={(event) =>
                      updateForm(
                        "format",
                        event.target.value as TournamentFormat,
                      )
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-ink-300/50 bg-white px-3 text-sm font-semibold text-ink-950 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  >
                    <option>Group stage + knockout</option>
                    <option>Single elimination</option>
                    <option>Round robin</option>
                  </select>
                </label>

                <div className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    Match divisions
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/20 bg-brand-500/8 px-3 py-1.5 text-sm font-bold text-brand-600"
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={() => removeCategory(cat)}
                          className="flex h-4 w-4 items-center justify-center rounded-full text-brand-600/60 transition-colors hover:bg-brand-500/15 hover:text-brand-600"
                        >
                          <XIcon
                            className="text-[14px]"
                            aria-hidden="true"
                            weight="bold"
                          />
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
                      className="h-10 min-w-[180px] flex-1 rounded-lg border border-ink-300/50 bg-white px-3 text-sm font-semibold text-ink-950 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    />
                    <select
                      value={newCategoryLevel}
                      onChange={(event) =>
                        setNewCategoryLevel(
                          event.target.value as DivisionSkillLevel,
                        )
                      }
                      className="h-10 w-[160px] max-w-full rounded-lg border border-ink-300/50 bg-white px-3 text-sm font-semibold text-ink-950 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
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
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-500/10 px-3 text-sm font-bold text-brand-600 transition-colors hover:bg-brand-500/20"
                    >
                      <PlusIcon
                        className="text-lg"
                        aria-hidden="true"
                        weight="bold"
                      />
                      Add
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-ink-600">
                    Each division combines match category and competition level.
                    Teams choose one division during registration.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={createTournament}
                  disabled={submitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-extrabold text-ink-950 shadow-lg shadow-ink-950/10 transition hover:-translate-y-0.5 hover:bg-brand-400 disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting ? (
                    <CircleNotchIcon
                      className="admin-spin text-lg"
                      weight="bold"
                      aria-hidden="true"
                    />
                  ) : (
                    <PlusIcon
                      className="text-lg"
                      weight="bold"
                      aria-hidden="true"
                    />
                  )}
                  {submitting ? "Creating..." : "Create control room"}
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
