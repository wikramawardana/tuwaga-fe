"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import RegistrationProgress from "@/components/RegistrationProgress";
import RegistrationShell from "@/components/RegistrationShell";
import { useSession } from "@/lib/auth-client";
import { divisionSkillLabel, divisionSkillLevel } from "@/lib/matchDivisions";
import {
  createRegistration,
  getRegistrationSummary,
  getTournamentBySlug,
  type Tournament,
  uploadFile,
} from "@/lib/tuwagaApi";

const WIZARD_STEPS = ["Kategori", "Pemain 1", "Pemain 2", "Review"];

const DEFAULT_JERSEY_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

function FieldLabel({
  children,
  htmlFor,
  required = false,
}: {
  children: string;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[14px] font-bold tracking-[0.01em] text-on-surface"
    >
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

function FileUploadBox({
  label,
  description,
  url,
  required = false,
  onUpload,
  loading,
}: {
  label: string;
  description: string;
  url?: string;
  required?: boolean;
  onUpload: (file: File) => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/60 bg-white p-5 transition hover:border-primary hover:bg-surface-container-low/50">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
        {url ? (
          <div className="flex w-full items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-outline-variant bg-slate-100">
              <Image
                src={url}
                alt={label}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                <span className="material-symbols-outlined text-sm">check</span>
                File terunggah
              </span>
              <p className="mt-1 text-xs text-on-surface-variant truncate">
                Klik untuk mengganti gambar
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">
              {loading ? "progress_activity" : "cloud_upload"}
            </span>
            <p className="mt-2 text-xs font-bold text-on-surface">
              {loading ? "Mengunggah..." : "Pilih atau seret gambar ke sini"}
            </p>
            <p className="text-[11px] text-on-surface-variant">{description}</p>
          </div>
        )}
      </label>
    </div>
  );
}

function StepActions({
  step,
  totalSteps,
  onBack,
  onNext,
  canNext,
  submitting,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  submitting: boolean;
}) {
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;

  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      {!isFirst ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-5 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali
        </button>
      ) : (
        <div />
      )}
      {isLast ? (
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext || submitting}
          className={`inline-flex h-12 items-center gap-2 rounded-lg px-7 text-[14px] font-semibold shadow-lg transition-all active:scale-95 ${
            canNext && !submitting
              ? "bg-primary text-on-primary shadow-primary/20 hover:bg-on-primary-fixed-variant"
              : "cursor-not-allowed bg-outline-variant text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            verified_user
          </span>
          {submitting ? "Memproses..." : "Konfirmasi & Kirim Pendaftaran"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={`inline-flex h-11 items-center gap-2 rounded-lg px-6 text-sm font-bold transition-colors ${
            canNext
              ? "bg-primary text-on-primary hover:bg-primary/90"
              : "cursor-not-allowed bg-outline-variant text-on-surface-variant"
          }`}
        >
          Lanjut
          <span className="material-symbols-outlined text-lg">
            arrow_forward
          </span>
        </button>
      )}
    </div>
  );
}

export default function TournamentRegisterPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [step, setStep] = useState(0);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmedDisclaimer, setConfirmedDisclaimer] = useState(false);

  // Uploading state flags
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>(
    {},
  );

  // Form states
  const [selectedCategory, setSelectedCategory] = useState("");

  const [player1, setPlayer1] = useState({
    fullName: "",
    email: "",
    phone: "",
    instagram: "",
    reclub: "",
    community: "",
    city: "",
    jerseySize: "M",
    photoUrl: "",
    idCardUrl: "",
    nationality: "ID",
  });

  const [player2, setPlayer2] = useState({
    fullName: "",
    email: "",
    phone: "",
    instagram: "",
    reclub: "",
    community: "",
    city: "",
    jerseySize: "M",
    photoUrl: "",
    idCardUrl: "",
  });

  const { data: session, isPending: sessionPending } = useSession();

  // Auto pre-fill player 1 from authenticated user session
  useEffect(() => {
    if (session?.user) {
      setPlayer1((prev) => ({
        ...prev,
        fullName: prev.fullName || session.user.name || "",
        email: prev.email || session.user.email || "",
      }));
    }
  }, [session]);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    async function loadTournament() {
      setLoading(true);
      try {
        const current = await getTournamentBySlug(slug);
        if (!active) return;
        setTournament(current);
        const categories = current.settings.categories ?? [];
        if (categories.length > 0) {
          setSelectedCategory(categories[0]);
        }
        await getRegistrationSummary(current.id);
      } catch (err) {
        if (!active) return;
        setMessage(
          err instanceof Error ? err.message : "Gagal memuat info turnamen.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTournament();
    return () => {
      active = false;
    };
  }, [slug]);

  const jerseyOptions = useMemo(() => {
    return tournament?.settings.jerseySizes &&
      tournament.settings.jerseySizes.length > 0
      ? tournament.settings.jerseySizes
      : DEFAULT_JERSEY_SIZES;
  }, [tournament]);

  const handleUploadKey = async (
    key: string,
    file: File,
    onSuccess: (url: string) => void,
  ) => {
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Ukuran file maksimal 5MB.");
      return;
    }
    setUploadingState((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await uploadFile(file);
      onSuccess(res.url);
      setMessage("");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Gagal mengunggah gambar.",
      );
    } finally {
      setUploadingState((prev) => ({ ...prev, [key]: false }));
    }
  };

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0:
        return !!selectedCategory;
      case 1:
        return (
          !!player1.fullName.trim() &&
          !!player1.phone.trim() &&
          !!player1.instagram.trim() &&
          !!player1.city.trim() &&
          !!player1.jerseySize
        );
      case 2:
        return (
          !!player2.fullName.trim() &&
          !!player2.phone.trim() &&
          !!player2.instagram.trim() &&
          !!player2.city.trim() &&
          !!player2.jerseySize
        );
      case 3:
        return true;
      default:
        return false;
    }
  }, [step, selectedCategory, player1, player2]);

  const handleSubmit = async () => {
    if (!tournament) return;
    setSubmitting(true);
    try {
      const divisionLevel = divisionSkillLevel(selectedCategory);
      const response = await createRegistration(tournament.id, {
        acceptedTerms: true,
        category: selectedCategory,
        userId: session?.user?.id,
        player: {
          fullName: player1.fullName.trim(),
          email:
            player1.email.trim() ||
            `${player1.fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}@player.tuwaga.id`,
          phone: player1.phone.trim(),
          nationality: player1.nationality,
          skillLevel: divisionLevel,
          city: player1.city.trim() || null,
          photoUrl: player1.photoUrl || null,
          instagram: player1.instagram.trim() || null,
          reclub: player1.reclub.trim() || null,
          community: player1.community.trim() || null,
          jerseySize: player1.jerseySize || null,
          idCardUrl: player1.idCardUrl || null,
        },
        partner: {
          fullName: player2.fullName.trim(),
          email:
            player2.email.trim() ||
            `${player2.fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}@partner.tuwaga.id`,
          phone: player2.phone.trim() || null,
          skillLevel: divisionLevel,
          city: player2.city.trim() || null,
          photoUrl: player2.photoUrl || null,
          instagram: player2.instagram.trim() || null,
          reclub: player2.reclub.trim() || null,
          community: player2.community.trim() || null,
          jerseySize: player2.jerseySize || null,
          idCardUrl: player2.idCardUrl || null,
        },
      });

      const params = new URLSearchParams({
        registrationId: response.registration.id,
        tournamentName: tournament.name,
        tournamentSlug: tournament.slug,
        category: selectedCategory,
        player: player1.fullName.trim(),
        partner: player2.fullName.trim(),
        venue: tournament.venue,
        date: tournament.dateLabel,
      });

      window.location.href = `/register/success?${params.toString()}`;
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Gagal mengirim pendaftaran.",
      );
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (step === WIZARD_STEPS.length - 1) {
      setShowConfirmModal(true);
    } else {
      setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && !tournament) {
    return (
      <RegistrationShell title="Memuat Turnamen..." showProgress={false}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </RegistrationShell>
    );
  }

  if (!tournament) {
    return (
      <RegistrationShell title="Turnamen Tidak Ditemukan" showProgress={false}>
        <div className="rounded-lg border border-error/20 bg-error-container p-6 text-sm font-semibold text-on-error-container">
          {message || "Informasi turnamen tidak dapat ditemukan."}
        </div>
      </RegistrationShell>
    );
  }

  if (!sessionPending && !session?.user) {
    const callbackUrl = encodeURIComponent(`/tournaments/${slug}/register`);
    return (
      <RegistrationShell
        title={tournament.name}
        description={`${tournament.venue} — ${tournament.dateLabel}`}
        showProgress={false}
      >
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>

            <div className="mt-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <span className="material-symbols-outlined text-sm">
                  shield
                </span>
                Pendaftaran Terverifikasi & Aman
              </span>
              <h2 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
                Masuk untuk Mendaftar Turnamen
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Untuk menjaga keamanan data pribadi dan verifikasi tiket resmi
                turnamen, seluruh calon peserta wajib masuk menggunakan akun
                Tuwaga.
              </p>
            </div>

            <div className="mt-6 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-emerald-600">
                  check_circle
                </span>
                <span>Data pendaftaran langsung terhubung ke akun Anda</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-emerald-600">
                  check_circle
                </span>
                <span>
                  Privasi terjamin: nama dan detail tim Anda aman dari pihak
                  luar
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-emerald-600">
                  check_circle
                </span>
                <span>
                  Pantau verifikasi pembayaran & jadwal tanding langsung di
                  dashboard pribadi
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href={`/login?callbackUrl=${callbackUrl}`}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                Masuk dengan Akun Anda
              </Link>
              <Link
                href={`/tournaments/${slug}`}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Kembali ke Info Turnamen
              </Link>
            </div>
          </div>
        </div>
      </RegistrationShell>
    );
  }

  return (
    <RegistrationShell
      current={step}
      title={tournament.name}
      description={`${tournament.venue} — ${tournament.dateLabel}`}
      showProgress
    >
      <RegistrationProgress steps={WIZARD_STEPS} current={step} />

      <div className="mx-auto max-w-2xl">
        {message && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {message}
          </div>
        )}

        {/* STEP 0: PILIH KATEGORI */}
        {step === 0 && (
          <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                <span className="material-symbols-outlined text-[22px]">
                  category
                </span>
              </div>
              <div>
                <h2 className="text-[24px] font-bold leading-[1.3] text-on-surface">
                  Pilihan Kategori
                </h2>
                <p className="mt-1 text-[14px] leading-[1.5] text-on-surface-variant">
                  Pilih salah satu kategori turnamen untuk pasangan Anda.
                </p>
              </div>
            </div>

            {/* Tournament brief banner info */}
            <div className="mb-6 rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Tahap Turnamen
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Kurasi & Verifikasi Kategori
                </span>
              </div>
              {tournament.settings.registrationClosedAt && (
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Batas Akhir Pendaftaran:</span>
                  <span className="font-bold text-rose-600">
                    {tournament.settings.registrationClosedAt}
                  </span>
                </div>
              )}
              {tournament.settings.contactPerson && (
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Kontak Panitia (CP):</span>
                  <span className="font-bold text-on-surface">
                    {tournament.settings.contactPerson}
                  </span>
                </div>
              )}
              {tournament.settings.registrationNotes && (
                <p className="pt-2 text-xs leading-relaxed text-on-surface-variant border-t border-outline-variant/20">
                  📌 {tournament.settings.registrationNotes}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(tournament.settings.categories ?? []).map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <label key={cat} className="cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={isSelected}
                      onChange={() => setSelectedCategory(cat)}
                      className="sr-only"
                    />
                    <div
                      className={`rounded-xl border bg-white p-5 transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/10 shadow-sm"
                          : "border-outline-variant hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-on-primary transition-all ${
                            isSelected ? "bg-primary opacity-100" : "opacity-0"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            check
                          </span>
                        </span>
                        <div>
                          <h3 className="text-[17px] font-extrabold text-on-surface">
                            {cat}
                          </h3>
                          <p className="text-xs font-semibold text-primary">
                            {divisionSkillLabel(cat)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* STEP 1: PEMAIN 1 */}
        {step === 1 && (
          <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                <span className="material-symbols-outlined text-[22px]">
                  person
                </span>
              </div>
              <div>
                <h2 className="text-[24px] font-bold leading-[1.3] text-on-surface">
                  Data Pemain 1 (Player 1)
                </h2>
                <p className="mt-1 text-[14px] leading-[1.5] text-on-surface-variant">
                  Informasi lengkap pemain utama sesuai identitas KTP.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <FieldLabel htmlFor="p1-name" required>
                  Nama Pemain 1 (Sesuai KTP)
                </FieldLabel>
                <input
                  id="p1-name"
                  type="text"
                  required
                  value={player1.fullName}
                  onChange={(e) =>
                    setPlayer1((p) => ({ ...p, fullName: e.target.value }))
                  }
                  placeholder="Contoh: Rudy Hartono"
                  className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <FileUploadBox
                label="Foto Pemain 1 (Selfie terbaru)"
                description="Format JPG, PNG atau WebP (Maks. 5MB)"
                url={player1.photoUrl}
                loading={!!uploadingState["p1-photo"]}
                onUpload={(file) =>
                  handleUploadKey("p1-photo", file, (url) =>
                    setPlayer1((p) => ({ ...p, photoUrl: url })),
                  )
                }
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="p1-phone" required>
                    Nomor WhatsApp
                  </FieldLabel>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-on-surface-variant">
                      +62
                    </span>
                    <input
                      id="p1-phone"
                      type="tel"
                      required
                      value={player1.phone}
                      onChange={(e) =>
                        setPlayer1((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="812 3456 7890"
                      className="w-full rounded-lg border border-outline-variant bg-white py-3 pl-14 pr-4 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="p1-ig" required>
                    Instagram
                  </FieldLabel>
                  <input
                    id="p1-ig"
                    type="text"
                    required
                    value={player1.instagram}
                    onChange={(e) =>
                      setPlayer1((p) => ({ ...p, instagram: e.target.value }))
                    }
                    placeholder="@rudyhartono"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="p1-reclub">Reclub (Opsional)</FieldLabel>
                  <input
                    id="p1-reclub"
                    type="text"
                    value={player1.reclub}
                    onChange={(e) =>
                      setPlayer1((p) => ({ ...p, reclub: e.target.value }))
                    }
                    placeholder="Link profil Reclub"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="p1-community">
                    Nama Komunitas / Klub (Opsional)
                  </FieldLabel>
                  <input
                    id="p1-community"
                    type="text"
                    value={player1.community}
                    onChange={(e) =>
                      setPlayer1((p) => ({ ...p, community: e.target.value }))
                    }
                    placeholder="Contoh: Padel Cah Semarang"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="p1-city" required>
                    Asal Kota Pemain 1
                  </FieldLabel>
                  <input
                    id="p1-city"
                    type="text"
                    required
                    value={player1.city}
                    onChange={(e) =>
                      setPlayer1((p) => ({ ...p, city: e.target.value }))
                    }
                    placeholder="Contoh: Semarang"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="p1-jersey" required>
                    Ukuran Jersey Pemain 1
                  </FieldLabel>
                  <select
                    id="p1-jersey"
                    value={player1.jerseySize}
                    onChange={(e) =>
                      setPlayer1((p) => ({ ...p, jerseySize: e.target.value }))
                    }
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {jerseyOptions.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <FileUploadBox
                label="KTP Pemain 1"
                description="Upload foto KTP untuk verifikasi identitas (Maks. 5MB)"
                url={player1.idCardUrl}
                loading={!!uploadingState["p1-ktp"]}
                onUpload={(file) =>
                  handleUploadKey("p1-ktp", file, (url) =>
                    setPlayer1((p) => ({ ...p, idCardUrl: url })),
                  )
                }
              />
            </div>
          </section>
        )}

        {/* STEP 2: PEMAIN 2 / PASANGAN */}
        {step === 2 && (
          <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                <span className="material-symbols-outlined text-[22px]">
                  group_add
                </span>
              </div>
              <div>
                <h2 className="text-[24px] font-bold leading-[1.3] text-on-surface">
                  Data Pemain 2 (Player 2 / Pasangan)
                </h2>
                <p className="mt-1 text-[14px] leading-[1.5] text-on-surface-variant">
                  Informasi pasangan main sesuai identitas KTP.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <FieldLabel htmlFor="p2-name" required>
                  Nama Pemain 2 (Sesuai KTP)
                </FieldLabel>
                <input
                  id="p2-name"
                  type="text"
                  required
                  value={player2.fullName}
                  onChange={(e) =>
                    setPlayer2((p) => ({ ...p, fullName: e.target.value }))
                  }
                  placeholder="Contoh: Kevin Sanjaya"
                  className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <FileUploadBox
                label="Foto Pemain 2 (Selfie terbaru)"
                description="Format JPG, PNG atau WebP (Maks. 5MB)"
                url={player2.photoUrl}
                loading={!!uploadingState["p2-photo"]}
                onUpload={(file) =>
                  handleUploadKey("p2-photo", file, (url) =>
                    setPlayer2((p) => ({ ...p, photoUrl: url })),
                  )
                }
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="p2-phone" required>
                    Nomor WhatsApp
                  </FieldLabel>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-on-surface-variant">
                      +62
                    </span>
                    <input
                      id="p2-phone"
                      type="tel"
                      required
                      value={player2.phone}
                      onChange={(e) =>
                        setPlayer2((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="813 9876 5432"
                      className="w-full rounded-lg border border-outline-variant bg-white py-3 pl-14 pr-4 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="p2-ig" required>
                    Instagram
                  </FieldLabel>
                  <input
                    id="p2-ig"
                    type="text"
                    required
                    value={player2.instagram}
                    onChange={(e) =>
                      setPlayer2((p) => ({ ...p, instagram: e.target.value }))
                    }
                    placeholder="@kevinsanjaya"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="p2-reclub">Reclub (Opsional)</FieldLabel>
                  <input
                    id="p2-reclub"
                    type="text"
                    value={player2.reclub}
                    onChange={(e) =>
                      setPlayer2((p) => ({ ...p, reclub: e.target.value }))
                    }
                    placeholder="Link profil Reclub"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="p2-community">
                    Nama Komunitas / Klub (Opsional)
                  </FieldLabel>
                  <input
                    id="p2-community"
                    type="text"
                    value={player2.community}
                    onChange={(e) =>
                      setPlayer2((p) => ({ ...p, community: e.target.value }))
                    }
                    placeholder="Contoh: Padel Cah Semarang"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="p2-city" required>
                    Asal Kota Pemain 2
                  </FieldLabel>
                  <input
                    id="p2-city"
                    type="text"
                    required
                    value={player2.city}
                    onChange={(e) =>
                      setPlayer2((p) => ({ ...p, city: e.target.value }))
                    }
                    placeholder="Contoh: Semarang"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="p2-jersey" required>
                    Ukuran Jersey Pemain 2
                  </FieldLabel>
                  <select
                    id="p2-jersey"
                    value={player2.jerseySize}
                    onChange={(e) =>
                      setPlayer2((p) => ({ ...p, jerseySize: e.target.value }))
                    }
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {jerseyOptions.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <FileUploadBox
                label="KTP Pemain 2"
                description="Upload foto KTP untuk verifikasi identitas (Maks. 5MB)"
                url={player2.idCardUrl}
                loading={!!uploadingState["p2-ktp"]}
                onUpload={(file) =>
                  handleUploadKey("p2-ktp", file, (url) =>
                    setPlayer2((p) => ({ ...p, idCardUrl: url })),
                  )
                }
              />
            </div>
          </section>
        )}

        {/* STEP 3: REVIEW DATA PENDAFTARAN */}
        {step === 3 && (
          <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                <span className="material-symbols-outlined text-[22px]">
                  fact_check
                </span>
              </div>
              <div>
                <h2 className="text-[24px] font-bold leading-[1.3] text-on-surface">
                  Review & Konfirmasi
                </h2>
                <p className="mt-1 text-[14px] leading-[1.5] text-on-surface-variant">
                  Periksa kembali seluruh informasi tim sebelum mengirimkan
                  pendaftaran.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Category card */}
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Kategori Pilihan
                </span>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-lg font-black text-on-surface">
                    {selectedCategory}
                  </span>
                  <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {divisionSkillLabel(selectedCategory)}
                  </span>
                </div>
              </div>

              {/* Player 1 Card */}
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Pemain 1 (Utama)
                  </span>
                  <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    Jersey: {player1.jerseySize}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {player1.photoUrl ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-outline-variant">
                      <Image
                        src={player1.photoUrl}
                        alt={player1.fullName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-black">
                      {player1.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-extrabold text-on-surface">
                      {player1.fullName}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      WA: +62{player1.phone} · IG: {player1.instagram} · Asal:{" "}
                      {player1.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Player 2 Card */}
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Pemain 2 (Pasangan)
                  </span>
                  <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    Jersey: {player2.jerseySize}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {player2.photoUrl ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-outline-variant">
                      <Image
                        src={player2.photoUrl}
                        alt={player2.fullName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-black">
                      {player2.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-extrabold text-on-surface">
                      {player2.fullName}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      WA: +62{player2.phone} · IG: {player2.instagram} · Asal:{" "}
                      {player2.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Pendaftaran & Tahap Kurasi Info */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-xl">
                    verified_user
                  </span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Tahap Kurasi & Verifikasi Kategori
                    </h4>
                    <p className="text-xs leading-relaxed text-on-surface-variant">
                      Pendaftaran tim Anda akan diverifikasi oleh panitia untuk
                      memastikan kesesuaian kategori skill level.
                    </p>
                    <p className="pt-1 text-xs font-medium text-amber-900 dark:text-amber-200">
                      Nominal pembayaran dan rekening transfer resmi panitia
                      akan diberikan di portal <strong>Pendaftaran Saya</strong>{" "}
                      setelah tim disetujui (Approved).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-xl">
                  verified
                </span>
                <p className="text-xs font-medium leading-relaxed text-on-surface">
                  Klik tombol di bawah untuk meninjau pernyataan persetujuan dan
                  mengirimkan pendaftaran ke panitia.
                </p>
              </div>
            </div>
          </section>
        )}

        <StepActions
          step={step}
          totalSteps={WIZARD_STEPS.length}
          onBack={goBack}
          onNext={goNext}
          canNext={canAdvance}
          submitting={submitting}
        />
      </div>

      {/* CONFIRMATION & DISCLAIMER MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <span className="material-symbols-outlined text-2xl">
                  assignment_turned_in
                </span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Pernyataan & Syarat Pendaftaran
                </h3>
                <p className="text-xs text-slate-500">
                  Harap baca dan setujui ketentuan di bawah ini.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-xs leading-relaxed text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-[11px] leading-normal text-slate-700 max-h-48 overflow-y-auto">
                <p className="font-bold text-slate-900 mb-2">
                  Ketentuan Turnamen & Self-Assessment:
                </p>
                <p className="whitespace-pre-line">
                  {tournament.settings.disclaimerText ||
                    `1. Dengan ini saya menyatakan bahwa informasi yang saya dan pasangan saya berikan adalah benar dan sesuai dengan kondisi sebenarnya.
2. Kami bersedia mengikuti proses screening kemampuan/level oleh panitia turnamen.
3. Keputusan panitia terkait verifikasi level dan eligibilitas bersifat mutlak dan tidak dapat diganggu gugat.
4. Pembayaran biaya pendaftaran dilakukan setelah tim dinyatakan lolos verifikasi/screening oleh panitia turnamen.
5. Kami bersedia mematuhi seluruh peraturan pertandingan dan tata tertib turnamen.`}
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 transition hover:bg-blue-50">
                <input
                  type="checkbox"
                  checked={confirmedDisclaimer}
                  onChange={(e) => setConfirmedDisclaimer(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-primary"
                />
                <span className="text-xs font-bold leading-normal text-slate-900">
                  KLIK UNTUK MENYETUJUI: Saya menyatakan data tim sudah benar
                  dan menyetujui seluruh ketentuan & disclaimer di atas.
                </span>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                disabled={!confirmedDisclaimer || submitting}
                onClick={handleSubmit}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-extrabold text-white shadow-md transition ${
                  confirmedDisclaimer && !submitting
                    ? "bg-primary hover:bg-primary/90 shadow-primary/20"
                    : "cursor-not-allowed bg-slate-300 text-slate-500"
                }`}
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Mengirim Pendaftaran...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">
                      check_circle
                    </span>
                    Setuju & Kirim Pendaftaran
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </RegistrationShell>
  );
}
