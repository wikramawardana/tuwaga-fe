"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { CaprivalQualificationModal } from "@/components/tournaments/CaprivalQualificationModal";
import VerifierAssignments from "@/components/verification/VerifierAssignments";
import { useSession } from "@/lib/auth-client";
import { isCaprivalTournament } from "@/lib/caprivalQualifications";
import {
  type EligibilityStatus,
  listVerificationRegistrations,
  listVerificationTournaments,
  type PartnerDetail,
  submitEligibilityReview,
  type VerificationRegistration,
  type VerificationTournament,
} from "@/lib/tuwagaApi";

const labels = {
  eligible: "Layak",
  needs_clarification: "Perlu klarifikasi",
  ineligible: "Tidak layak",
  pending: "Belum ditinjau",
};
const inputClass =
  "mt-1 h-11 w-full rounded-lg border border-ink-300 bg-white px-3 text-sm";

function documentUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function Profile({ title, player }: { title: string; player: PartnerDetail }) {
  const fields = [
    ["Nama", player.fullName],
    ["Email", player.email],
    ["Telepon", player.phone],
    ["Kota", player.city],
    ["Level", player.skillLevel],
    ["Instagram", player.instagram],
    ["Reclub", player.reclub],
    ["Komunitas", player.community],
    ["Membership", player.membershipId],
  ];
  return (
    <section className="rounded-xl border border-ink-200 bg-white p-4">
      <h3 className="font-semibold">{title}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        {fields.map(([label, value]) => (
          <div className="grid grid-cols-[100px_1fr] gap-3" key={label}>
            <dt className="text-ink-500">{label}</dt>
            <dd className="break-words">{value || "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-3">
        {[
          ["Foto pemain", player.photoUrl],
          ["Dokumen identitas", player.idCardUrl],
        ].map(([label, value]) => {
          const href = documentUrl(value);
          return href ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline"
            >
              {label}
            </a>
          ) : (
            <span key={label} className="text-xs text-ink-500">
              {label}: belum tersedia
            </span>
          );
        })}
      </div>
    </section>
  );
}

export default function VerificationWorkspace({
  tournamentId,
}: {
  tournamentId?: string;
}) {
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "admin";
  const [tournaments, setTournaments] = useState<VerificationTournament[]>([]);
  const [registrations, setRegistrations] = useState<
    VerificationRegistration[]
  >([]);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EligibilityStatus>("eligible");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const loadVersion = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setError("");
    setRegistrations([]);
    setSelectedId("");
    try {
      const events = await listVerificationTournaments();
      if (version !== loadVersion.current) return;
      setTournaments(events);
      if (tournamentId) {
        if (!events.some((event) => event.id === tournamentId))
          throw new Error("Anda tidak ditugaskan ke turnamen ini.");
        const teams = await listVerificationRegistrations(tournamentId);
        if (version !== loadVersion.current) return;
        setRegistrations(teams);
      }
    } catch (err) {
      if (version !== loadVersion.current) return;
      // Discard any previously loaded private information after access failure.
      setRegistrations([]);
      setTournaments([]);
      setSelectedId("");
      setError(err instanceof Error ? err.message : "Gagal memuat verifikasi");
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [tournamentId]);
  useEffect(() => {
    void refresh();
    return () => {
      loadVersion.current++;
    };
  }, [refresh]);
  const selected = registrations.find((team) => team.id === selectedId);
  const tournament = tournaments.find((event) => event.id === tournamentId);
  const visible = registrations.filter(
    (team) =>
      (filter === "all" || (team.reviews[0]?.status ?? "pending") === filter) &&
      `${team.player.fullName} ${team.partner?.fullName ?? ""} ${team.category}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  function select(team: VerificationRegistration) {
    setSelectedId(team.id);
    setStatus(team.reviews[0]?.status ?? "eligible");
    setNotes("");
    setSaved(false);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!tournamentId || !selected || saving) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const review = await submitEligibilityReview(
        tournamentId,
        selected.id,
        status,
        notes,
      );
      setRegistrations((current) =>
        current.map((team) =>
          team.id === selected.id
            ? { ...team, reviews: [review, ...team.reviews] }
            : team,
        ),
      );
      setNotes("");
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan keputusan",
      );
    } finally {
      setSaving(false);
    }
  }
  const qualificationUrl = documentUrl(selected?.qualificationUrl);
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink-950">
      <Navbar active="admin" />
      <main className="container-wide flex-1 pb-12 pt-24">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-ink-500">EO · Verifikasi Pemain</p>
            <h1 className="mt-2 text-3xl font-semibold">
              {tournament?.name || "Verifikasi turnamen"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-ink-600">
              Tinjau profil dan kelayakan kategori pemain. Panitia tetap
              mengelola persetujuan pendaftaran dan pembayaran.
            </p>
          </div>
          {tournamentId && (
            <Link className="btn btn-outline" href="/verification">
              Daftar turnamen
            </Link>
          )}
          {session?.user.role !== "eo" && (
            <Link className="btn btn-outline" href="/admin">
              Control room
            </Link>
          )}
        </div>
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
            <button
              type="button"
              className="btn btn-sm btn-outline ml-3"
              onClick={() => void refresh()}
            >
              Coba lagi
            </button>
          </div>
        )}
        {loading ? (
          <output aria-live="polite">Memuat verifikasi…</output>
        ) : !tournamentId ? (
          <>
            {tournaments.length === 0 && !error && (
              <div className="rounded-2xl border border-ink-200 bg-white p-8">
                <h2 className="text-lg font-semibold">
                  Belum ada turnamen yang ditugaskan
                </h2>
                <p className="mt-2 text-sm text-ink-600">
                  Hubungi admin untuk mendapatkan penugasan EO.
                </p>
              </div>
            )}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-ink-200 bg-white p-6"
                >
                  <h2 className="text-xl font-semibold">{event.name}</h2>
                  <p className="mt-2 text-sm text-ink-600">
                    {event.venue} · {event.dateLabel}
                  </p>
                  <Link
                    className="btn btn-dark mt-5"
                    href={`/verification/${encodeURIComponent(event.id)}`}
                  >
                    Buka verifikasi
                  </Link>
                </article>
              ))}
            </div>
          </>
        ) : tournament ? (
          <div className="space-y-6">
            {isAdmin && <VerifierAssignments tournamentId={tournamentId} />}
            {isCaprivalTournament(tournament.slug) && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowRules(true)}
              >
                Panduan kualifikasi kategori
              </button>
            )}
            <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
              <section className="rounded-2xl border border-ink-200 bg-white p-5">
                <h2 className="text-lg font-semibold">
                  Peserta ({registrations.length})
                </h2>
                <label className="mt-4 block text-sm">
                  Cari pemain
                  <input
                    className={inputClass}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Nama atau kategori"
                  />
                </label>
                <label className="mt-3 block text-sm">
                  Status verifikasi
                  <select
                    className={inputClass}
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                  >
                    <option value="all">Semua</option>
                    {Object.entries(labels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                {visible.length === 0 && (
                  <p className="mt-5 text-sm text-ink-500">
                    Tidak ada peserta yang cocok.
                  </p>
                )}
                <ul className="mt-4 space-y-2">
                  {visible.map((team) => (
                    <li key={team.id}>
                      <button
                        type="button"
                        disabled={saving}
                        aria-pressed={selectedId === team.id}
                        className={`w-full rounded-xl border p-3 text-left ${selectedId === team.id ? "border-brand-600 bg-brand-50" : "border-ink-200 hover:bg-ink-50"}`}
                        onClick={() => select(team)}
                      >
                        <span className="block font-semibold">
                          {team.player.fullName}
                          {team.partner ? ` / ${team.partner.fullName}` : ""}
                        </span>
                        <span className="mt-1 block text-xs text-ink-600">
                          {team.category}
                        </span>
                        <span className="mt-2 block text-xs font-semibold">
                          {labels[team.reviews[0]?.status ?? "pending"]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
              {selected ? (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Profile title="Pemain 1" player={selected.player} />
                    {selected.partner && (
                      <Profile title="Pemain 2" player={selected.partner} />
                    )}
                  </div>
                  {qualificationUrl && (
                    <a
                      href={qualificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                    >
                      Dokumen kualifikasi
                    </a>
                  )}
                  <form
                    onSubmit={submit}
                    className="rounded-2xl border border-ink-200 bg-white p-5"
                  >
                    <h2 className="text-lg font-semibold">
                      Keputusan kelayakan · {selected.category}
                    </h2>
                    <label className="mt-4 block text-sm">
                      Hasil verifikasi
                      <select
                        className={inputClass}
                        value={status}
                        onChange={(event) =>
                          setStatus(event.target.value as EligibilityStatus)
                        }
                        disabled={saving}
                      >
                        <option value="eligible">Layak</option>
                        <option value="needs_clarification">
                          Perlu klarifikasi
                        </option>
                        <option value="ineligible">Tidak layak</option>
                      </select>
                    </label>
                    <label className="mt-4 block text-sm">
                      Catatan {status !== "eligible" ? "(wajib)" : "(opsional)"}
                      <textarea
                        className="mt-1 min-h-28 w-full rounded-lg border border-ink-300 p-3"
                        maxLength={2000}
                        required={status !== "eligible"}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        disabled={saving}
                      />
                    </label>
                    <button
                      type="submit"
                      className="btn btn-primary mt-4"
                      disabled={
                        saving || (status !== "eligible" && !notes.trim())
                      }
                    >
                      {saving ? "Menyimpan…" : "Simpan keputusan"}
                    </button>
                    {saved && (
                      <output
                        aria-live="polite"
                        className="mt-3 text-sm text-emerald-700"
                      >
                        Keputusan tersimpan. Panitia dapat melihat hasilnya.
                      </output>
                    )}
                  </form>
                  <section className="rounded-2xl border border-ink-200 bg-white p-5">
                    <h2 className="text-lg font-semibold">
                      Riwayat verifikasi
                    </h2>
                    {selected.reviews.length === 0 && (
                      <p className="mt-3 text-sm text-ink-500">
                        Belum ada keputusan.
                      </p>
                    )}
                    <ol className="mt-3 divide-y divide-ink-100">
                      {selected.reviews.map((review) => (
                        <li key={review.id} className="py-3">
                          <p className="text-sm font-semibold">
                            {labels[review.status]} · {review.reviewerName}
                          </p>
                          <p className="mt-1 text-xs text-ink-500">
                            {new Date(review.reviewedAt).toLocaleString(
                              "id-ID",
                              { timeZone: "Asia/Jakarta" },
                            )}{" "}
                            WIB
                          </p>
                          {review.notes && (
                            <p className="mt-2 whitespace-pre-wrap text-sm">
                              {review.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </section>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-8 text-sm text-ink-600">
                  Pilih peserta untuk meninjau profil dan kelayakan.
                </div>
              )}
            </div>
          </div>
        ) : null}
        <CaprivalQualificationModal
          isOpen={showRules}
          onClose={() => setShowRules(false)}
        />
      </main>
      <Footer />
    </div>
  );
}
