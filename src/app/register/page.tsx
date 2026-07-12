"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import RegistrationShell from "@/components/RegistrationShell";
import {
  createRegistration,
  getCurrentTournament,
  getRegistrationSummary,
  getTournament,
  type RegistrationSummary,
  type Tournament,
} from "@/lib/tuwagaApi";

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

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="registration-parallax-section rounded-xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        <div>
          <h2 className="text-[24px] font-semibold leading-[1.3] text-on-surface">
            {title}
          </h2>
          <p className="mt-1 text-[15px] leading-[1.5] text-on-surface-variant">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TournamentSummary({
  selectedSkill,
  agreed,
  summary,
  submitting,
}: {
  selectedSkill: (typeof SKILL_LEVELS)[number];
  agreed: boolean;
  summary: RegistrationSummary | null;
  submitting: boolean;
}) {
  const currency = summary?.tournament.currency ?? "IDR";
  const formatMoney = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <aside className="lg:col-span-4 lg:h-full">
      <div className="custom-scrollbar register-summary-panel overflow-hidden rounded-xl border border-surface-container bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.04)] lg:sticky lg:top-0 lg:max-h-full lg:overflow-y-auto">
        <div className="relative h-40 bg-primary-container">
          <Image
            src="/arena.png"
            alt="Jakarta arena tournament venue"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 to-transparent" />
          <div className="absolute bottom-4 left-5">
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-on-secondary">
              {summary?.tournament.badge ?? "Backend event"}
            </span>
            <h2 className="mt-2 max-w-[260px] text-[24px] font-semibold leading-[1.25] text-white">
              {summary?.tournament.name ?? "Loading tournament"}
            </h2>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-4">
            {[
              {
                icon: "calendar_today",
                label: "Date",
                value: summary?.tournament.dateLabel ?? "Loading",
              },
              {
                icon: "location_on",
                label: "Location",
                value: summary?.tournament.location ?? "Loading",
              },
              {
                icon: "payments",
                label: "Entry",
                value: summary
                  ? `${formatMoney(summary.tournament.entryFeePerPair)} / pair`
                  : "Loading",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-primary">
                  {item.icon}
                </span>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {item.label}
                  </p>
                  <p className="text-[14px] font-semibold text-on-surface">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-surface-container pt-5">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Selected Category
            </p>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-container p-3">
              <span className="text-[14px] font-semibold capitalize text-primary">
                {selectedSkill.value}
              </span>
              <span className="text-[12px] font-semibold text-on-surface-variant">
                {selectedSkill.label}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-primary/10 bg-primary/5 p-4 text-[12px] font-semibold leading-relaxed text-primary">
            WhatsApp support: {summary?.support.whatsapp ?? "Loading"}.
            Registration is saved to the backend.
          </div>

          <button
            type="submit"
            form="registration-form"
            disabled={!agreed || submitting}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg px-7 text-[14px] font-semibold tracking-[0.01em] shadow-lg transition-all active:scale-95 ${
              agreed
                ? "bg-primary text-on-primary shadow-primary/20 hover:bg-on-primary-fixed-variant"
                : "cursor-not-allowed bg-outline-variant text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">lock</span>
            {submitting ? "Submitting..." : "Submit Registration"}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const [selectedSkill, setSelectedSkill] =
    useState<SkillValue>("intermediate");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [hasPartner, setHasPartner] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [summary, setSummary] = useState<RegistrationSummary | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedSkillData = useMemo(
    () =>
      SKILL_LEVELS.find((skill) => skill.value === selectedSkill) ??
      SKILL_LEVELS[1],
    [selectedSkill],
  );

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      try {
        const tournamentSlug = searchParams.get("tournament");
        let current: Tournament | null = null;

        if (tournamentSlug) {
          current = await getTournament(tournamentSlug);
        } else {
          current = await getCurrentTournament();
        }

        if (!active) return;
        setTournament(current);
        if (!current) {
          setMessage("No tournament found in the backend.");
          return;
        }

        if (
          (current.settings.categories ?? []).length > 0 &&
          !selectedCategory
        ) {
          setSelectedCategory((current.settings.categories ?? [])[0]);
        }

        const nextSummary = await getRegistrationSummary(current.id);
        if (!active) return;
        setSummary(nextSummary);
      } catch (err) {
        if (!active) return;
        setMessage(
          err instanceof Error
            ? err.message
            : "Failed to load registration summary.",
        );
      }
    }

    loadSummary();

    return () => {
      active = false;
    };
  }, [searchParams, selectedCategory]);

  const submitRegistration = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!tournament) {
      setMessage("No tournament is available for registration.");
      return;
    }

    const form = event.currentTarget;
    const field = (id: string) =>
      (
        (form.elements.namedItem(id) as HTMLInputElement | HTMLSelectElement)
          ?.value ?? ""
      ).trim();

    setSubmitting(true);
    try {
      const partnerInput = hasPartner
        ? {
            fullName: field("partner-name"),
            email: field("partner-email"),
            skillLevel: field("partner-level") || selectedSkill,
            membershipId: field("partner-id") || undefined,
          }
        : undefined;

      const response = await createRegistration(tournament.id, {
        acceptedTerms: agreed,
        category: selectedCategory,
        player: {
          fullName: field("full-name"),
          email: field("email"),
          phone: field("phone"),
          nationality: field("nationality"),
          skillLevel: selectedSkill,
          city: null,
          membershipId: null,
        },
        partner: partnerInput,
      });
      setMessage(`Registration saved: ${response.registration.id}`);
      form.reset();
      setAgreed(false);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to submit registration.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RegistrationShell
      title="Tournament Registration"
      description="All participant, partner, category, and payment details are loaded in one page for the current Indonesia MVP tournament."
      showProgress={false}
    >
      <div className="grid grid-cols-1 gap-[24px] lg:h-[calc(100dvh-13.5rem)] lg:min-h-[620px] lg:grid-cols-12 lg:items-start lg:overflow-hidden">
        <form
          id="registration-form"
          className="custom-scrollbar space-y-6 lg:col-span-8 lg:h-full lg:overflow-y-auto lg:pb-2 lg:pr-2"
          onSubmit={submitRegistration}
        >
          {message && (
            <div className="rounded-lg border border-primary/15 bg-primary/5 p-4 text-sm font-semibold text-primary">
              {message}
            </div>
          )}
          <FormSection
            icon="sports_score"
            title="Tournament Category"
            description="Choose the competition level for this registration."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      className={`h-full rounded-xl border bg-white p-5 transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/10"
                          : "border-outline-variant hover:border-primary/40"
                      }`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                          <span className="material-symbols-outlined text-[24px]">
                            {skill.icon}
                          </span>
                        </div>
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-on-primary transition-all ${
                            isSelected ? "bg-primary opacity-100" : "opacity-0"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            check
                          </span>
                        </span>
                      </div>
                      <h3 className="text-[20px] font-semibold text-on-surface">
                        {skill.title}
                      </h3>
                      <p className="mt-2 text-[14px] leading-[1.5] text-on-surface-variant">
                        {skill.description}
                      </p>
                      <span className="mt-4 inline-flex rounded-full bg-primary-fixed px-3 py-1 text-[12px] font-semibold text-primary">
                        {skill.label}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </FormSection>

          {tournament && (tournament.settings.categories ?? []).length > 1 && (
            <FormSection
              icon="category"
              title="Event Category"
              description="Select the event category you want to compete in."
            >
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
                        className={`rounded-xl border bg-white p-4 transition-all ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/10"
                            : "border-outline-variant hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-on-primary transition-all ${
                              isSelected
                                ? "bg-primary opacity-100"
                                : "opacity-0"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              check
                            </span>
                          </span>
                          <h3 className="text-[16px] font-semibold text-on-surface">
                            {cat}
                          </h3>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </FormSection>
          )}

          <FormSection
            icon="person"
            title="Player Information"
            description="Main participant details for tournament verification."
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                <input
                  id="full-name"
                  type="text"
                  placeholder="Bima Pratama"
                  className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <input
                  id="email"
                  type="email"
                  placeholder="bima@tuwaga.id"
                  className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
                    +62
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="812 3456 7890"
                    className="w-full rounded-lg border border-outline-variant bg-white py-3 pl-14 pr-4 text-[16px] leading-[1.5] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="nationality">Nationality</FieldLabel>
                <div className="relative">
                  <select
                    id="nationality"
                    defaultValue="ID"
                    className="w-full cursor-pointer appearance-none rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                  >
                    <option value="ID">Indonesia</option>
                    <option value="MY">Malaysia</option>
                    <option value="SG">Singapore</option>
                    <option value="TH">Thailand</option>
                    <option value="PH">Philippines</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon="group_add"
            title="Partner Details"
            description="Add a teammate for doubles play. Leave toggled off for singles registration."
          >
            <div className="mb-5 flex items-center gap-4">
              <button
                type="button"
                role="switch"
                aria-checked={hasPartner}
                onClick={() => setHasPartner((prev) => !prev)}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${
                  hasPartner ? "bg-primary" : "bg-outline-variant"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                    hasPartner ? "translate-x-[26px]" : "translate-x-[4px]"
                  }`}
                />
              </button>
              <span className="text-sm font-semibold text-on-surface">
                {hasPartner ? "Registering with partner" : "Registering solo"}
              </span>
            </div>

            {hasPartner && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="partner-name">
                    Partner Full Name
                  </FieldLabel>
                  <input
                    id="partner-name"
                    type="text"
                    placeholder="Raka Wijaya"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="partner-email">Partner Email</FieldLabel>
                  <input
                    id="partner-email"
                    type="email"
                    placeholder="raka@tuwaga.id"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="partner-level">
                    Partner Skill Level
                  </FieldLabel>
                  <div className="relative">
                    <select
                      id="partner-level"
                      defaultValue="intermediate"
                      className="w-full cursor-pointer appearance-none rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                    >
                      <option value="" disabled>
                        Select level
                      </option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="professional">Professional</option>
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                      expand_more
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="partner-id">
                    Partner Membership ID
                  </FieldLabel>
                  <input
                    id="partner-id"
                    type="text"
                    placeholder="TWG-XXXXXX (optional)"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </FormSection>

          <FormSection
            icon="lock"
            title="Confirmation"
            description="Review your details before submitting."
          >
            <div className="space-y-6">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-surface-container-low p-4">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span className="text-[14px] font-medium leading-relaxed text-on-surface-variant">
                  I confirm all registration details are accurate and agree to
                  the tournament rules and registration terms.
                </span>
              </label>
            </div>
          </FormSection>
        </form>

        <TournamentSummary
          selectedSkill={selectedSkillData}
          agreed={agreed}
          summary={summary}
          submitting={submitting}
        />
      </div>
    </RegistrationShell>
  );
}
