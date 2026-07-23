"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { createTournament as createTournamentRequest } from "@/lib/tuwagaApi";

function RequiredMark() {
  return (
    <span className="ml-1 text-error" aria-hidden="true">
      *
    </span>
  );
}

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (startDate === endDate) {
    return formatter.format(start);
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const weekdays = [
  ["sun", "S"],
  ["mon", "M"],
  ["tue", "T"],
  ["wed", "W"],
  ["thu", "T"],
  ["fri", "F"],
  ["sat", "S"],
] as const;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function calendarDays(monthDate: Date) {
  const firstOfMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1,
  );
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      key: toDateKey(date),
      label: date.getDate(),
      currentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

export default function NewTournamentPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [categories, setCategories] = useState<string[]>([
    "Men's Doubles",
    "Women's Doubles",
    "Mixed Doubles",
  ]);
  const [newCategory, setNewCategory] = useState("");
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
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
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

  const selectDate = (dateKey: string) => {
    setError("");
    setForm((current) => {
      if (!current.startsAt || current.endsAt) {
        return { ...current, startsAt: dateKey, endsAt: "" };
      }

      if (dateKey < current.startsAt) {
        setDatePickerOpen(false);
        return { ...current, startsAt: dateKey, endsAt: current.startsAt };
      }

      setDatePickerOpen(false);
      return { ...current, endsAt: dateKey };
    });
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
                  <div className="relative">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Date range
                      <RequiredMark />
                    </span>
                    <button
                      type="button"
                      onClick={() => setDatePickerOpen((current) => !current)}
                      className="mt-2 flex h-11 w-full items-center justify-between rounded-lg border border-outline-variant/50 bg-white px-3 text-left text-sm font-semibold text-on-surface outline-none transition-colors hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <span
                        className={
                          form.startsAt &&
                          form.endsAt &&
                          form.endsAt >= form.startsAt
                            ? "text-on-surface"
                            : "text-on-surface-variant"
                        }
                      >
                        {form.startsAt &&
                        form.endsAt &&
                        form.endsAt >= form.startsAt
                          ? formatDateRange(form.startsAt, form.endsAt)
                          : "Select date range"}
                      </span>
                      <span className="material-symbols-outlined text-lg text-on-surface-variant">
                        date_range
                      </span>
                    </button>

                    {datePickerOpen && (
                      <div className="absolute right-0 z-20 mt-2 w-[320px] max-w-[calc(100vw-3rem)] rounded-lg border border-outline-variant/40 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              setVisibleMonth((current) =>
                                addMonths(current, -1),
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
                            aria-label="Previous month"
                          >
                            <span className="material-symbols-outlined text-xl">
                              chevron_left
                            </span>
                          </button>
                          <p className="text-sm font-extrabold text-on-surface">
                            {monthFormatter.format(visibleMonth)}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setVisibleMonth((current) =>
                                addMonths(current, 1),
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
                            aria-label="Next month"
                          >
                            <span className="material-symbols-outlined text-xl">
                              chevron_right
                            </span>
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-on-surface-variant">
                          {weekdays.map(([key, label]) => (
                            <span key={key}>{label}</span>
                          ))}
                        </div>

                        <div className="mt-2 grid grid-cols-7 gap-1">
                          {calendarDays(visibleMonth).map((day) => {
                            const isStart = day.key === form.startsAt;
                            const isEnd = day.key === form.endsAt;
                            const isInRange =
                              form.startsAt &&
                              form.endsAt &&
                              day.key > form.startsAt &&
                              day.key < form.endsAt;

                            return (
                              <button
                                key={day.key}
                                type="button"
                                onClick={() => selectDate(day.key)}
                                className={`h-9 rounded-lg text-sm font-bold transition-colors ${
                                  isStart || isEnd
                                    ? "bg-primary text-on-primary"
                                    : isInRange
                                      ? "bg-primary/10 text-primary"
                                      : day.currentMonth
                                        ? "text-on-surface hover:bg-surface-container-low"
                                        : "text-on-surface-variant/50 hover:bg-surface-container-low"
                                }`}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-outline-variant/20 pt-3">
                          <p className="min-w-0 text-xs font-semibold text-on-surface-variant">
                            {form.startsAt && form.endsAt
                              ? formatDateRange(form.startsAt, form.endsAt)
                              : form.startsAt
                                ? "Select an end date"
                                : "Select a start date"}
                          </p>
                          <button
                            type="button"
                            onClick={() => setDatePickerOpen(false)}
                            className="h-9 rounded-lg bg-primary px-4 text-xs font-bold text-on-primary transition-colors hover:bg-primary/90"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
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
                    Categories
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
                  <div className="mt-3 flex gap-2">
                    <input
                      value={newCategory}
                      onChange={(event) => setNewCategory(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCategory();
                        }
                      }}
                      placeholder="Add category..."
                      className="h-10 flex-1 rounded-lg border border-outline-variant/50 bg-white px-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
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
                    Players will choose from these categories during
                    registration.
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
