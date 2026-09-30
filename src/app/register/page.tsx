"use client";

import {
  CalendarBlankIcon,
  CaretDownIcon,
  CheckIcon,
  LockIcon,
  MapPinIcon,
  MoneyIcon,
  ShapesIcon,
  UserCirclePlusIcon,
  UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { AppIcon } from "@/components/icons/SportIcons";
import RadarArt from "@/components/landing/RadarArt";
import RegistrationShell from "@/components/RegistrationShell";
import { divisionSkillLabel, divisionSkillLevel } from "@/lib/matchDivisions";
import {
  createRegistration,
  getCurrentTournament,
  getRegistrationSummary,
  getTournament,
  type RegistrationSummary,
  type Tournament,
} from "@/lib/tuwagaApi";

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
      className="block text-[14px] font-medium tracking-[0.01em] text-ink-950"
    >
      {children}
    </label>
  );
}

function FormSection({
  icon: SectionIcon,
  title,
  description,
  children,
}: {
  icon: AppIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="registration-parallax-section rounded-xl border border-ink-200 bg-white p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-ink-950">
          <SectionIcon
            className="text-[22px]"
            weight="duotone"
            aria-hidden="true"
          />
        </div>
        <div>
          <h2 className="text-[24px] font-semibold leading-[1.3] text-ink-950">
            {title}
          </h2>
          <p className="mt-1 text-[15px] leading-[1.5] text-ink-600">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TournamentSummary({
  selectedDivision,
  agreed,
  summary,
  submitting,
}: {
  selectedDivision: string;
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
      <div className="custom-scrollbar register-summary-panel overflow-hidden rounded-xl border border-ink-200 bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.04)] lg:sticky lg:top-0 lg:max-h-full lg:overflow-y-auto">
        <div className="relative isolate h-40 overflow-hidden bg-ink-950">
          <div className="texture-grain pointer-events-none absolute inset-0 -z-10 opacity-60" />
          <RadarArt
            className="pointer-events-none absolute -right-24 -top-28 -z-10 w-[26rem] opacity-80"
            showCourts={false}
          />
          <div className="absolute bottom-4 left-5">
            <span className="eyebrow rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[10px] text-brand-400">
              {summary?.tournament.badge ?? "Backend event"}
            </span>
            <h2 className="mt-3 max-w-[260px] text-[24px] font-semibold leading-[1.15] tracking-tight text-cream-50">
              {summary?.tournament.name ?? "Loading tournament"}
            </h2>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-4">
            {[
              {
                icon: CalendarBlankIcon,
                label: "Date",
                value: summary?.tournament.dateLabel ?? "Loading",
              },
              {
                icon: MapPinIcon,
                label: "Location",
                value: summary?.tournament.location ?? "Loading",
              },
              {
                icon: MoneyIcon,
                label: "Entry",
                value: summary
                  ? `${formatMoney(summary.tournament.entryFeePerPair)} / pair`
                  : "Loading",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon
                  className="text-[22px] text-brand-600"
                  weight="duotone"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-600">
                    {item.label}
                  </p>
                  <p className="text-[14px] font-semibold text-ink-950">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-ink-200 pt-5">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-600">
              Selected Match Division
            </p>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-ink-200 p-3">
              <span className="text-[14px] font-semibold text-brand-600">
                {selectedDivision || "Select a division"}
              </span>
              <span className="text-[12px] font-semibold text-ink-600">
                {selectedDivision
                  ? divisionSkillLabel(selectedDivision)
                  : "Required"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-brand-500/10 bg-brand-500/5 p-4 text-[12px] font-semibold leading-relaxed text-brand-600">
            WhatsApp support: {summary?.support.whatsapp ?? "Loading"}.
            Registration is saved to the backend.
          </div>

          <button
            type="submit"
            form="registration-form"
            disabled={!agreed || !selectedDivision || submitting}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg px-7 text-[14px] font-semibold tracking-[0.01em] shadow-lg transition-all active:scale-95 ${
              agreed && selectedDivision
                ? "bg-brand-500 text-ink-950 shadow-ink-950/10 hover:bg-brand-400"
                : "cursor-not-allowed bg-ink-300 text-ink-600"
            }`}
          >
            <LockIcon
              className="text-[20px]"
              aria-hidden="true"
              weight="duotone"
            />
            {submitting ? "Submitting..." : "Submit Registration"}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [hasPartner, setHasPartner] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [summary, setSummary] = useState<RegistrationSummary | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

        if ((current.settings.categories ?? []).length > 0) {
          setSelectedCategory(
            (previous) =>
              previous || (current.settings.categories ?? [])[0] || "",
          );
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
  }, [searchParams]);

  const submitRegistration = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!tournament) {
      setMessage("No tournament is available for registration.");
      return;
    }
    if (!selectedCategory) {
      setMessage("Select a match division before submitting.");
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
      const divisionLevel = divisionSkillLevel(selectedCategory);
      const partnerInput = hasPartner
        ? {
            fullName: field("partner-name"),
            email: field("partner-email"),
            skillLevel: divisionLevel,
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
          skillLevel: divisionLevel,
          city: null,
          membershipId: null,
        },
        partner: partnerInput,
      });
      const params = new URLSearchParams({
        registrationId: response.registration.id,
        tournamentName: tournament.name,
        category: selectedCategory,
        player: field("full-name"),
        partner: partnerInput?.fullName || "",
        venue: tournament.venue,
        date: tournament.dateLabel,
      });
      window.location.href = `/register/success?${params.toString()}`;
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
            <div className="rounded-lg border border-brand-500/15 bg-brand-500/5 p-4 text-sm font-semibold text-brand-600">
              {message}
            </div>
          )}
          <FormSection
            icon={ShapesIcon}
            title="Match Division"
            description="Choose one division. Its match category and competition level apply to both players."
          >
            {tournament && (tournament.settings.categories ?? []).length > 0 ? (
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
                            ? "border-brand-500 ring-2 ring-brand-500/10"
                            : "border-ink-300 hover:border-brand-500/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-ink-950 transition-all ${
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
                          <h3 className="text-[16px] font-semibold text-ink-950">
                            {cat}
                          </h3>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg bg-ink-200 p-4 text-sm font-semibold text-ink-600">
                No match divisions are available for this tournament.
              </p>
            )}
          </FormSection>

          <FormSection
            icon={UserIcon}
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
                  className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <input
                  id="email"
                  type="email"
                  placeholder="bima@tuwaga.id"
                  className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-ink-600">
                    +62
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="812 3456 7890"
                    className="w-full rounded-lg border border-ink-300 bg-white py-3 pl-14 pr-4 text-[16px] leading-[1.5] outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="nationality">Nationality</FieldLabel>
                <div className="relative">
                  <select
                    id="nationality"
                    defaultValue="ID"
                    className="w-full cursor-pointer appearance-none rounded-lg border border-ink-300 bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="ID">Indonesia</option>
                    <option value="MY">Malaysia</option>
                    <option value="SG">Singapore</option>
                    <option value="TH">Thailand</option>
                    <option value="PH">Philippines</option>
                  </select>
                  <CaretDownIcon
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-600"
                    aria-hidden="true"
                    weight="bold"
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={UserCirclePlusIcon}
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
                  hasPartner ? "bg-brand-500" : "bg-ink-300"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                    hasPartner ? "translate-x-[26px]" : "translate-x-[4px]"
                  }`}
                />
              </button>
              <span className="text-sm font-semibold text-ink-950">
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
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="partner-email">Partner Email</FieldLabel>
                  <input
                    id="partner-email"
                    type="email"
                    placeholder="raka@tuwaga.id"
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="partner-id">
                    Partner Membership ID
                  </FieldLabel>
                  <input
                    id="partner-id"
                    type="text"
                    placeholder="TWG-XXXXXX (optional)"
                    className="w-full rounded-lg border border-ink-300 bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}
          </FormSection>

          <FormSection
            icon={LockIcon}
            title="Confirmation"
            description="Review your details before submitting."
          >
            <div className="space-y-6">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-ink-100 p-4">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-brand-500"
                />
                <span className="text-[14px] font-medium leading-relaxed text-ink-600">
                  I confirm all registration details are accurate and agree to
                  the tournament rules and registration terms.
                </span>
              </label>
            </div>
          </FormSection>
        </form>

        <TournamentSummary
          selectedDivision={selectedCategory}
          agreed={agreed}
          summary={summary}
          submitting={submitting}
        />
      </div>
    </RegistrationShell>
  );
}
