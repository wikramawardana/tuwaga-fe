"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import RegistrationShell from "@/components/RegistrationShell";

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
}: {
  selectedSkill: (typeof SKILL_LEVELS)[number];
  agreed: boolean;
}) {
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
              MVP Event
            </span>
            <h2 className="mt-2 max-w-[260px] text-[24px] font-semibold leading-[1.25] text-white">
              Jakarta Arena Championship
            </h2>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-4">
            {[
              {
                icon: "calendar_today",
                label: "Date",
                value: "Aug 16 - Aug 18, 2026",
              },
              {
                icon: "location_on",
                label: "Location",
                value: "Jakarta, Indonesia",
              },
              {
                icon: "payments",
                label: "Entry",
                value: "Rp250.000 / player",
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

          <div className="space-y-2 border-t border-surface-container pt-5">
            <div className="flex justify-between text-[14px] text-on-surface-variant">
              <span>Registration Fee (2 players)</span>
              <span className="text-on-surface">Rp500.000</span>
            </div>
            <div className="flex justify-between text-[14px] text-on-surface-variant">
              <span>Service Fee</span>
              <span className="text-on-surface">Rp30.000</span>
            </div>
            <div className="flex justify-between text-[14px] text-on-surface-variant">
              <span>Payment Admin</span>
              <span className="text-on-surface">Rp7.500</span>
            </div>
            <div className="flex justify-between border-t border-surface-container pt-3 text-[20px] font-semibold">
              <span>Total</span>
              <span className="text-primary">Rp537.500</span>
            </div>
          </div>

          <div className="rounded-lg border border-primary/10 bg-primary/5 p-4 text-[12px] font-semibold leading-relaxed text-primary">
            WhatsApp support: +62 812-3456-7890. Registration stays on one page
            for this MVP.
          </div>

          <button
            type="submit"
            form="registration-form"
            disabled={!agreed}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg px-7 text-[14px] font-semibold tracking-[0.01em] shadow-lg transition-all active:scale-95 ${
              agreed
                ? "bg-primary text-on-primary shadow-primary/20 hover:bg-on-primary-fixed-variant"
                : "cursor-not-allowed bg-outline-variant text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">lock</span>
            Submit Registration
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function RegisterPage() {
  const [selectedSkill, setSelectedSkill] =
    useState<SkillValue>("intermediate");
  const [agreed, setAgreed] = useState(false);

  const selectedSkillData = useMemo(
    () =>
      SKILL_LEVELS.find((skill) => skill.value === selectedSkill) ??
      SKILL_LEVELS[1],
    [selectedSkill],
  );

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
          onSubmit={(event) => event.preventDefault()}
        >
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

          <FormSection
            icon="group_add"
            title="Partner Details"
            description="Add teammate information for the current tournament."
          >
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
                    defaultValue=""
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
          </FormSection>

          <FormSection
            icon="lock"
            title="Payment Details"
            description="Mock payment fields for the MVP registration interface."
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <FieldLabel htmlFor="card-number">Card Number</FieldLabel>
                <input
                  id="card-number"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <FieldLabel htmlFor="expiry">Expiry Date</FieldLabel>
                  <input
                    id="expiry"
                    placeholder="MM / YY"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="cvv">CVV</FieldLabel>
                  <input
                    id="cvv"
                    inputMode="numeric"
                    placeholder="123"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="card-name">Cardholder Name</FieldLabel>
                  <input
                    id="card-name"
                    placeholder="Bima Pratama"
                    className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-[16px] leading-[1.5] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-surface-container-low p-4">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span className="text-[14px] font-medium leading-relaxed text-on-surface-variant">
                  I confirm all registration details are accurate and agree to
                  the tournament rules and payment terms.
                </span>
              </label>
            </div>
          </FormSection>
        </form>

        <TournamentSummary selectedSkill={selectedSkillData} agreed={agreed} />
      </div>
    </RegistrationShell>
  );
}
