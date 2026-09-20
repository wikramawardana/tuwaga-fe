"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { simplifyScore } from "@/lib/matchScore";
import {
  getTournamentBySlug,
  listMatches,
  listPublicTeams,
  type Match,
  type RegistrationListSummary,
  type RegistrationTeam,
  type Tournament,
} from "@/lib/tuwagaApi";

type TabType = "tracker" | "participants" | "matches" | "info";

function TournamentPortalContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params?.slug || "";

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<RegistrationTeam[]>([]);
  const [summary, setSummary] = useState<RegistrationListSummary | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<TabType>("tracker");

  // Tracker state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedTeam, setSearchedTeam] = useState<RegistrationTeam | null>(
    null,
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Participant list state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantStatusFilter, setParticipantStatusFilter] =
    useState<string>("all");

  // Match list filter
  const [matchCategoryFilter, setMatchCategoryFilter] = useState<string>("all");

  // Load tournament and data
  const fetchData = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const tourney = await getTournamentBySlug(slug);
      setTournament(tourney);

      // Load public teams
      try {
        const teamsData = await listPublicTeams(tourney.id || slug);
        setTeams(teamsData.teams || []);
        setSummary(teamsData.summary || null);
      } catch (err) {
        console.warn("Could not load public teams:", err);
      }

      // Load matches if available
      try {
        const matchData = await listMatches(tourney.id || slug);
        setMatches(matchData || []);
      } catch (err) {
        console.warn("Could not load matches:", err);
      }
    } catch (err) {
      console.error("Failed to load tournament portal:", err);
      setError(
        err instanceof Error ? err.message : "Gagal memuat data turnamen.",
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle URL query for auto-check (e.g., ?check=T-12345678 or ?tab=participants)
  useEffect(() => {
    const checkId = searchParams.get("check");
    const tabParam = searchParams.get("tab") as TabType | null;

    if (
      tabParam &&
      ["tracker", "participants", "matches", "info"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }

    if (checkId && teams.length > 0) {
      const q = checkId.trim().toLowerCase();
      setSearchQuery(checkId);
      const found = teams.find(
        (t) =>
          t.id.toLowerCase() === q ||
          t.player.toLowerCase().includes(q) ||
          t.partner?.toLowerCase().includes(q),
      );
      if (found) {
        setSearchedTeam(found);
        setHasSearched(true);
        setActiveTab("tracker");
      }
    }
  }, [searchParams, teams]);

  // Handle search submission in tracker
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchedTeam(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const found = teams.find(
      (t) =>
        t.id.toLowerCase() === query ||
        t.id.toLowerCase().includes(query) ||
        t.player.toLowerCase().includes(query) ||
        t.partner?.toLowerCase().includes(query),
    );
    setSearchedTeam(found || null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Filtered participants
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const matchCat =
        selectedCategory === "all" || t.category === selectedCategory;
      const matchStatus =
        participantStatusFilter === "all" ||
        t.status === participantStatusFilter;
      const q = participantSearch.trim().toLowerCase();
      const matchQuery =
        !q ||
        t.player.toLowerCase().includes(q) ||
        t.partner?.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q);
      return matchCat && matchStatus && matchQuery;
    });
  }, [teams, selectedCategory, participantStatusFilter, participantSearch]);

  // Categories list
  const categories = useMemo(() => {
    if (
      tournament?.settings?.categories &&
      tournament.settings.categories.length > 0
    ) {
      return tournament.settings.categories;
    }
    const catSet = new Set<string>();
    teams.forEach((t) => {
      if (t.category) catSet.add(t.category);
    });
    return Array.from(catSet);
  }, [tournament, teams]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      return (
        matchCategoryFilter === "all" || m.category === matchCategoryFilter
      );
    });
  }, [matches, matchCategoryFilter]);

  // Find next match for searched team
  const searchedTeamMatches = useMemo(() => {
    if (!searchedTeam) return [];
    return matches.filter((m) => {
      return (
        m.teamAId === searchedTeam.id ||
        m.teamBId === searchedTeam.id ||
        m.teamAName.toLowerCase().includes(searchedTeam.player.toLowerCase()) ||
        m.teamBName.toLowerCase().includes(searchedTeam.player.toLowerCase())
      );
    });
  }, [searchedTeam, matches]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f8fafc]">
        <Navbar active="tournaments" />
        <main className="flex flex-1 items-center justify-center p-6 pt-28">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Memuat data turnamen...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f8fafc]">
        <Navbar active="tournaments" />
        <main className="flex flex-1 items-center justify-center p-6 pt-28">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <span className="material-symbols-outlined text-4xl text-rose-500">
              error_outline
            </span>
            <h1 className="mt-3 text-lg font-black text-slate-900">
              Turnamen Tidak Ditemukan
            </h1>
            <p className="mt-1.5 text-xs text-slate-500">
              {error ||
                "Turnamen yang Anda cari tidak tersedia atau belum dipublikasikan."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-700"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isRegistrationOpen =
    tournament.status === "registration" || tournament.status === "setup";
  const venueMapLink = tournament.venue.toLowerCase().includes("capri")
    ? "https://maps.app.goo.gl/BLv78wtxoGt2bCLT6"
    : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] text-slate-900">
      <Navbar active="tournaments" />

      <main className="flex-1 pb-20 pt-20">
        {/* ── Top Hero Card ────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white shadow-xs">
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          <div className="relative mx-auto max-w-[1200px] px-4 py-8 sm:px-6 md:py-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Left Info */}
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                    {tournament.settings?.sport === "padel"
                      ? "🎾 Padel Tournament"
                      : "🏆 Turnamen Olahraga"}
                  </span>

                  {tournament.status === "live" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
                      Live Sedang Bertanding
                    </span>
                  ) : tournament.status === "completed" ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                      ✓ Registrasi Aktif
                    </span>
                  )}
                </div>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  {tournament.name}
                </h1>

                <div className="mt-3.5 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-blue-600">
                      calendar_month
                    </span>
                    <span>{tournament.dateLabel}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-rose-500">
                      location_on
                    </span>
                    {venueMapLink ? (
                      <a
                        href={venueMapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-slate-300 underline-offset-2 transition hover:text-blue-600"
                      >
                        {tournament.venue} (Buka Peta)
                      </a>
                    ) : (
                      <span>{tournament.venue}</span>
                    )}
                  </div>

                  {tournament.entryFeePerPair > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-emerald-600">
                        payments
                      </span>
                      <span>
                        Rp {tournament.entryFeePerPair.toLocaleString("id-ID")}{" "}
                        / Pasang
                      </span>
                    </div>
                  )}
                </div>

                {tournament.description && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {tournament.description}
                  </p>
                )}
              </div>

              {/* Right CTA Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {isRegistrationOpen && (
                  <Link
                    href={`/tournaments/${tournament.slug}/register`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
                  >
                    <span className="material-symbols-outlined text-base">
                      how_to_reg
                    </span>
                    Daftar Tim Sekarang
                  </Link>
                )}

                <Link
                  href={`/tournaments/bracket?tournament=${tournament.slug}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <span className="material-symbols-outlined text-base text-slate-400">
                    account_tree
                  </span>
                  Bagan
                </Link>

                <Link
                  href={`/tournaments/live?tournament=${tournament.slug}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <span className="material-symbols-outlined text-base text-rose-500">
                    sensors
                  </span>
                  Live Score
                </Link>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Tim Terdaftar
                </span>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {teams.length}
                </p>
                <span className="text-[11px] font-medium text-slate-500">
                  {summary?.approved ?? 0} Disetujui di Main Draw
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Status Pembayaran
                </span>
                <p className="mt-1 text-2xl font-black text-emerald-600">
                  {summary?.paid ?? 0}
                </p>
                <span className="text-[11px] font-medium text-slate-500">
                  Tim Terverifikasi Lunas
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Kategori / Divisi
                </span>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {categories.length}
                </p>
                <span className="text-[11px] font-medium text-slate-500">
                  Divisi Pertandingan
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Kapasitas Slot
                </span>
                <p className="mt-1 text-2xl font-black text-blue-600">
                  {summary?.capacityPercent ?? 0}%
                </p>
                <span className="text-[11px] font-medium text-slate-500">
                  {tournament.settings?.maxPlayers
                    ? `Dari maks ${tournament.settings.maxPlayers} pemain`
                    : "Kuota terbuka"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Tabbed Content Area ────────────────────────────── */}
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 md:py-10">
          {/* Tabs header */}
          <div className="flex border-b border-slate-200">
            <div className="flex gap-2 overflow-x-auto pb-px">
              {[
                {
                  id: "tracker" as TabType,
                  label: "Cek Status Pendaftaran",
                  icon: "search_check",
                  badge: teams.length > 0 ? teams.length : undefined,
                },
                {
                  id: "participants" as TabType,
                  label: "Daftar Peserta",
                  icon: "groups",
                  badge: teams.length > 0 ? teams.length : undefined,
                },
                {
                  id: "matches" as TabType,
                  label: "Jadwal & Pertandingan",
                  icon: "event_upcoming",
                  badge: matches.length > 0 ? matches.length : undefined,
                },
                {
                  id: "info" as TabType,
                  label: "Info & Aturan",
                  icon: "info",
                },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {tab.icon}
                    </span>
                    {tab.label}
                    {tab.badge !== undefined && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          isActive
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              TAB 1: REGISTRATION STATUS TRACKER
          ────────────────────────────────────────────────────────── */}
          {activeTab === "tracker" && (
            <div className="mt-8 space-y-8">
              {/* Search Box */}
              <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/20 p-6 shadow-sm sm:p-8">
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-800">
                    <span className="material-symbols-outlined text-sm">
                      verified_user
                    </span>
                    Live Participant Tracker
                  </span>
                  <h2 className="mt-2.5 text-xl font-black text-slate-900 sm:text-2xl">
                    Cek Status Pendaftaran & Pembayaran Tim
                  </h2>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600">
                    Masukkan Nama Pemain, Pasangan, atau Kode Tim Pendaftaran
                    (contoh:{" "}
                    <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold text-blue-700 shadow-2xs">
                      T-B2E8F91A
                    </code>
                    ) untuk melihat status verifikasi secara real-time.
                  </p>
                </div>

                <form
                  onSubmit={handleSearch}
                  className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ketik Nama Pemain, Pasangan, atau Kode Tim..."
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-4 text-xs font-semibold text-slate-900 shadow-2xs outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSearchedTeam(null);
                          setHasSearched(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <span className="material-symbols-outlined text-base">
                          close
                        </span>
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">
                      search
                    </span>
                    Cek Status
                  </button>
                </form>

                {/* Quick select from recent list if any */}
                {teams.length > 0 && !hasSearched && (
                  <div className="mt-5 border-t border-blue-100/60 pt-4">
                    <span className="text-[11px] font-bold text-slate-500">
                      Pendaftar Terbaru:
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {teams.slice(0, 5).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSearchQuery(t.player);
                            setSearchedTeam(t);
                            setHasSearched(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700"
                        >
                          <span>{t.player}</span>
                          {t.partner && (
                            <span className="text-slate-400">
                              / {t.partner}
                            </span>
                          )}
                          <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-mono text-slate-500">
                            {t.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Search Result Card */}
              {hasSearched && (
                <div>
                  {searchedTeam ? (
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                      {/* Status Banner */}
                      <div
                        className={`p-6 sm:p-8 ${
                          searchedTeam.status === "approved"
                            ? "bg-emerald-50 border-b border-emerald-100"
                            : searchedTeam.status === "waitlist"
                              ? "bg-amber-50 border-b border-amber-100"
                              : searchedTeam.status === "rejected"
                                ? "bg-rose-50 border-b border-rose-100"
                                : "bg-blue-50 border-b border-blue-100"
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                                searchedTeam.status === "approved"
                                  ? "bg-emerald-600 text-white"
                                  : searchedTeam.status === "waitlist"
                                    ? "bg-amber-500 text-white"
                                    : searchedTeam.status === "rejected"
                                      ? "bg-rose-600 text-white"
                                      : "bg-blue-600 text-white"
                              }`}
                            >
                              <span className="material-symbols-outlined text-2xl">
                                {searchedTeam.status === "approved"
                                  ? "verified"
                                  : searchedTeam.status === "waitlist"
                                    ? "hourglass_top"
                                    : searchedTeam.status === "rejected"
                                      ? "cancel"
                                      : "pending"}
                              </span>
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                    searchedTeam.status === "approved"
                                      ? "bg-emerald-200/80 text-emerald-900"
                                      : searchedTeam.status === "waitlist"
                                        ? "bg-amber-200/80 text-amber-900"
                                        : searchedTeam.status === "rejected"
                                          ? "bg-rose-200/80 text-rose-900"
                                          : "bg-blue-200/80 text-blue-900"
                                  }`}
                                >
                                  {searchedTeam.status === "approved"
                                    ? "Terkonfirmasi (Approved)"
                                    : searchedTeam.status === "waitlist"
                                      ? "Daftar Tunggu (Waitlisted)"
                                      : searchedTeam.status === "rejected"
                                        ? "Pendaftaran Ditolak"
                                        : "Menunggu Verifikasi Admin"}
                                </span>

                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                    searchedTeam.paid
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {searchedTeam.paid
                                    ? "✓ Pembayaran Lunas"
                                    : "⏳ Pembayaran Diproses"}
                                </span>
                              </div>

                              <h3 className="mt-1 text-xl font-black text-slate-900">
                                {searchedTeam.player}{" "}
                                {searchedTeam.partner &&
                                  `/ ${searchedTeam.partner}`}
                              </h3>
                            </div>
                          </div>

                          {/* Reference Code */}
                          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
                            <div>
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                Kode Pendaftaran
                              </span>
                              <span className="font-mono text-xs font-extrabold text-slate-900">
                                {searchedTeam.id}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(searchedTeam.id)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              title="Salin Kode"
                            >
                              <span className="material-symbols-outlined text-sm">
                                {copiedId ? "check" : "content_copy"}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Stepper Progression */}
                      <div className="border-b border-slate-100 p-6 sm:p-8">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Tahapan Pendaftaran
                        </span>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
                          {[
                            {
                              step: "1",
                              title: "Registrasi Dikirim",
                              desc: "Data formulir masuk ke sistem",
                              status: "done",
                            },
                            {
                              step: "2",
                              title: "Verifikasi Berkas & Bayar",
                              desc: searchedTeam.paid
                                ? "Pembayaran diverifikasi panitia"
                                : "Sedang ditinjau admin",
                              status: searchedTeam.paid
                                ? "done"
                                : searchedTeam.status === "rejected"
                                  ? "failed"
                                  : "active",
                            },
                            {
                              step: "3",
                              title: "Slot Main Draw",
                              desc:
                                searchedTeam.status === "approved"
                                  ? "Resmi diterima di turnamen"
                                  : searchedTeam.status === "waitlist"
                                    ? "Dalam antrean tunggu"
                                    : "Menunggu konfirmasi slot",
                              status:
                                searchedTeam.status === "approved"
                                  ? "done"
                                  : searchedTeam.status === "waitlist"
                                    ? "waitlist"
                                    : searchedTeam.status === "rejected"
                                      ? "failed"
                                      : "pending",
                            },
                            {
                              step: "4",
                              title: "Jadwal & Bagan",
                              desc: searchedTeam.group
                                ? `Grup ${searchedTeam.group}`
                                : searchedTeamMatches.length > 0
                                  ? `${searchedTeamMatches.length} Laga Terjadwal`
                                  : "Akan dirilis menjelang tanding",
                              status:
                                searchedTeamMatches.length > 0 ||
                                searchedTeam.group
                                  ? "done"
                                  : "pending",
                            },
                          ].map((item) => (
                            <div
                              key={item.step}
                              className={`relative rounded-2xl border p-4 ${
                                item.status === "done"
                                  ? "border-emerald-200 bg-emerald-50/40"
                                  : item.status === "active"
                                    ? "border-blue-300 bg-blue-50/40"
                                    : item.status === "waitlist"
                                      ? "border-amber-200 bg-amber-50/40"
                                      : item.status === "failed"
                                        ? "border-rose-200 bg-rose-50/40"
                                        : "border-slate-200 bg-slate-50/40 opacity-70"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                    item.status === "done"
                                      ? "bg-emerald-600 text-white"
                                      : item.status === "active"
                                        ? "bg-blue-600 text-white"
                                        : item.status === "waitlist"
                                          ? "bg-amber-500 text-white"
                                          : item.status === "failed"
                                            ? "bg-rose-600 text-white"
                                            : "bg-slate-200 text-slate-600"
                                  }`}
                                >
                                  {item.status === "done" ? "✓" : item.step}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Langkah {item.step}
                                </span>
                              </div>
                              <h4 className="mt-3 text-xs font-bold text-slate-900">
                                {item.title}
                              </h4>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {item.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team Details Table */}
                      <div className="p-6 sm:p-8">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Rincian Tim & Kategori
                        </h4>

                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Kategori / Divisi
                            </span>
                            <p className="mt-0.5 text-xs font-bold text-slate-900">
                              {searchedTeam.category}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Pemain 1
                            </span>
                            <p className="mt-0.5 text-xs font-bold text-slate-900">
                              {searchedTeam.player}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Pemain 2 (Partner)
                            </span>
                            <p className="mt-0.5 text-xs font-bold text-slate-900">
                              {searchedTeam.partner || "- (Single)"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Waktu Pendaftaran
                            </span>
                            <p className="mt-0.5 text-xs font-bold text-slate-900">
                              {new Date(
                                searchedTeam.registeredAt,
                              ).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Scheduled match alert if found */}
                        {searchedTeamMatches.length > 0 && (
                          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-blue-600">
                                sports_tennis
                              </span>
                              <h5 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                                Jadwal Pertandingan Tim Anda
                              </h5>
                            </div>
                            <div className="mt-3 divide-y divide-blue-100">
                              {searchedTeamMatches.map((m) => (
                                <div
                                  key={m.id}
                                  className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
                                >
                                  <div>
                                    <span className="text-[10px] font-bold text-blue-600">
                                      {m.round} · Court {m.courtId ?? "TBA"} ·{" "}
                                      {m.time}
                                    </span>
                                    <p className="text-xs font-bold text-slate-900">
                                      {m.teamAName} vs {m.teamBName}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                        m.status === "live"
                                          ? "bg-rose-100 text-rose-700"
                                          : m.status === "completed"
                                            ? "bg-slate-100 text-slate-700"
                                            : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {m.status === "live"
                                        ? "Sedang Main"
                                        : m.status === "completed"
                                          ? `Selesai (${simplifyScore(m.score)})`
                                          : "Terjadwal"}
                                    </span>
                                    <Link
                                      href={`/tournaments/live?tournament=${tournament.slug}`}
                                      className="text-xs font-semibold text-blue-600 hover:underline"
                                    >
                                      Pantau Skor →
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* WhatsApp support helper */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400">
                              help
                            </span>
                            <span className="text-xs text-slate-600">
                              Butuh perubahan pasangan atau konfirmasi cepat?
                            </span>
                          </div>
                          <a
                            href="https://wa.me/6281234567890"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                          >
                            <span className="material-symbols-outlined text-sm">
                              chat
                            </span>
                            Chat Panitia WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                      <span className="material-symbols-outlined text-4xl text-slate-400">
                        person_search
                      </span>
                      <h3 className="mt-3 text-base font-bold text-slate-900">
                        Data Pendaftaran Tidak Ditemukan
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Tidak ditemukan pendaftar dengan kata kunci &ldquo;
                        {searchQuery}&rdquo;. Pastikan ejaan nama atau kode tim
                        sudah sesuai.
                      </p>
                      <div className="mt-5 flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setHasSearched(false);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Reset Pencarian
                        </button>
                        {isRegistrationOpen && (
                          <Link
                            href={`/tournaments/${tournament.slug}/register`}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                          >
                            Daftarkan Tim Baru
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 2: PARTICIPANTS DIRECTORY
          ────────────────────────────────────────────────────────── */}
          {activeTab === "participants" && (
            <div className="mt-8 space-y-6">
              {/* Category pills & filters */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                      selectedCategory === "all"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Semua Kategori ({teams.length})
                  </button>
                  {categories.map((cat) => {
                    const count = teams.filter(
                      (t) => t.category === cat,
                    ).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                          selectedCategory === cat
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Status filter dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={participantStatusFilter}
                    onChange={(e) => setParticipantStatusFilter(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:border-blue-600"
                  >
                    <option value="all">Semua Status</option>
                    <option value="approved">Terkonfirmasi (Approved)</option>
                    <option value="pending">Menunggu Verifikasi</option>
                    <option value="waitlist">Daftar Tunggu (Waitlist)</option>
                  </select>
                </div>
              </div>

              {/* Live search input */}
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Cari nama pemain, klub, atau kota dalam daftar..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-medium text-slate-900 shadow-2xs outline-none focus:border-blue-600"
                />
              </div>

              {/* Roster Cards / Table */}
              {filteredTeams.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Pasangan Pemain</th>
                          <th className="px-4 py-3">Kategori</th>
                          <th className="px-4 py-3">Kota / Asal</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTeams.map((t, idx) => (
                          <tr
                            key={t.id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="px-4 py-3 font-mono font-bold text-slate-400">
                              {t.seed ? (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                                  [{t.seed}]
                                </span>
                              ) : (
                                idx + 1
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">
                                {t.player}
                              </div>
                              {t.partner && (
                                <div className="text-[11px] font-medium text-slate-500">
                                  / {t.partner}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                {t.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {t.city || "Jakarta"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                  t.status === "approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : t.status === "waitlist"
                                      ? "bg-amber-100 text-amber-800"
                                      : t.status === "rejected"
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {t.status === "approved"
                                  ? "Terkonfirmasi"
                                  : t.status === "waitlist"
                                    ? "Waitlist"
                                    : t.status === "rejected"
                                      ? "Ditolak"
                                      : "Menunggu Verifikasi"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchQuery(t.player);
                                  setSearchedTeam(t);
                                  setHasSearched(true);
                                  setActiveTab("tracker");
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Detail Status
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
                  <span className="material-symbols-outlined text-4xl text-slate-300">
                    group_off
                  </span>
                  <h4 className="mt-2 text-sm font-bold text-slate-900">
                    Tidak Ada Peserta
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Belum ada tim yang cocok dengan filter kategori atau kata
                    kunci pencarian.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 3: MATCHES & SCHEDULE (OOP)
          ────────────────────────────────────────────────────────── */}
          {activeTab === "matches" && (
            <div className="mt-8 space-y-6">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMatchCategoryFilter("all")}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      matchCategoryFilter === "all"
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Semua Kategori ({matches.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMatchCategoryFilter(cat)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        matchCategoryFilter === cat
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/tournaments/bracket?tournament=${tournament.slug}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined text-sm text-slate-400">
                      account_tree
                    </span>
                    Bagan Knockout
                  </Link>
                  <Link
                    href={`/tournaments/live?tournament=${tournament.slug}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700"
                  >
                    <span className="material-symbols-outlined text-sm">
                      sensors
                    </span>
                    Live Score
                  </Link>
                </div>
              </div>

              {filteredMatches.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredMatches.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-300"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="text-[11px] font-bold text-blue-600">
                          {m.category} · {m.round}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500">
                            Court {m.courtId ?? "TBA"} · {m.time}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                              m.status === "live"
                                ? "bg-rose-100 text-rose-700 animate-pulse"
                                : m.status === "completed"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              m.winnerTeamId && m.winnerTeamId === m.teamAId
                                ? "text-emerald-700 font-extrabold"
                                : "text-slate-900"
                            }`}
                          >
                            {m.teamAName}
                          </span>
                          {m.score && (
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {simplifyScore(m.score).split("-")[0] || ""}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              m.winnerTeamId && m.winnerTeamId === m.teamBId
                                ? "text-emerald-700 font-extrabold"
                                : "text-slate-900"
                            }`}
                          >
                            {m.teamBName}
                          </span>
                          {m.score && (
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {simplifyScore(m.score).split("-")[1] || ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xs">
                  <span className="material-symbols-outlined text-5xl text-slate-300">
                    event_busy
                  </span>
                  <h4 className="mt-3 text-base font-bold text-slate-900">
                    Jadwal Pertandingan Belum Dirilis
                  </h4>
                  <p className="mt-1 max-w-md mx-auto text-xs text-slate-500">
                    Panitia sedang menyelesaikan proses pendaftaran dan drawing
                    bagan. Jadwal Order of Play (nomor lapangan & estimasi jam
                    tanding) akan tampil di sini segera setelah diterbitkan.
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <Link
                      href={`/tournaments/bracket?tournament=${tournament.slug}`}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Lihat Bagan Sementara
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 4: INFO & VENUE
          ────────────────────────────────────────────────────────── */}
          {activeTab === "info" && (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Venue Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500">
                    location_on
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Lokasi & Venue
                  </h3>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">
                    {tournament.venue}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {tournament.location || "Jakarta, Indonesia"}
                  </p>

                  {venueMapLink && (
                    <a
                      href={venueMapLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">
                        map
                      </span>
                      Petunjuk Arah Google Maps
                    </a>
                  )}
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tanggal Pertandingan
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {tournament.dateLabel}
                  </p>
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Kategori Dibuka
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rules & Payment info */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600">
                      gavel
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Format Pertandingan
                    </h3>
                  </div>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-slate-900">1.</span>
                      <span>
                        <strong>Sistem:</strong>{" "}
                        {tournament.settings?.format ||
                          "Group stage + knockout"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-slate-900">2.</span>
                      <span>
                        <strong>Aturan Skor:</strong> Menggunakan scoring resmi{" "}
                        {tournament.settings?.sport === "padel"
                          ? "Padel (Best of 3 Sets / Pro Set dengan Golden Point)"
                          : "standar olahraga"}
                        .
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-slate-900">3.</span>
                      <span>
                        <strong>Wasit & Live Scoring:</strong> Skor dicatat
                        langsung oleh referee lapangan menggunakan sistem
                        TUWAGA.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Organizer Contact */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">
                      support_agent
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Bantuan & Panitia
                    </h3>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Ada pertanyaan seputar verifikasi pembayaran, transfer, atau
                    pergantian pemain?
                  </p>
                  <div className="mt-4">
                    <a
                      href="https://wa.me/6281234567890"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                    >
                      <span className="material-symbols-outlined text-base">
                        chat
                      </span>
                      Hubungi Helpdesk Panitia
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function TournamentPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <TournamentPortalContent />
    </Suspense>
  );
}
