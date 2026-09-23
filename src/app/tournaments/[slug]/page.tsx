"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { CaprivalQualificationModal } from "@/components/tournaments/CaprivalQualificationModal";
import { useSession } from "@/lib/auth-client";
import {
  getCaprivalCategoryEligibility,
  isCaprivalTournament,
} from "@/lib/caprivalQualifications";
import { simplifyScore } from "@/lib/matchScore";
import {
  getTournamentBySlug,
  listMatches,
  listMyRegistrations,
  listPublicTeams,
  type Match,
  type PaymentInfo,
  type RegistrationListSummary,
  type RegistrationTeam,
  submitPaymentProof,
  type Tournament,
  uploadFile,
} from "@/lib/tuwagaApi";

type TabType = "my-registration" | "categories" | "matches" | "info";

function TournamentPortalContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params?.slug || "";

  const { data: session, isPending: sessionPending } = useSession();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [summary, setSummary] = useState<RegistrationListSummary | null>(null);
  const [myTeams, setMyTeams] = useState<RegistrationTeam[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [uploadingProofTeamId, setUploadingProofTeamId] = useState<
    string | null
  >(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<
    string | null
  >(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMyTeams, setLoadingMyTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<TabType>("my-registration");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Caprival qualification modal
  const [showCaprivalModal, setShowCaprivalModal] = useState(false);
  const isCaprival = isCaprivalTournament(slug);

  // Match list filter
  const [matchCategoryFilter, setMatchCategoryFilter] = useState<string>("all");

  // Load tournament and general metadata
  const fetchData = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const tourney = await getTournamentBySlug(slug);
      setTournament(tourney);

      // Load summary metrics and matches in parallel
      const targetId = tourney.id || slug;
      const [teamsRes, matchesRes] = await Promise.allSettled([
        listPublicTeams(targetId),
        listMatches(targetId),
      ]);

      if (teamsRes.status === "fulfilled") {
        setSummary(teamsRes.value.summary || null);
      } else {
        console.warn("Could not load summary:", teamsRes.reason);
      }

      if (matchesRes.status === "fulfilled") {
        setMatches(matchesRes.value || []);
      } else {
        console.warn("Could not load matches:", matchesRes.reason);
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

  // Load user's private registrations and payment info when session is active
  const fetchMyTeams = useCallback(async () => {
    if (!slug || !session?.user) {
      setMyTeams([]);
      setPaymentInfo(null);
      return;
    }
    try {
      setLoadingMyTeams(true);
      const res = await listMyRegistrations(slug);
      setMyTeams(res.teams || []);
      setPaymentInfo(res.paymentInfo || null);
    } catch (err) {
      console.warn("Could not load my registrations:", err);
    } finally {
      setLoadingMyTeams(false);
    }
  }, [slug, session]);

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  // Handle uploading payment proof for approved teams
  const handleUploadPaymentProof = async (teamId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Ukuran file maksimal 5MB.");
      return;
    }
    setUploadingProofTeamId(teamId);
    setUploadError(null);
    setUploadSuccessMessage(null);
    try {
      const uploadRes = await uploadFile(file);
      const updatedTeam = await submitPaymentProof(slug, teamId, uploadRes.url);
      setMyTeams((prev) =>
        prev.map((t) =>
          t.id === teamId
            ? {
                ...t,
                paymentProofUrl: updatedTeam.paymentProofUrl,
                paymentStatus: updatedTeam.paymentStatus,
              }
            : t,
        ),
      );
      setUploadSuccessMessage(
        "Bukti transfer berhasil dikirim. Panitia akan segera memverifikasi.",
      );
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Gagal mengunggah bukti transfer.",
      );
    } finally {
      setUploadingProofTeamId(null);
    }
  };

  // Handle URL tab param
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;
    if (
      tabParam &&
      ["my-registration", "categories", "matches", "info"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Categories list
  const categories = useMemo(() => {
    if (
      tournament?.settings?.categories &&
      tournament.settings.categories.length > 0
    ) {
      return tournament.settings.categories;
    }
    return [];
  }, [tournament]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      return (
        matchCategoryFilter === "all" || m.category === matchCategoryFilter
      );
    });
  }, [matches, matchCategoryFilter]);

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
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      ✓ Registrasi Aktif
                    </span>
                  )}
                </div>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  {tournament.name}
                </h1>

                <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
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

                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-indigo-600">
                      fact_check
                    </span>
                    <span className="font-semibold text-slate-700">
                      Tahap Kurasi & Verifikasi Kategori
                    </span>
                  </div>
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
                  Slot Terkonfirmasi
                </span>
                <p className="mt-1 text-2xl font-black text-emerald-600">
                  {summary?.approved ?? 0} Tim
                </p>
                <span className="text-[11px] font-medium text-slate-500">
                  Resmi di Main Draw
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Menunggu Verifikasi
                </span>
                <p className="mt-1 text-2xl font-black text-amber-600">
                  {summary?.pending ?? 0} Tim
                </p>
                <span className="text-[11px] font-medium text-slate-500">
                  Proses cek berkas / bukti
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
                  Divisi Dibuka
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Kapasitas Turnamen
                </span>
                <p className="mt-1 text-2xl font-black text-blue-600">
                  {summary?.capacityPercent ?? 0}%
                </p>
                <span className="text-[11px] font-medium text-slate-500">
                  {tournament.settings?.maxPlayers
                    ? `Maksimal ${tournament.settings.maxPlayers} pemain`
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
                  id: "my-registration" as TabType,
                  label: "Pendaftaran Saya",
                  icon: "verified_user",
                  badge: myTeams.length > 0 ? myTeams.length : undefined,
                },
                {
                  id: "categories" as TabType,
                  label: "Kuota & Kategori",
                  icon: "layers",
                  badge: categories.length > 0 ? categories.length : undefined,
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
              TAB 1: MY REGISTRATION (SECURE & PRIVATE)
          ────────────────────────────────────────────────────────── */}
          {activeTab === "my-registration" && (
            <div className="mt-8 space-y-8">
              {sessionPending ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
              ) : !session?.user ? (
                /* Unauthenticated View: Prompt Login */
                <div className="mx-auto max-w-xl">
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <span className="material-symbols-outlined text-3xl">
                        lock
                      </span>
                    </div>

                    <div className="mt-5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        <span className="material-symbols-outlined text-sm">
                          security
                        </span>
                        Akses Data Pribadi & Aman
                      </span>
                      <h3 className="mt-3 text-xl font-black text-slate-900 sm:text-2xl">
                        Masuk untuk Memantau Pendaftaran Anda
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        Demi menjaga kerahasiaan dan privasi seluruh peserta
                        turnamen, data tim dan status verifikasi hanya dapat
                        dilihat oleh akun terdaftar.
                      </p>
                    </div>

                    <div className="mt-6 text-left space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-emerald-600">
                          check_circle
                        </span>
                        <span>
                          Nama dan data tim Anda terlindungi dari pihak luar
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-emerald-600">
                          check_circle
                        </span>
                        <span>
                          Pantau approval panitia & verifikasi bukti transfer
                          otomatis
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-emerald-600">
                          check_circle
                        </span>
                        <span>
                          Lihat nomor lapangan & jam main tim Anda saat jadwal
                          dirilis
                        </span>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3">
                      <Link
                        href={`/login?callbackUrl=/tournaments/${slug}`}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-lg">
                          login
                        </span>
                        Masuk dengan Akun Anda
                      </Link>
                      {isRegistrationOpen && (
                        <Link
                          href={`/tournaments/${slug}/register`}
                          className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          Daftar Tim Baru
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ) : loadingMyTeams ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <p className="text-xs font-semibold text-slate-500">
                      Memuat pendaftaran Anda...
                    </p>
                  </div>
                </div>
              ) : myTeams.length > 0 ? (
                /* Authenticated View: User's Teams */
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        Pendaftaran Tim Anda ({myTeams.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Terhubung dengan akun:{" "}
                        <strong className="text-slate-800">
                          {session.user.email}
                        </strong>
                      </p>
                    </div>

                    {isRegistrationOpen && (
                      <Link
                        href={`/tournaments/${slug}/register`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined text-sm text-blue-600">
                          add_circle
                        </span>
                        Daftar Kategori Lain
                      </Link>
                    )}
                  </div>

                  {myTeams.map((team) => {
                    const isApproved = team.status === "approved";
                    const isWaitlist = team.status === "waitlist";
                    const isRejected = team.status === "rejected";

                    // Check matches for this team
                    const teamMatches = matches.filter(
                      (m) =>
                        m.teamAId === team.id ||
                        m.teamBId === team.id ||
                        m.teamAName
                          .toLowerCase()
                          .includes(team.player.toLowerCase()) ||
                        m.teamBName
                          .toLowerCase()
                          .includes(team.player.toLowerCase()),
                    );

                    return (
                      <div
                        key={team.id}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md"
                      >
                        {/* Status Header */}
                        <div
                          className={`p-6 sm:p-8 ${
                            isApproved
                              ? "border-b border-emerald-100 bg-emerald-50"
                              : isWaitlist
                                ? "border-b border-amber-100 bg-amber-50"
                                : isRejected
                                  ? "border-b border-rose-100 bg-rose-50"
                                  : "border-b border-blue-100 bg-blue-50"
                          }`}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                                  isApproved
                                    ? "bg-emerald-600 text-white"
                                    : isWaitlist
                                      ? "bg-amber-500 text-white"
                                      : isRejected
                                        ? "bg-rose-600 text-white"
                                        : "bg-blue-600 text-white"
                                }`}
                              >
                                <span className="material-symbols-outlined text-2xl">
                                  {isApproved
                                    ? "verified"
                                    : isWaitlist
                                      ? "hourglass_top"
                                      : isRejected
                                        ? "cancel"
                                        : "pending"}
                                </span>
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                      isApproved
                                        ? "bg-emerald-200/80 text-emerald-900"
                                        : isWaitlist
                                          ? "bg-amber-200/80 text-amber-900"
                                          : isRejected
                                            ? "bg-rose-200/80 text-rose-900"
                                            : "bg-indigo-100 text-indigo-900"
                                    }`}
                                  >
                                    {isApproved
                                      ? "Kategori Lolos Kurasi"
                                      : isWaitlist
                                        ? "Daftar Tunggu (Waitlisted)"
                                        : isRejected
                                          ? "Kurasi Tidak Lolos"
                                          : "Tahap Verifikasi Kategori"}
                                  </span>

                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                      team.paid
                                        ? "bg-emerald-100 text-emerald-800"
                                        : isApproved
                                          ? team.paymentProofUrl
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-orange-100 text-orange-800"
                                          : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {team.paid
                                      ? "✓ Pembayaran Lunas"
                                      : isApproved
                                        ? team.paymentProofUrl
                                          ? "⏳ Bukti Sedang Ditinjau"
                                          : "Menunggu Pembayaran"
                                        : "Biaya Diumumkan Setelah Kurasi"}
                                  </span>
                                </div>

                                <h3 className="mt-1 text-xl font-black text-slate-900">
                                  {team.player}{" "}
                                  {team.partner && `/ ${team.partner}`}
                                </h3>
                              </div>
                            </div>

                            {/* Reference Code */}
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
                              <div>
                                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                  Kode Tim Anda
                                </span>
                                <span className="font-mono text-xs font-extrabold text-slate-900">
                                  {team.id}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(team.id)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                title="Salin Kode"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  {copiedId === team.id
                                    ? "check"
                                    : "content_copy"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Stepper Progression */}
                        <div className="border-b border-slate-100 p-6 sm:p-8">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Progres Tiket Pendaftaran
                          </span>

                          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
                            {[
                              {
                                step: "1",
                                title: "Pendaftaran Masuk",
                                desc: "Data formulir tercatat",
                                status: "done",
                              },
                              {
                                step: "2",
                                title: "Verifikasi Kategori",
                                desc: isApproved
                                  ? "Kategori disetujui panitia"
                                  : isWaitlist
                                    ? "Antrean daftar tunggu"
                                    : isRejected
                                      ? "Kategori tidak sesuai"
                                      : "Pengecekan kesesuaian kategori",
                                status: isApproved
                                  ? "done"
                                  : isWaitlist
                                    ? "waitlist"
                                    : isRejected
                                      ? "rejected"
                                      : "active",
                              },
                              {
                                step: "3",
                                title: "Biaya & Pembayaran",
                                desc: team.paid
                                  ? "Pembayaran lunas terverifikasi"
                                  : isApproved
                                    ? team.paymentProofUrl
                                      ? "Bukti transfer ditinjau"
                                      : "Menunggu pembayaran tim"
                                    : "Diberikan setelah lolos kurasi",
                                status: team.paid
                                  ? "done"
                                  : isApproved
                                    ? "active"
                                    : "pending",
                              },
                              {
                                step: "4",
                                title: "Jadwal & Bagan",
                                desc: team.group
                                  ? `Grup ${team.group}`
                                  : teamMatches.length > 0
                                    ? `${teamMatches.length} Laga Terjadwal`
                                    : "Dirilis saat drawing",
                                status:
                                  teamMatches.length > 0 || team.group
                                    ? "done"
                                    : "pending",
                              },
                            ].map((item) => (
                              <div
                                key={item.step}
                                className={`rounded-2xl border p-4 ${
                                  item.status === "done"
                                    ? "border-emerald-200 bg-emerald-50/40"
                                    : item.status === "active"
                                      ? "border-blue-300 bg-blue-50/40"
                                      : item.status === "waitlist"
                                        ? "border-amber-200 bg-amber-50/40"
                                        : item.status === "rejected"
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
                                            : item.status === "rejected"
                                              ? "bg-rose-600 text-white"
                                              : "bg-slate-200 text-slate-600"
                                    }`}
                                  >
                                    {item.status === "done" ? "✓" : item.step}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Tahap {item.step}
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

                        {/* Status Pending: Category Verification Notice */}
                        {!isApproved && !isWaitlist && !isRejected && (
                          <div className="border-b border-slate-100 bg-indigo-50/40 p-6 sm:p-8">
                            <div className="flex items-start gap-3.5">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                                <span className="material-symbols-outlined text-xl">
                                  fact_check
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-black text-indigo-950">
                                    Tahap Verifikasi Kategori Sedang Berlangsung
                                  </h4>
                                  <span className="rounded-full bg-indigo-200/80 px-2 py-0.5 text-[10px] font-bold text-indigo-900">
                                    Kurasi Panitia
                                  </span>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-indigo-900/80">
                                  Data pendaftaran Anda di kategori{" "}
                                  <strong>{team.category}</strong> telah kami
                                  terima. Panitia turnamen sedang meninjau
                                  kelayakan berkas dan kesesuaian level pemain.
                                </p>
                                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-indigo-700">
                                  <span className="material-symbols-outlined text-sm">
                                    info
                                  </span>
                                  <span>
                                    Nominal biaya pendaftaran & nomor rekening
                                    transfer panitia akan otomatis ditampilkan
                                    di sini segera setelah tim Anda disetujui
                                    (Approved).
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Status Approved & Unpaid: Fee Nominal, Bank Details, and Payment Proof Upload */}
                        {isApproved && !team.paid && (
                          <div className="border-b border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/30 p-6 sm:p-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                  <span className="material-symbols-outlined text-sm">
                                    check_circle
                                  </span>
                                  Selamat! Kategori Tim Anda Telah Disetujui
                                </span>
                                <h4 className="mt-2.5 text-lg font-black text-slate-900 sm:text-xl">
                                  Selesaikan Pembayaran untuk Mengamankan Slot
                                </h4>
                                <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-600">
                                  Tim Anda telah lolos kurasi untuk kategori{" "}
                                  <strong className="text-slate-900">
                                    {team.category}
                                  </strong>
                                  . Silakan selesaikan pembayaran pendaftaran
                                  sesuai nominal berikut dan unggah bukti
                                  transfer.
                                </p>
                              </div>

                              {/* Fee Nominal Display */}
                              <div className="shrink-0 rounded-2xl border border-emerald-300/80 bg-white p-4 shadow-xs sm:text-right">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Nominal Pendaftaran Tim
                                </span>
                                <p className="text-2xl font-black text-emerald-600">
                                  Rp{" "}
                                  {(
                                    team.entryFee ??
                                    paymentInfo?.entryFeePerPair ??
                                    tournament.entryFeePerPair ??
                                    600000
                                  ).toLocaleString("id-ID")}
                                </p>
                                <span className="text-[10px] font-medium text-slate-500">
                                  Per Pasangan
                                </span>
                              </div>
                            </div>

                            {/* Official Bank Account Details */}
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-base text-blue-600">
                                    account_balance
                                  </span>
                                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                                    Rekening Resmi Panitia Turnamen
                                  </span>
                                </div>
                                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-800">
                                  {paymentInfo?.bankName || "BCA"}
                                </span>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Bank Tujuan
                                  </span>
                                  <p className="text-sm font-black text-slate-900">
                                    {paymentInfo?.bankName || "BCA"}
                                  </p>
                                </div>

                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Nama Pemilik Rekening
                                  </span>
                                  <p className="text-sm font-bold text-slate-800">
                                    {paymentInfo?.accountHolder ||
                                      "PT TUWAGA INDONESIA"}
                                  </p>
                                </div>

                                <div className="sm:col-span-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Nomor Rekening
                                  </span>
                                  <div className="mt-1 flex items-center gap-3">
                                    <span className="font-mono text-lg font-black tracking-wider text-slate-900">
                                      {paymentInfo?.accountNumber ||
                                        "8831234567"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopyCode(
                                          paymentInfo?.accountNumber ||
                                            "8831234567",
                                        )
                                      }
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
                                    >
                                      <span className="material-symbols-outlined text-sm">
                                        {copiedId ===
                                        (paymentInfo?.accountNumber ||
                                          "8831234567")
                                          ? "check"
                                          : "content_copy"}
                                      </span>
                                      {copiedId ===
                                      (paymentInfo?.accountNumber ||
                                        "8831234567")
                                        ? "Tersalin!"
                                        : "Salin Nomor"}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {paymentInfo?.paymentInstructions && (
                                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs leading-relaxed text-blue-900">
                                  <strong>Instruksi Panitia:</strong>{" "}
                                  {paymentInfo.paymentInstructions}
                                </div>
                              )}
                            </div>

                            {/* Payment Proof Upload Section */}
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-base text-emerald-600">
                                    receipt_long
                                  </span>
                                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                    Kirim Bukti Pembayaran
                                  </h5>
                                </div>

                                {team.paymentProofUrl && (
                                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-800">
                                    ⏳ Bukti Terkirim · Menunggu Approval
                                  </span>
                                )}
                              </div>

                              {team.paymentProofUrl && (
                                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center">
                                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-300 bg-white">
                                    <Image
                                      src={team.paymentProofUrl}
                                      alt="Bukti Transfer"
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900">
                                      Bukti transfer telah berhasil kami terima
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      Panitia akan memeriksa transfer Anda. Slot
                                      Main Draw akan otomatis terkunci begitu
                                      pembayaran diverifikasi.
                                    </p>
                                    <a
                                      href={team.paymentProofUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                                    >
                                      <span className="material-symbols-outlined text-xs">
                                        open_in_new
                                      </span>
                                      Lihat Bukti Ukuran Penuh
                                    </a>
                                  </div>
                                </div>
                              )}

                              {uploadSuccessMessage && (
                                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                                  ✓ {uploadSuccessMessage}
                                </div>
                              )}

                              {uploadError && (
                                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                                  {uploadError}
                                </div>
                              )}

                              <div className="mt-4">
                                <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-5 transition hover:border-emerald-500 hover:bg-emerald-50/20">
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="sr-only"
                                    disabled={uploadingProofTeamId === team.id}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file)
                                        handleUploadPaymentProof(team.id, file);
                                    }}
                                  />
                                  {uploadingProofTeamId === team.id ? (
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                                      Mengunggah bukti transfer...
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center text-center">
                                      <span className="material-symbols-outlined text-3xl text-slate-400">
                                        upload_file
                                      </span>
                                      <span className="mt-1.5 text-xs font-bold text-slate-700">
                                        {team.paymentProofUrl
                                          ? "Klik untuk Mengganti / Mengunggah Ulang Bukti Transfer"
                                          : "Klik untuk Mengunggah Foto Bukti Transfer"}
                                      </span>
                                      <span className="mt-0.5 text-[10px] text-slate-400">
                                        Format JPG, PNG, atau WebP (Maksimal
                                        5MB)
                                      </span>
                                    </div>
                                  )}
                                </label>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Status Approved & Paid */}
                        {isApproved && team.paid && (
                          <div className="border-b border-emerald-100 bg-emerald-50/40 p-6 sm:p-8">
                            <div className="flex items-start gap-3.5">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                                <span className="material-symbols-outlined text-xl">
                                  verified
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <h4 className="text-sm font-black text-emerald-950">
                                    Pembayaran Lunas & Slot Terkunci
                                  </h4>
                                  <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-900">
                                    Resmi di Main Draw
                                  </span>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-emerald-900/80">
                                  Pembayaran pendaftaran sebesar{" "}
                                  <strong>
                                    Rp{" "}
                                    {(
                                      team.entryFee ??
                                      paymentInfo?.entryFeePerPair ??
                                      tournament.entryFeePerPair ??
                                      600000
                                    ).toLocaleString("id-ID")}
                                  </strong>{" "}
                                  telah diverifikasi panitia. Tim Anda resmi
                                  bertanding di kategori{" "}
                                  <strong>{team.category}</strong>.
                                </p>
                                {team.paymentProofUrl && (
                                  <div className="mt-2.5">
                                    <a
                                      href={team.paymentProofUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                                    >
                                      <span className="material-symbols-outlined text-xs">
                                        receipt_long
                                      </span>
                                      Lihat Bukti Transfer Tersimpan ↗
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Status Waitlist */}
                        {isWaitlist && (
                          <div className="border-b border-amber-100 bg-amber-50/40 p-6 sm:p-8">
                            <div className="flex items-start gap-3.5">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                                <span className="material-symbols-outlined text-xl">
                                  hourglass_top
                                </span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-black text-amber-950">
                                  Tim Anda Berada di Antrean Daftar Tunggu
                                  (Waitlist)
                                </h4>
                                <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                                  Kuota untuk kategori{" "}
                                  <strong>{team.category}</strong> saat ini
                                  telah penuh. Jika ada tim yang membatalkan
                                  atau tidak menyelesaikan pembayaran, slot akan
                                  otomatis ditawarkan kepada Anda.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Status Rejected */}
                        {isRejected && (
                          <div className="border-b border-rose-100 bg-rose-50/40 p-6 sm:p-8">
                            <div className="flex items-start gap-3.5">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
                                <span className="material-symbols-outlined text-xl">
                                  cancel
                                </span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-black text-rose-950">
                                  Pendaftaran Tidak Memenuhi Syarat Kategori
                                </h4>
                                <p className="mt-1 text-xs leading-relaxed text-rose-900/80">
                                  Berdasarkan verifikasi tim kurasi turnamen,
                                  tim Anda belum memenuhi persyaratan untuk
                                  kategori <strong>{team.category}</strong>.
                                  Silakan hubungi panitia jika Anda ingin
                                  berkonsultasi mengenai opsi pemindahan
                                  kategori.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Team Details & Schedule */}
                        <div className="p-6 sm:p-8">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Rincian Pendaftaran
                          </h4>

                          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Kategori
                              </span>
                              <p className="mt-0.5 text-xs font-bold text-slate-900">
                                {team.category}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Pemain 1
                              </span>
                              <p className="mt-0.5 text-xs font-bold text-slate-900">
                                {team.player}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Pasangan (Partner)
                              </span>
                              <p className="mt-0.5 text-xs font-bold text-slate-900">
                                {team.partner || "- (Single)"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Waktu Mendaftar
                              </span>
                              <p className="mt-0.5 text-xs font-bold text-slate-900">
                                {new Date(team.registeredAt).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Scheduled Match info if available */}
                          {teamMatches.length > 0 && (
                            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-600">
                                  sports_tennis
                                </span>
                                <h5 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                                  Jadwal Laga Tim Anda
                                </h5>
                              </div>
                              <div className="mt-3 divide-y divide-blue-100">
                                {teamMatches.map((m) => (
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

                          {/* WhatsApp assistance */}
                          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-slate-400">
                                help
                              </span>
                              <span className="text-xs text-slate-600">
                                Butuh verifikasi cepat atau konfirmasi transfer?
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
                    );
                  })}
                </div>
              ) : (
                /* Authenticated but no teams registered yet */
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xs">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <span className="material-symbols-outlined text-3xl">
                      sports_tennis
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">
                    Anda Belum Terdaftar di Turnamen Ini
                  </h3>
                  <p className="mt-1 max-w-md mx-auto text-xs text-slate-500">
                    Akun Anda ({session.user.email}) belum memiliki tim aktif di{" "}
                    {tournament.name}. Daftarkan tim Anda sekarang untuk
                    mengamankan slot pertandingan.
                  </p>
                  {isRegistrationOpen && (
                    <div className="mt-6">
                      <Link
                        href={`/tournaments/${slug}/register`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-base">
                          how_to_reg
                        </span>
                        Daftar Tim Sekarang
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 2: KUOTA & KAPASITAS KATEGORI (PRIVACY-PRESERVED)
          ────────────────────────────────────────────────────────── */}
          {activeTab === "categories" && (
            <div className="mt-8 space-y-6">
              {/* Caprival Qualification Banner */}
              {isCaprival && (
                <div className="rounded-2xl border border-indigo-900/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/30">
                          <span className="material-symbols-outlined text-[13px]">
                            verified
                          </span>
                          The Grand Caprival
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-white">
                        Panduan & Matriks Kualifikasi Kategori Resmi
                      </h3>
                      <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                        Turnamen The Grand Caprival memberlakukan standarisasi
                        level ketat untuk cabang Tenis & Padel. Pastikan Anda
                        memeriksa matriks kualifikasi sebelum mendaftar.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCaprivalModal(true)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-md transition hover:bg-amber-300"
                    >
                      <span className="material-symbols-outlined text-base">
                        table_chart
                      </span>
                      Buka Matriks Kualifikasi
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">
                    shield
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Kebijakan Privasi Peserta
                  </h4>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-blue-800/80">
                  Untuk melindungi kerahasiaan data seluruh pemain, daftar nama
                  peserta tidak dipublikasikan secara terbuka. Peserta dapat
                  memantau pendaftarannya masing-masing di tab{" "}
                  <strong>Pendaftaran Saya</strong>.
                </p>
              </div>

              {/* Division slots grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {categories.map((cat) => {
                  const caprivalEligibility = isCaprival
                    ? getCaprivalCategoryEligibility(cat)
                    : null;

                  return (
                    <div
                      key={cat}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900">
                            {cat}
                          </h4>
                          {caprivalEligibility && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                                {caprivalEligibility.badgeText}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                          Slot Dibuka
                        </span>
                      </div>

                      {caprivalEligibility && (
                        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-600">
                          <span className="font-bold text-slate-900 block mb-0.5">
                            Kriteria Kelayakan:
                          </span>
                          <p className="text-[11px] leading-relaxed">
                            {caprivalEligibility.description}
                          </p>
                        </div>
                      )}

                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span>Format Pertandingan</span>
                          <span className="text-slate-900 font-bold">
                            {tournament.settings?.format ||
                              "Group stage + knockout"}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span>Biaya Pendaftaran</span>
                          <span className="text-indigo-600 font-bold">
                            Diberikan setelah lolos kurasi
                          </span>
                        </div>
                      </div>

                      {isRegistrationOpen && (
                        <div className="mt-5">
                          <Link
                            href={`/tournaments/${slug}/register`}
                            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                          >
                            <span className="material-symbols-outlined text-base">
                              how_to_reg
                            </span>
                            Daftar di Kategori Ini
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 3: JADWAL & PERTANDINGAN
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
              TAB 4: INFO & ATURAN
          ────────────────────────────────────────────────────────── */}
          {activeTab === "info" && (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Caprival Qualification Card in Tab 4 */}
              {isCaprival && (
                <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-6 sm:p-8 shadow-xs lg:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                        <span className="material-symbols-outlined text-2xl">
                          verified
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">
                            Standar Kualifikasi Level Pemain (Tenis & Padel)
                          </h3>
                          <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">
                            The Grand Caprival
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Untuk menjaga integritas kompetisi, seluruh tim akan
                          melewati tahap kurasi & verifikasi profil secara
                          ketat.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCaprivalModal(true)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700"
                    >
                      <span className="material-symbols-outlined text-base">
                        table_chart
                      </span>
                      Buka Matriks Lengkap (Pop-up)
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-1.5">
                      <span className="font-extrabold text-amber-900 block text-sm">
                        Upper Beginner Women
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Khusus pemula tenis & padel. Dilarang bagi mantan atlet
                        pro raket (5 thn), tenis intermediate/advanced, peraih
                        gelar resmi, dan coach.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5">
                      <span className="font-extrabold text-slate-900 block text-sm">
                        Bronze (Men & Women)
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Pemain intermediate tenis atau 2x juara beginner
                        (partner beda). Dilarang untuk advanced tenis, coach,
                        dan peraih podium silver/gold.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-1.5">
                      <span className="font-extrabold text-indigo-950 block text-sm">
                        Silver Open
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Terbuka untuk petenis advanced, pelatih tenis/padel, dan
                        semifinalis turnamen silver. Dilarang bagi pro raket (5
                        thn) & pemain PON.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-4 space-y-1.5">
                      <span className="font-extrabold text-sky-950 block text-sm">
                        KU-14 Men
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Pembinaan junior putra kelahiran tahun 2012 atau
                        setelahnya. Wajib melampirkan identitas resmi saat
                        mendaftar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                {/* Registration & Curation Workflow */}
                <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600">
                      fact_check
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Alur Registrasi & Pembayaran
                    </h3>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Turnamen menerapkan sistem kurasi kategori terlebih dahulu
                    untuk memastikan kompetisi yang adil dan seimbang:
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-white p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                        1
                      </span>
                      <div>
                        <strong className="text-slate-900">
                          Pendaftaran Bebas Biaya di Awal:
                        </strong>{" "}
                        Tim mendaftarkan diri secara online dengan melengkapi
                        profil pemain dan pilihan kategori.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-white p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                        2
                      </span>
                      <div>
                        <strong className="text-slate-900">
                          Verifikasi & Kurasi Kategori:
                        </strong>{" "}
                        Panitia melakukan pengecekan data, rekam jejak, dan
                        kesesuaian kategori masing-masing tim.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-white p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                        3
                      </span>
                      <div>
                        <strong className="text-slate-900">
                          Penetapan Biaya & Pembayaran:
                        </strong>{" "}
                        Setelah tim disetujui (Approved), nominal pendaftaran
                        dan rekening resmi akan dibuka di tab{" "}
                        <em>Pendaftaran Saya</em>.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-white p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                        4
                      </span>
                      <div>
                        <strong className="text-slate-900">
                          Konfirmasi Main Draw:
                        </strong>{" "}
                        Begitu bukti transfer diverifikasi, slot tim Anda resmi
                        dikunci dan masuk ke jadwal pertandingan.
                      </div>
                    </div>
                  </div>
                </div>

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

      {/* Caprival Qualification Matrix Modal */}
      {isCaprival && (
        <CaprivalQualificationModal
          isOpen={showCaprivalModal}
          onClose={() => setShowCaprivalModal(false)}
        />
      )}

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
