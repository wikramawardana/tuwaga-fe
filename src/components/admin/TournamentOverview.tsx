"use client";

import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  BroadcastIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  DiceFiveIcon,
  EyeIcon,
  HourglassHighIcon,
  MapPinIcon,
  MoneyIcon,
  SealCheckIcon,
  SlidersHorizontalIcon,
  TrophyIcon,
  UserCheckIcon,
  UserCirclePlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useMemo } from "react";
import {
  type AppIcon,
  ScoreboardIcon,
  WhistleIcon,
} from "@/components/icons/SportIcons";
import SportBadge from "@/components/SportBadge";
import type {
  Match,
  RegistrationTeam,
  Tournament,
  TournamentStatus,
} from "@/lib/tuwagaApi";
import type { AdminSection, EditableSettings } from "./TournamentControlRoom";

interface TournamentOverviewProps {
  tournament: Tournament;
  settings: EditableSettings;
  teams: RegistrationTeam[];
  matches: Match[];
  totals: {
    approved: number;
    paid: number;
    eligible: number;
    live: number;
    scheduled: number;
    completed: number;
  };
  onNavigateSection: (section: AdminSection) => void;
  onViewTeam: (team: RegistrationTeam) => void;
  onUpdateStatus: (status: TournamentStatus) => Promise<void>;
}

const statusOptions: Array<{
  id: TournamentStatus;
  label: string;
  icon: AppIcon;
}> = [
  { id: "setup", label: "Setup", icon: SlidersHorizontalIcon },
  { id: "registration", label: "Registration", icon: UserCheckIcon },
  { id: "live", label: "Live Tournament", icon: BroadcastIcon },
  { id: "completed", label: "Completed", icon: TrophyIcon },
];

export default function TournamentOverview({
  tournament,
  settings,
  teams,
  matches,
  totals,
  onNavigateSection,
  onViewTeam,
  onUpdateStatus,
}: TournamentOverviewProps) {
  const pendingTeams = useMemo(
    () =>
      teams.filter(
        (t) => t.status === "pending" || (!t.paid && t.paymentProofUrl),
      ),
    [teams],
  );

  const entryFee = settings.entryFeePerPair ?? 600000;
  const totalRevenue = totals.paid * entryFee;
  const maxCapacity = settings.maxPlayers || 32;
  const fillPercentage = Math.min(
    Math.round((teams.length / maxCapacity) * 100),
    100,
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Tournament Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-ink-200/80 bg-gradient-to-br from-ink-900 via-ink-950 to-ink-950 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 -mb-16 h-48 w-48 rounded-full bg-ink-900/10 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <SportBadge sport={settings.sport} tone="dark" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-ink-300 backdrop-blur-sm">
                <MapPinIcon
                  className="text-sm"
                  aria-hidden="true"
                  weight="bold"
                />
                {tournament.venue || "Venue belum diatur"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-ink-300 backdrop-blur-sm">
                <CalendarCheckIcon
                  className="text-sm"
                  aria-hidden="true"
                  weight="bold"
                />
                {tournament.dateLabel || "Tanggal belum diatur"}
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
              {tournament.name}
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-cream-100/80">
              {tournament.description ||
                "Pusat komando eksekutif turnamen TUWAGA. Pantau pendaftaran, verifikasi tim, gelar Technical Meeting, dan kelola pertandingan."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Quick Status Changer */}
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/15">
              <span className="pl-3 text-[11px] font-bold uppercase tracking-wider text-cream-200">
                Status:
              </span>
              <select
                value={tournament.status}
                onChange={(e) =>
                  onUpdateStatus(e.target.value as TournamentStatus)
                }
                className="h-9 rounded-xl bg-white px-3 text-xs font-extrabold text-ink-900 shadow-sm outline-none cursor-pointer hover:bg-ink-50 transition"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <a
              href={`/tournaments/${tournament.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-xs font-extrabold text-ink-950 shadow-lg shadow-ink-950/10 transition hover:-translate-y-0.5 hover:bg-brand-50"
            >
              <span>Halaman Publik</span>
              <ArrowSquareOutIcon
                className="text-base"
                aria-hidden="true"
                weight="bold"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Vital Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Registrations */}
        <div className="rounded-2xl border border-ink-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400">
              Pendaftar / Kuota
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <UsersThreeIcon
                className="text-lg"
                aria-hidden="true"
                weight="bold"
              />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-ink-950">
              {teams.length}
            </span>
            <span className="text-sm font-semibold text-ink-500">
              / {maxCapacity} Tim ({fillPercentage}%)
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
          <p className="mt-3 text-[11px] font-medium text-ink-500">
            <strong className="text-emerald-600 font-bold">
              {totals.approved} Disetujui
            </strong>{" "}
            ·{" "}
            <strong className="text-amber-600 font-bold">
              {teams.filter((t) => t.status === "pending").length} Review
            </strong>{" "}
            · {teams.filter((t) => t.status === "waitlist").length} Waitlist
          </p>
        </div>

        {/* Card 2: Revenue */}
        <div className="rounded-2xl border border-ink-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400">
              Kas Pembayaran
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <MoneyIcon className="text-lg" aria-hidden="true" weight="bold" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black tracking-tight text-ink-950">
              Rp {totalRevenue.toLocaleString("id-ID")}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-emerald-700">
            {totals.paid} tim telah lunas
          </p>
          <p className="mt-3 text-[11px] font-medium text-ink-500">
            Biaya: Rp {entryFee.toLocaleString("id-ID")} / pasang ·{" "}
            {teams.length - totals.paid} belum lunas
          </p>
        </div>

        {/* Card 3: Drawing Readiness */}
        <div className="rounded-2xl border border-ink-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400">
              Kesiapan TM & Draw
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream-50 text-cream-700">
              <DiceFiveIcon
                className="text-lg"
                aria-hidden="true"
                weight="bold"
              />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-ink-950">
              {totals.eligible}
            </span>
            <span className="text-sm font-semibold text-ink-500">
              Tim Siap Undi
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {totals.eligible >= 4 ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                <CheckCircleIcon
                  className="text-sm"
                  aria-hidden="true"
                  weight="bold"
                />
                Siap Technical Meeting
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                <HourglassHighIcon
                  className="text-sm"
                  aria-hidden="true"
                  weight="bold"
                />
                Menunggu verifikasi tim
              </span>
            )}
          </div>
          <p className="mt-3 text-[11px] font-medium text-ink-500">
            Syarat: Status disetujui & pembayaran lunas
          </p>
        </div>

        {/* Card 4: Match Progress */}
        <div className="rounded-2xl border border-ink-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400">
              Operasional Match
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <ScoreboardIcon
                className="text-lg"
                aria-hidden="true"
                weight="bold"
              />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-ink-950">
              {matches.length}
            </span>
            <span className="text-sm font-semibold text-ink-500">
              Total Match
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink-600">
            {totals.live > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-bold text-rose-700 border border-rose-200">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                {totals.live} Live
              </span>
            )}
            <span>{totals.scheduled} Jadwal</span> ·{" "}
            <span>{totals.completed} Selesai</span>
          </div>
          <p className="mt-3 text-[11px] font-medium text-ink-500">
            {settings.courts} Lapangan · Durasi {settings.matchDuration} Menit
          </p>
        </div>
      </div>

      {/* Quick Launch Action Center */}
      <div>
        <div className="mb-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-600">
            Pusat Kendali Turnamen
          </p>
          <h2 className="text-xl font-black tracking-tight text-ink-950">
            Alur Kerja & Menu Cepat
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Action 1: Teams */}
          <button
            type="button"
            onClick={() => onNavigateSection("registrations")}
            className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-ink-200/80 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md focus:outline-none"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-500 group-hover:text-ink-950">
                  <UserCirclePlusIcon
                    className="text-2xl"
                    aria-hidden="true"
                    weight="duotone"
                  />
                </span>
                {pendingTeams.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping" />
                    {pendingTeams.length} Perlu Review
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-black text-ink-950 group-hover:text-brand-700 transition">
                Tim & Pendaftaran
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">
                Verifikasi kelengkapan tim, ukuran jersey, dan cek bukti
                transfer pembayaran.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1 text-xs font-extrabold text-brand-600">
              <span>Buka Data Pendaftar</span>
              <ArrowRightIcon
                className="text-sm transition group-hover:translate-x-1"
                aria-hidden="true"
                weight="bold"
              />
            </div>
          </button>

          {/* Action 2: Technical Meeting */}
          <button
            type="button"
            onClick={() => onNavigateSection("technical-meeting")}
            className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-cream-200/80 bg-gradient-to-br from-white to-cream-50/40 p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-cream-400 hover:shadow-md focus:outline-none"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-100 text-cream-700 transition group-hover:bg-cream-600 group-hover:text-white">
                  <DiceFiveIcon
                    className="text-2xl"
                    aria-hidden="true"
                    weight="duotone"
                  />
                </span>
                <span className="rounded-md bg-cream-100 px-2 py-0.5 text-[10px] font-black uppercase text-cream-800">
                  Live Wheel
                </span>
              </div>
              <h3 className="mt-4 font-black text-ink-950 group-hover:text-cream-700 transition">
                Technical Meeting & Draw
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">
                Putar roda undian interaktif (Picker Wheel) untuk pembagian grup
                dan slot bagan langsung.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1 text-xs font-extrabold text-cream-700">
              <span>Mulai Technical Meeting</span>
              <ArrowRightIcon
                className="text-sm transition group-hover:translate-x-1"
                aria-hidden="true"
                weight="bold"
              />
            </div>
          </button>

          {/* Action 3: Match Operations */}
          <button
            type="button"
            onClick={() => onNavigateSection("operations")}
            className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-ink-200/80 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md focus:outline-none"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                  <WhistleIcon
                    className="text-2xl"
                    aria-hidden="true"
                    weight="duotone"
                  />
                </span>
                <span className="rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-black uppercase text-ink-600">
                  {matches.length} Matches
                </span>
              </div>
              <h3 className="mt-4 font-black text-ink-950 group-hover:text-emerald-700 transition">
                Match Operations
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">
                Atur jadwal lapangan (OOP), panggil tim ke court, dan catat skor
                pertandingan secara live.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1 text-xs font-extrabold text-emerald-600">
              <span>Buka Match Board</span>
              <ArrowRightIcon
                className="text-sm transition group-hover:translate-x-1"
                aria-hidden="true"
                weight="bold"
              />
            </div>
          </button>

          {/* Action 4: Setup */}
          <button
            type="button"
            onClick={() => onNavigateSection("setup")}
            className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-ink-200/80 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md focus:outline-none"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-700 transition group-hover:bg-ink-800 group-hover:text-white">
                  <SlidersHorizontalIcon
                    className="text-2xl"
                    aria-hidden="true"
                    weight="duotone"
                  />
                </span>
                <span className="rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-black uppercase text-ink-600">
                  Konfigurasi
                </span>
              </div>
              <h3 className="mt-4 font-black text-ink-950 group-hover:text-brand-700 transition">
                Pengaturan Turnamen
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">
                Ubah informasi turnamen, rekening transfer, aturan per divisi,
                serta kapasitas Order of Play.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1 text-xs font-extrabold text-ink-700">
              <span>Buka Pengaturan</span>
              <ArrowRightIcon
                className="text-sm transition group-hover:translate-x-1"
                aria-hidden="true"
                weight="bold"
              />
            </div>
          </button>
        </div>
      </div>

      {/* Action Needed Section: Pending Verifications */}
      <div className="rounded-3xl border border-ink-200/80 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-ink-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ClockCountdownIcon
                className="text-amber-500"
                aria-hidden="true"
                weight="bold"
              />
              <h3 className="text-lg font-black text-ink-950">
                Pendaftar Menunggu Verifikasi ({pendingTeams.length})
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-ink-500">
              Tim yang berkasnya perlu ditinjau atau bukti transfernya perlu
              dikonfirmasi.
            </p>
          </div>
          {pendingTeams.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateSection("registrations")}
              className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-600 hover:underline"
            >
              Lihat semua pendaftar ({teams.length})
              <ArrowRightIcon
                className="text-sm"
                aria-hidden="true"
                weight="bold"
              />
            </button>
          )}
        </div>

        {pendingTeams.length === 0 ? (
          <div className="py-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <SealCheckIcon
                className="text-2xl"
                aria-hidden="true"
                weight="duotone"
              />
            </span>
            <p className="mt-3 font-black text-ink-900">
              Semua Berkas Terverifikasi!
            </p>
            <p className="mt-1 text-xs text-ink-500 max-w-md mx-auto">
              Tidak ada tim yang menunggu kurasi atau verifikasi pembayaran saat
              ini. Anda dapat melanjutkan ke Technical Meeting atau pembuatan
              jadwal.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-ink-100">
            {pendingTeams.slice(0, 5).map((team) => (
              <div
                key={team.id}
                className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xs font-black text-brand-800">
                    {team.player.charAt(0).toUpperCase()}
                    {team.partner?.charAt(0).toUpperCase() ?? ""}
                  </span>
                  <div>
                    <p className="font-bold text-ink-900 text-sm">
                      {team.player} {team.partner ? `/ ${team.partner}` : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-ink-500">
                      <span className="font-semibold text-brand-700">
                        {team.category}
                      </span>
                      <span>·</span>
                      <span>{team.city || "Indonesia"}</span>
                      {team.paymentProofUrl && (
                        <>
                          <span>·</span>
                          <span className="font-bold text-emerald-700">
                            Bukti Ada
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      team.paid
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {team.paid ? "Lunas" : "Belum Bayar"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onViewTeam(team)}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-brand-200 bg-brand-50 px-3 text-xs font-bold text-brand-700 hover:bg-brand-100 transition"
                  >
                    <EyeIcon
                      className="text-base"
                      aria-hidden="true"
                      weight="bold"
                    />
                    Review Berkas
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
