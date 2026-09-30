import type { Tournament } from "@/lib/tuwagaApi";

/*
 * The tournament the landing page promotes, plus the small formatting helpers
 * its hero poster and division band share. Safe on the server and the client.
 */

const statusPriority: Record<string, number> = {
  live: 4,
  registration: 3,
  setup: 2,
  completed: 1,
};

/** Live first, then the soonest upcoming, else the most recently finished. */
export function pickFeatured(tournaments: Tournament[]): Tournament | null {
  return (
    [...tournaments].sort((a, b) => {
      const byStatus =
        (statusPriority[b.status] ?? 0) - (statusPriority[a.status] ?? 0);
      if (byStatus !== 0) return byStatus;
      const startA = a.startsAt ?? "";
      const startB = b.startsAt ?? "";
      return a.status === "completed"
        ? startB.localeCompare(startA)
        : startA.localeCompare(startB);
    })[0] ?? null
  );
}

/**
 * Server-side fetch for the landing page. Returns null on any failure so the
 * page can fall back to fetching in the browser.
 */
export async function fetchFeaturedTournament(): Promise<Tournament | null> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  )?.replace(/\/$/, "");
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/tournaments`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const envelope = (await response.json()) as {
      data?: { tournaments?: Tournament[] };
    };
    return pickFeatured(envelope.data?.tournaments ?? []);
  } catch {
    return null;
  }
}

// Tournament dates are calendar days at the venue (Indonesia, WIB).
const VENUE_TIME_ZONE = "Asia/Jakarta";

function venueDate(day: string, time = "12:00") {
  const date = new Date(`${day.slice(0, 10)}T${time}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** First serve (the order-of-play start time on day one, 09:00 by default). */
export function tournamentStart(tournament: Tournament) {
  if (!tournament.startsAt) return null;
  const startTime = tournament.settings?.oop?.startTime;
  return venueDate(
    tournament.startsAt,
    /^\d{2}:\d{2}$/.test(startTime ?? "") ? startTime : "09:00",
  );
}

/** End of the last tournament day at the venue. */
export function tournamentEnd(tournament: Tournament) {
  const lastDay = tournament.endsAt || tournament.startsAt;
  return lastDay ? venueDate(lastDay, "23:59") : null;
}

/** Poster-style date: "07—08" + "November 2026". */
export function posterDate(tournament: Tournament) {
  if (!tournament.startsAt) return null;
  const start = venueDate(tournament.startsAt);
  const end = venueDate(tournament.endsAt || tournament.startsAt);
  if (!start || !end) return null;

  const part = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("id-ID", {
      timeZone: VENUE_TIME_ZONE,
      ...options,
    }).format(date);
  const day = (date: Date) => part(date, { day: "2-digit" });
  const sameMonth =
    part(start, { month: "numeric", year: "numeric" }) ===
    part(end, { month: "numeric", year: "numeric" });
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return {
      days: day(start),
      label: part(start, { month: "long", year: "numeric" }),
    };
  }
  if (sameMonth) {
    return {
      days: `${day(start)}—${day(end)}`,
      label: part(start, { month: "long", year: "numeric" }),
    };
  }
  const dayMonth = (date: Date) =>
    part(date, { day: "2-digit", month: "2-digit" });
  return {
    days: `${dayMonth(start)}—${dayMonth(end)}`,
    label: part(end, { year: "numeric" }),
  };
}

export function formatFee(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency || "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("id-ID")}`;
  }
}

export const statusCopy: Record<
  Tournament["status"],
  { label: string; live: boolean }
> = {
  registration: { label: "Pendaftaran dibuka", live: true },
  live: { label: "Sedang berlangsung", live: true },
  setup: { label: "Segera dibuka", live: false },
  completed: { label: "Turnamen selesai", live: false },
};

/** The single main action for a tournament, by its status. */
export function primaryAction(tournament: Tournament) {
  const slug = tournament.slug;
  switch (tournament.status) {
    case "registration":
      return {
        label: "Daftar Tim Sekarang",
        href: `/tournaments/${slug}/register`,
      };
    case "live":
      return {
        label: "Lihat Live Score",
        href: `/tournaments/live?tournament=${slug}`,
      };
    case "completed":
      return {
        label: "Lihat Hasil",
        href: `/tournaments/bracket?tournament=${slug}`,
      };
    default:
      return { label: "Buka Portal Turnamen", href: `/tournaments/${slug}` };
  }
}

/** Short audience tag for a division name, e.g. "Women", "Men", "U-14". */
export function divisionTag(division: string) {
  const name = division.toLowerCase();
  const youth = name.match(/\bku-?\s?(\d{1,2})\b/);
  if (youth) return `U-${youth[1]}`;
  if (/\bwomen\b|\bputri\b|\bladies\b/.test(name)) return "Women";
  if (/\bmen\b|\bmens\b|\bputra\b/.test(name)) return "Men";
  if (/\bmix(ed)?\b|\bcampuran\b/.test(name)) return "Mixed";
  return "Open";
}
