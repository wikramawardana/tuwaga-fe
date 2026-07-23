"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import RegistrationProgress from "@/components/RegistrationProgress";
import RegistrationShell from "@/components/RegistrationShell";
import {
  createRegistration,
  getRegistrationSummary,
  getTournamentBySlug,
  type Tournament,
  uploadQualification,
} from "@/lib/tuwagaApi";

const WIZARD_STEPS = [
  "Category",
  "Player",
  "Partner",
  "Qualification",
  "Review",
];

const SKILL_LEVELS = [
  {
    value: "beginner",
    icon: "school",
    title: "Beginner",
    description:
      "New tournament participant with basic scoring and match-flow awareness.",
    label: "Level 1-2",
  },
  {
    value: "intermediate",
    icon: "sports_tennis",
    title: "Intermediate",
    description:
      "Consistent rhythm, reliable scoring, and ready for local Indonesian events.",
    label: "Level 3-4",
  },
  {
    value: "advanced",
    icon: "bolt",
    title: "Advanced",
    description:
      "Strong tactical execution, reliable court awareness, and match control.",
    label: "Level 5-6",
  },
  {
    value: "professional",
    icon: "military_tech",
    title: "Professional",
    description:
      "National-level competitor with technical and psychological discipline.",
    label: "Level 7+",
  },
] as const;

type SkillValue = (typeof SKILL_LEVELS)[number]["value"];

function FieldLabel({
  children,
  htmlFor,
}: {
  children: string;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[14px] font-medium tracking-[0.01em] text-on-surface"
    >
      {children}
    </label>
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
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
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
          <span className="material-symbols-outlined text-[20px]">lock</span>
          {submitting ? "Submitting..." : "Submit Registration"}
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
          Next
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

  // Form state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSkill, setSelectedSkill] =
    useState<SkillValue>("intermediate");
  const [player, setPlayer] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "ID",
  });
  const [partner, setPartner] = useState({
    fullName: "",
    email: "",
    skillLevel: "intermediate" as string,
  });
  const [qualificationFile, setQualificationFile] = useState<File | null>(null);
  const [qualificationUrl, setQualificationUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    async function loadTournament() {
      setLoading(true);
      try {
        const current = await getTournamentBySlug(slug);
        if (!active) return;
        setTournament(current);
        if ((current.settings.categories ?? []).length > 0) {
          setSelectedCategory((current.settings.categories ?? [])[0]);
        }
        const nextSummary = await getRegistrationSummary(current.id);
        if (!active) return;
      } catch (err) {
        if (!active) return;
        setMessage(
          err instanceof Error ? err.message : "Failed to load tournament.",
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

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0:
        return !!selectedCategory;
      case 1:
        return (
          !!player.fullName.trim() &&
          !!player.email.trim() &&
          !!player.phone.trim()
        );
      case 2:
        return !!partner.fullName.trim() && !!partner.email.trim();
      case 3:
        return true; // qualification is optional
      case 4:
        return agreed;
      default:
        return false;
    }
  }, [step, selectedCategory, player, partner, agreed]);

  const handleUpload = async (file: File) => {
    setQualificationFile(file);
    setUploading(true);
    try {
      const result = await uploadQualification(file);
      setQualificationUrl(result.url);
    } catch {
      setMessage(
        "Failed to upload qualification image. You can still continue.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!tournament) return;
    setSubmitting(true);
    try {
      const response = await createRegistration(tournament.id, {
        acceptedTerms: agreed,
        category: selectedCategory,
        qualificationUrl: qualificationUrl || undefined,
        player: {
          fullName: player.fullName.trim(),
          email: player.email.trim(),
          phone: player.phone.trim(),
          nationality: player.nationality,
          skillLevel: selectedSkill,
        },
        partner: {
          fullName: partner.fullName.trim(),
          email: partner.email.trim(),
          skillLevel: partner.skillLevel,
        },
      });
      setMessage(`Registration saved: ${response.registration.id}`);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to submit registration.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (step === WIZARD_STEPS.length - 1) {
      handleSubmit();
    } else {
      setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
    }
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  if (loading && !tournament) {
    return (
      <RegistrationShell title="Loading..." showProgress={false}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </RegistrationShell>
    );
  }

  if (!tournament) {
    return (
      <RegistrationShell title="Tournament Not Found" showProgress={false}>
        <div className="rounded-lg border border-error/20 bg-error-container p-6 text-sm font-semibold text-on-error-container">
          {message || "This tournament could not be found."}
        </div>
      </RegistrationShell>
    );
  }

  return (
    <RegistrationShell
      current={step}
      title={`Register for ${tournament.name}`}
      description={`${tournament.venue} — ${tournament.dateLabel}`}
      showProgress
    >
      <RegistrationProgress steps={WIZARD_STEPS} current={step} />

      <div className="mx-auto max-w-2xl">
        {message && (
          <div className="mb-6 rounded-lg border border-primary/15 bg-primary/5 p-4 text-sm font-semibold text-primary">
            {message}
          </div>
        )}

        {/* Step 0: Category */}
        {step === 0 && (
          <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                <span className="material-symbols-outlined text-[22px]">
                  category
                </span>
              </div>
              <div>
                <h2 className="text-[24px] font-semibold leading-[1.3] text-on-surface">
                  Event Category
                </h2>
                <p className="mt-1 text-[15px] leading-[1.5] text-on-surface-variant">
                  Select the category you want to compete in.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      className={`rounded-xl border bg-white p-5 transition-all ${isSelected ? "border-primary ring-2 ring-primary/10" : "border-outline-variant hover:border-primary/40"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-on-primary transition-all ${isSelected ? "bg-primary opacity-100" : "opacity-0"}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            check
                          </span>
                        </span>
                        <h3 className="text-[18px] font-semibold text-on-surface">
                          {cat}
                        </h3>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-8">
              <h3 className="mb-4 text-[18px] font-semibold text-on-surface">
                Skill Level
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {SKILL_LEVELS.map((skill) => {
                  const isSelected = selectedSkill === skill.value;
                  return (
                    <label key={skill.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="skill-level"
                        value={skill.value}
                        checked={isSelected}
                        onChange={() => setSelectedSkill(skill.value)}
                        className="sr-only"
                      />
                      <div
                        className={`rounded-xl border bg-white p-4 text-center transition-all ${isSelected ? "border-primary ring-2 ring-primary/10" : "border-outline-variant hover:border-primary/40"}`}
                      >
                        <span className="material-symbols-outlined text-[28px] text-primary">
                          {skill.icon}
                        </span>
                        <p className="mt-2 text-sm font-bold text-on-surface">
                          {skill.title}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {skill.label}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Step 1: Player */}
        {step === 1 && (
          <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                <span className="material-symbols-outlined text-[22px]">
                  person
                </span>
              </div>
              <div>
                <h2 className="text-[24px] font-semibold leading-[1.3] text-on-surface">
                  Player Information
                </h2>
                <p className="mt-1 text-[15px] leading-[1.5] text-on-surface-variant">
                  Your details for tournament verification.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="full-name">Full Name *</FieldLabel>
                <input
                  id="full-name"
                  type="text"
                  required
                  value={player.fullName}
                  onChange={(e) =>
                    setPlayer((p) => ({ ...p, fullName: e.target.value }))
                  }
                  placeholder="Bima Pratama"
                  className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="email">Email *</FieldLabel>
                <input
                  id="email"
                  type="email"
                  required
                  value={player.email}
                  onChange={(e) =>
                    setPlayer((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="bima@tuwaga.id"
                  className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="phone">Phone *</FieldLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
                    +62
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={player.phone}
                    onChange={(e) =>
                      setPlayer((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="812 3456 7890"
                    className="w-full rounded-lg border border-outline-variant bg-white py-3 pl-14 pr-4 text-[16px] outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="nationality">Nationality</FieldLabel>
                <select
                  id="nationality"
                  value={player.nationality}
                  onChange={(e) =>
                    setPlayer((p) => ({ ...p, nationality: e.target.value }))
                  }
                  className="w-full appearance-none rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                >
                  <option value="ID">Indonesia</option>
                  <option value="MY">Malaysia</option>
                  <option value="SG">Singapore</option>
                  <option value="TH">Thailand</option>
                  <option value="PH">Philippines</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Step 2: Partner */}
        {step === 2 && (
          <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                <span className="material-symbols-outlined text-[22px]">
                  group_add
                </span>
              </div>
              <div>
                <h2 className="text-[24px] font-semibold leading-[1.3] text-on-surface">
                  Partner Details
                </h2>
                <p className="mt-1 text-[15px] leading-[1.5] text-on-surface-variant">
                  Your doubles partner for this tournament.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="partner-name">
                  Partner Full Name *
                </FieldLabel>
                <input
                  id="partner-name"
                  type="text"
                  required
                  value={partner.fullName}
                  onChange={(e) =>
                    setPartner((p) => ({ ...p, fullName: e.target.value }))
                  }
                  placeholder="Raka Wijaya"
                  className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="partner-email">Partner Email *</FieldLabel>
                <input
                  id="partner-email"
                  type="email"
                  required
                  value={partner.email}
                  onChange={(e) =>
                    setPartner((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="raka@tuwaga.id"
                  className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="partner-level">
                  Partner Skill Level
                </FieldLabel>
                <select
                  id="partner-level"
                  value={partner.skillLevel}
                  onChange={(e) =>
                    setPartner((p) => ({ ...p, skillLevel: e.target.value }))
                  }
                  className="w-full appearance-none rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Qualification */}
        {step === 3 && (
          <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                <span className="material-symbols-outlined text-[22px]">
                  upload_file
                </span>
              </div>
              <div>
                <h2 className="text-[24px] font-semibold leading-[1.3] text-on-surface">
                  Qualification
                </h2>
                <p className="mt-1 text-[15px] leading-[1.5] text-on-surface-variant">
                  Upload a qualification image (optional). Max 5MB.
                </p>
              </div>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/50 bg-white p-10 transition-colors hover:border-primary/40 hover:bg-surface-container-low">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
              {qualificationFile ? (
                <>
                  <span className="material-symbols-outlined text-[40px] text-secondary">
                    check_circle
                  </span>
                  <p className="mt-3 text-sm font-bold text-on-surface">
                    {qualificationFile.name}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {(qualificationFile.size / 1024).toFixed(0)} KB
                  </p>
                  {uploading && (
                    <p className="mt-2 text-xs font-bold text-primary">
                      Uploading...
                    </p>
                  )}
                  {qualificationUrl && (
                    <p className="mt-1 text-xs font-bold text-secondary">
                      Uploaded ✓
                    </p>
                  )}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[40px] text-on-surface-variant">
                    cloud_upload
                  </span>
                  <p className="mt-3 text-sm font-bold text-on-surface">
                    Click to upload qualification image
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    JPG, PNG, or WebP — Max 5MB
                  </p>
                </>
              )}
            </label>

            {qualificationUrl && (
              <div className="relative mt-4 h-48 overflow-hidden rounded-lg border border-outline-variant/30">
                <Image
                  src={qualificationUrl}
                  alt="Qualification"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </section>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                <span className="material-symbols-outlined text-[22px]">
                  fact_check
                </span>
              </div>
              <div>
                <h2 className="text-[24px] font-semibold leading-[1.3] text-on-surface">
                  Review & Submit
                </h2>
                <p className="mt-1 text-[15px] leading-[1.5] text-on-surface-variant">
                  Confirm your details before submitting.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Category
                </p>
                <p className="mt-1 text-sm font-bold text-on-surface">
                  {selectedCategory} —{" "}
                  {SKILL_LEVELS.find((s) => s.value === selectedSkill)?.title}
                </p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Player
                </p>
                <p className="mt-1 text-sm font-bold text-on-surface">
                  {player.fullName}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {player.email} · +62{player.phone}
                </p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Partner
                </p>
                <p className="mt-1 text-sm font-bold text-on-surface">
                  {partner.fullName}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {partner.email} · {partner.skillLevel}
                </p>
              </div>
              {qualificationUrl && (
                <div className="rounded-lg bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Qualification
                  </p>
                  <p className="mt-1 text-sm font-bold text-secondary">
                    Image uploaded ✓
                  </p>
                </div>
              )}
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg bg-surface-container-low p-4">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="text-[14px] font-medium leading-relaxed text-on-surface-variant">
                I confirm all registration details are accurate and agree to the
                tournament rules and registration terms.
              </span>
            </label>
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
    </RegistrationShell>
  );
}
