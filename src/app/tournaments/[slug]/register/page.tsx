"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BabyIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  ClipboardTextIcon,
  CloudArrowUpIcon,
  ListChecksIcon,
  LockIcon,
  PushPinIcon,
  SealCheckIcon,
  ShapesIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SignInIcon,
  TableIcon,
  UserCirclePlusIcon,
  UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import RegistrationProgress from "@/components/RegistrationProgress";
import RegistrationShell from "@/components/RegistrationShell";
import { CaprivalQualificationModal } from "@/components/tournaments/CaprivalQualificationModal";
import { useSession } from "@/lib/auth-client";
import {
  getCaprivalCategoryEligibility,
  isCaprivalTournament,
} from "@/lib/caprivalQualifications";
import { divisionSkillLevel } from "@/lib/matchDivisions";
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
      className="block text-[14px] font-bold tracking-[0.01em] text-ink-950"
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
      <label
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition hover:border-brand-500 hover:bg-ink-100/50 ${
          url
            ? "border-emerald-300 bg-emerald-50/20"
            : "border-ink-300/60 bg-white"
        }`}
      >
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
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-ink-300 bg-ink-100">
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
                <CheckIcon
                  className="text-sm"
                  aria-hidden="true"
                  weight="bold"
                />
                File terunggah
              </span>
              <p className="mt-1 text-xs text-ink-600 truncate">
                Klik untuk mengganti gambar
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            {loading ? (
              <CircleNotchIcon
                className="admin-spin text-3xl text-ink-600"
                weight="bold"
                aria-hidden="true"
              />
            ) : (
              <CloudArrowUpIcon
                className="text-3xl text-ink-600"
                weight="duotone"
                aria-hidden="true"
              />
            )}
            <p className="mt-2 text-xs font-bold text-ink-950">
              {loading ? "Mengunggah..." : "Pilih atau seret gambar ke sini"}
            </p>
            <p className="text-[11px] text-ink-600">{description}</p>
            {required && (
              <span className="mt-1 text-[11px] font-semibold text-rose-500">
                * Wajib dilampirkan
              </span>
            )}
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
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-ink-300/50 bg-white px-5 text-sm font-bold text-ink-950 transition hover:bg-ink-100"
        >
          <ArrowLeftIcon className="text-lg" aria-hidden="true" weight="bold" />
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
              ? "bg-brand-500 text-ink-950 shadow-ink-950/10 hover:bg-brand-400"
              : "cursor-not-allowed bg-ink-300 text-ink-600"
          }`}
        >
          <ShieldCheckIcon
            className="text-[20px]"
            aria-hidden="true"
            weight="duotone"
          />
          {submitting ? "Memproses..." : "Konfirmasi & Kirim Pendaftaran"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={`inline-flex h-11 items-center gap-2 rounded-lg px-6 text-sm font-bold transition-colors ${
            canNext
              ? "bg-brand-500 text-ink-950 hover:bg-brand-500/90"
              : "cursor-not-allowed bg-ink-300 text-ink-600"
          }`}
        >
          Lanjut
          <ArrowRightIcon
            className="text-lg"
            aria-hidden="true"
            weight="bold"
          />
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

  // Caprival qualification guide modal state
  const [showCaprivalModal, setShowCaprivalModal] = useState(false);

  // Uploading state flags
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>(
    {},
  );

  // Form states
  const [selectedCategory, setSelectedCategory] = useState("");

  const isCaprival = isCaprivalTournament(slug);
  const isYouthCategory =
    selectedCategory.toLowerCase().includes("ku-14") ||
    selectedCategory.toLowerCase().includes("u-14");

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
          !!player1.jerseySize &&
          !!player1.photoUrl &&
          !!player1.idCardUrl
        );
      case 2:
        return (
          !!player2.fullName.trim() &&
          !!player2.phone.trim() &&
          !!player2.instagram.trim() &&
          !!player2.city.trim() &&
          !!player2.jerseySize &&
          !!player2.photoUrl &&
          !!player2.idCardUrl
        );
      case 3:
        return (
          !!player1.fullName.trim() &&
          !!player1.phone.trim() &&
          !!player1.instagram.trim() &&
          !!player1.city.trim() &&
          !!player1.jerseySize &&
          !!player1.photoUrl &&
          !!player1.idCardUrl &&
          !!player2.fullName.trim() &&
          !!player2.phone.trim() &&
          !!player2.instagram.trim() &&
          !!player2.city.trim() &&
          !!player2.jerseySize &&
          !!player2.photoUrl &&
          !!player2.idCardUrl
        );
      default:
        return false;
    }
  }, [step, selectedCategory, player1, player2]);

  const handleSubmit = async () => {
    if (!tournament) return;
    if (!canAdvance) {
      setMessage(
        "Mohon lengkapi seluruh data dan lampiran file yang diwajibkan.",
      );
      return;
    }
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
    if (!canAdvance) return;
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
      <RegistrationShell
        title="Memuat Turnamen..."
        showProgress={false}
        hideFooter={true}
      >
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      </RegistrationShell>
    );
  }

  if (!tournament) {
    return (
      <RegistrationShell
        title="Turnamen Tidak Ditemukan"
        showProgress={false}
        hideFooter={true}
      >
        <div className="rounded-lg border border-rose-600/20 bg-rose-100 p-6 text-sm font-semibold text-rose-900">
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
        parentLabel={tournament.name}
        parentHref={`/tournaments/${slug}`}
        currentLabel="Daftar"
        hideFooter={true}
      >
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-ink-200/80 bg-white p-6 shadow-sm sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <LockIcon
                className="text-3xl"
                aria-hidden="true"
                weight="duotone"
              />
            </div>

            <div className="mt-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                <ShieldIcon
                  className="text-sm"
                  aria-hidden="true"
                  weight="bold"
                />
                Pendaftaran Terverifikasi & Aman
              </span>
              <h2 className="mt-3 text-2xl font-black text-ink-900 sm:text-3xl">
                Masuk untuk Mendaftar Turnamen
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Untuk menjaga keamanan data pribadi dan verifikasi tiket resmi
                turnamen, seluruh calon peserta wajib masuk menggunakan akun
                Tuwaga.
              </p>
            </div>

            <div className="mt-6 space-y-2.5 rounded-2xl border border-ink-100 bg-ink-50/70 p-4 text-xs font-medium text-ink-700">
              <div className="flex items-center gap-2">
                <CheckCircleIcon
                  className="text-base text-emerald-600"
                  aria-hidden="true"
                  weight="bold"
                />
                <span>Data pendaftaran langsung terhubung ke akun Anda</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon
                  className="text-base text-emerald-600"
                  aria-hidden="true"
                  weight="bold"
                />
                <span>
                  Privasi terjamin: nama dan detail tim Anda aman dari pihak
                  luar
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon
                  className="text-base text-emerald-600"
                  aria-hidden="true"
                  weight="bold"
                />
                <span>
                  Pantau verifikasi pembayaran & jadwal tanding langsung di
                  dashboard pribadi
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href={`/login?callbackUrl=${callbackUrl}`}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-bold text-ink-950 shadow-md shadow-ink-950/10 transition hover:bg-brand-400 active:scale-95"
              >
                <SignInIcon
                  className="text-lg"
                  aria-hidden="true"
                  weight="bold"
                />
                Masuk dengan Akun Anda
              </Link>
              <Link
                href={`/tournaments/${slug}`}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-ink-200 bg-white px-4 text-xs font-bold text-ink-700 transition hover:bg-ink-50"
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
      title={tournament.name}
      description={`${tournament.venue} — ${tournament.dateLabel}`}
      showProgress={false}
      parentLabel={tournament.name}
      parentHref={`/tournaments/${slug}`}
      currentLabel="Daftar"
      hideFooter={true}
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
          <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-ink-950">
                <ShapesIcon
                  className="text-[22px]"
                  aria-hidden="true"
                  weight="duotone"
                />
              </div>
              <div>
                <h2 className="text-[24px] font-bold leading-[1.3] text-ink-950">
                  Pilihan Kategori
                </h2>
                <p className="mt-1 text-[14px] leading-[1.5] text-ink-600">
                  Pilih salah satu kategori turnamen untuk pasangan Anda.
                </p>
              </div>
            </div>

            {/* Caprival Qualification Guide Banner */}
            {isCaprival && (
              <div className="mb-6 rounded-2xl border border-ink-900/30 bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 p-5 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/30">
                        <SealCheckIcon
                          className="text-[13px]"
                          aria-hidden="true"
                          weight="bold"
                        />
                        The Grand Caprival
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">
                      Panduan & Syarat Kualifikasi Kategori
                    </h3>
                    <p className="text-xs text-ink-300 max-w-xl leading-relaxed">
                      Turnamen menerapkan kurasi ketat level pemain (Tenis &
                      Padel). Pastikan pasangan Anda memenuhi kriteria sebelum
                      memilih kategori.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCaprivalModal(true)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-ink-950 shadow-md transition hover:bg-amber-300"
                  >
                    <TableIcon
                      className="text-base"
                      aria-hidden="true"
                      weight="bold"
                    />
                    Lihat Matriks Kualifikasi
                  </button>
                </div>
              </div>
            )}

            {/* Tournament brief banner info */}
            <div className="mb-6 rounded-xl border border-ink-300/30 bg-ink-100/60 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-300/20 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                  Tahap Turnamen
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Kurasi & Verifikasi Kategori
                </span>
              </div>
              {tournament.settings.registrationClosedAt && (
                <div className="flex items-center justify-between text-xs text-ink-600">
                  <span>Batas Akhir Pendaftaran:</span>
                  <span className="font-bold text-rose-600">
                    {tournament.settings.registrationClosedAt}
                  </span>
                </div>
              )}
              {tournament.settings.contactPerson && (
                <div className="flex items-center justify-between text-xs text-ink-600">
                  <span>Kontak Panitia (CP):</span>
                  <span className="font-bold text-ink-950">
                    {tournament.settings.contactPerson}
                  </span>
                </div>
              )}
              {tournament.settings.registrationNotes && (
                <p className="flex gap-2 border-t border-ink-300/20 pt-2 text-xs leading-relaxed text-ink-600">
                  <PushPinIcon
                    className="mt-0.5 shrink-0 text-sm text-brand-500"
                    weight="fill"
                    aria-hidden="true"
                  />
                  <span>{tournament.settings.registrationNotes}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(tournament.settings.categories ?? []).map((cat) => {
                const displayCat =
                  isCaprival &&
                  (cat.toLowerCase().includes("silver") ||
                    cat.toLowerCase().includes("open"))
                    ? "Mens Open"
                    : cat;
                const isSelected =
                  selectedCategory === displayCat || selectedCategory === cat;
                const caprivalInfo = isCaprival
                  ? getCaprivalCategoryEligibility(cat)
                  : null;

                return (
                  <label key={cat} className="cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={displayCat}
                      checked={isSelected}
                      onChange={() => setSelectedCategory(displayCat)}
                      className="sr-only"
                    />
                    <div
                      className={`rounded-xl border bg-white p-5 transition-all ${
                        isSelected
                          ? "border-brand-500 ring-2 ring-brand-500/10 shadow-sm"
                          : "border-ink-300 hover:border-brand-500/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-950 transition-all ${
                            isSelected
                              ? "bg-brand-500 opacity-100"
                              : "opacity-0"
                          }`}
                        >
                          <CheckIcon
                            className="text-[16px]"
                            aria-hidden="true"
                            weight="bold"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[17px] font-extrabold text-ink-950">
                            {displayCat}
                          </h3>
                          {caprivalInfo && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                                {caprivalInfo.badgeText}
                              </span>
                            </div>
                          )}
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
          <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-ink-950">
                <UserIcon
                  className="text-[22px]"
                  aria-hidden="true"
                  weight="duotone"
                />
              </div>
              <div>
                <h2 className="text-[24px] font-bold leading-[1.3] text-ink-950">
                  Data Pemain 1 (Player 1)
                </h2>
                <p className="mt-1 text-[14px] leading-[1.5] text-ink-600">
                  Informasi lengkap pemain utama sesuai kartu identitas resmi
                  (KTP, SIM, Kartu Pelajar, dll).
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <FieldLabel htmlFor="p1-name" required>
                  Nama Pemain 1 (Sesuai Kartu Identitas)
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
                  className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <FileUploadBox
                label="Foto Pemain 1 (Selfie terbaru)"
                description="Format JPG, PNG atau WebP (Maks. 5MB)"
                url={player1.photoUrl}
                required
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-ink-600">
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
                      className="w-full rounded-lg border border-ink-300 bg-white py-3 pl-14 pr-4 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    {jerseyOptions.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isCaprival && isYouthCategory && (
                <div className="rounded-xl border border-cream-200 bg-cream-50/80 p-3.5 text-xs text-cream-900 font-medium flex items-start gap-2.5">
                  <BabyIcon
                    className="text-cream-600 text-lg shrink-0 mt-0.5"
                    aria-hidden="true"
                    weight="bold"
                  />
                  <div>
                    <strong className="text-cream-950 font-bold block mb-0.5">
                      Verifikasi Usia KU-14 (Kelahiran 2012 atau Setelahnya):
                    </strong>
                    Pemain kategori KU-14 wajib melampirkan foto kartu identitas
                    (KIA / Akta Kelahiran / Kartu Pelajar) yang memperlihatkan
                    tanggal/tahun kelahiran untuk proses screening panitia.
                  </div>
                </div>
              )}

              <FileUploadBox
                label="Kartu Identitas Pemain 1"
                description="Upload foto kartu identitas (KTP, SIM, Kartu Pelajar, atau KIA) untuk verifikasi identitas (Maks. 5MB)"
                url={player1.idCardUrl}
                required
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
          <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-ink-950">
                <UserCirclePlusIcon
                  className="text-[22px]"
                  aria-hidden="true"
                  weight="duotone"
                />
              </div>
              <div>
                <h2 className="text-[24px] font-bold leading-[1.3] text-ink-950">
                  Data Pemain 2 (Player 2 / Pasangan)
                </h2>
                <p className="mt-1 text-[14px] leading-[1.5] text-ink-600">
                  Informasi pasangan main sesuai kartu identitas resmi (KTP,
                  SIM, Kartu Pelajar, dll).
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <FieldLabel htmlFor="p2-name" required>
                  Nama Pemain 2 (Sesuai Kartu Identitas)
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
                  className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <FileUploadBox
                label="Foto Pemain 2 (Selfie terbaru)"
                description="Format JPG, PNG atau WebP (Maks. 5MB)"
                url={player2.photoUrl}
                required
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-ink-600">
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
                      className="w-full rounded-lg border border-ink-300 bg-white py-3 pl-14 pr-4 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    {jerseyOptions.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isCaprival && isYouthCategory && (
                <div className="rounded-xl border border-cream-200 bg-cream-50/80 p-3.5 text-xs text-cream-900 font-medium flex items-start gap-2.5">
                  <BabyIcon
                    className="text-cream-600 text-lg shrink-0 mt-0.5"
                    aria-hidden="true"
                    weight="bold"
                  />
                  <div>
                    <strong className="text-cream-950 font-bold block mb-0.5">
                      Verifikasi Usia KU-14 (Kelahiran 2012 atau Setelahnya):
                    </strong>
                    Pemain pasangan kategori KU-14 wajib melampirkan foto kartu
                    identitas (KIA / Akta Kelahiran / Kartu Pelajar) yang
                    memperlihatkan tanggal/tahun kelahiran untuk proses
                    screening panitia.
                  </div>
                </div>
              )}

              <FileUploadBox
                label="Kartu Identitas Pemain 2"
                description="Upload foto kartu identitas (KTP, SIM, Kartu Pelajar, atau KIA) untuk verifikasi identitas (Maks. 5MB)"
                url={player2.idCardUrl}
                required
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
          <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-ink-950">
                <ListChecksIcon
                  className="text-[22px]"
                  aria-hidden="true"
                  weight="duotone"
                />
              </div>
              <div>
                <h2 className="text-[24px] font-bold leading-[1.3] text-ink-950">
                  Review & Konfirmasi
                </h2>
                <p className="mt-1 text-[14px] leading-[1.5] text-ink-600">
                  Periksa kembali seluruh informasi tim sebelum mengirimkan
                  pendaftaran.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Category card */}
              <div className="rounded-xl border border-ink-300/30 bg-ink-100/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    Kategori Pilihan
                  </span>
                  {isCaprival && (
                    <button
                      type="button"
                      onClick={() => setShowCaprivalModal(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline"
                    >
                      <TableIcon
                        className="text-[14px]"
                        aria-hidden="true"
                        weight="bold"
                      />
                      Cek Matriks Kualifikasi
                    </button>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-lg font-black text-ink-950">
                    {selectedCategory}
                  </span>
                </div>
                {isCaprival && (
                  <p className="mt-2 text-[11px] text-ink-500 border-t border-ink-300/20 pt-2">
                    Pendaftaran tim Anda akan diverifikasi sesuai kriteria
                    kelayakan resmi The Grand Caprival.
                  </p>
                )}
              </div>

              {/* Player 1 Card */}
              <div className="rounded-xl border border-ink-300/30 bg-ink-100/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    Pemain 1 (Utama)
                  </span>
                  <span className="rounded bg-ink-200/80 px-2 py-0.5 text-[11px] font-bold text-ink-700">
                    Jersey: {player1.jerseySize}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {player1.photoUrl ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-ink-300">
                      <Image
                        src={player1.photoUrl}
                        alt={player1.fullName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 font-black">
                      {player1.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-extrabold text-ink-950">
                      {player1.fullName}
                    </p>
                    <p className="text-xs text-ink-600">
                      WA: +62{player1.phone} · IG: {player1.instagram} · Asal:{" "}
                      {player1.city}
                    </p>
                    {player1.idCardUrl && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <span className="material-symbols-outlined text-xs">
                          badge
                        </span>
                        Kartu Identitas Terlampir
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Player 2 Card */}
              <div className="rounded-xl border border-ink-300/30 bg-ink-100/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    Pemain 2 (Pasangan)
                  </span>
                  <span className="rounded bg-ink-200/80 px-2 py-0.5 text-[11px] font-bold text-ink-700">
                    Jersey: {player2.jerseySize}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {player2.photoUrl ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-ink-300">
                      <Image
                        src={player2.photoUrl}
                        alt={player2.fullName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 font-black">
                      {player2.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-extrabold text-ink-950">
                      {player2.fullName}
                    </p>
                    <p className="text-xs text-ink-600">
                      WA: +62{player2.phone} · IG: {player2.instagram} · Asal:{" "}
                      {player2.city}
                    </p>
                    {player2.idCardUrl && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <span className="material-symbols-outlined text-xs">
                          badge
                        </span>
                        Kartu Identitas Terlampir
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Pendaftaran & Tahap Kurasi Info */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon
                    className="text-amber-600 text-xl"
                    aria-hidden="true"
                    weight="duotone"
                  />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Tahap Kurasi & Verifikasi Kategori
                    </h4>
                    <p className="text-xs leading-relaxed text-ink-600">
                      Pendaftaran tim Anda akan diverifikasi oleh panitia untuk
                      memastikan kesesuaian disetiap kategori.
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

            <div className="mt-6 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
              <div className="flex items-start gap-2.5">
                <SealCheckIcon
                  className="text-brand-600 text-xl"
                  aria-hidden="true"
                  weight="duotone"
                />
                <p className="text-xs font-medium leading-relaxed text-ink-950">
                  Klik tombol di bawah untuk meninjau pernyataan persetujuan dan
                  mengirimkan pendaftaran ke panitia.
                </p>
              </div>
            </div>
          </section>
        )}

        {!canAdvance && (step === 1 || step === 2) && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800">
            <span className="material-symbols-outlined text-rose-600 text-lg shrink-0 mt-0.5">
              error
            </span>
            <div>
              <p className="font-bold">Formulir belum lengkap:</p>
              <p className="mt-0.5 text-rose-700">
                Pastikan nama, nomor WhatsApp, Instagram, asal kota, ukuran
                jersey, serta <strong>foto selfie</strong> dan{" "}
                <strong>kartu identitas</strong> sudah diunggah.
              </p>
            </div>
          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-ink-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <ClipboardTextIcon
                  className="text-2xl"
                  aria-hidden="true"
                  weight="duotone"
                />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-ink-900">
                  Pernyataan & Syarat Pendaftaran
                </h3>
                <p className="text-xs text-ink-500">
                  Harap baca dan setujui ketentuan di bawah ini.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-xs leading-relaxed text-ink-600">
              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 font-mono text-[11px] leading-normal text-ink-700 max-h-48 overflow-y-auto">
                <p className="font-bold text-ink-900 mb-2">
                  Ketentuan Turnamen & Self-Assessment:
                </p>
                <p className="whitespace-pre-line">
                  {tournament.settings.disclaimerText ||
                    (isCaprival
                      ? `1. Dengan ini saya menyatakan bahwa informasi dan rekam jejak kemampuan level saya dan pasangan adalah benar sesuai kondisi sebenarnya.
2. Kami telah membaca dan menyatakan bahwa kami memenuhi seluruh kriteria kualifikasi kategori ${selectedCategory} sesuai Matriks Kualifikasi Resmi The Grand Caprival.
3. Kami bersedia mengikuti proses kurasi & verifikasi profil secara menyeluruh oleh panitia turnamen.
4. Keputusan panitia terkait verifikasi level dan eligibilitas bersifat mutlak. Jika ditemukan ketidaksesuaian level/data, panitia berhak memindahkan kategori atau mendiskualifikasi tanpa pengembalian biaya.
5. Pembayaran biaya pendaftaran baru dilakukan setelah tim dinyatakan lolos verifikasi kurasi panitia.
6. Kami bersedia mematuhi seluruh peraturan pertandingan dan tata tertib turnamen The Grand Caprival.`
                      : `1. Dengan ini saya menyatakan bahwa informasi yang saya dan pasangan saya berikan adalah benar dan sesuai dengan kondisi sebenarnya.
2. Kami bersedia mengikuti proses screening kemampuan/level oleh panitia turnamen.
3. Keputusan panitia terkait verifikasi level dan eligibilitas bersifat mutlak dan tidak dapat diganggu gugat.
4. Pembayaran biaya pendaftaran dilakukan setelah tim dinyatakan lolos verifikasi/screening oleh panitia turnamen.
5. Kami bersedia mematuhi seluruh peraturan pertandingan dan tata tertib turnamen.`)}
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-200 bg-brand-50/70 p-3.5 transition hover:bg-brand-50">
                <input
                  type="checkbox"
                  checked={confirmedDisclaimer}
                  onChange={(e) => setConfirmedDisclaimer(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 accent-brand-500"
                />
                <span className="text-xs font-bold leading-normal text-ink-900">
                  KLIK UNTUK MENYETUJUI: Saya menyatakan data tim sudah benar
                  dan menyetujui seluruh ketentuan & disclaimer di atas.
                </span>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
                className="h-10 rounded-xl border border-ink-200 px-4 text-xs font-extrabold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                disabled={!confirmedDisclaimer || submitting}
                onClick={handleSubmit}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-extrabold text-ink-950 shadow-md transition ${
                  confirmedDisclaimer && !submitting
                    ? "bg-brand-500 hover:bg-brand-400 shadow-ink-950/10"
                    : "cursor-not-allowed bg-ink-300 text-ink-500"
                }`}
              >
                {submitting ? (
                  <>
                    <CircleNotchIcon
                      className="text-sm animate-spin"
                      aria-hidden="true"
                      weight="bold"
                    />
                    Mengirim Pendaftaran...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon
                      className="text-sm"
                      aria-hidden="true"
                      weight="bold"
                    />
                    Setuju & Kirim Pendaftaran
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAPRIVAL QUALIFICATION MATRIX MODAL */}
      {isCaprival && (
        <CaprivalQualificationModal
          isOpen={showCaprivalModal}
          onClose={() => setShowCaprivalModal(false)}
          initialCategory={selectedCategory}
        />
      )}
    </RegistrationShell>
  );
}
